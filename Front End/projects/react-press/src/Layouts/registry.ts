import type { RouteObject } from "react-router-dom"

import theme1Routes from "./Theme-1/routes"
import theme2Routes from "./Theme-2/routes"
import type { ReactPressTheme } from "../Hooks/Theme/types"

const themeRegistry: Record<ReactPressTheme, RouteObject[]> = {
    "Theme-1": theme1Routes,
    "Theme-2": theme2Routes
}

export const getThemeRoutes = (theme: ReactPressTheme): RouteObject[] => {
    return themeRegistry[theme]
}
