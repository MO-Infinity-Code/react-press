import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { root, requiredNodeVersion } from "./constants.mjs"
import { log, error } from "./logger.mjs"

function getNvmPath() {
    try {
        return (
            execFileSync("where.exe", ["nvm.exe"], {
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

function getNvmRoot(nvmPath) {
    try {
        const output = execFileSync(nvmPath, ["root"], {
            encoding: "utf8",
            windowsHide: true
        })

        const lines = output
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean)

        return lines.at(-1) || null
    } catch (err) {
        error("Failed to read NVM root")
        error(err.message)
        return null
    }
}

function getNvmVersions(nvmPath) {
    try {
        const output = execFileSync(nvmPath, ["list"], {
            encoding: "utf8",
            windowsHide: true
        })

        const versions = []

        for (const line of output.split(/\r?\n/)) {
            const matches = line.match(/v?(\d+\.\d+\.\d+)/g)

            if (!matches) {
                continue
            }

            for (const version of matches) {
                versions.push(version.replace(/^v/, ""))
            }
        }

        return [...new Set(versions)]
    } catch (err) {
        error("Failed to read NVM versions")
        error(err.message)
        return []
    }
}

function installNodeWithNvm(nvmPath) {
    log(`Installing Node.js ${requiredNodeVersion} using NVM`)

    try {
        execFileSync(nvmPath, ["install", requiredNodeVersion], {
            stdio: "inherit",
            cwd: root,
            windowsHide: false
        })

        return true
    } catch (err) {
        error("Failed to install Node.js with NVM")
        error(err.message)
        return false
    }
}

function useNodeWithNvm(nvmPath) {
    log(`Activating Node.js ${requiredNodeVersion} using NVM`)

    try {
        execFileSync(nvmPath, ["use", requiredNodeVersion], {
            stdio: "inherit",
            cwd: root,
            windowsHide: false
        })

        return true
    } catch (err) {
        error("Failed to activate Node.js with NVM")
        error(err.message)
        return false
    }
}

function getNvmNodeExecutable(nvmPath, version) {
    const nvmRoot = getNvmRoot(nvmPath)

    if (!nvmRoot) {
        return null
    }

    const candidates = [
        path.join(nvmRoot, `v${version}`, "node.exe"),
        path.join(nvmRoot, version, "node.exe")
    ]

    return candidates.find((filePath) => fs.existsSync(filePath)) || null
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

function resolveNvmNode() {
    const nvmPath = getNvmPath()

    if (!nvmPath) {
        return null
    }

    log("NVM detected")

    let versions = getNvmVersions(nvmPath)

    if (!versions.includes(requiredNodeVersion)) {
        const installed = installNodeWithNvm(nvmPath)

        if (!installed) {
            return {
                supported: false,
                source: "nvm",
                version: null,
                executable: null
            }
        }

        versions = getNvmVersions(nvmPath)
    }

    if (!versions.includes(requiredNodeVersion)) {
        error(`Node.js ${requiredNodeVersion} is not available in NVM`)

        return {
            supported: false,
            source: "nvm",
            version: null,
            executable: null
        }
    }

    if (!useNodeWithNvm(nvmPath)) {
        return {
            supported: false,
            source: "nvm",
            version: null,
            executable: null
        }
    }

    const nodeExecutable = getNvmNodeExecutable(nvmPath, requiredNodeVersion)

    if (!nodeExecutable) {
        error(`Node.js ${requiredNodeVersion} executable was not found in NVM`)

        return {
            supported: false,
            source: "nvm",
            version: null,
            executable: null
        }
    }

    const version = getNodeVersion(nodeExecutable)

    if (version !== requiredNodeVersion) {
        error(`Expected Node.js ${requiredNodeVersion} but found ${version || "Unknown"} in NVM`)

        return {
            supported: false,
            source: "nvm",
            version,
            executable: nodeExecutable
        }
    }

    log(`Node.js ${version} selected from NVM`)
    log(`Node executable: ${nodeExecutable}`)

    return {
        supported: true,
        source: "nvm",
        version,
        executable: nodeExecutable,
        managerPath: nvmPath
    }
}

export { getNvmPath, getNvmVersions, resolveNvmNode }
