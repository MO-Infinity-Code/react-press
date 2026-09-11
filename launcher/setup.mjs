import { spawn, execFileSync } from "node:child_process"
import { root, setupScript, requiredNodeVersion, minimumSystemNodeMajor } from "./constants.mjs"
import { log, error } from "./logger.mjs"
import { resolveFnmNode } from "./fnm.mjs"
import { resolveNvmNode } from "./nvm.mjs"

function commandExists(command) {
    try {
        execFileSync("where.exe", [command], {
            stdio: "ignore",
            windowsHide: true
        })

        return true
    } catch {
        return false
    }
}

function getSystemNodeExecutable() {
    try {
        return (
            execFileSync("where.exe", ["node.exe"], {
                encoding: "utf8",
                windowsHide: true
            })
                .split(/\r?\n/)
                .map((value) => value.trim())
                .find(Boolean) || null
        )
    } catch {
        return null
    }
}

function getNodeVersion(nodeCommand) {
    try {
        return execFileSync(nodeCommand, ["--version"], {
            encoding: "utf8",
            windowsHide: true
        })
            .trim()
            .replace(/^v/, "")
    } catch {
        return null
    }
}

function getMajorVersion(version) {
    if (!version) {
        return null
    }

    const major = Number(version.split(".")[0])

    return Number.isFinite(major) ? major : null
}

function resolveSystemNode() {
    if (!commandExists("node.exe")) {
        return {
            supported: false,
            source: "system",
            version: null,
            executable: null
        }
    }

    const nodeExecutable = getSystemNodeExecutable()

    if (!nodeExecutable) {
        return {
            supported: false,
            source: "system",
            version: null,
            executable: null
        }
    }

    const version = getNodeVersion(nodeExecutable)
    const major = getMajorVersion(version)

    log(`System Node.js detected: ${version || "Unknown"}`)

    if (!major || major < minimumSystemNodeMajor) {
        error(
            `System Node.js ${version || "Unknown"} is below required Node.js ${requiredNodeVersion}`
        )

        return {
            supported: false,
            source: "system",
            version,
            executable: nodeExecutable
        }
    }

    return {
        supported: true,
        source: "system",
        version,
        executable: nodeExecutable
    }
}

function resolveNode() {
    const fnmNode = resolveFnmNode()

    if (fnmNode?.supported) {
        return fnmNode
    }

    const nvmNode = resolveNvmNode()

    if (nvmNode?.supported) {
        return nvmNode
    }

    return resolveSystemNode()
}

function runSetup() {
    const node = resolveNode()

    if (!node || !node.supported) {
        return Promise.resolve({
            success: false,
            reason: "unsupported-node",
            version: node?.version || null,
            source: node?.source || null
        })
    }

    log(`Node.js ${node.version}`)
    log(`Node source: ${node.source}`)
    log(`Node executable: ${node.executable}`)

    return new Promise((resolve) => {
        const setupProcess = spawn(node.executable, [setupScript], {
            cwd: root,
            stdio: "inherit",
            windowsHide: false
        })

        setupProcess.on("error", (err) => {
            error("Failed to start environment setup")
            error(err.message)

            resolve({
                success: false,
                reason: "setup-process-error"
            })
        })

        setupProcess.on("close", (code) => {
            if (code !== 0) {
                error("Environment setup failed")

                resolve({
                    success: false,
                    reason: "setup-failed",
                    code
                })

                return
            }

            resolve({
                success: true,
                node
            })
        })
    })
}

export { runSetup, resolveNode }
