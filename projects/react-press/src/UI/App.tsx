import { RouterProvider } from "react-router-dom"

import createRouter from "../Routers"
import type { ReactPressTheme } from "../Hooks/Theme/types"
import type { ReactPressUser } from "../Hooks/User-Data/types"

interface AppProps {
    theme: ReactPressTheme
    user: ReactPressUser | null
}

function App({ theme, user }: AppProps) {
    const initialPath = user ? "/dashboard" : "/register"
    const router = createRouter(theme, initialPath)
    return <RouterProvider router={router} />
}

export default App
