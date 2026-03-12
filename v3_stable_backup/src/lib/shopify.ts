import { getPrisma } from "./prisma";
import { fixMojibake } from "./encoding";

export async function syncShopifyOrders(
    domain?: string,
    token?: string
) {
    const SHOPIFY_STORE_DOMAIN = domain || process.env.SHOPIFY_STORE_DOMAIN;
    const SHOPIFY_ACCESS_TOKEN = token || process.env.SHOPIFY_ACCESS_TOKEN;

    const debugInfo = {
        domain: SHOPIFY_STORE_DOMAIN || "MISSING",
        tokenPrefix: SHOPIFY_ACCESS_TOKEN ? SHOPIFY_ACCESS_TOKEN.substring(0, 10) : "MISSING"
    };

    if (!SHOPIFY_STORE_DOMAIN || !SHOPIFY_ACCESS_TOKEN) {
        return { success: false, error: "Shopify credentials missing", count: 0, debugInfo };
    }

    try {
        const prisma = await getPrisma();

        // Paginate through ALL orders using Shopify cursor-based pagination
        const allOrders: any[] = [];
        let nextUrl: string | null =
            `https://${SHOPIFY_STORE_DOMAIN}/admin/api/2024-04/orders.json?status=any&limit=250`;

        while (nextUrl) {
            const response: Response = await fetch(nextUrl, {
                headers: {
                    "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN!,
                    "Content-Type": "application/json",
                },
                cache: "no-store",
            });

            if (!response.ok) {
                const errorText = await response.text();
                return { success: false, error: `Shopify API ${response.status}: ${errorText}`, count: 0, debugInfo };
            }

            const data = await response.json() as { orders: any[] };
            allOrders.push(...(data.orders || []));

            // Follow cursor-based pagination via Link header
            const linkHeader = response.headers.get("Link") || "";
            const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
            nextUrl = nextMatch ? nextMatch[1] : null;
        }

        const orders = allOrders;

        let upserted = 0;
        const failedOrders = [];

        for (const order of orders) {
            try {
                const totalQuantity = order.line_items?.reduce((s: number, li: any) => s + (li.quantity || 0), 0) || 1;
                const firstLineItem = order.line_items?.[0];
                const props: Record<string, string> = {};
                // ... (existing props collection logic)
                if (firstLineItem?.properties) {
                    for (const p of firstLineItem.properties) {
                        if (p.name && p.value) {
                            props[p.name] = String(p.value);
                        }
                    }
                }

                const createdAt = new Date(order.created_at);
                let activityDate = createdAt;
                let activityTime: string | null = createdAt.toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Europe/Lisbon",
                });

                const meetyFromTime = props["_meety_from_time"];
                const meetyDateTime = props["Date & time"];

                if (meetyFromTime) {
                    const from = new Date(meetyFromTime);
                    if (!isNaN(from.getTime())) {
                        activityDate = from;
                        activityTime = from.toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "Europe/Lisbon",
                        });
                    }
                } else if (meetyDateTime) {
                    try {
                        const parts = meetyDateTime.split(",");
                        if (parts.length >= 2) {
                            const monthDay = parts[0].trim();
                            const year = parts[1].trim();
                            const timePart = parts[2]?.split("-")[0].trim();

                            const fullStr = `${monthDay} ${year} ${timePart || "00:00"}`;
                            const dt = new Date(fullStr);
                            if (!isNaN(dt.getTime())) {
                                activityDate = dt;
                                if (timePart) activityTime = timePart;
                            }
                        }
                    } catch (e) {
                        console.warn("Could not parse Meety Date & time string:", meetyDateTime);
                    }
                }

                const shopifyId = order.id.toString();
                const orderNumber = order.order_number ? `#${order.order_number}` : null;

                const customerName = fixMojibake(
                    `${order.customer?.first_name || ""} ${order.customer?.last_name || ""}`.trim()
                    || order.customer?.email
                    || "Consumidor Final"
                );

                const status = (order.cancelled_at) ? "CANCELLED" : (order.financial_status === "paid" ? "CONFIRMED" : "PENDING");
                const totalPrice = parseFloat(order.total_price) || 0;

                // Advanced PAX detection
                const slots = parseInt(props["_meety_numslots"] || "0", 10);
                let pax = Math.max(totalQuantity, slots);

                for (const key in props) {
                    const val = props[key];
                    if (val && val.toLowerCase().includes("attending?")) {
                        const match = val.match(/=>\s*(\d+)/);
                        if (match && match[1]) {
                            pax = parseInt(match[1], 10);
                            break;
                        }
                    }
                }

                const activityType = firstLineItem?.variant_title
                    ? `${firstLineItem.title} - ${firstLineItem.variant_title}`
                    : firstLineItem?.title || "Atividade Shopify";

                const country = order.billing_address?.country_code
                    || order.billing_address?.country
                    || order.customer?.default_address?.country_code
                    || null;

                // Check if booking exists and was manually edited
                const existing = await prisma.booking.findUnique({
                    where: { shopifyId },
                    select: { isEdited: true },
                });

                if (existing) {
                    if (existing.isEdited) {
                        // Preserve all manual edits — only sync status from Shopify
                        await prisma.booking.update({
                            where: { shopifyId },
                            data: { status, orderNumber },
                        });
                    } else {
                        // Not manually edited — update all fields from Shopify
                        await prisma.booking.update({
                            where: { shopifyId },
                            data: {
                                customerName,
                                status,
                                totalPrice,
                                pax,
                                quantity: totalQuantity,
                                orderNumber,
                                activityType,
                                activityDate,
                                activityTime,
                                country,
                            },
                        });
                    }
                } else {
                    await prisma.booking.create({
                        data: {
                            shopifyId,
                            orderNumber,
                            customerName,
                            customerEmail: order.customer?.email || null,
                            customerPhone: order.customer?.phone || null,
                            activityDate,
                            activityTime,
                            activityType,
                            pax,
                            quantity: totalQuantity,
                            status,
                            source: "SHOPIFY",
                            totalPrice,
                            country,
                            createdById: "shopify-sync",
                            notes: `Shopify ${orderNumber || order.id}`,
                        },
                    });
                }

                upserted++;
            } catch (err: any) {
                console.error(`Sync error for order ${order.id}:`, err);
                failedOrders.push({ id: order.id, error: err.message });
            }
        }

        return { success: true, count: upserted, failed: failedOrders.length, failedOrders, debugInfo };
    } catch (error) {
        return { success: false, error: String(error), count: 0, debugInfo };
    }
}
