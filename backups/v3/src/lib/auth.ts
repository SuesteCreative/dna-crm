export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "PARTNER" | "USER";

export function getRole(sessionClaims: Record<string, any> | null | undefined): UserRole | undefined {
    return sessionClaims?.metadata?.role as UserRole | undefined;
}

export function isAdminRole(role: UserRole | undefined): boolean {
    return role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF";
}
