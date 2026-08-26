import { spawn } from "node:child_process"
import path from "node:path"
import { port, projectPath } from "./constants.mjs"
import { log, error } from "./logger.mjs"
import { checkPort, waitBeforeExit } from "./utils.mjs"
import { state } from "./state.mjs"
import { openBrowser } from "./browser.mjs"

function checkExistingVite(node) {
    checkPort(port, (exists) => {
        if (exists) {
            log("Vite already running")
            openBrowser()
            return
        }

        log("Starting Vite...")
        startVite(node)
    })
}

function startVite(node) {
    const nodeDirectory = path.dirname(node.executable)

    const npmCli = path.join(nodeDirectory, "node_modules", "npm", "bin", "npm-cli.js")

    state.viteProcess = spawn(node.executable, [npmCli, "run", "dev"], {
        cwd: projectPath,
        stdio: "inherit",
        windowsHide: false,
        env: {
            ...process.env,
            PATH: `${nodeDirectory};${process.env.PATH || ""}`
        }
    })

    state.viteProcess.on("error", (err) => {
        error("Failed to start Vite")
        error(err.message)
        waitBeforeExit()
    })

    state.viteProcess.on("close", (code) => {
        if (code !== 0) {
            error(`Vite exited with code ${code}`)
            waitBeforeExit(code)
        }
    })

    waitForVite()
}

function waitForVite() {
    let attempts = 0
    const maxAttempts = 100

    const interval = setInterval(() => {
        attempts++

        checkPort(port, (exists) => {
            if (exists) {
                clearInterval(interval)

                log(`Vite ready: http://localhost:${port}/`)
                openBrowser()

                return
            }

            if (attempts >= maxAttempts) {
                clearInterval(interval)

                error("Vite did not become ready")
                waitBeforeExit()
            }
        })
    }, 300)
}

export { checkExistingVite }
