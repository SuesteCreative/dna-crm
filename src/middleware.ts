import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/shopify/webhook(.*)",
    "/api/webhooks/(.*)",
    "/api/debug-(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
    if (isPublicRoute(request)) return;

    await auth.protect();

    const { sessionClaims } = await auth();
    const role = (sessionClaims as any)?.metadata?.role as string | undefined;
    const path = request.nextUrl.pathname;

    // /pending is accessible to all authenticated users
    if (path.startsWith("/pending")) return;

    // /admin/* — only SUPER_ADMIN and ADMIN
    if (path.startsWith("/admin")) {
        if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/pending", request.url));
        }
        return;
    }

    // API routes — return 403 JSON instead of redirecting
    if (path.startsWith("/api/admin")) {
        if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
        return;
    }

    // All other pages — require at least PARTNER, ADMIN, or SUPER_ADMIN
    if (!role || role === "USER") {
        return NextResponse.redirect(new URL("/pending", request.url));
    }
});

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        "/(api|trpc)(.*)",
    ],
};
