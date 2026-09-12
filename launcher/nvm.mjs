import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { root, requiredNodeVersion } from "./constants.mjs"
import { log, error } from "./logger.mjs"

function getNvmPath() {
    try {
        const output = execFileSync("where.exe", ["nvm.exe"], {
            encoding: "utf8",
            windowsHide: true
        })

        return (
            output
                .split(/\r?\n/)
                .map((value) => value.trim())
                .find(Boolean) || null
        )
    } catch {
        return null
    }
}

function getNvmEnvironment(nvmPath) {
    try {
        return execFileSync(nvmPath, ["env"], {
            encoding: "utf8",
            windowsHide: true
        })
    } catch (err) {
        error("Failed to read NVM environment")
        error(err.message)
        return null
    }
}

function getNvmRoot(nvmPath) {
    const output = getNvmEnvironment(nvmPath)

    if (!output) {
        return null
    }

    const lines = output
        .split(/\r?\n/)
        .map((value) => value.trim())
        .filter(Boolean)

    for (const line of lines) {
        const match = line.match(/(?:NVM_HOME|NVM_ROOT|root|home)\s*[:=]\s*(.+)$/i)

        if (!match) {
            continue
        }

        const value = match[1].trim().replace(/^["']|["']$/g, "")

        if (fs.existsSync(value)) {
            return value
        }
    }

    const possiblePaths = []

    for (const line of lines) {
        const matches = line.match(/[A-Za-z]:\\[^<>\r\n"]+/g)

        if (!matches) {
            continue
        }

        for (const match of matches) {
            const value = match
                .trim()
                .replace(/[;,]+$/, "")
                .replace(/^["']|["']$/g, "")

            if (fs.existsSync(value)) {
                possiblePaths.push(value)
            }
        }
    }

    for (const possiblePath of possiblePaths) {
        const versionPath = path.join(possiblePath, `v${requiredNodeVersion}`)

        if (fs.existsSync(versionPath)) {
            return possiblePath
        }
    }

    return null
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

function getNvmNodeExecutable(nvmPath) {
    const nvmRoot = getNvmRoot(nvmPath)

    if (!nvmRoot) {
        error("NVM root could not be resolved")
        return null
    }

    const nodeExecutable = path.join(nvmRoot, `v${requiredNodeVersion}`, "node.exe")

    if (!fs.existsSync(nodeExecutable)) {
        error(`Node executable does not exist: ${nodeExecutable}`)
        return null
    }

    return nodeExecutable
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
        if (!installNodeWithNvm(nvmPath)) {
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

    const nodeExecutable = getNvmNodeExecutable(nvmPath)

    if (!nodeExecutable) {
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

    return {
        supported: true,
        source: "nvm",
        version,
        executable: nodeExecutable,
        managerPath: nvmPath
    }
}

export { getNvmPath, getNvmVersions, resolveNvmNode }
