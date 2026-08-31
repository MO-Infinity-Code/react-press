import { spawn } from "node:child_process"
import { success, warn, error } from "./logger.mjs"
import { state } from "./state.mjs"
import { url, nodeErrorPage } from "./constants.mjs"

function openBrowser() {
    if (state.browserOpened) return
    state.browserOpened = true
    success("Opening:", url)
    const browser = spawn("cmd.exe", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
    })
    browser.on("error", (err) => {
        error("Failed to open browser")
        error(err.message)
        state.browserOpened = false
    })
    browser.unref()
}

function openNodeErrorPage(detectedVersion) {
    const separator = nodeErrorPage.includes("?") ? "&" : "?"
    const encodedVersion = encodeURIComponent(detectedVersion || "Unknown")
    const page = `file:///${nodeErrorPage.replace(/\\/g, "/")}${separator}detected=${encodedVersion}`
    warn("Opening Node.js error page:", page)
    const browser = spawn("cmd.exe", ["/c", "start", "", page], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
    })
    browser.on("error", (err) => {
        error("Failed to open Node.js error page")
        error(err.message)
    })
    browser.unref()
}

export { openBrowser, openNodeErrorPage }
