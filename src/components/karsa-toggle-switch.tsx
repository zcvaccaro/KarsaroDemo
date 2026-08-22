export function KarsaToggleSwitch({
  checked,
  onChange,
  disabled,
  name,
  value,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** When set, renders a hidden input for native form posts */
  name?: string;
  value?: string;
  ariaLabel?: string;
}) {
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
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karsa-accent/40 disabled:opacity-50 ${
          checked ? "bg-karsa-accent" : "bg-karsa-border"
        }`}
      >
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
        <span
          className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-md bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[26px]" : "translate-x-0.5"
          }`}
        >
          <span className="flex h-3 items-center gap-[2px]" aria-hidden>
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
