export const VALID_THEMES = ["Theme-1", "Theme-2"] as const
export type ReactPressTheme = (typeof VALID_THEMES)[number]
