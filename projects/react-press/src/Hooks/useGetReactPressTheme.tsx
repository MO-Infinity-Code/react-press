import { useState } from "react"

const STORAGE_KEY = "react-press-theme"
const DEFAULT_THEME = "Theme-1"
const VALID_THEMES = ["Theme-1", "Theme-2"] as const

type ReactPressTheme = (typeof VALID_THEMES)[number]

const isValidTheme = (value: string | null): value is ReactPressTheme => {
    return typeof value === "string" && VALID_THEMES.includes(value as ReactPressTheme)
}

export const getReactPressTheme = (): ReactPressTheme => {
    if (typeof window === "undefined") {
        return DEFAULT_THEME
    }

    try {
        const savedTheme = window.localStorage.getItem(STORAGE_KEY)

        if (isValidTheme(savedTheme)) {
            return savedTheme
        }

        window.localStorage.setItem(STORAGE_KEY, DEFAULT_THEME)
        return DEFAULT_THEME
    } catch {
        return DEFAULT_THEME
    }
}

const useGetReactPressTheme = (): ReactPressTheme => {
    const [theme] = useState<ReactPressTheme>(() => getReactPressTheme())

    return theme
}

export default useGetReactPressTheme
