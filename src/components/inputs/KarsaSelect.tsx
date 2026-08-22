import { useEffect, useId, useRef, useState } from "react";

export type KarsaSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type KarsaSelectVariant = "dashboard" | "public";

type Props = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  options: KarsaSelectOption[];
  onChange?: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
  placeholder?: string;
  variant?: KarsaSelectVariant;
};

/**
 * Custom select with brand-green hover/selected states.
 * Native <select> option hover stays OS-blue and cannot be restyled.
 */
export function KarsaSelect({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  options,
  onChange,
  disabled,
  required,
  className,
  "aria-label": ariaLabel,
  placeholder,
  variant = "dashboard",
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolled;
  const isPublic = variant === "public";

  const selected = options.find((o) => o.value === value);
  const label = selected?.label ?? placeholder ?? "Select…";

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(next: string) {
    if (!isControlled) setUncontrolled(next);
    onChange?.(next);
    setOpen(false);
  }

  const labelIdle = isPublic ? "text-stone-500" : "text-karsa-faint";
  const labelActive = isPublic ? "text-stone-900" : "text-karsa-text";
  const chevronClass = isPublic ? "text-stone-400" : "text-karsa-faint";
  const listClass = isPublic
    ? "absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-stone-300 bg-white py-1 shadow-lg shadow-stone-900/10"
    : "absolute z-40 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-karsa-border bg-karsa-bg py-1 shadow-lg shadow-black/40";
  const optionSelected = isPublic
    ? "bg-emerald-50 text-emerald-800"
    : "bg-karsa-accent/25 text-karsa-accent-strong";
  const optionIdle = isPublic
    ? "text-stone-800 hover:bg-emerald-50 hover:text-emerald-800"
    : "text-karsa-text hover:bg-karsa-accent-soft hover:text-karsa-accent-strong";

  return (
    <div ref={rootRef} className="relative">
      {name ? (
        <input type="hidden" name={name} value={value} required={required} />
      ) : null}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`${className ?? ""} flex items-center justify-between gap-2 text-left disabled:opacity-60`}
      >
        <span className={selected ? labelActive : labelIdle}>{label}</span>
        <svg
          className={`size-3.5 shrink-0 ${chevronClass}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && !disabled ? (
        <ul id={listId} role="listbox" className={listClass}>
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  className={`flex w-full px-3 py-1.5 text-left text-sm transition-colors disabled:opacity-40 ${
                    isSelected ? optionSelected : optionIdle
                  }`}
                  onClick={() => choose(opt.value)}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
