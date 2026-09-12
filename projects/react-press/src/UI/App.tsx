import { Outlet } from "react-router-dom"
import type { ReactPressTheme } from "../Hooks/Theme/types"

interface AppProps {
    theme: ReactPressTheme
}

function App({ theme }: AppProps) {
    return (
        <div data-theme={theme}>
            <Outlet />
        </div>
    )
}

export default App
