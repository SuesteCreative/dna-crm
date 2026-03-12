const { JWT } = require("google-auth-library");
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");

async function main() {
    const envPath = path.join(process.cwd(), ".env");
    const envContent = fs.readFileSync(envPath, "utf-8");
    let jsonLine = envContent.split("\n").find(l => l.startsWith("GOOGLE_SERVICE_ACCOUNT_JSON="));
    let rawJson = jsonLine.substring("GOOGLE_SERVICE_ACCOUNT_JSON=".length).trim();
    if (rawJson.startsWith('"') && rawJson.endsWith('"')) rawJson = rawJson.substring(1, rawJson.length - 1);
    
    const credentials = JSON.parse(rawJson);
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');

    const client = new JWT({
        email: credentials.client_email,
        key: privateKey,
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    });

    try {
        await client.authorize();
        console.log("Auth success!");
        const calendar = google.calendar({ version: "v3", auth: client });
        const res = await calendar.calendarList.list();
        console.log("CALENDARS:");
        res.data.items.forEach(c => {
            console.log(`- ${c.summary}: ${c.id}`);
        });
    } catch (e) {
        console.error("Auth/List failed:", e.message);
    }
}
main();
