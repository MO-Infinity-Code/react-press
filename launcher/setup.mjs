import { spawn, execFileSync } from "node:child_process"
import { root, setupScript, isSea } from "./constants.mjs"
import { log, error } from "./logger.mjs"
import { waitBeforeExit } from "./utils.mjs"
import { checkExistingVite } from "./viteManager.mjs"

function runSetup() {
    let nodeCommand = process.execPath

    if (isSea) {
        try {
            nodeCommand = execFileSync("where.exe", ["node.exe"], {
                encoding: "utf8"
            })
                .split(/\r?\n/)[0]
                .trim()
        } catch {
            error("Node.js was not found in PATH")
            waitBeforeExit()
        }
    }

    log("Node command:", nodeCommand)

    const setupProcess = spawn(nodeCommand, [setupScript], {
        cwd: root,
        stdio: "inherit",
        windowsHide: false
    })

    setupProcess.on("error", (err) => {
        error("Failed to start setup script")
        error(err)
        waitBeforeExit()
    })

    setupProcess.on("close", (code) => {
        log("Setup finished with code:", code)

        if (code !== 0) {
            error("Environment setup failed")
            waitBeforeExit(code)
        }

        checkExistingVite()
    })
}

export { runSetup }
