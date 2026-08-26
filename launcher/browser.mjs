import { spawn } from "node:child_process"
import { log, error } from "./logger.mjs"
import { state } from "./state.mjs"
import { url } from "./constants.mjs"

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

export { openBrowser }
