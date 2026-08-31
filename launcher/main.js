import path from "node:path"
import fs from "node:fs"
import { log, error } from "./logger.mjs"
import { isSea, root, projectPath, setupScript } from "./constants.mjs"
import { runSetup } from "./setup.mjs"
import { checkExistingVite } from "./viteManager.mjs"
import { ensureMongoDB } from "./databaseManager.mjs"

function keepAlive() {
    if (!isSea) return
    process.stdin.resume()
    process.stdin.on("data", () => {})
}

function fail(message, details = null) {
    error(message)

    if (details) {
        error(details)
    }

    keepAlive()
}

async function main() {
    log("========== React Press Launcher ==========")
    if (!fs.existsSync(projectPath)) {
        fail("Project directory does not exist", projectPath)
        return
    }

    if (!fs.existsSync(setupScript)) {
        fail("Setup script does not exist", setupScript)
        return
    }

    let mongoResult

    try {
        mongoResult = await ensureMongoDB()
    } catch (err) {
        fail("MongoDB setup crashed", err)
        return
    }

    if (!mongoResult?.success) {
        fail("React Press could not prepare MongoDB", mongoResult?.reason)
        return
    }

    let setupResult

    try {
        setupResult = await runSetup()
    } catch (err) {
        fail("Environment setup crashed", err)
        return
    }

    if (!setupResult?.success) {
        if (setupResult?.reason === "unsupported-node") {
            const { openNodeErrorPage } = await import("./browser.mjs")

            openNodeErrorPage(setupResult.version)
        }

        fail("React Press could not prepare the required environment")

        return
    }

    try {
        checkExistingVite(setupResult.node)
    } catch (err) {
        fail("Failed to start Vite", err)
    }
}

main().catch((err) => {
    error("Unhandled React Press Launcher error")

    error(err)

    keepAlive()
})
