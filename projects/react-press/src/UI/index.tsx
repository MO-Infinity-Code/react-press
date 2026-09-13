import React from "react"
import ReactDOM from "react-dom/client"

import { getReactPressTheme } from "../Hooks/Theme/storage"
import { getReactPressUser } from "../Hooks/User-Data/storage"
import App from "./App"

const rootEl = document.getElementById("root")

if (rootEl) {
    const theme = getReactPressTheme()
    const user = getReactPressUser()
    const root = ReactDOM.createRoot(rootEl)

    root.render(
        <React.StrictMode>
            <App
                theme={theme}
                user={user}
            />
        </React.StrictMode>
    )
}
