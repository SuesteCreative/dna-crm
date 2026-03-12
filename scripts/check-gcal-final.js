const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function main() {
    const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    const match = env.match(/GOOGLE_SERVICE_ACCOUNT_JSON=(.*)/);
    if (!match) {
        console.error("No GOOGLE_SERVICE_ACCOUNT_JSON in .env");
        return;
    }
    
    let jsonStr = match[1].trim();
    if (jsonStr.startsWith('"') && jsonStr.endsWith('"')) {
        jsonStr = jsonStr.slice(1, -1);
    }
    
    const credentials = JSON.parse(jsonStr);
    console.log("Client Email:", credentials.client_email);
    
    // The key in JSON.parse result should ALREADY have real newlines if the JSON was escaped correctly.
    // If it has literal '\n' strings, we need to replace them.
    let privateKey = credentials.private_key;
    if (privateKey.includes('\\n')) {
        console.log("Detected literal \\n, replacing with real newlines.");
        privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        privateKey,
        ['https://www.googleapis.com/auth/calendar.readonly']
    );

    try {
        console.log("Authorizing...");
        await auth.authorize();
        console.log("Authorized successfully!");
        
        const calendar = google.calendar({ version: 'v3', auth });
        console.log("Listing calendars...");
        const res = await calendar.calendarList.list();
        
        if (res.data.items && res.data.items.length > 0) {
            console.log("Found", res.data.items.length, "calendars:");
            res.data.items.forEach(c => {
                console.log(`- [${c.summary}] ID: ${c.id}`);
            });
        } else {
            console.log("No calendars found in the account.");
        }
    } catch (e) {
        console.error("Error during GCal operation:");
        console.error(e.message);
        if (e.response && e.response.data) {
            console.error("Response data:", JSON.stringify(e.response.data, null, 2));
        }
    }
}

main();
