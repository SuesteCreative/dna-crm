const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function main() {
    const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    const match = env.match(/GOOGLE_SERVICE_ACCOUNT_JSON=(.*)/);
    let val = match[1].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    const credentials = JSON.parse(val);

    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });

    const calendar = google.calendar({ version: 'v3', auth });
    
    try {
        console.log("Attempting to list calendars...");
        const res = await calendar.calendarList.list();
        console.log("SUCCESS!");
        res.data.items.forEach(c => {
            console.log(`- [${c.summary}] : ${c.id}`);
        });
    } catch (e) {
        console.error("FAILED.");
        console.error("Error name:", e.name);
        console.error("Error message:", e.message);
        if (e.response) {
            console.error("Response data:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

main();
