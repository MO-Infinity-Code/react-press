import fs from "node:fs"
import { execFileSync } from "node:child_process"
import { root, requiredNodeVersion } from "./constants.mjs"
import { log, error } from "./logger.mjs"

function getNvmPath() {
    try {
        const output = execFileSync("where.exe", ["nvm.exe"], {
            encoding: "utf8",
            windowsHide: true
        })

        log(`where nvm.exe output: ${output}`)

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

function getNvmVersions(nvmPath) {
    try {
        log(`Reading NVM versions using: ${nvmPath}`)

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
    log(`NVM executable: ${nvmPath}`)

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
    log(`NVM executable: ${nvmPath}`)

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
    log(`NVM executable received: ${nvmPath || "UNDEFINED"}`)

    if (!nvmPath) {
        error("Cannot resolve Node executable because NVM path is undefined")
        return null
    }

    try {
        log(`Running NVM exec for Node.js ${requiredNodeVersion}`)

        const output = execFileSync(
            nvmPath,
            ["exec", requiredNodeVersion, "node", "-p", "process.execPath"],
            {
                encoding: "utf8",
                cwd: root,
                windowsHide: true
            }
        )

        log(`NVM exec raw output:\n${output}`)

        const lines = output
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter(Boolean)

        log(`NVM exec parsed lines:`)
        log(lines)

        const nodeExecutable = lines.at(-1)

        log(`Resolved Node executable: ${nodeExecutable || "NOT FOUND"}`)

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
    log(`Checking Node.js version using: ${nodeCommand}`)

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
        log("Installing required Node.js version...")

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

    log(`Checking if Node.js ${requiredNodeVersion} is available after installation`)

    if (!versions.includes(requiredNodeVersion)) {
        error(`Node.js ${requiredNodeVersion} is not available in NVM after installation`)

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
