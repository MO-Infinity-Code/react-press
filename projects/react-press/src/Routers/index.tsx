import { createBrowserRouter } from "react-router-dom"

import App from "../UI/App"
import type { ReactPressTheme } from "../Hooks/Theme/types"

const createRouter = (theme: ReactPressTheme) => {
    return createBrowserRouter([
        {
            path: "/",
            element: <App theme={theme} />,
            children: [
                // your actual page routes go here as children
                // { index: true, element: <Home /> },
            ]
        }
    ])
}

export default createRouter
