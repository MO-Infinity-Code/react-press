import { createBrowserRouter, Navigate } from "react-router-dom"

import { getThemeRoutes } from "../Layouts/registry"
import type { ReactPressTheme } from "../Hooks/Theme/types"

const createRouter = (theme: ReactPressTheme, initialPath: string) => {
    const themeRoutes = getThemeRoutes(theme)

    const rootRoute = themeRoutes.find((route) => route.path === "/")

    if (rootRoute && rootRoute.children) {
        rootRoute.children = [
            {
                index: true,
                element: (
                    <Navigate
                        to={initialPath}
                        replace
                    />
                )
            },
            ...rootRoute.children
        ]
    }

    return createBrowserRouter(themeRoutes)
}

export default createRouter
