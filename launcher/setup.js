import { spawn, execFileSync } from "node:child_process"
import fs from "node:fs"
import { log, error, waitBeforeExit } from "./utils.js"

export function runSetup(config) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(config.setupScript)) {
            error("Setup script does not exist:", config.setupScript)
            waitBeforeExit(config)
            reject()
            return
        }

        let nodeCommand = process.execPath
        if (config.isSea) {
            try {
                nodeCommand = execFileSync("where.exe", ["node.exe"], { encoding: "utf8" })
                    .split(/\r?\n/)[0]
                    .trim()
            } catch {
                error("Node.js was not found in PATH")
                waitBeforeExit(config)
                reject()
                return
            }
        }

        log("Node command:", nodeCommand)

        const setupProcess = spawn(nodeCommand, [config.setupScript], {
            cwd: config.root,
            stdio: "inherit",
            windowsHide: false
        })

        setupProcess.on("error", (err) => {
            error("Failed to start setup script:", err)
            waitBeforeExit(config)
            reject(err)
        })

        setupProcess.on("close", (code) => {
            log("Setup finished with code:", code)
            if (code !== 0) {
                error("Environment setup failed")
                waitBeforeExit(config, code)
                reject(new Error(`Setup failed with code ${code}`))
            } else {
                resolve()
            }
        })
    })
}
