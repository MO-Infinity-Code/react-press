import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const root = path.resolve(__dirname, "..")

const version = "19.2.8"

const source = path.resolve(root, "react", version, "node_modules")

const target = path.resolve(root, "projects", "react-press", "node_modules")

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
    throw new Error(`React environment not found: ${source}`)
}

if (isCorrectEnvironment()) {
    console.log(`Environment ${version} already linked`)
    process.exit(0)
}

const targetType = getTargetType()
const oldTarget = getTargetRealPath()

if (targetType !== "missing") {
    console.log(`Invalid node_modules detected`)

    if (oldTarget) {
        console.log(`Old target: ${oldTarget}`)
    } else {
        console.log(`Broken node_modules link detected`)
    }
}

createEnvironmentLink()

console.log(`Environment ${version} linked successfully`)
