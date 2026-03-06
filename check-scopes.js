const dotenv = require('dotenv');
dotenv.config();

/**
 * Script to check Shopify API Scopes and confirm connectivity
 */
async function checkShopify() {
    const domain = process.env.SHOPIFY_STORE_DOMAIN;
    const token = process.env.SHOPIFY_ACCESS_TOKEN;

    console.log(`Checking Shopify: ${domain}`);
    console.log(`Using Token (starts with): ${token?.substring(0, 10)}...`);

    const url = `https://${domain}/admin/oauth/access_scopes.json`;

    try {
        const response = await fetch(url, {
            headers: {
                "X-Shopify-Access-Token": token,
                "Content-Type": "application/json",
            },
        });

        console.log(`HTTP Status: ${response.status}`);
        const data = await response.json();

        if (response.ok) {
            console.log("SUCCESS! Scopes found:");
            console.log(JSON.stringify(data, null, 2));
        } else {
            console.error("FAILED. Errors:");
            console.error(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error("Fetch Error:", err.message);
    }
}

checkShopify();
