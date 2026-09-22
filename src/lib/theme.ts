export const THEME_STORAGE_KEY = "karsaro-theme";

export type KarsaroTheme = "dark" | "light";

export function isKarsaroTheme(value: unknown): value is KarsaroTheme {
  return value === "dark" || value === "light";
}
