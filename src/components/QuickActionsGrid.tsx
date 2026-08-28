import { useOptimistic, useRef, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import {
  orderQuickActions,
  type QuickActionDef,
  type QuickActionIcon,
} from "../lib/quick-actions";
import { setQuickActionsOrder } from "../lib/store";

export function QuickActionsGrid({
  initialOrder,
}: {
  initialOrder: string[] | null;
}) {
  const [pending, startTransition] = useTransition();
  const [actions, setActions] = useOptimistic(
    orderQuickActions(initialOrder),
    (_current, next: QuickActionDef[]) => next,
  );
  const [editing, setEditing] = useState(false);
  const [draggingHref, setDraggingHref] = useState<string | null>(null);
  /** Index where the dragged item would insert (before this index). */
  const [insertBefore, setInsertBefore] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const dragHrefRef = useRef<string | null>(null);
  const grabOffsetRef = useRef({ x: 0, y: 0 });
  const tileSizeRef = useRef({ w: 0, h: 0 });

  function commitReorder(fromHref: string, beforeIndex: number) {
    const fromIdx = actions.findIndex((a) => a.href === fromHref);
    if (fromIdx < 0) return;

    let toIdx = beforeIndex;
    if (fromIdx < toIdx) toIdx -= 1;
    if (toIdx === fromIdx || toIdx < 0) return;

    const next = [...actions];
    const [moved] = next.splice(fromIdx, 1);
    if (!moved) return;
    next.splice(toIdx, 0, moved);

    if (next.every((a, i) => a.href === actions[i]?.href)) return;

    startTransition(() => {
      setActions(next);
      setQuickActionsOrder(next.map((a) => a.href));
    });
  }

  function clearDrag() {
    dragHrefRef.current = null;
    setDraggingHref(null);
    setInsertBefore(null);
    setPointer(null);
  }

  function toggleEditing() {
    if (editing) clearDrag();
    setEditing((on) => !on);
  }

  function updateInsertFromPoint(clientX: number, clientY: number) {
    const fromHref = dragHrefRef.current;
    if (!fromHref) return;
    setPointer({ x: clientX, y: clientY });

    const fromIdx = actions.findIndex((a) => a.href === fromHref);
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-quick-action]"),
    );
    if (nodes.length === 0) return;

    const home = nodes.find((n) => n.dataset.quickAction === fromHref);
    if (home && fromIdx >= 0) {
      const rect = home.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        setInsertBefore(fromIdx);
        return;
      }
    }

    let bestBefore = actions.length;
    let bestDist = Number.POSITIVE_INFINITY;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      const href = node.dataset.quickAction;
      if (!href || href === fromHref) continue;
      const rect = node.getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      const midY = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - midX, clientY - midY);
      if (dist >= bestDist) continue;
      bestDist = dist;
      const before =
        clientX < midX || (Math.abs(clientX - midX) < 8 && clientY < midY);
      const targetIdx = actions.findIndex((a) => a.href === href);
      if (targetIdx < 0) continue;
      bestBefore = before ? targetIdx : targetIdx + 1;
    }

    if (fromIdx >= 0 && bestBefore === fromIdx + 1) {
      setInsertBefore(fromIdx);
      return;
    }

    setInsertBefore(bestBefore);
  }

  const fromIdx = draggingHref
    ? actions.findIndex((a) => a.href === draggingHref)
    : -1;
  const draggingAction =
    draggingHref != null
      ? (actions.find((a) => a.href === draggingHref) ?? null)
      : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-karsa-text">Quick actions</h2>
          <button
            type="button"
            onClick={toggleEditing}
            aria-pressed={editing}
            className="mt-1 rounded-md border border-karsa-border px-2 py-0.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface-hover hover:text-karsa-text"
          >
            {editing ? "Done" : "Edit widgets"}
          </button>
        </div>
        {pending ? (
          <p className="text-xs text-karsa-muted">Saving…</p>
        ) : null}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:auto-rows-fr">
        {actions.map((action, index) => {
          const isDragging = draggingHref === action.href;
          const showLine =
            draggingHref != null &&
            insertBefore === index &&
            insertBefore !== fromIdx &&
            insertBefore !== fromIdx + 1;

          // Items between origin and insert nudge toward the gap.
          let nudge = "";
          if (
            draggingHref &&
            insertBefore != null &&
            fromIdx >= 0 &&
            !isDragging
          ) {
            if (
              fromIdx < insertBefore &&
              index > fromIdx &&
              index < insertBefore
            ) {
              nudge = "animate-quick-action-nudge-left";
            } else if (
              fromIdx > insertBefore &&
              index >= insertBefore &&
              index < fromIdx
            ) {
              nudge = "animate-quick-action-nudge-right";
            }
          }

          return (
            <li key={action.href} className="relative min-h-0">
              {showLine ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -left-1.5 top-1 bottom-1 z-20 w-1 rounded-full bg-karsa-accent shadow-[0_0_10px_rgba(154,175,157,0.55)] transition-opacity"
                />
              ) : null}
              <div
                data-quick-action={action.href}
                draggable={editing}
                onDragStart={(e) => {
                  if (!editing) {
                    e.preventDefault();
                    return;
                  }
                  const rect = (
                    e.currentTarget as HTMLElement
                  ).getBoundingClientRect();
                  grabOffsetRef.current = {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                  };
                  tileSizeRef.current = { w: rect.width, h: rect.height };
                  dragHrefRef.current = action.href;
                  setDraggingHref(action.href);
                  setInsertBefore(index);
                  setPointer({ x: e.clientX, y: e.clientY });
                  e.dataTransfer.setData("text/plain", action.href);
                  e.dataTransfer.effectAllowed = "move";
                  // Transparent native ghost; we render a floating tile instead.
                  const ghost = document.createElement("div");
                  ghost.style.opacity = "0";
                  document.body.appendChild(ghost);
                  e.dataTransfer.setDragImage(ghost, 0, 0);
                  requestAnimationFrame(() => ghost.remove());
                }}
                onDrag={(e) => {
                  if (!editing) return;
                  if (e.clientX === 0 && e.clientY === 0) return;
                  updateInsertFromPoint(e.clientX, e.clientY);
                }}
                onDragOver={(e) => {
                  if (!editing) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  updateInsertFromPoint(e.clientX, e.clientY);
                }}
                onDrop={(e) => {
                  if (!editing) return;
                  e.preventDefault();
                  const fromHref =
                    e.dataTransfer.getData("text/plain") || dragHrefRef.current;
                  const before =
                    insertBefore ??
                    actions.findIndex((a) => a.href === action.href);
                  clearDrag();
                  if (fromHref && before != null) {
                    commitReorder(fromHref, before);
                  }
                }}
                onDragEnd={() => clearDrag()}
                className={`h-full transition-transform duration-200 ease-out ${nudge} ${
                  isDragging ? "scale-[0.97] opacity-30" : ""
                }`}
              >
                <Link
                  to={action.href}
                  draggable={false}
                  onClick={(e) => {
                    if (editing || draggingHref || pending) e.preventDefault();
                  }}
                  className={`group flex h-full flex-col items-center justify-center gap-2.5 rounded-xl border bg-karsa-surface/50 px-3 py-5 text-center transition-all duration-200 hover:border-karsa-accent/35 hover:bg-karsa-surface-hover ${
                    editing
                      ? "cursor-grab border-karsa-accent/30 active:cursor-grabbing"
                      : "cursor-pointer border-karsa-border-subtle hover:-translate-y-0.5"
                  }`}
                >
                  <ActionIcon name={action.icon} />
                  <span className="text-xs font-medium text-karsa-text transition-colors group-hover:text-karsa-accent-strong">
                    {action.label}
                  </span>
                </Link>
              </div>
            </li>
          );
        })}
        {draggingHref != null &&
        insertBefore === actions.length &&
        fromIdx !== actions.length - 1 ? (
          <li className="relative col-span-full h-0 sm:col-span-1" aria-hidden>
            <span className="pointer-events-none absolute -left-1.5 -top-3 h-16 w-1 rounded-full bg-karsa-accent shadow-[0_0_10px_rgba(154,175,157,0.55)]" />
          </li>
        ) : null}
      </ul>
      {draggingAction && pointer ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex flex-col items-center justify-center gap-2.5 rounded-xl border border-karsa-accent/50 bg-karsa-surface px-3 py-5 text-center shadow-lg shadow-black/40"
          style={{
            width: tileSizeRef.current.w || undefined,
            height: tileSizeRef.current.h || undefined,
            left: pointer.x - grabOffsetRef.current.x,
            top: pointer.y - grabOffsetRef.current.y,
            transform: "scale(1.03)",
          }}
        >
          <ActionIcon name={draggingAction.icon} />
          <span className="text-xs font-medium text-karsa-accent-strong">
            {draggingAction.label}
          </span>
        </div>
      ) : null}
    </div>
  );
}

function ActionIcon({ name }: { name: QuickActionIcon }) {
  const common =
    "size-7 text-karsa-muted transition-colors group-hover:text-karsa-accent-strong";
  switch (name) {
    case "calendar":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="3.5"
            y="5"
            width="17"
            height="15"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M8 3.5v3M16 3.5v3M3.5 10h17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "list":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M8 7h12M8 12h12M8 17h12"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="4.5" cy="7" r="1" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" />
          <circle cx="4.5" cy="17" r="1" fill="currentColor" />
        </svg>
      );
    case "person":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="12"
            cy="8"
            r="3.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M5 19c1.5-3.2 4-4.8 7-4.8S17.5 15.8 19 19"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "clipboard":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="6"
            y="4.5"
            width="12"
            height="17"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M9 4.5h6v2H9zM9 12l2 2 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "book":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 5.5A2.5 2.5 0 017.5 3H19v16H7.5A2.5 2.5 0 005 16.5v-11z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M5 16.5A2.5 2.5 0 017.5 19H19"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "sync":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 12a8 8 0 0113.5-5.8M20 12a8 8 0 01-13.5 5.8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M17 3v4h4M7 21v-4H3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "flow":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M4 7h10M4 12h16M4 17h8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M16 5l4 2-4 2M14 15l4 2-4 2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "settings":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M5.8 5.8l1.6 1.6M16.6 16.6l1.6 1.6M18.2 5.8l-1.6 1.6M7.4 16.6l-1.6 1.6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "team":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle
            cx="9"
            cy="8"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle
            cx="17"
            cy="9"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3.5 19c1.2-2.8 3.4-4.2 5.5-4.2S13.3 16.2 14.5 19M14 14.2c1.4-.4 2.9.1 4.2 1.4.9.9 1.5 2.1 1.8 3.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
    case "email":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M3 8l9 6 9-6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pin":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21s7-5.2 7-11a7 7 0 10-14 0c0 5.8 7 11 7 11z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <circle
            cx="12"
            cy="10"
            r="2.5"
            stroke="currentColor"
            strokeWidth="1.5"
          />
        </svg>
      );
    case "spark":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return <span className={common} />;
  }
}
