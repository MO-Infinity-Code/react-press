import type { RouteObject } from "react-router-dom"

import Layout from "./Pages/Layout/Layout"
import Register from "./Pages/Auth/Register"
import Dashboard from "./Pages/Main/Dashboard"

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
