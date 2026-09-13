import { Outlet } from "react-router-dom"

function Layout() {
    return (
        <div data-theme="Theme-1">
            <Outlet />
        </div>
    )
}

export default Layout
