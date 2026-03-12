/**
 * Fix UTF-8 mojibake: strings where UTF-8 bytes were mis-decoded as Latin-1.
 * Example: "GrÃ¤fling" → "Gräfling"
 *
 * Strategy: re-encode the string as Latin-1 bytes, then decode as UTF-8.
 * If the result contains replacement characters (U+FFFD), the original was
 * not mojibake — return it unchanged.
 */
export function fixMojibake(s: string): string {
    if (!s) return s;
    // Quick check: mojibake of multi-byte UTF-8 sequences always produces chars
    // in the range 0xC0-0xFF. Skip pure ASCII strings entirely.
    if (!/[\u00C0-\u00FF]/.test(s)) return s;
    try {
        const bytes = Buffer.from(s, "latin1");
        const decoded = bytes.toString("utf8");
        return decoded.includes("\uFFFD") ? s : decoded;
    } catch {
        return s;
    }
}
