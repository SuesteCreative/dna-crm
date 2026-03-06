const { syncShopifyOrders } = require('./src/lib/shopify');

async function test() {
    console.log('Running Shopify Sync...');
    const result = await syncShopifyOrders();
    console.log('Sync Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
