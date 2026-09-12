import React from "react"
import ReactDOM from "react-dom/client"
import { RouterProvider } from "react-router-dom"

import { getReactPressTheme } from "../Hooks/Theme/storage"
import createRouter from "../Routers"

const rootEl = document.getElementById("root")

if (rootEl) {
    const theme = getReactPressTheme()
    const router = createRouter(theme)
    const root = ReactDOM.createRoot(rootEl)

    root.render(
        <React.StrictMode>
            <RouterProvider router={router} />
        </React.StrictMode>
    )
}
