/**
 * Import activity times from Meety CSV exports into existing Shopify bookings.
 * Matches by customerEmail + activityDate (date part only).
 * Run with: npx tsx scripts/import-meety-times.ts
 */

import fs from "fs";
import path from "path";
import { getPrisma } from "../src/lib/prisma";

const MEETY_DIR = path.join(__dirname, "../meety");

interface MeetyRow {
    appointmentTime: Date;
    email: string;
    service: string;
}

function parseCSV(content: string): MeetyRow[] {
    const lines = content.replace(/^\uFEFF/, "").split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const timeIdx = headers.indexOf("appointment time");
    const emailIdx = headers.indexOf("customer email");
    const serviceIdx = headers.indexOf("service");

    if (timeIdx === -1 || emailIdx === -1) {
        console.warn("  Missing required columns, skipping file");
        return [];
    }

    const rows: MeetyRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Simple CSV split (fields may contain commas inside quotes)
        const cols = splitCSVLine(line);

        const timeStr = cols[timeIdx]?.trim();
        const email = cols[emailIdx]?.trim().toLowerCase();
        const service = cols[serviceIdx]?.trim() || "";

        if (!timeStr || !email) continue;

        const appointmentTime = new Date(timeStr);
        if (isNaN(appointmentTime.getTime())) continue;

        rows.push({ appointmentTime, email, service });
    }

    return rows;
}

function splitCSVLine(line: string): string[] {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === "," && !inQuotes) {
            cols.push(current);
            current = "";
        } else {
            current += ch;
        }
    }
    cols.push(current);
    return cols;
}

function toDateKey(d: Date): string {
    return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function main() {
    const prisma = await getPrisma();

    // Read all CSV files
    const files = fs
        .readdirSync(MEETY_DIR)
        .filter((f) => f.endsWith(".csv"))
        .sort();

    console.log(`Found ${files.length} CSV files in meety/`);

    // Collect all Meety rows, de-duplicate by email+date keeping earliest time
    const meetyMap = new Map<string, Date>(); // key: "email|YYYY-MM-DD" -> earliest appointment time

    for (const file of files) {
        const content = fs.readFileSync(path.join(MEETY_DIR, file), "utf8");
        const rows = parseCSV(content);
        console.log(`  ${file}: ${rows.length} rows`);

        for (const row of rows) {
            const dateKey = toDateKey(row.appointmentTime);
            const mapKey = `${row.email}|${dateKey}`;
            const existing = meetyMap.get(mapKey);
            if (!existing || row.appointmentTime < existing) {
                meetyMap.set(mapKey, row.appointmentTime);
            }
        }
    }

    console.log(`\nTotal unique email+date combinations: ${meetyMap.size}`);

    // Fetch all Shopify bookings that have an email
    const bookings = await prisma.booking.findMany({
        where: {
            source: "SHOPIFY",
            customerEmail: { not: null },
        },
        select: {
            id: true,
            customerEmail: true,
            activityDate: true,
            activityTime: true,
        },
    });

    console.log(`Found ${bookings.length} Shopify bookings with email\n`);

    let updated = 0;
    let skipped = 0;
    let noMatch = 0;

    for (const booking of bookings) {
        const email = booking.customerEmail!.toLowerCase();
        const dateKey = toDateKey(new Date(booking.activityDate));
        const mapKey = `${email}|${dateKey}`;

        const meetyTime = meetyMap.get(mapKey);
        if (!meetyTime) {
            noMatch++;
            continue;
        }

        // Format time as HH:MM in Europe/Lisbon timezone
        const newTime = meetyTime.toLocaleTimeString("pt-PT", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Europe/Lisbon",
        });

        const newDate = new Date(
            Date.UTC(
                meetyTime.getUTCFullYear(),
                meetyTime.getUTCMonth(),
                meetyTime.getUTCDate()
            )
        );

        // Skip if already correct
        if (
            booking.activityTime === newTime &&
            toDateKey(new Date(booking.activityDate)) === toDateKey(newDate)
        ) {
            skipped++;
            continue;
        }

        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                activityDate: newDate,
                activityTime: newTime,
            },
        });

        updated++;
        if (updated <= 20) {
            console.log(
                `  Updated ${email} on ${dateKey}: time -> ${newTime}`
            );
        }
    }

    if (updated > 20) {
        console.log(`  ... and ${updated - 20} more`);
    }

    console.log(`\nDone. Updated: ${updated}, Already correct: ${skipped}, No Meety match: ${noMatch}`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
