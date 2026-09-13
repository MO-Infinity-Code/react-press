import type { RouteObject } from "react-router-dom"

import Layout from "./Layout"

const theme2Routes: RouteObject[] = [
    {
        path: "/",
        element: <Layout />,
        children: [
            {
                path: "register",
                element: <div>Register Page - Theme 2</div>
            },
            {
                path: "dashboard",
                element: <div>Dashboard Page - Theme 2</div>
            }
        ]
    }
]

export default theme2Routes
