import http from "node:http"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const root = path.resolve(__dirname, "..")
const indexFile = path.join(root, "projects", "react-press", "index.html")

const port = 4177

const server = http.createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
        fs.readFile(indexFile, (error, data) => {
            if (error) {
                console.error(error)

                res.writeHead(500, {
                    "Content-Type": "text/plain"
                })

                res.end("Failed to load index.html")

                return
            }

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            })

            res.end(data)
        })

        return
    }

    res.writeHead(404)
    res.end("Not Found")
})

server.listen(port, "127.0.0.1", () => {
    console.log(`React Press server running on http://127.0.0.1:${port}`)
})
