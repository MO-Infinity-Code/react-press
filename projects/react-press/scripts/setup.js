#!/usr/bin/env node
/**
 * scripts/setup.js
 * بديل عن "npm install" العادي — بيتأكد إن node_modules
 * بتاع نسخة React الحالية موجود في المخزن المركزي، ويربط المشروع بيه.
 * لو مش موجود، بيثبته أول مرة وينقله هناك تلقائيًا.
 *
 * الاستخدام (بعد git clone مباشرة):
 *   node scripts/setup.js
 * أو لو ضفتها في package.json كـ script:
 *   npm run setup
 *
 * البنية المتوقعة:
 *   react-press/                          <- الجذر
 *   ├── react/<version>/node_modules      <- المخزن المركزي (يتنشئ تلقائي)
 *   └── projects/
 *       └── react-press/                  <- المشروع (فيه package.json و scripts/setup.js)
 */

const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const PROJECT_DIR = path.resolve(__dirname, "..") // projects/react-press
const ROOT = path.resolve(PROJECT_DIR, "..", "..") // جذر react-press
const LOCAL_MODULES = path.join(PROJECT_DIR, "node_modules")

function getReactVersion() {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, "package.json"), "utf-8"))
    return pkg.dependencies.react.replace(/[^\d.]/g, "")
}

function isJunctionOrSymlink(p) {
    try {
        return fs.lstatSync(p).isSymbolicLink()
    } catch {
        return false
    }
}

function hasContent(dir) {
    try {
        return fs.readdirSync(dir).length > 0
    } catch {
        return false
    }
}

function linkToStore(storeDir) {
    // لو LOCAL_MODULES موجود ومربوط بالفعل بنفس المكان، مفيش داعي نعمل حاجة
    if (isJunctionOrSymlink(LOCAL_MODULES)) {
        console.log("الربط موجود بالفعل. تمام.")
        return
    }
    // لو موجود كمجلد حقيقي (مش ربط)، امسحه الأول عشان نستبدله بربط
    if (fs.existsSync(LOCAL_MODULES)) {
        fs.rmSync(LOCAL_MODULES, { recursive: true, force: true })
    }
    execSync(`mklink /J "${LOCAL_MODULES}" "${storeDir}"`, { shell: "cmd.exe" })
    console.log(`تم الربط بـ: ${storeDir}`)
}

function main() {
    const version = getReactVersion()
    const storeDir = path.join(ROOT, "react", version, "node_modules")

    console.log(`نسخة React المطلوبة: ${version}`)

    if (hasContent(storeDir)) {
        console.log("المخزن المركزي لهذه النسخة موجود بالفعل — مفيش تحميل جديد.")
        linkToStore(storeDir)
        console.log("\nالمشروع جاهز. شغّل: npm run dev")
        return
    }

    console.log("مفيش مخزن مركزي لهذه النسخة بعد. هيتم التثبيت أول مرة...")
    execSync("npm install", { cwd: PROJECT_DIR, stdio: "inherit" })

    fs.mkdirSync(path.dirname(storeDir), { recursive: true })
    fs.renameSync(LOCAL_MODULES, storeDir)
    console.log(`تم نقل node_modules إلى المخزن المركزي: ${storeDir}`)

    linkToStore(storeDir)
    console.log("\nالمشروع جاهز. شغّل: npm run dev")
}

main()
