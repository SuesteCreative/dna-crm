import { renewAllWatches } from "../src/lib/gcal";
import fs from 'fs';
import path from 'path';

async function main() {
    console.log("Activating real-time Meety mirroring (Google Webhooks)...");
    
    // Manual env loading
    const envPath = path.join(process.cwd(), '.env');
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [k, ...v] = line.split('=');
        if (k && v.length) process.env[k.trim()] = v.join('=').trim().replace(/^"(.*)"$/, '$1');
    });

    try {
        const results = await renewAllWatches();
        console.log("Watch Results:", JSON.stringify(results, null, 2));
    } catch (e) {
        console.error("Watch activation failed:", e);
    }
}
main();
