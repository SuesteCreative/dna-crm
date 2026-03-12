const fs = require('fs');
const path = require('path');

try {
    const env = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    const match = env.match(/GOOGLE_SERVICE_ACCOUNT_JSON=(.*)/);
    if (!match) {
        console.log("NOT FOUND");
    } else {
        let val = match[1].trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        console.log("Found JSON string length:", val.length);
        const parsed = JSON.parse(val);
        console.log("Parsed type:", parsed.type);
        console.log("Project ID:", parsed.project_id);
        console.log("Client Email:", parsed.client_email);
        console.log("Has private key:", !!parsed.private_key);
        if (parsed.private_key) {
            console.log("Private key starts with:", parsed.private_key.substring(0, 30));
            console.log("Private key contains \\n:", parsed.private_key.includes('\\n'));
        }
    }
} catch (e) {
    console.error("Error:", e.message);
}
