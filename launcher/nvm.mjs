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

function getNvmNodeExecutable(nvmPath) {
    log("========== Resolving NVM Node executable ==========")

    try {
        const output = execFileSync(
            nvmPath,
            ["exec", requiredNodeVersion, "node", "-p", "process.execPath"],
            {
                encoding: "utf8",
                cwd: root,
                windowsHide: true
            }
        )

        log(`NVM exec output:`)
        log(output)

        const nodeExecutable = output
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean)
            .at(-1)

        log(`Resolved Node executable from NVM: ${nodeExecutable || "NOT FOUND"}`)

        if (!nodeExecutable) {
            error("NVM did not return a Node executable path")
            return null
        }

        if (!fs.existsSync(nodeExecutable)) {
            error(`Resolved Node executable does not exist: ${nodeExecutable}`)
            return null
        }

        log(`Node executable exists: ${nodeExecutable}`)

        return nodeExecutable
    } catch (err) {
        error("Failed to resolve Node.js executable from NVM")
        error(err.message)
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
