import { useState, type ReactNode } from "react";

/** Centered add button; create form drops down above the list when opened. */
export function ExpandableAddSection({
  addLabel,
  children,
  list,
  disabled,
}: {
  addLabel: string;
  children: ReactNode;
  list: ReactNode;
  /** When true, the add button still toggles but children should be read-only. */
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`rounded-md bg-karsa-accent px-5 py-2.5 text-sm font-medium text-karsa-bg transition-colors hover:bg-karsa-accent-strong ${
            disabled ? "opacity-70" : ""
          }`}
        >
          {open ? "Close" : addLabel}
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          open ? "" : "pointer-events-none"
        }`}
        style={{
          gridTemplateRows: open ? "1fr" : "0fr",
          opacity: open ? 1 : 0,
        }}
        aria-hidden={!open}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            className={`origin-top transition-transform duration-300 ease-out ${
              open ? "translate-y-0" : "-translate-y-3"
            }`}
          >
            {children}
          </div>
        </div>
      </div>

      <div>{list}</div>
    </div>
  );
}
