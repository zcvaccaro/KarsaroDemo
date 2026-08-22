import { useEffect, useId, useMemo, useRef, useState } from "react";
import { formatHm12 } from "../../lib/format-hm";

/** HH:MM options within [minHm, maxHm]. */
export function buildHmOptions(
  minHm: string,
  maxHm: string,
  stepMinutes = 15,
): string[] {
  const toMin = (hm: string) => {
    const [h, m] = hm.slice(0, 5).split(":").map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  const fromMin = (total: number) => {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  let start = toMin(minHm);
  let end = toMin(maxHm);
  if (end < start) [start, end] = [end, start];

  const startSnap = Math.ceil(start / stepMinutes) * stepMinutes;
  const endSnap = Math.floor(end / stepMinutes) * stepMinutes;
  const options: string[] = [];
  for (let t = startSnap; t <= endSnap; t += stepMinutes) {
    options.push(fromMin(t));
  }
  const minLabel = fromMin(start);
  const maxLabel = fromMin(end);
  if (!options.includes(minLabel)) options.unshift(minLabel);
  if (!options.includes(maxLabel)) options.push(maxLabel);
  if (options.length === 0) options.push(minLabel);
  return [...new Set(options)].sort();
}

type Props = {
  value: string;
  minHm?: string;
  maxHm?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
  stepMinutes?: number;
};

/**
 * Custom time picker — same field chrome as dashboard inputs, brand-green
 * hover/selection (native type=time / select stay browser-blue).
 */
export function HmTimeSelect({
  value,
  minHm = "00:00",
  maxHm = "23:59",
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
  stepMinutes = 15,
}: Props) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => buildHmOptions(minHm, maxHm, stepMinutes),
    [minHm, maxHm, stepMinutes],
  );

  const normalized = value.slice(0, 5);
  const safeValue = options.includes(normalized)
    ? normalized
    : (options[0] ?? normalized);

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

  useEffect(() => {
    if (!open || !listRef.current) return;
    const selected = listRef.current.querySelector<HTMLElement>(
      '[data-selected="true"]',
    );
    selected?.scrollIntoView({ block: "nearest" });
  }, [open, safeValue]);

  if (disabled) {
    return (
      <input
        type="text"
        value="—"
        disabled
        readOnly
        className={className}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`${className ?? ""} flex items-center justify-between gap-2 text-left`}
      >
        <span>{formatHm12(safeValue)}</span>
        <svg
          className="size-3.5 shrink-0 text-karsa-faint"
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
      {open ? (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel ?? "Time"}
          className="absolute z-40 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-karsa-border bg-karsa-bg py-1 shadow-lg shadow-black/40"
        >
          {options.map((hm) => {
            const selected = hm === safeValue;
            return (
              <li key={hm} role="option" aria-selected={selected}>
                <button
                  type="button"
                  data-selected={selected ? "true" : undefined}
                  className={`flex w-full px-3 py-1.5 text-left text-sm transition-colors ${
                    selected
                      ? "bg-karsa-accent/25 text-karsa-accent-strong"
                      : "text-karsa-text hover:bg-karsa-accent-soft hover:text-karsa-accent-strong"
                  }`}
                  onClick={() => {
                    onChange(hm);
                    setOpen(false);
                  }}
                >
                  {formatHm12(hm)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
