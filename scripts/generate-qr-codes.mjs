/**
 * generate-qr-codes.mjs
 * Generates 88 QR code PNGs (tropico-1..48, subnauta-1..40)
 * Output: public/qr-codes/
 * Run: node scripts/generate-qr-codes.mjs
 */
import QRCode from "qrcode";
import { writeFile, mkdir } from "fs/promises";

const BASE = "https://desportosnauticosalvor.com";
const OUT = "./public/qr-codes";

await mkdir(OUT, { recursive: true });

const spots = [
  ...Array.from({ length: 48 }, (_, i) => ({ slug: "tropico",  n: i + 1 })),
  ...Array.from({ length: 40 }, (_, i) => ({ slug: "subnauta", n: i + 1 })),
];

let count = 0;
for (const { slug, n } of spots) {
  const url = `${BASE}/concessao/book/${slug}/${n}`;
  const buffer = await QRCode.toBuffer(url, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: slug === "subnauta" ? "#0ea5e9" : "#f97316", light: "#ffffff" },
  });
  await writeFile(`${OUT}/${slug}-${n}.png`, buffer);
  count++;
  if (count % 10 === 0) console.log(`  ${count}/88...`);
}

console.log(`\n✓ ${count} QR codes written to ${OUT}/`);
console.log("Commit public/qr-codes/ to the repo so Vercel serves them statically.");
