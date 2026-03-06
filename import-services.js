const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function parseCSV(content) {
    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        const nextChar = content[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (currentCell || currentRow.length > 0) {
                currentRow.push(currentCell.trim());
                rows.push(currentRow);
                currentCell = '';
                currentRow = [];
            }
            if (char === '\r' && nextChar === '\n') i++;
        } else {
            currentCell += char;
        }
    }
    if (currentCell || currentRow.length > 0) {
        currentRow.push(currentCell.trim());
        rows.push(currentRow);
    }
    return rows;
}

async function importServices() {
    const csvPath = path.join(__dirname, 'products_export.csv');
    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found at:', csvPath);
        return;
    }

    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);
    if (rows.length < 2) return;

    const headers = rows[0];
    const h = (name) => headers.indexOf(name);

    const iHandle = h('Handle');
    const iTitle = h('Title');
    const iOption1 = h('Option1 Value');
    const iSku = h('Variant SKU');
    const iPrice = h('Variant Price');
    const iImage = h('Image Src');
    const iType = h('Type');

    let count = 0;
    let lastHandle = '';
    let lastTitle = '';
    let lastType = '';
    let lastImage = '';

    for (let i = 1; i < rows.length; i++) {
        const parts = rows[i];

        const handle = parts[iHandle] || lastHandle;
        const title = parts[iTitle] || lastTitle;
        const type = parts[iType] || lastType;
        const image = parts[iImage] || lastImage;
        const variant = parts[iOption1];
        const sku = parts[iSku];
        const priceStr = parts[iPrice];

        // Update trackers
        if (parts[iHandle]) lastHandle = handle;
        if (parts[iTitle]) lastTitle = title;
        if (parts[iType]) lastType = type;
        if (parts[iImage]) lastImage = image;

        if (!sku) continue;

        const price = parseFloat(priceStr) || 0;
        console.log(`Importing: ${title} (${variant || 'Default'}) - SKU: ${sku}`);

        try {
            await prisma.service.upsert({
                where: { sku },
                update: {
                    name: title,
                    variant: (variant === 'Default Title' || !variant) ? null : variant,
                    price,
                    imageUrl: image || null,
                    category: type || null,
                    shopifyHandle: handle || null,
                    isActive: true
                },
                create: {
                    sku,
                    name: title,
                    variant: (variant === 'Default Title' || !variant) ? null : variant,
                    price,
                    imageUrl: image || null,
                    category: type || null,
                    shopifyHandle: handle || null,
                    isActive: true
                }
            });
            count++;
        } catch (err) {
            console.error(`Error with ${sku}:`, err.message);
        }
    }

    console.log(`Done! Imported ${count} services.`);
    await prisma.$disconnect();
}

importServices();
