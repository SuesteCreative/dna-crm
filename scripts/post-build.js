const fs = require("fs");
const path = require("path");

console.log("Running post-build...");

// 1. Rename worker.js to _worker.js (required by Cloudflare Pages)
const workerPath = ".open-next/worker.js";
if (fs.existsSync(workerPath)) {
    fs.copyFileSync(workerPath, ".open-next/_worker.js");
    console.log("Copied worker.js -> _worker.js");
} else {
    console.log("worker.js not found, skipping copy (might be handled by OpenNext target)");
}

// 2. Copy all assets from .open-next/assets/ to .open-next/
//    This makes /_next/static/... accessible at the root of the output dir
function copyDirSync(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`Skipping copy: ${src} does not exist`);
        return;
    }
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirSync(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

copyDirSync(".open-next/assets", ".open-next");
console.log("Copied assets to .open-next root");

// 3. Create _routes.json to bypass the worker for static files.
//    This is the key fix: /_next/static/* is served directly by Cloudflare
//    without going through the worker. No more 404s on JS/CSS chunks.
const routes = {
    version: 1,
    include: ["/*"],
    exclude: [
        "/_next/static/*",
        "/_next/image/*",
        "/favicon.ico",
        "/BUILD_ID",
    ],
};
fs.writeFileSync(".open-next/_routes.json", JSON.stringify(routes, null, 2));
console.log("Created _routes.json");

console.log("Post-build complete.");
