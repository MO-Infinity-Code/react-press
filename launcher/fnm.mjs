import { execFileSync } from "node:child_process"
import { root, requiredNodeVersion } from "./constants.mjs"
import { log, error } from "./logger.mjs"

function getFnmPath() {
    try {
        return (
            execFileSync("where.exe", ["fnm.exe"], {
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

function getFnmVersions(fnmPath) {
    try {
        const output = execFileSync(fnmPath, ["list"], {
            encoding: "utf8",
            windowsHide: true
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
    } catch (err) {
        error("Failed to read FNM versions")
        error(err.message)
        return []
    }
}

function installNodeWithFnm(fnmPath) {
    log(`Installing Node.js ${requiredNodeVersion} using FNM`)

    try {
        execFileSync(fnmPath, ["install", requiredNodeVersion], {
            stdio: "inherit",
            cwd: root,
            windowsHide: false
        })

        return true
    } catch (err) {
        error("Failed to install Node.js with FNM")
        error(err.message)
        return false
    }
}

function getFnmNodeExecutable(fnmPath) {
    try {
        const output = execFileSync(
            fnmPath,
            ["exec", "--using", requiredNodeVersion, "node", "-p", "process.execPath"],
            {
                encoding: "utf8",
                cwd: root,
                windowsHide: true
            }
        )

        return (
            output
                .split(/\r?\n/)
                .map((value) => value.trim())
                .filter(Boolean)
                .at(-1) || null
        )
    } catch (err) {
        error(`Failed to resolve Node.js ${requiredNodeVersion} from FNM`)
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

function resolveFnmNode() {
    const fnmPath = getFnmPath()

    if (!fnmPath) {
        return null
    }

    log("FNM detected")

    let versions = getFnmVersions(fnmPath)

    if (!versions.includes(requiredNodeVersion)) {
        const installed = installNodeWithFnm(fnmPath)

        if (!installed) {
            return {
                supported: false,
                source: "fnm",
                version: null,
                executable: null
            }
        }

        versions = getFnmVersions(fnmPath)
    }

    const nodeExecutable = getFnmNodeExecutable(fnmPath)

    if (!nodeExecutable) {
        return {
            supported: false,
            source: "fnm",
            version: null,
            executable: null
        }
    }

    const version = getNodeVersion(nodeExecutable)

    if (version !== requiredNodeVersion) {
        return {
            supported: false,
            source: "fnm",
            version,
            executable: nodeExecutable
        }
    }

    log(`Node.js ${version} selected from FNM`)

    return {
        supported: true,
        source: "fnm",
        version,
        executable: nodeExecutable,
        managerPath: fnmPath
    }
}

export { getFnmPath, getFnmVersions, resolveFnmNode }
