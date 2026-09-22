import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  isKarsaroTheme,
  type KarsaroTheme,
} from "../lib/theme";

type ThemeContextValue = {
  theme: KarsaroTheme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  toggleTheme: () => {},
});

function readDomTheme(): KarsaroTheme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function applyTheme(next: KarsaroTheme, orbitTurn: number) {
  const root = document.documentElement;
  root.dataset.theme = next;
  root.style.colorScheme = next;
  root.style.setProperty("--karsaro-orbit-turn", `${orbitTurn}deg`);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* private mode */
  }
}

function readStoredTheme(): KarsaroTheme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isKarsaroTheme(stored)) return stored;
  } catch {
    /* private mode */
  }
  return "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<KarsaroTheme>("dark");

  useEffect(() => {
    const next = readStoredTheme();
    applyTheme(next, next === "light" ? 0 : 180);
    setTheme(next);
    const id = requestAnimationFrame(() => {
      document.documentElement.classList.add("karsaro-theme-ready");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = readDomTheme();
    const next: KarsaroTheme = current === "dark" ? "light" : "dark";
    const raw = getComputedStyle(document.documentElement).getPropertyValue(
      "--karsaro-orbit-turn",
    );
    const currentTurn = Number.parseFloat(raw);
    const from = Number.isFinite(currentTurn)
      ? currentTurn
      : current === "light"
        ? 0
        : 180;
    applyTheme(next, from + 180);
    setTheme(next);
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    [theme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
