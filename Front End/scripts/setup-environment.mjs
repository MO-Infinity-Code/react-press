import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

const version = "19.2.8"

const source = path.resolve(root, "react", version, "node_modules")
const target = path.resolve(root, "projects", "react-press", "node_modules")

const logPrefix = () => `[${new Date().toISOString()}] MAIN`

const colors = {
    reset: "\x1b[0m",
    blue: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m"
}

function normalizePath(value) {
    return path.resolve(value).replace(/\\/g, "/").toLowerCase()
}

function targetExists() {
    try {
        fs.lstatSync(target)
        return true
    } catch {
        return false
    }
}

function getTargetType() {
    if (!targetExists()) {
        return "missing"
    }

    try {
        const stat = fs.lstatSync(target)

        if (stat.isSymbolicLink()) {
            return "link"
        }

        if (stat.isDirectory()) {
            return "directory"
        }

        return "file"
    } catch {
        return "unknown"
    }
}

function getTargetRealPath() {
    try {
        return fs.realpathSync(target)
    } catch {
        return null
    }
}

function isCorrectEnvironment() {
    if (!targetExists()) {
        return false
    }

    try {
        const sourceRealPath = fs.realpathSync(source)
        const targetRealPath = fs.realpathSync(target)

        return normalizePath(sourceRealPath) === normalizePath(targetRealPath)
    } catch {
        return false
    }
}

function removeTarget() {
    const type = getTargetType()

    if (type === "missing") {
        return
    }

    if (type === "link") {
        fs.unlinkSync(target)
        return
    }

    fs.rmSync(target, {
        recursive: true,
        force: true
    })
}

function createEnvironmentLink() {
    if (targetExists()) {
        removeTarget()
    }

    fs.symlinkSync(source, target, "junction")
}

if (!fs.existsSync(source)) {
    console.log(`${colors.red}${logPrefix()} React environment not found: ${source}${colors.reset}`)
    process.exit(1)
}

if (isCorrectEnvironment()) {
    console.log(
        `${colors.green}${logPrefix()} Environment ${version} already linked${colors.reset}`
    )
    process.exit(0)
}

const targetType = getTargetType()
const oldTarget = getTargetRealPath()

if (targetType !== "missing") {
    console.log(`${colors.yellow}${logPrefix()} Invalid node_modules detected${colors.reset}`)

    if (oldTarget) {
        console.log(`${colors.blue}${logPrefix()} Old target: ${oldTarget}${colors.reset}`)
    } else {
        console.log(`${colors.red}${logPrefix()} Broken node_modules link detected${colors.reset}`)
    }
}

createEnvironmentLink()

console.log(
    `${colors.green}${logPrefix()} Environment ${version} linked successfully${colors.reset}`
)
