const { google } = require("googleapis");
require("dotenv").config();

async function main() {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    try {
        const res = await calendar.calendarList.list();
        console.log("Accessible Calendars:");
        res.data.items.forEach(c => {
            console.log(`- ${c.summary}: ${c.id}`);
        });
    } catch (e) {
        console.error("GCal List Error:", e.message);
    }
}

main();
