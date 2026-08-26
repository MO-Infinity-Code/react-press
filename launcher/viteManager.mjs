import { spawn } from "node:child_process"
import { port, projectPath } from "./constants.mjs"
import { log, error } from "./logger.mjs"
import { checkPort, waitBeforeExit } from "./utils.mjs"
import { state } from "./state.mjs"
import { openBrowser } from "./browser.mjs"

function checkExistingVite() {
    log("Checking Vite...")

    checkPort(port, (exists) => {
        if (exists) {
            log("Vite is already running")
            openBrowser()
            return
        }

        log("Vite is not running")
        startVite()
    })
}

function startVite() {
    log("Starting Vite")

    state.viteProcess = spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
        cwd: projectPath,
        stdio: "inherit",
        windowsHide: false
    })

    state.viteProcess.on("error", (err) => {
        error("Failed to start Vite")
        error(err)
        waitBeforeExit()
    })

    state.viteProcess.on("close", (code) => {
        error("Vite exited with code:", code)

        if (code !== 0) {
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

                log("Vite is ready")
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
