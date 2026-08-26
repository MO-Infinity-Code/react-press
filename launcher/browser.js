import { spawn } from "node:child_process"
import { log, error } from "./utils.js"

export function openBrowser(config) {
    return new Promise((resolve, reject) => {
        log("Opening:", config.url)

        const browser = spawn("cmd.exe", ["/c", "start", "", config.url], {
            detached: true,
            stdio: "ignore",
            windowsHide: true
        })

        browser.on("error", (err) => {
            error("Failed to open browser:", err)
            reject(err)
        })

        browser.on("close", (code) => {
            log("Browser closed with code:", code)
            resolve(code)
        })

        browser.unref()
    })
}
