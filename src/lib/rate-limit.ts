// Simple in-memory rate limiter.
// Resets on cold start — fine for a small deployment.
// Protects public endpoints from casual abuse without needing Redis/KV.

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Prune stale entries every 10 minutes to avoid memory leaks
setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
        if (entry.resetAt < now) store.delete(key);
    });
}, 10 * 60 * 1000);

/**
 * Returns true if the request should be blocked.
 * @param ip        Caller's IP address
 * @param key       Unique namespace for this endpoint (e.g. "checkout")
 * @param max       Max requests allowed within the window
 * @param windowMs  Window duration in milliseconds
 */
export function isRateLimited(ip: string, key: string, max: number, windowMs: number): boolean {
    const id = `${key}:${ip}`;
    const now = Date.now();
    const entry = store.get(id);

    if (!entry || entry.resetAt < now) {
        store.set(id, { count: 1, resetAt: now + windowMs });
        return false;
    }

    entry.count += 1;
    if (entry.count > max) return true;
    return false;
}

/** Extract the real client IP from a Next.js request (works behind Vercel's proxy). */
export function getClientIp(req: Request): string {
    const forwarded = (req as any).headers?.get?.("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return "unknown";
}
