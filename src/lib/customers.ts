import { getPrisma } from "./prisma";

export async function ensureCustomer(data: {
    name: string;
    email?: string | null;
    phone?: string | null;
    country?: string | null;
}) {
    const prisma = await getPrisma();
    const { name, email, phone, country } = data;

    if (!email) {
        // Without email, we can't reliably link to a centralized hub yet,
        // but we could try phone. For now, only email-based global linking.
        return null;
    }

    try {
        const customer = await prisma.customer.upsert({
            where: { email },
            update: {
                name, // Update name if it changed
                phone: phone || undefined,
                country: country || undefined,
            },
            create: {
                name,
                email,
                phone,
                country,
                source: "AUTO",
            },
        });
        return customer.id;
    } catch (error) {
        console.error("ensureCustomer error:", error);
        return null;
    }
}
