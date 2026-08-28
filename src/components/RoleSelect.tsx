import { useEffect, useId, useRef, useState } from "react";

export const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "receptionist", label: "Receptionist" },
  { value: "practitioner", label: "Practitioner" },
] as const;

export const ROLE_DESCRIPTIONS: Record<
  (typeof ROLE_OPTIONS)[number]["value"],
  { title: string; body: string }
> = {
  admin: {
    title: "Admin",
    body: "Full studio access: calendar, clients, services, locations, hours, forms, booking flow, and hiring. Admins can add, edit, and deactivate any employee.",
  },
  receptionist: {
    title: "Receptionist",
    body: "Same day-to-day ops as admin — calendar, bookings, clients, services, locations, and hours. Cannot create or hire employees, and cannot edit forms or booking flow.",
  },
  practitioner: {
    title: "Practitioner",
    body: "Appears in Book Now and the calendar when they have services assigned. Can edit only their own profile, hours, and services. Cannot change other staff, forms, or studio settings.",
  },
};

type RoleValue = (typeof ROLE_OPTIONS)[number]["value"];

export function RoleSelect({
  name,
  value,
  onChange,
  className,
}: {
  name?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [helpRole, setHelpRole] = useState<RoleValue | null>(null);
  const selected =
    ROLE_OPTIONS.find((o) => o.value === value) ?? ROLE_OPTIONS[2];

  useEffect(() => {
    if (!open && !helpRole) return;
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setHelpRole(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setHelpRole(null);
      }
    }
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, helpRole]);

  const help = helpRole ? ROLE_DESCRIPTIONS[helpRole] : null;

  return (
    <div ref={rootRef} className="relative">
      {name ? <input type="hidden" name={name} value={value} required /> : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className={`${className ?? ""} flex items-center justify-between gap-2 text-left`}
      >
        <span>{selected.label}</span>
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
          id={listId}
          role="listbox"
          className="absolute z-40 mt-1 w-full overflow-visible rounded-md border border-karsa-border bg-karsa-bg py-1 shadow-lg shadow-black/40"
        >
          {ROLE_OPTIONS.map((opt) => {
            const active = opt.value === value;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={active}
                className="relative"
                onMouseEnter={() => setHelpRole(opt.value)}
              >
                <div className="flex items-center">
                  <button
                    type="button"
                    className={`min-w-0 flex-1 px-3 py-1.5 text-left text-sm ${
                      active
                        ? "bg-karsa-accent/25 text-karsa-accent-strong"
                        : "text-karsa-text hover:bg-karsa-accent-soft hover:text-karsa-accent-strong"
                    }`}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setHelpRole(null);
                    }}
                  >
                    {opt.label}
                  </button>
                  <button
                    type="button"
                    aria-label={`About ${opt.label}`}
                    className="shrink-0 px-2 py-1.5 text-xs text-karsa-faint hover:text-karsa-accent-strong"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHelpRole((current) =>
                        current === opt.value ? null : opt.value,
                      );
                    }}
                  >
                    i
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
      {help ? (
        <div
          role="dialog"
          aria-label={help.title}
          className="absolute top-full right-0 z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-md border border-karsa-border bg-karsa-bg-elevated p-3 shadow-lg shadow-black/40"
        >
          <p className="text-sm font-medium text-karsa-text">{help.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-karsa-muted">
            {help.body}
          </p>
        </div>
      ) : null}
    </div>
  );
}
