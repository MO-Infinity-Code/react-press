import { spawn } from "node:child_process"
import { log, error, waitBeforeExit, checkPort } from "./utils.js"
import { openBrowser } from "./browser.js"

export function startViteAndWait(config) {
    return new Promise((resolve, reject) => {
        log("Starting Vite")
        const viteProcess = spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
            cwd: config.projectPath,
            stdio: "inherit",
            windowsHide: false
        })

        viteProcess.on("error", (err) => {
            error("Failed to start Vite:", err)
            reject(err)
        })

        viteProcess.on("close", (code) => {
            log("Vite exited with code:", code)
            resolve(code)
        })

        waitForVite(config)
            .then(() => {
                log("Vite is ready, opening browser")
                openBrowser(config).catch((err) => error("Failed to open browser:", err))
            })
            .catch((err) => {
                error("Vite failed to become ready:", err)
                reject(err)
            })
    })
}

function waitForVite(config) {
    return new Promise((resolve, reject) => {
        let attempts = 0
        const maxAttempts = 100
        const interval = setInterval(() => {
            attempts++
            checkPort(config.port, (exists) => {
                if (exists) {
                    clearInterval(interval)
                    resolve()
                    return
                }
                if (attempts >= maxAttempts) {
                    clearInterval(interval)
                    reject(new Error("Vite timeout"))
                }
            })
        }, 300)
    })
}

export function checkExistingVite(config) {
    return new Promise((resolve) => {
        log("Checking Vite...")
        checkPort(config.port, (exists) => {
            resolve(exists)
        })
    })
}
