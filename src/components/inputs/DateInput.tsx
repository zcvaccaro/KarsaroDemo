import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  dateDigits,
  formatDateInput,
  isoToDisplayDate,
  parseDisplayDateToIso,
} from "../../lib/date-format";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function parseIsoParts(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function toIso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function mergeClassName(className: string | undefined, extra: string) {
  return [className, extra].filter(Boolean).join(" ");
}

type Props = {
  id?: string;
  name?: string;
  /** ISO yyyy-mm-dd value (preferred storage). */
  value?: string;
  defaultValue?: string;
  onChange?: (iso: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  /** When set, only these ISO dates are selectable (booking availability). */
  allowedDates?: string[];
  min?: string;
  /** Dashboard uses dark Karsaro chrome; public Book Now uses light. */
  variant?: "dark" | "light";
};

export function DateInput({
  id,
  name,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className,
  placeholder = "MM/DD/YYYY",
  allowedDates,
  min,
  variant = "dark",
}: Props) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const rootRef = useRef<HTMLDivElement>(null);
  const allowed = useMemo(
    () => (allowedDates ? new Set(allowedDates) : null),
    [allowedDates],
  );

  const controlled = value !== undefined;
  const [iso, setIso] = useState(() => value ?? defaultValue ?? "");
  const [display, setDisplay] = useState(() =>
    isoToDisplayDate(value ?? defaultValue ?? ""),
  );
  const [open, setOpen] = useState(false);

  const initialView = parseIsoParts(iso) ?? {
    y: new Date().getFullYear(),
    m: new Date().getMonth() + 1,
    d: 1,
  };
  const [viewY, setViewY] = useState(initialView.y);
  const [viewM, setViewM] = useState(initialView.m);

  useEffect(() => {
    if (!controlled) return;
    setIso(value);
    if (!value) return;
    setDisplay(isoToDisplayDate(value));
    const parts = parseIsoParts(value);
    if (parts) {
      setViewY(parts.y);
      setViewM(parts.m);
    }
  }, [controlled, value]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function tryCommit(displayValue: string, allowTwoDigitYear: boolean) {
    const digits = dateDigits(displayValue);
    if (!allowTwoDigitYear && digits.length < 8) return false;
    if (allowTwoDigitYear && digits.length < 6) return false;

    const parsed = parseDisplayDateToIso(displayValue);
    if (!parsed) return false;
    if (allowed && !allowed.has(parsed)) return false;
    if (min && parsed < min) return false;

    setIso(parsed);
    setDisplay(isoToDisplayDate(parsed));
    onChange?.(parsed);
    return true;
  }

  function onType(raw: string) {
    const formatted = formatDateInput(raw);
    setDisplay(formatted);

    const digits = dateDigits(formatted);
    if (digits.length === 8) {
      tryCommit(formatted, false);
      return;
    }

    if (formatted === "") {
      setIso("");
      onChange?.("");
    }
  }

  function onBlur() {
    if (!display.trim()) {
      setIso("");
      onChange?.("");
      return;
    }
    if (!tryCommit(display, true)) {
      setDisplay(iso ? isoToDisplayDate(iso) : "");
    }
  }

  function selectDay(day: number) {
    const next = toIso(viewY, viewM, day);
    if (allowed && !allowed.has(next)) return;
    if (min && next < min) return;
    setIso(next);
    setDisplay(isoToDisplayDate(next));
    onChange?.(next);
    setOpen(false);
  }

  function shiftMonth(delta: number) {
    let m = viewM + delta;
    let y = viewY;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    setViewY(y);
    setViewM(m);
  }

  const firstDow = new Date(viewY, viewM - 1, 1).getDay();
  const dim = daysInMonth(viewY, viewM);
  const monthLabel = new Date(viewY, viewM - 1, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });

  const cells: Array<number | null> = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: dim }, (_, i) => i + 1),
  ];

  return (
    <div ref={rootRef} className="relative">
      {name ? <input type="hidden" name={name} value={iso} readOnly /> : null}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="bday"
          disabled={disabled}
          required={required && !iso}
          placeholder={placeholder}
          value={display}
          onChange={(e) => onType(e.target.value)}
          onBlur={onBlur}
          className={mergeClassName(className, "pr-10")}
          aria-haspopup="dialog"
          aria-expanded={open}
        />
        <button
          type="button"
          disabled={disabled}
          aria-label="Open calendar"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          onClick={() => {
            if (disabled) return;
            setOpen((o) => !o);
          }}
          className={
            variant === "light"
              ? "absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-600 transition-colors hover:text-stone-900 disabled:text-stone-300"
              : "absolute inset-y-0 right-0 flex items-center px-2.5 text-karsa-muted transition-colors hover:text-karsa-text disabled:opacity-30"
          }
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
        </button>
      </div>

      {open && !disabled ? (
        <div
          role="dialog"
          aria-label="Choose date"
          className={
            variant === "light"
              ? "absolute z-30 mt-1 w-[min(100%,18rem)] rounded-lg border border-stone-200 bg-white p-3 text-stone-800 shadow-lg"
              : "absolute z-30 mt-1 w-[min(100%,18rem)] rounded-lg border border-karsa-border bg-karsa-bg-elevated p-3 text-karsa-text shadow-lg"
          }
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className={
                variant === "light"
                  ? "rounded-md px-2 py-1 text-sm text-stone-700 hover:bg-stone-100"
                  : "rounded-md px-2 py-1 text-sm text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text"
              }
              onClick={() => shiftMonth(-1)}
            >
              ‹
            </button>
            <p
              className={
                variant === "light"
                  ? "text-sm font-medium text-stone-800"
                  : "text-sm font-medium text-karsa-text"
              }
            >
              {monthLabel}
            </p>
            <button
              type="button"
              className={
                variant === "light"
                  ? "rounded-md px-2 py-1 text-sm text-stone-700 hover:bg-stone-100"
                  : "rounded-md px-2 py-1 text-sm text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text"
              }
              onClick={() => shiftMonth(1)}
            >
              ›
            </button>
          </div>
          <div
            className={
              variant === "light"
                ? "grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-stone-500"
                : "grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium text-karsa-faint"
            }
          >
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>
          <div className="mt-0.5 grid grid-cols-7 gap-0.5">
            {cells.map((day, idx) => {
              if (day === null) {
                return <span key={`e-${idx}`} className="h-8" />;
              }
              const cellIso = toIso(viewY, viewM, day);
              const selected = iso === cellIso;
              const allowedOk = !allowed || allowed.has(cellIso);
              const minOk = !min || cellIso >= min;
              const enabled = allowedOk && minOk;
              return (
                <button
                  key={cellIso}
                  type="button"
                  disabled={!enabled}
                  onClick={() => selectDay(day)}
                  className={`h-8 rounded-md text-sm transition-colors ${
                    selected
                      ? "bg-karsa-accent font-medium text-karsa-bg"
                      : enabled
                        ? variant === "light"
                          ? "text-stone-800 hover:bg-stone-100"
                          : "text-karsa-text hover:bg-karsa-surface-hover"
                        : variant === "light"
                          ? "cursor-not-allowed text-stone-300"
                          : "cursor-not-allowed text-karsa-faint/50"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          {allowed && allowed.size === 0 ? (
            <p
              className={
                variant === "light"
                  ? "mt-2 text-xs text-amber-700"
                  : "mt-2 text-xs text-karsa-warning"
              }
            >
              No available dates.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
