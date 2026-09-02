import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LOCATION_FILTER_ALL,
  useDemoLocationScope,
} from "../lib/location-filter";

const navBtnClass =
  "rounded-md border border-karsa-border px-3 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text";

export function HistoryNav() {
  const navigate = useNavigate();
  const { locations, locationId, setLocationFilter } = useDemoLocationScope();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const value = locationId ?? LOCATION_FILTER_ALL;
  const selectedLabel =
    locations.find((location) => location.id === locationId)?.name ??
    "All locations";

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
    setOpen(false);
    setLocationFilter(next);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={navBtnClass}
          aria-label="Go back"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => navigate(1)}
          className={navBtnClass}
          aria-label="Go forward"
        >
          Forward →
        </button>
      </div>

      <div ref={rootRef} className="relative shrink-0">
        <button
          type="button"
          className={`${navBtnClass} inline-flex max-w-[14rem] items-center gap-2`}
          aria-label="Filter by location"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="truncate">{selectedLabel}</span>
          <svg
            className="size-3.5 shrink-0"
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
            className="absolute right-0 z-50 mt-1 max-h-56 min-w-[12rem] overflow-y-auto rounded-md border border-karsa-border bg-karsa-bg py-1"
          >
            <li role="option" aria-selected={value === LOCATION_FILTER_ALL}>
              <button
                type="button"
                className={`flex w-full px-3 py-1.5 text-left text-xs ${
                  value === LOCATION_FILTER_ALL
                    ? "bg-karsa-accent/25 text-karsa-accent-strong"
                    : "text-karsa-muted hover:bg-karsa-surface hover:text-karsa-text"
                }`}
                onClick={() => choose(LOCATION_FILTER_ALL)}
              >
                All locations
              </button>
            </li>
            {locations.map((loc) => {
              const selected = value === loc.id;
              return (
                <li key={loc.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    className={`flex w-full px-3 py-1.5 text-left text-xs ${
                      selected
                        ? "bg-karsa-accent/25 text-karsa-accent-strong"
                        : "text-karsa-muted hover:bg-karsa-surface hover:text-karsa-text"
                    }`}
                    onClick={() => choose(loc.id)}
                  >
                    {loc.name}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
