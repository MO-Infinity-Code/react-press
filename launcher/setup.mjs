import { spawn, execFileSync } from "node:child_process"
import { root, setupScript, requiredNodeVersion, minimumSystemNodeMajor } from "./constants.mjs"
import { log, error } from "./logger.mjs"

function commandExists(command) {
    try {
        execFileSync("where.exe", [command], {
            stdio: "ignore"
        })

        return true
    } catch {
        return false
    }
}

function getFnmPath() {
    try {
        return (
            execFileSync("where.exe", ["fnm.exe"], {
                encoding: "utf8"
            })
                .split(/\r?\n/)
                .map((value) => value.trim())
                .find(Boolean) || null
        )
    } catch {
        return null
    }
}

function getFnmVersions(fnmPath) {
    try {
        const output = execFileSync(fnmPath, ["list"], {
            encoding: "utf8"
        })

        const versions = []

        for (const line of output.split(/\r?\n/)) {
            const matches = line.match(/v(\d+\.\d+\.\d+)/g)

            if (!matches) {
                continue
            }

            for (const version of matches) {
                versions.push(version.substring(1))
            }
        }

        return [...new Set(versions)]
    } catch {
        return []
    }
}

function installNodeWithFnm(fnmPath) {
    log(`Installing Node.js ${requiredNodeVersion}...`)

    try {
        execFileSync(fnmPath, ["install", requiredNodeVersion], {
            stdio: "inherit",
            cwd: root
        })

        return true
    } catch (err) {
        error("Failed to install Node.js with FNM")
        error(err.message)
        return false
    }
}

function getFnmNodeExecutable(fnmPath, version) {
    try {
        const output = execFileSync(
            fnmPath,
            ["exec", "--using", version, "node", "-p", "process.execPath"],
            {
                encoding: "utf8",
                cwd: root
            }
        )

        return (
            output
                .split(/\r?\n/)
                .map((value) => value.trim())
                .filter(Boolean)
                .at(-1) || null
        )
    } catch {
        return null
    }
}

function getNodeVersion(nodeCommand) {
    try {
        return execFileSync(nodeCommand, ["--version"], {
            encoding: "utf8"
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

function resolveNode() {
    const fnmPath = getFnmPath()

    if (fnmPath) {
        const versions = getFnmVersions(fnmPath)

        let nodeExecutable = getFnmNodeExecutable(fnmPath, requiredNodeVersion)

        if (!nodeExecutable) {
            if (!versions.includes(requiredNodeVersion)) {
                const installed = installNodeWithFnm(fnmPath)

                if (!installed) {
                    return {
                        unsupported: true,
                        version: null,
                        source: "fnm"
                    }
                }
            }

            nodeExecutable = getFnmNodeExecutable(fnmPath, requiredNodeVersion)
        }

        if (!nodeExecutable) {
            return {
                unsupported: true,
                version: null,
                source: "fnm"
            }
        }

        const version = getNodeVersion(nodeExecutable)

        if (version !== requiredNodeVersion) {
            return {
                unsupported: true,
                version,
                source: "fnm"
            }
        }

        log(`Node.js ${version}`)

        return {
            executable: nodeExecutable,
            version,
            fnmPath,
            source: "fnm"
        }
    }

    if (!commandExists("node.exe")) {
        return {
            unsupported: true,
            version: null,
            source: "system"
        }
    }

    const nodeCommand = execFileSync("where.exe", ["node.exe"], {
        encoding: "utf8"
    })
        .split(/\r?\n/)
        .map((value) => value.trim())
        .find(Boolean)

    const version = getNodeVersion(nodeCommand)
    const major = getMajorVersion(version)

    if (!major || major < minimumSystemNodeMajor) {
        return {
            unsupported: true,
            version,
            source: "system"
        }
    }

    log(`Node.js ${version}`)

    return {
        executable: nodeCommand,
        version,
        source: "system"
    }
}

function runSetup() {
    const node = resolveNode()

    if (!node || node.unsupported) {
        return Promise.resolve({
            success: false,
            reason: "unsupported-node",
            version: node?.version || null
        })
    }

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
