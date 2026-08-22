type DayAvailabilityEdgeProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
  variant?: "closed" | "unavailable" | "location";
  /** Compact location chips that stretch to fill their grid cell. */
  size?: "default" | "compact";
  className?: string;
  disabled?: boolean;
};

const idleClass =
  "border-karsa-border bg-karsa-bg text-karsa-muted hover:border-karsa-accent hover:bg-karsa-accent-soft hover:text-karsa-accent-strong";

/** Muted terracotta selected state (not neon orange-600). */
const selectedClosedClass =
  "border-[#a86f45] bg-[#a86f45] text-[#f7f1ea] hover:border-[#9a643c] hover:bg-[#9a643c]";

function selectedClass(variant: DayAvailabilityEdgeProps["variant"]) {
  if (variant === "location") {
    return "border-karsa-accent bg-karsa-accent text-karsa-bg hover:border-karsa-accent-strong hover:bg-karsa-accent-strong";
  }
  return selectedClosedClass;
}

export function DayAvailabilityEdge({
  label,
  selected,
  onToggle,
  variant = "closed",
  size = "default",
  className = "",
  disabled = false,
}: DayAvailabilityEdgeProps) {
  const idle =
    variant === "location"
      ? "border-karsa-border bg-karsa-bg text-karsa-muted hover:border-karsa-accent/60 hover:bg-karsa-accent-soft hover:text-karsa-accent-strong"
      : idleClass;

  const sizeClass =
    size === "compact"
      ? "min-h-0 w-full px-2 py-1 text-[11px]"
      : "min-h-[4.75rem] w-[6.5rem] self-stretch px-2.5";

  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      title={disabled ? "Location is closed this day" : undefined}
      onClick={onToggle}
      className={`flex cursor-pointer items-center justify-center rounded-md border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karsa-accent/40 ${sizeClass} ${
        disabled
          ? "cursor-not-allowed border-karsa-border-subtle bg-karsa-bg/50 text-karsa-faint opacity-60"
          : selected
            ? selectedClass(variant)
            : idle
      } ${className}`}
      style={
        size === "default"
          ? { alignSelf: "stretch", height: "100%" }
          : { height: "100%" }
      }
    >
      <span className="line-clamp-2 text-center leading-tight">
        {disabled ? `${label} (closed)` : label}
      </span>
    </button>
  );
}
