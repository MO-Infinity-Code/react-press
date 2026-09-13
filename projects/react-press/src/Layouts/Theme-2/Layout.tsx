import { Outlet } from "react-router-dom"

function Layout() {
    return (
        <div data-theme="Theme-2">
            <Outlet />
        </div>
    )
}

export default Layout
