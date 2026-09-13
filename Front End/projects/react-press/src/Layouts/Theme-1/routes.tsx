import type { RouteObject } from "react-router-dom"

import Layout from "./Layout"
import Register from "./Pages/Register"
import Dashboard from "./Pages/Dashboard"

const theme1Routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "register",
                element: <Register />
            },
            {
                path: "dashboard",
                element: <Dashboard />
            }
        ]
    }
]

export default theme1Routes
