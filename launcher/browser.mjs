import { spawn } from "node:child_process"
import { log, error } from "./logger.mjs"
import { state } from "./state.mjs"
import { url, nodeErrorPage } from "./constants.mjs"

function openBrowser() {
    if (state.browserOpened) {
        return
    }

    state.browserOpened = true

    log("Opening:", url)

    const browser = spawn("cmd.exe", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
    })

    browser.on("error", (err) => {
        error("Failed to open browser")

        error(err)

        state.browserOpened = false
    })

    browser.unref()
}

function openNodeErrorPage(detectedVersion) {
    const separator = nodeErrorPage.includes("?") ? "&" : "?"

    const encodedVersion = encodeURIComponent(detectedVersion || "Unknown")

    const page = `file:///${nodeErrorPage.replace(/\\/g, "/")}${separator}detected=${encodedVersion}`

    log("Opening Node.js error page:", page)

    const browser = spawn("cmd.exe", ["/c", "start", "", page], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
    })

    browser.unref()
}

export { openBrowser, openNodeErrorPage }
