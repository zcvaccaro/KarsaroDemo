export function KarsaToggleSwitch({
  checked,
  onChange,
  disabled,
  name,
  value,
  ariaLabel,
  size = "default",
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** When set, renders a hidden input for native form posts */
  name?: string;
  value?: string;
  ariaLabel?: string;
  size?: "default" | "compact";
}) {
  const compact = size === "compact";
  return (
    <>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={checked ? (value ?? "true") : "false"}
        />
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? (checked ? "On" : "Off")}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex shrink-0 items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karsa-accent/40 disabled:opacity-50 ${
          compact ? "h-5 w-8" : "h-7 w-12"
        } ${checked ? "bg-karsa-accent" : "bg-karsa-border"}`}
      >
        {compact ? null : (
          <>
            <span
              className={`pointer-events-none absolute text-[9px] font-semibold tracking-wide uppercase transition-opacity ${
                checked
                  ? "left-1.5 text-karsa-bg opacity-100"
                  : "left-1.5 text-karsa-bg opacity-0"
              }`}
            >
              On
            </span>
            <span
              className={`pointer-events-none absolute text-[9px] font-semibold tracking-wide uppercase transition-opacity ${
                !checked
                  ? "right-1 text-karsa-muted opacity-100"
                  : "right-1 text-karsa-muted opacity-0"
              }`}
            >
              Off
            </span>
          </>
        )}
        <span
          className={`pointer-events-none inline-flex items-center justify-center rounded-md bg-white shadow-sm transition-transform ${
            compact ? "size-3.5" : "h-5 w-5"
          } ${
            checked
              ? compact
                ? "translate-x-[14px]"
                : "translate-x-[26px]"
              : "translate-x-0.5"
          }`}
        >
          <span
            className={`flex items-center gap-[2px] ${compact ? "h-2" : "h-3"}`}
            aria-hidden
          >
            <span className="h-full w-px rounded-full bg-karsa-border" />
            <span className="h-full w-px rounded-full bg-karsa-border" />
            <span className="h-full w-px rounded-full bg-karsa-border" />
          </span>
        </span>
      </button>
    </>
  );
}

export function KarsaToggleField({
  label,
  description,
  checked,
  onChange,
  disabled,
  name,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  name?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-karsa-text">{label}</p>
        {description ? (
          <p className="mt-0.5 text-xs text-karsa-faint">{description}</p>
        ) : null}
      </div>
      <KarsaToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        name={name}
        ariaLabel={label}
      />
    </div>
  );
}
