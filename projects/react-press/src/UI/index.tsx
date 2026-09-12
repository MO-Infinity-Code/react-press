import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import { getReactPressTheme } from "../Hooks/Theme/storage"

const rootEl = document.getElementById("root")

if (rootEl) {
    const theme = getReactPressTheme()
    const root = ReactDOM.createRoot(rootEl)

    root.render(
        <React.StrictMode>
            <App theme={theme} />
        </React.StrictMode>
    )
}
