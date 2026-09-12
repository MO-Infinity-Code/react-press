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

        const nvmPath = output
            .split(/\r?\n/)
            .map((value) => value.trim())
            .find(Boolean)

        log(`NVM executable path: ${nvmPath || "NOT FOUND"}`)

        return nvmPath || null
    } catch (err) {
        error("Failed to find NVM")
        error(err.message)
        return null
    }
}

function getNvmEnvironment(nvmPath) {
    try {
        log("========== Reading NVM environment ==========")

        const output = execFileSync(nvmPath, ["env"], {
            encoding: "utf8",
            windowsHide: true
        })

        log(`NVM env output:\n${output}`)

        return output
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
            log(`Resolved NVM root: ${value}`)
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
            log(`Resolved NVM root from environment path: ${possiblePath}`)
            return possiblePath
        }
    }

    error("Could not resolve NVM root from nvm env")

    return null
}

function getNvmVersions(nvmPath) {
    try {
        const output = execFileSync(nvmPath, ["list"], {
            encoding: "utf8",
            windowsHide: true
        })

        log(`NVM list output:\n${output}`)

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

        const uniqueVersions = [...new Set(versions)]

        log(`Detected NVM versions: ${uniqueVersions.join(", ") || "NONE"}`)

        return uniqueVersions
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

        log(`Node.js ${requiredNodeVersion} installation completed`)

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

        log(`NVM use ${requiredNodeVersion} completed`)

        return true
    } catch (err) {
        error("Failed to activate Node.js with NVM")
        error(err.message)
        return false
    }
}

function getNvmNodeExecutable(nvmPath) {
    log("========== Resolving NVM Node executable ==========")

    const nvmRoot = getNvmRoot(nvmPath)

    if (!nvmRoot) {
        error("NVM root could not be resolved")
        return null
    }

    const versionDirectory = path.join(nvmRoot, `v${requiredNodeVersion}`)

    log(`NVM version directory: ${versionDirectory}`)

    if (!fs.existsSync(versionDirectory)) {
        error(`NVM version directory does not exist: ${versionDirectory}`)

        return null
    }

    const nodeExecutable = path.join(versionDirectory, "node.exe")

    log(`Expected Node executable: ${nodeExecutable}`)

    if (!fs.existsSync(nodeExecutable)) {
        error(`Node executable does not exist: ${nodeExecutable}`)

        return null
    }

    const stats = fs.statSync(nodeExecutable)

    log(`Node executable size: ${stats.size} bytes`)
    log(`Node executable is file: ${stats.isFile()}`)

    if (!stats.isFile()) {
        error(`Node executable is not a file: ${nodeExecutable}`)
        return null
    }

    return nodeExecutable
}

function getNodeVersion(nodeCommand) {
    try {
        const version = execFileSync(nodeCommand, ["--version"], {
            encoding: "utf8",
            windowsHide: true
        })
            .trim()
            .replace(/^v/, "")

        log(`Node.js version detected: ${version}`)

        return version
    } catch (err) {
        error("Failed to detect Node.js version")
        error(err.message)
        return null
    }
}

function resolveNvmNode() {
    log("========== Resolving Node.js through NVM ==========")

    const nvmPath = getNvmPath()

    if (!nvmPath) {
        log("NVM was not found")
        return null
    }

    log("NVM detected")
    log(`NVM path: ${nvmPath}`)

    let versions = getNvmVersions(nvmPath)

    if (!versions.includes(requiredNodeVersion)) {
        log(`Node.js ${requiredNodeVersion} was not found in NVM`)

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

    log(`Node.js ${requiredNodeVersion} is available in NVM`)

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
        error("Failed to resolve Node.js executable from NVM")

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
