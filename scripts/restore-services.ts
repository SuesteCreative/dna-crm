import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SERVICES = [
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "10 minutes",
        sku: "001-001",
        price: 40,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg?v=1742288499",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "15 minutes",
        sku: "001-002",
        price: 55,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/jetski3_1716709b-4018-444d-9c5d-871944391814.jpg?v=1742288506",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "20 minutes",
        sku: "001-003",
        price: 65,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/jetski2.jpg?v=1742288503",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "30 minutes",
        sku: "001-004",
        price: 85,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg?v=1742288499",
        category: "Jetski",
    },
    {
        shopifyHandle: "jetski-rental",
        name: "Jetski Rental",
        variant: "1 hour",
        sku: "001-005",
        price: 160,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/mota.jpg?v=1742288499",
        category: "Jetski",
    },
    {
        shopifyHandle: "crazy-sofa-inflatable-towable",
        name: "Crazy Sofa - Inflatable Towable",
        variant: null,
        sku: "002-001",
        price: 18,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/CrazySofa-InflatableTowable.png?v=1769024529",
        category: "Towable",
    },
    {
        shopifyHandle: "banana-slider-inflatable-towable",
        name: "Banana Slider - Inflatable Towable",
        variant: null,
        sku: "002-002",
        price: 18,
        imageUrl: "https://cdn.shopify.com/s/files/1/0818/0554/1723/files/BananaSlider-InflatableTowable.png?v=1769024472",
        category: "Towable",
    },
];

async function main() {
    try {
        let seeded = 0;
        for (const svc of SERVICES) {
            await prisma.service.upsert({
                where: { sku: svc.sku },
                update: {
                    name: svc.name,
                    variant: svc.variant,
                    price: svc.price,
                    imageUrl: svc.imageUrl,
                    category: svc.category,
                    shopifyHandle: svc.shopifyHandle,
                    isActive: true
                },
                create: { ...svc, isActive: true },
            });
            seeded++;
        }
        console.log(`Seeded ${seeded} services.`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
