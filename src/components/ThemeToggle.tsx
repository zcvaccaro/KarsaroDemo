import { KarsaroMark } from "./Logo";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="karsaro-theme-toggle inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-karsa-border text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text"
    >
      <span className="karsaro-theme-toggle-mark inline-flex">
        <KarsaroMark size={26} decorative />
      </span>
    </button>
  );
}
