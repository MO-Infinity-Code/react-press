import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { root, requiredNodeVersion } from "./constants.mjs"
import { log, warn, error } from "./logger.mjs"

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

function getNvmSymlink() {
    log("========== Resolving NVM symlink ==========")

    const configuredSymlink = process.env.NVM_SYMLINK?.trim()

    log(`NVM_SYMLINK: ${configuredSymlink || "NOT SET"}`)

    if (configuredSymlink) {
        log(`Checking configured NVM_SYMLINK: ${configuredSymlink}`)
        log(`Exists: ${fs.existsSync(configuredSymlink)}`)

        if (fs.existsSync(configuredSymlink)) {
            log(`Using NVM_SYMLINK: ${configuredSymlink}`)
            return configuredSymlink
        }

        warn(`Configured NVM_SYMLINK does not exist: ${configuredSymlink}`)
    }

    const candidates = ["C:\\Program Files\\nodejs", "C:\\Program Files (x86)\\nodejs"]

    log("Checking fallback NVM symlink locations...")

    for (const candidate of candidates) {
        const exists = fs.existsSync(candidate)

        log(`Checking: ${candidate}`)
        log(`Exists: ${exists}`)

        if (exists) {
            log(`Using fallback NVM symlink: ${candidate}`)
            return candidate
        }
    }

    error("No valid NVM symlink directory was found")

    return null
}

function getNvmNodeExecutable() {
    log("========== Resolving NVM Node executable ==========")

    const nvmSymlink = getNvmSymlink()

    log(`NVM symlink: ${nvmSymlink || "NOT FOUND"}`)

    if (!nvmSymlink) {
        error("NVM symlink directory was not found")
        error(`NVM_SYMLINK environment variable: ${process.env.NVM_SYMLINK || "NOT SET"}`)
        return null
    }

    const nodeExecutable = path.join(nvmSymlink, "node.exe")

    log(`Expected Node executable: ${nodeExecutable}`)
    log(`Checking if Node executable exists...`)

    if (!fs.existsSync(nodeExecutable)) {
        error("Node executable does not exist")
        error(`Missing file: ${nodeExecutable}`)

        try {
            const files = fs.readdirSync(nvmSymlink)
            log(`Files inside NVM symlink directory:`)
            log(files)
        } catch (err) {
            error("Failed to read NVM symlink directory")
            error(err.message)
        }

        return null
    }

    log(`Node executable found: ${nodeExecutable}`)

    try {
        const stats = fs.statSync(nodeExecutable)

        log(`Node executable size: ${stats.size} bytes`)
        log(`Node executable is file: ${stats.isFile()}`)
    } catch (err) {
        error("Failed to inspect Node executable")
        error(err.message)
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

    const nodeExecutable = getNvmNodeExecutable()

    if (!nodeExecutable) {
        error("Node.js executable was not found in NVM symlink")

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
