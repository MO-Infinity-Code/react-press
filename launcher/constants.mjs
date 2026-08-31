import { fileURLToPath } from "node:url"
import path from "node:path"

const port = 3000
const url = `http://localhost:${port}/`

const requiredNodeVersion = "26.4.0"
const minimumSystemNodeMajor = 26

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isSea = process.execPath.toLowerCase().endsWith(".exe")

const root =
    isSea ? path.resolve(path.dirname(process.execPath), "..") : path.resolve(__dirname, "..")

const projectPath = path.join(root, "projects", "react-press")

const setupScript = path.join(root, "scripts", "setup-environment.mjs")

const nodeErrorPage = path.join(root, "launcher", "node-error.html")

const mongodbPath = path.join(root, "databases", "progs", "mongodb")

const mongodbInstaller = path.join(mongodbPath, "mongodb-windows-x86_64-8.3.8-signed.msi")

const mongoshInstaller = path.join(mongodbPath, "mongosh-2.10.0-x64.msi")

export {
    __filename,
    __dirname,
    isSea,
    root,
    projectPath,
    setupScript,
    nodeErrorPage,
    port,
    url,
    requiredNodeVersion,
    minimumSystemNodeMajor,
    mongodbPath,
    mongodbInstaller,
    mongoshInstaller
}
