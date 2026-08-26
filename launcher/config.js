import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isSea = process.execPath.toLowerCase().endsWith(".exe")

const root =
    isSea ? path.resolve(path.dirname(process.execPath), "..") : path.resolve(__dirname, "..")

const port = 3000

export const config = {
    isSea,
    root,
    projectPath: path.join(root, "projects", "react-press"),
    setupScript: path.join(root, "scripts", "setup-environment.js"),
    port,
    url: `http://localhost:${port}/`
}
