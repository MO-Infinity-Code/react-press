import { spawn } from "node:child_process"
import path from "node:path"
import { backendPort, backendProjectPath } from "./constants.mjs"
import { log, error, success } from "./logger.mjs"
import { checkPort, waitBeforeExit } from "./utils.mjs"
import { state } from "./state.mjs"

function checkExistingBackend(node) {
    return new Promise((resolve, reject) => {
        checkPort(backendPort, (exists) => {
            if (exists) {
                log("Back End already running")

                waitForBackend().then(resolve).catch(reject)

                return
            }

            log("Starting Back End...")

            startBackend(node)

            waitForBackend().then(resolve).catch(reject)
        })
    })
}

function startBackend(node) {
    const nodeDirectory = path.dirname(node.executable)

    const npmCli = path.join(nodeDirectory, "node_modules", "npm", "bin", "npm-cli.js")

    state.backendProcess = spawn(node.executable, [npmCli, "run", "dev"], {
        cwd: backendProjectPath,
        stdio: "inherit",
        windowsHide: false,
        env: {
            ...process.env,
            PATH: `${nodeDirectory};${process.env.PATH || ""}`
        }
    })

    state.backendProcess.on("error", (err) => {
        error("Failed to start Back End")
        error(err.message)
    })

    state.backendProcess.on("close", (code) => {
        if (code !== 0) {
            error(`Back End exited with code ${code}`)
        }
    })
}

function waitForBackend() {
    return new Promise((resolve, reject) => {
        let attempts = 0
        const maxAttempts = 100

        const interval = setInterval(() => {
            attempts++

            checkPort(backendPort, (exists) => {
                if (exists) {
                    clearInterval(interval)

                    success(`Back End ready: http://localhost:${backendPort}/`)

                    resolve()

                    return
                }

                if (attempts >= maxAttempts) {
                    clearInterval(interval)

                    error("Back End did not become ready")

                    reject(new Error("Back End startup timeout"))

                    waitBeforeExit()
                }
            })
        }, 300)
    })
}

export { checkExistingBackend }
