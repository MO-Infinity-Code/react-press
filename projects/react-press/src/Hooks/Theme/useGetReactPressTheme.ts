import { useState } from "react"
import type { ReactPressTheme } from "./types"
import { getReactPressTheme } from "./storage"
const useReactPressTheme = (): ReactPressTheme => {
    const [theme] = useState<ReactPressTheme>(() => getReactPressTheme())
    return theme
}
export default useReactPressTheme
