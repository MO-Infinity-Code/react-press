import { spawn, execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import path from "node:path"
import http from "node:http"
import fs from "node:fs"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isSea = process.execPath.toLowerCase().endsWith(".exe")

const root =
    isSea ? path.resolve(path.dirname(process.execPath), "..") : path.resolve(__dirname, "..")

const logPrefix = () => `[${new Date().toISOString()}] MAIN`

function log(...args) {
    console.log(logPrefix(), ...args)
}

function error(...args) {
    console.error(logPrefix(), ...args)
}

function waitBeforeExit(code = 1) {
    if (isSea) {
        console.log("")
        console.log("Press Enter to exit...")
        process.stdin.resume()
        process.stdin.once("data", () => {
            process.exit(code)
        })
        return
    }

    process.exit(code)
}

log("========== React Press Launcher ==========")
log("SEA:", isSea)
log("Executable:", process.execPath)
log("Directory:", isSea ? path.dirname(process.execPath) : __dirname)
log("Root:", root)

const projectPath = path.join(root, "projects", "react-press")

const setupScript = path.join(root, "scripts", "setup-environment.mjs")

const port = 3000
const url = `http://localhost:${port}/`

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

let browserOpened = false
let viteProcess = null

runSetup()

function runSetup() {
    let nodeCommand = process.execPath

    if (isSea) {
        try {
            nodeCommand = execFileSync("where.exe", ["node.exe"], {
                encoding: "utf8"
            })
                .split(/\r?\n/)[0]
                .trim()
        } catch {
            error("Node.js was not found in PATH")
            waitBeforeExit()
        }
    }

    log("Node command:", nodeCommand)

    const setupProcess = spawn(nodeCommand, [setupScript], {
        cwd: root,
        stdio: "inherit",
        windowsHide: false
    })

    setupProcess.on("error", (err) => {
        error("Failed to start setup script")
        error(err)
        waitBeforeExit()
    })

    setupProcess.on("close", (code) => {
        log("Setup finished with code:", code)

        if (code !== 0) {
            error("Environment setup failed")
            waitBeforeExit(code)
        }

        checkExistingVite()
    })
}

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

    viteProcess = spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], {
        cwd: projectPath,
        stdio: "inherit",
        windowsHide: false
    })

    viteProcess.on("error", (err) => {
        error("Failed to start Vite")
        error(err)
        waitBeforeExit()
    })

    viteProcess.on("close", (code) => {
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

function checkPort(port, callback) {
    let finished = false

    const finish = (result) => {
        if (finished) {
            return
        }

        finished = true
        callback(result)
    }

    const request = http.get(
        {
            hostname: "localhost",
            port,
            path: "/"
        },
        (response) => {
            response.resume()

            finish(response.statusCode >= 200 && response.statusCode < 500)
        }
    )

    request.on("error", () => {
        finish(false)
    })

    request.setTimeout(1000, () => {
        request.destroy()
        finish(false)
    })
}

function openBrowser() {
    if (browserOpened) {
        return
    }

    browserOpened = true

    log("Opening:", url)

    const browser = spawn("cmd.exe", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: true
    })

    browser.on("error", (err) => {
        error("Failed to open browser")
        error(err)
        browserOpened = false
    })

    browser.unref()
}
