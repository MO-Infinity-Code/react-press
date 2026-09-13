import { DEFAULT_THEME, STORAGE_KEY } from "./constants"
import { VALID_THEMES, type ReactPressTheme } from "./types"
const isValidTheme = (value: string | null): value is ReactPressTheme => {
    return typeof value === "string" && VALID_THEMES.includes(value as ReactPressTheme)
}
export const getReactPressTheme = (): ReactPressTheme => {
    try {
        const savedTheme = window.localStorage.getItem(STORAGE_KEY)
        if (isValidTheme(savedTheme)) return savedTheme
        window.localStorage.setItem(STORAGE_KEY, DEFAULT_THEME)
        return DEFAULT_THEME
    } catch {
        return DEFAULT_THEME
    }
}
