import { spawn } from "node:child_process"
import path from "node:path"
import { port, projectPath } from "./constants.mjs"
import { log, error } from "./logger.mjs"
import { checkPort, waitBeforeExit } from "./utils.mjs"
import { state } from "./state.mjs"
import { openBrowser } from "./browser.mjs"

function checkExistingRsbuild(node) {
    checkPort(port, (exists) => {
        if (exists) {
            log("Rsbuild already running")
            openBrowser()
            return
        }

        log("Starting Rsbuild...")
        startRsbuild(node)
    })
}

function startRsbuild(node) {
    const nodeDirectory = path.dirname(node.executable)

    const npmCli = path.join(nodeDirectory, "node_modules", "npm", "bin", "npm-cli.js")

    state.rsbuildProcess = spawn(node.executable, [npmCli, "run", "dev"], {
        cwd: projectPath,
        stdio: "inherit",
        windowsHide: false,
        env: {
            ...process.env,
            PATH: `${nodeDirectory};${process.env.PATH || ""}`
        }
    })

    state.rsbuildProcess.on("error", (err) => {
        error("Failed to start Rsbuild")
        error(err.message)
        waitBeforeExit()
    })

    state.rsbuildProcess.on("close", (code) => {
        if (code !== 0) {
            error(`Rsbuild exited with code ${code}`)
            waitBeforeExit(code)
        }
    })

    waitForRsbuild()
}

function waitForRsbuild() {
    let attempts = 0
    const maxAttempts = 100

    const interval = setInterval(() => {
        attempts++

        checkPort(port, (exists) => {
            if (exists) {
                clearInterval(interval)

                log(`Rsbuild ready: http://localhost:${port}/`)
                openBrowser()

                return
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval)

                error("Rsbuild did not become ready")
                waitBeforeExit()
            }
        })
    }, 300)
}

export { checkExistingRsbuild }
