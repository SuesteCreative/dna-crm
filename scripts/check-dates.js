const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
    const filePath = path.join(process.cwd(), 'orders_export_1.csv');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const records = XLSX.utils.sheet_to_json(sheet);

    console.log(`Checking first 5 records for dates...`);
    for (let i = 0; i < 5 && i < records.length; i++) {
        console.log(`Record ${i}: Name=${records[i]['Name']}, CreatedAt=${records[i]['Created at']}, Type=${typeof records[i]['Created at']}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
