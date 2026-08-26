import http from "node:http"
import { isSea } from "./constants.mjs"

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

export { waitBeforeExit, checkPort }
