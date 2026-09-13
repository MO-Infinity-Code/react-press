import { Outlet } from "react-router-dom"
import type { ReactPressTheme } from "../Hooks/Theme/types"

interface LayoutProps {
    theme: ReactPressTheme
}

function Layout({ theme }: LayoutProps) {
    return (
        <div data-theme={theme}>
            <Outlet />
        </div>
    )
}

export default Layout
