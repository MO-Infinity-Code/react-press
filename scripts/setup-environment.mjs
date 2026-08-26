import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

const version = "19.2.8"

const source = path.join(root, "react", version, "node_modules")

const target = path.join(root, "projects", "react-press", "node_modules")

if (!fs.existsSync(source)) {
    throw new Error(`React environment not found: ${source}`)
}

if (fs.existsSync(target)) {
    console.log(`Environment ${version} already linked`)
    process.exit(0)
}

fs.symlinkSync(source, target, "junction")

console.log(`Environment ${version} linked successfully`)
