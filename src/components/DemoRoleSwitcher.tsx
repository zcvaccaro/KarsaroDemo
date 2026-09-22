import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RolePersonIcon } from "./RolePersonIcon";
import {
  setViewerRole,
  useViewerRole,
  viewerRoleLabel,
  type ViewerRole,
} from "../lib/viewer-role";
import { isAdminOnlyHref } from "../lib/nav";

const ROLES: ViewerRole[] = ["admin", "receptionist", "practitioner"];

export function DemoRoleSwitcher() {
  const role = useViewerRole();
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  function choose(next: ViewerRole) {
    setOpen(false);
    setViewerRole(next);
    const hash = window.location.hash.replace(/^#/, "") || "/dashboard";
    const path = hash.split("?")[0] || "/dashboard";
    if (next !== "admin" && isAdminOnlyHref(path)) {
      navigate("/dashboard");
    }
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className="inline-flex max-w-[14rem] items-center gap-2 rounded-md border border-karsa-border px-3 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label="Preview a role"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="truncate">{viewerRoleLabel(role)}</span>
        <RolePersonIcon role={role} />
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
          {ROLES.map((option) => {
            const current = option === role;
            return (
              <li key={option} role="option" aria-selected={current}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs ${
                    current
                      ? "bg-karsa-accent/25 text-karsa-accent-strong"
                      : "text-karsa-muted hover:bg-karsa-surface hover:text-karsa-text"
                  }`}
                  onClick={() => choose(option)}
                >
                  <span className="min-w-0 flex-1 truncate">
                    {viewerRoleLabel(option)}
                  </span>
                  <RolePersonIcon role={option} />
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
