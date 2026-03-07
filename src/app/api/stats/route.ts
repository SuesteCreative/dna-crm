import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

function getDateRange(period: string): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();

    switch (period) {
        case "7d":  start.setDate(start.getDate() - 7); break;
        case "30d": start.setDate(start.getDate() - 30); break;
        case "90d": start.setDate(start.getDate() - 90); break;
        case "1y":  start.setFullYear(start.getFullYear() - 1); break;
        case "all": return { start: new Date(2000, 0, 1), end };
        default:    start.setDate(start.getDate() - 30);
    }

    start.setHours(0, 0, 0, 0);
    return { start, end };
}

const MONTH_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const DOW_PT   = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface BookingRow {
    activityDate:          Date;
    activityTime:          string | null;
    totalPrice:            number | null;
    source:                string | null;
    status:                string | null;
    customerEmail:         string | null;
    customerName:          string | null;
    serviceId:             string | null;
    activityType:          string | null;
    partnerId:             string | null;
    country:               string | null;
    isEdited:              boolean;
    originalActivityType:  string | null;
    originalPax:           number | null;
    originalQuantity:      number | null;
    originalTotalPrice:    number | null;
    originalActivityDate:  Date | null;
    originalActivityTime:  string | null;
    pax:                   number;
    quantity:              number | null;
    showedUp:              boolean | null;
}

export async function GET(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const isPartner = role === "PARTNER";
    const sessionPartnerId = (sessionClaims as any)?.publicMetadata?.partnerId as string | undefined;

    const { searchParams } = new URL(req.url);
    const period      = searchParams.get("period") || "30d";
    const customStart = searchParams.get("startDate");
    const customEnd   = searchParams.get("endDate");
    const isCustom    = period === "custom" && customStart && customEnd;
    const isAll       = period === "all" && !isCustom;

    const prisma = await getPrisma();

    let start: Date;
    let end: Date;
    if (isCustom) {
        start = new Date(customStart!);
        start.setHours(0, 0, 0, 0);
        end = new Date(customEnd!);
        end.setHours(23, 59, 59, 999);
    } else {
        ({ start, end } = getDateRange(period));
    }

    const partnerFilter = isPartner && sessionPartnerId ? { partnerId: sessionPartnerId } : {};
    const dateFilter = isAll ? { ...partnerFilter } : { activityDate: { gte: start, lte: end }, ...partnerFilter };

    // Previous period for growth calc
    let prevRevenue = 0;
    if (!isAll && !isCustom) {
        const duration  = end.getTime() - start.getTime();
        const prevStart = new Date(start.getTime() - duration);
        const prevEnd   = new Date(start.getTime() - 1);
        const prev = await prisma.booking.aggregate({
            where: { activityDate: { gte: prevStart, lte: prevEnd }, status: { not: "CANCELLED" }, ...partnerFilter },
            _sum: { totalPrice: true },
        });
        prevRevenue = (prev._sum.totalPrice as number) ?? 0;
    }

    const [bookings, partners, services] = await Promise.all([
        prisma.booking.findMany({ where: dateFilter }) as unknown as Promise<BookingRow[]>,
        prisma.partner.findMany({ select: { id: true, name: true, commission: true } }),
        prisma.service.findMany({ select: { id: true, name: true, variant: true } }),
    ]);

    const partnerMap: Record<string, { name: string; commission: number }> = Object.fromEntries(
        partners.map(p => [p.id, { name: p.name, commission: p.commission ?? 0 }])
    );
    const serviceMap: Record<string, string> = Object.fromEntries(
        services.map(s => [s.id, s.variant ? `${s.name} – ${s.variant}` : s.name])
    );

    const activeBookings = bookings.filter(b => b.status?.toUpperCase() !== "CANCELLED");

    // KPIs
    const totalRevenue    = activeBookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const totalOrders     = bookings.length;
    const avgTicket       = activeBookings.length > 0 ? totalRevenue / activeBookings.length : 0;
    const activeCustomers = new Set(bookings.map(b => b.customerEmail).filter(Boolean)).size;
    const revenueGrowth   = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : null;

    // Status breakdown
    const statusBreakdown: Record<string, number> = { confirmed: 0, pending: 0, cancelled: 0 };
    for (const b of bookings) {
        const s = (b.status ?? "PENDING").toUpperCase();
        if (s === "CONFIRMED") statusBreakdown.confirmed++;
        else if (s === "CANCELLED") statusBreakdown.cancelled++;
        else statusBreakdown.pending++;
    }

    // Revenue by month
    const monthMap: Record<string, { revenue: number; count: number }> = {};
    for (const b of bookings) {
        const d   = new Date(b.activityDate);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = { revenue: 0, count: 0 };
        monthMap[key].revenue += b.totalPrice ?? 0;
        monthMap[key].count++;
    }
    const revenueByMonth = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => {
            const [year, month] = key.split("-");
            return { month: `${MONTH_PT[parseInt(month) - 1]} ${year}`, ...val };
        });

    // Revenue by channel
    const channelMap: Record<string, { revenue: number; count: number }> = {};
    for (const b of bookings) {
        const ch = b.source || "MANUAL";
        if (!channelMap[ch]) channelMap[ch] = { revenue: 0, count: 0 };
        channelMap[ch].revenue += b.totalPrice ?? 0;
        channelMap[ch].count++;
    }
    const revenueByChannel = Object.entries(channelMap)
        .map(([channel, val]) => ({ channel, ...val }))
        .sort((a, b) => b.revenue - a.revenue);

    // Top services — group by activityType (Shopify product name) with serviceId as fallback
    const svcMap: Record<string, { name: string; count: number; revenue: number }> = {};
    for (const b of bookings) {
        const key  = b.activityType || (b.serviceId ? serviceMap[b.serviceId] : null) || "Sem serviço";
        const name = b.activityType || (b.serviceId ? serviceMap[b.serviceId] : null) || "Sem serviço";
        if (!svcMap[key]) svcMap[key] = { name, count: 0, revenue: 0 };
        svcMap[key].count++;
        svcMap[key].revenue += b.totalPrice ?? 0;
    }
    const topServices = Object.values(svcMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    // Top customers
    const custMap: Record<string, { name: string; email: string; count: number; revenue: number }> = {};
    for (const b of bookings) {
        const email = b.customerEmail || "desconhecido";
        if (!custMap[email]) custMap[email] = { name: b.customerName || email, email, count: 0, revenue: 0 };
        custMap[email].count++;
        custMap[email].revenue += b.totalPrice ?? 0;
    }
    const topCustomers = Object.values(custMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

    // New vs returning
    let newCustomers = 0;
    let returningCustomers = 0;
    if (!isAll && !isCustom) {
        const pastRows = await prisma.booking.findMany({
            where: { activityDate: { lt: start } },
            select: { customerEmail: true },
        }) as { customerEmail: string | null }[];
        const pastEmails    = new Set(pastRows.map(b => b.customerEmail).filter(Boolean) as string[]);
        const periodEmails  = Array.from(new Set(bookings.map(b => b.customerEmail).filter(Boolean) as string[]));
        for (const email of periodEmails) {
            if (pastEmails.has(email)) returningCustomers++;
            else newCustomers++;
        }
    }

    // Sales by day of week
    const dowMap: Record<number, { count: number; revenue: number }> = {};
    for (let i = 0; i < 7; i++) dowMap[i] = { count: 0, revenue: 0 };
    for (const b of bookings) {
        const dow = new Date(b.activityDate).getDay();
        dowMap[dow].count++;
        dowMap[dow].revenue += b.totalPrice ?? 0;
    }
    const salesByDayOfWeek = Object.entries(dowMap).map(([day, val]) => ({
        day: DOW_PT[parseInt(day)], ...val,
    }));

    // Sales by hour
    const hourMap: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourMap[i] = 0;
    for (const b of bookings) {
        if (!b.activityTime) continue;
        const hour = parseInt(b.activityTime.split(":")[0]);
        if (hour >= 0 && hour < 24) hourMap[hour]++;
    }
    const salesByHour = Object.entries(hourMap)
        .map(([h, count]) => ({ hour: `${h}h`, count }))
        .filter(h => h.count > 0);

    // Top countries
    const countryMap: Record<string, { count: number; revenue: number }> = {};
    for (const b of bookings) {
        if (!b.country) continue;
        if (!countryMap[b.country]) countryMap[b.country] = { count: 0, revenue: 0 };
        countryMap[b.country].count++;
        countryMap[b.country].revenue += b.totalPrice ?? 0;
    }
    const topCountries = Object.entries(countryMap)
        .map(([country, val]) => ({ name: country, ...val }))
        .sort((a, b) => b.revenue - a.revenue);

    // No-show stats (across all active bookings)
    const noShowBookings    = activeBookings.filter(b => b.showedUp === false);
    const showedUpBookings  = activeBookings.filter(b => b.showedUp === true);
    const noShowCount       = noShowBookings.length;
    const noShowRevenue     = noShowBookings.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
    const showedUpCount     = showedUpBookings.length;
    const markedCount       = noShowCount + showedUpCount;
    const showRate          = markedCount > 0 ? (showedUpCount / markedCount) * 100 : null;

    // Bookings by partner — commission only on non-no-show bookings
    const partnerBMap: Record<string, {
        name: string; count: number; revenue: number;
        noShowCount: number; noShowRevenue: number;
        revenueEligible: number;
        commissionPct: number; commissionEarned: number;
    }> = {};
    for (const b of bookings) {
        if (!b.partnerId) continue;
        const id = b.partnerId;
        const pInfo = partnerMap[id];
        if (!partnerBMap[id]) partnerBMap[id] = {
            name: pInfo?.name || "Desconhecido",
            count: 0, revenue: 0,
            noShowCount: 0, noShowRevenue: 0,
            revenueEligible: 0,
            commissionPct: pInfo?.commission ?? 0, commissionEarned: 0,
        };
        partnerBMap[id].count++;
        partnerBMap[id].revenue += b.totalPrice ?? 0;
        if (b.showedUp === false) {
            partnerBMap[id].noShowCount++;
            partnerBMap[id].noShowRevenue += b.totalPrice ?? 0;
        } else {
            partnerBMap[id].revenueEligible += b.totalPrice ?? 0;
        }
    }
    for (const entry of Object.values(partnerBMap)) {
        entry.commissionEarned = entry.revenueEligible * (entry.commissionPct / 100);
    }
    const bookingsByPartner = Object.values(partnerBMap).sort((a, b) => b.count - a.count);

    // For partner role: compute their own commission (excluding no-shows)
    let partnerCommissionPct = 0;
    let partnerCommissionEarned = 0;
    let partnerNoShowCount = 0;
    let partnerNoShowRevenue = 0;
    if (isPartner && sessionPartnerId && partnerMap[sessionPartnerId]) {
        partnerCommissionPct = partnerMap[sessionPartnerId].commission;
        const myBookings = activeBookings.filter(b => b.partnerId === sessionPartnerId);
        const myNoShows  = myBookings.filter(b => b.showedUp === false);
        partnerNoShowCount   = myNoShows.length;
        partnerNoShowRevenue = myNoShows.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
        const myEligible     = myBookings.filter(b => b.showedUp !== false).reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
        partnerCommissionEarned = myEligible * (partnerCommissionPct / 100);
    }

    // Edit stats
    const editedBookings = bookings.filter(b => b.isEdited);
    const editRevenueDelta = editedBookings.reduce((sum, b) => {
        const actual   = b.totalPrice ?? 0;
        const original = b.originalTotalPrice ?? actual;
        return sum + (actual - original);
    }, 0);

    // Activity type changes: from → to
    const typeChangeMap: Record<string, number> = {};
    for (const b of editedBookings) {
        const from = b.originalActivityType || "—";
        const to   = b.activityType || "—";
        if (from === to) continue;
        const key = `${from} → ${to}`;
        typeChangeMap[key] = (typeChangeMap[key] || 0) + 1;
    }
    const topTypeChanges = Object.entries(typeChangeMap)
        .map(([change, count]) => ({ change, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    // Pax delta
    const paxDelta = editedBookings.reduce((sum, b) => {
        return sum + (b.pax - (b.originalPax ?? b.pax));
    }, 0);

    return NextResponse.json({
        kpis: { totalRevenue, totalOrders, avgTicket, activeCustomers, revenueGrowth },
        revenueByMonth,
        revenueByChannel,
        topServices,
        topCustomers,
        newVsReturning: { new: newCustomers, returning: returningCustomers },
        salesByDayOfWeek,
        salesByHour,
        statusBreakdown,
        topCountries,
        bookingsByPartner,
        noShowStats: { count: noShowCount, revenue: noShowRevenue, showRate },
        partnerSelf: isPartner ? {
            commissionPct: partnerCommissionPct,
            commissionEarned: partnerCommissionEarned,
            noShowCount: partnerNoShowCount,
            noShowRevenue: partnerNoShowRevenue,
        } : null,
        editStats: {
            count: editedBookings.length,
            revenueDelta: editRevenueDelta,
            paxDelta,
            topTypeChanges,
        },
    });
}
