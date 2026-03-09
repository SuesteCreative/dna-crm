const fs = require('fs');
const path = require('path');

function replaceInDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const regex1 = /role !== "ADMIN" && role !== "SUPER_ADMIN"/g;
            if (regex1.test(content)) {
                content = content.replace(regex1, 'role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "STAFF"');
                modified = true;
            }

            const regex2 = /role === "ADMIN" \|\| role === "SUPER_ADMIN"/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, 'role === "ADMIN" || role === "SUPER_ADMIN" || role === "STAFF"');
                modified = true;
            }

            const regex3 = /role === "SUPER_ADMIN" \|\| role === "ADMIN"/g;
            if (regex3.test(content)) {
                content = content.replace(regex3, 'role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF"');
                modified = true;
            }

            // skip some admin routes if we want to be safe, but actually we want STAFF to act like ADMIN but strictly gated by sidebar perms on UI.
            // Wait! If STAFF gets access to the API, they are still limited by the UI unless they manually hit the endpoints.
            // The proper way is to use `await getUserPermissions(role)` and check `perms.concessionAccess`.

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log("Updated", fullPath);
            }
        }
    }
}

replaceInDir(path.join(__dirname, 'src', 'app', 'api', 'concessions'));
replaceInDir(path.join(__dirname, 'src', 'app', 'concessao'));
