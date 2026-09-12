import { STORAGE_KEY } from "./constants"
import type { ReactPressUser } from "./types"

const isValidUser = (value: unknown): value is ReactPressUser => {
    if (typeof value !== "object" || value === null) {
        return false
    }
    const user = value as Record<string, unknown>
    return (
        typeof user.id === "string" &&
        typeof user.name === "string" &&
        typeof user.email === "string"
    )
}

export const getReactPressUser = (): ReactPressUser | null => {
    try {
        const savedUser = window.localStorage.getItem(STORAGE_KEY)
        if (!savedUser) return null
        const user = JSON.parse(savedUser)
        return isValidUser(user) ? user : null
    } catch {
        return null
    }
}
