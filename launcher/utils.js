import http from "node:http"

export function log(...args) {
    console.log(`[${new Date().toISOString()}] MAIN`, ...args)
}

export function error(...args) {
    console.error(`[${new Date().toISOString()}] MAIN`, ...args)
}

export function waitBeforeExit(config, code = 1) {
    if (config.isSea) {
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

export function checkPort(port, callback) {
    let finished = false
    const finish = (result) => {
        if (finished) return
        finished = true
        callback(result)
    }

    const request = http.get({ hostname: "localhost", port, path: "/" }, (response) => {
        response.resume()
        finish(response.statusCode >= 200 && response.statusCode < 500)
    })

    request.on("error", () => finish(false))
    request.setTimeout(1000, () => {
        request.destroy()
        finish(false)
    })
}
