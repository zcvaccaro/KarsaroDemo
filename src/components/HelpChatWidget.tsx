import { useState } from "react";
import { KarsaroMark } from "./Logo";

const PLACEHOLDER =
  "This helper answers questions about how Karsaro works. It does not see live appointments, clients, or payments. In the full product you can ask about calendar arrived/no-show, overlap limits, Change password on an employee profile, upgrading seats and locations on Billing (Practice includes 15 people then +$12 each), inactive extra locations, roles, forms, and importing a CSV.";

export function HelpChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="karsaro-help-widget fixed right-4 bottom-4 z-40 flex flex-col items-end md:right-6 md:bottom-6">
      {open ? (
        <div className="mb-3 flex max-h-[min(70vh,32rem)] w-[min(calc(100vw-2rem),22rem)] flex-col overflow-hidden rounded-lg border border-karsa-border bg-karsa-bg shadow-xl">
          <div className="flex items-start justify-between gap-2 border-b border-karsa-border-subtle px-3 py-2">
            <div>
              <p className="text-sm font-medium text-karsa-text">Helper</p>
              <p className="text-[11px] leading-relaxed text-karsa-faint">
                Ask a specific question about how Karsaro works. This helper
                does not see live appointments or clients.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-karsa-muted hover:text-karsa-text"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 text-sm leading-relaxed text-karsa-muted">
            <p>{PLACEHOLDER}</p>
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="karsaro-help-button inline-flex items-center gap-2 rounded-full border border-karsa-border bg-karsa-bg px-3 py-2 text-sm font-medium text-karsa-text shadow-lg"
        aria-expanded={open}
        aria-label="Help"
      >
        <span className="karsaro-help-orbits" aria-hidden>
          <span
            className="karsaro-help-orbit karsaro-help-orbit-outer"
            style={{ ["--karsaro-help-from" as string]: "0deg" }}
          >
            <KarsaroMark size={28} decorative />
          </span>
          <span
            className="karsaro-help-orbit karsaro-help-orbit-mid"
            style={{ ["--karsaro-help-from" as string]: "120deg" }}
          >
            <KarsaroMark size={20} decorative />
          </span>
          <span
            className="karsaro-help-orbit karsaro-help-orbit-inner"
            style={{ ["--karsaro-help-from" as string]: "-90deg" }}
          >
            <KarsaroMark size={12} decorative />
          </span>
        </span>
        Help
      </button>
    </div>
  );
}
