const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), 'orders_export_1.csv');
    // Specify raw: false and cellDates: true for CSV
    const workbook = XLSX.readFile(filePath, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const records = XLSX.utils.sheet_to_json(sheet);

    console.log(`Parsed ${records.length} line items.`);

    // Group by Order ID ("Id")
    const orders = new Map();

    for (const row of records) {
        const shopifyId = String(row['Id'] || '');
        if (!shopifyId) continue;

        const orderNumber = String(row['Name'] || '');
        const email = String(row['Email'] || '');
        const billingName = String(row['Billing Name'] || email);
        const totalPrice = parseFloat(row['Total'] || '0');
        const createdAt = row['Created at'];
        const financialStatus = String(row['Financial Status'] || '').toUpperCase();
        const lineItemName = String(row['Lineitem name'] || '');
        const lineItemQuantity = parseInt(row['Lineitem quantity'] || '1');
        const notes = String(row['Notes'] || '');

        if (!orders.has(shopifyId)) {
            orders.set(shopifyId, {
                shopifyId: shopifyId,
                orderNumber: orderNumber,
                customerEmail: email,
                customerName: billingName,
                totalPrice: totalPrice,
                activityDate: createdAt instanceof Date ? createdAt : new Date(createdAt),
                status: financialStatus === 'PAID' ? 'CONFIRMED' : (financialStatus === 'CANCELLED' ? 'CANCELLED' : 'PENDING'),
                activityType: lineItemName,
                pax: lineItemQuantity,
                quantity: lineItemQuantity,
                notes: notes
            });
        } else {
            const existing = orders.get(shopifyId);
            existing.activityType += `, ${lineItemName}`;
            existing.pax += lineItemQuantity;
            existing.quantity += lineItemQuantity;
            if (existing.totalPrice === 0 && totalPrice > 0) {
                existing.totalPrice = totalPrice;
            }
        }
    }

    console.log(`Grouped into ${orders.size} unique orders.`);

    let imported = 0;
    let skipped = 0;

    for (const [sId, order] of orders.entries()) {
        try {
            let dateObj = order.activityDate;
            if (isNaN(dateObj.getTime())) {
                console.warn(`Invalid Date for ${order.orderNumber} (Value: ${order.activityDate}) - skipping`);
                skipped++;
                continue;
            }

            await prisma.booking.upsert({
                where: { shopifyId: order.shopifyId },
                update: {
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    activityDate: dateObj,
                    totalPrice: order.totalPrice,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    activityType: order.activityType,
                    pax: order.pax,
                    quantity: order.quantity,
                    notes: order.notes,
                    source: 'SHOPIFY'
                },
                create: {
                    shopifyId: order.shopifyId,
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    activityDate: dateObj,
                    totalPrice: order.totalPrice,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    activityType: order.activityType,
                    pax: order.pax,
                    quantity: order.quantity,
                    notes: order.notes,
                    source: 'SHOPIFY'
                },
            });
            imported++;
        } catch (err) {
            console.error(`Failed to import order ${order.orderNumber} (ID: ${sId}):`, err.message);
            skipped++;
        }
    }

    console.log(`Success: ${imported} orders imported/updated correctly.`);
    console.log(`Skipped: ${skipped} orders failed.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
