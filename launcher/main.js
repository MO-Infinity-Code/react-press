import path from "node:path"
import fs from "node:fs"
import { log, error } from "./logger.mjs"
import { __dirname, isSea, root, projectPath, setupScript, url } from "./constants.mjs"
import { waitBeforeExit } from "./utils.mjs"
import { runSetup } from "./setup.mjs"

log("========== React Press Launcher ==========")
log("SEA:", isSea)
log("Executable:", process.execPath)
log("Directory:", isSea ? path.dirname(process.execPath) : __dirname)
log("Root:", root)

log("Project:", projectPath)
log("Setup:", setupScript)
log("URL:", url)

if (!fs.existsSync(projectPath)) {
    error("Project directory does not exist")
    error(projectPath)
    waitBeforeExit()
}

if (!fs.existsSync(setupScript)) {
    error("Setup script does not exist")
    error(setupScript)
    waitBeforeExit()
}

runSetup()
