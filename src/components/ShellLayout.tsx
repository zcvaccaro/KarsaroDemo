import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { KarsaroLogo } from "./Logo";
import { demoNav, isNavActive } from "../lib/nav";
import { orderQuickActions } from "../lib/quick-actions";
import { resetDemoState } from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";
import { EntityModalsProvider } from "./EntityModals";

const CHIP_LABEL: Record<string, string> = {
  "/dashboard/calendar": "Calendar",
  "/dashboard/bookings/new": "Book Now",
  "/dashboard/settings/booking-flow": "Booking flow",
  "/dashboard/waitlist": "Waitlist",
  "/dashboard/settings": "Business",
  "/dashboard/locations": "Locations",
  "/dashboard/settings/email": "Emails",
  "/dashboard/services": "Services",
  "/dashboard/forms": "Forms",
  "/dashboard/clients": "Clients",
  "/dashboard/employees": "Employees",
  "/dashboard/settings/sync": "Sync",
};

function HistoryNav() {
  const navigate = useNavigate();

  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="rounded-md border border-karsa-border px-3 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text"
        aria-label="Go back"
      >
        ← Back
      </button>
      <button
        type="button"
        onClick={() => navigate(1)}
        className="rounded-md border border-karsa-border px-3 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface hover:text-karsa-text"
        aria-label="Go forward"
      >
        Forward →
      </button>
    </div>
  );
}

function DemoSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { pathname } = useLocation();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-karsa-border bg-karsa-bg-elevated">
      <div className="border-b border-karsa-border-subtle px-4 py-4">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="group block transition-opacity hover:opacity-90"
          aria-label="Karsaro Booking — Dashboard"
        >
          <KarsaroLogo size="md" />
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {demoNav.map((group) => (
          <div key={group.label} className="mb-6">
            <p className="mb-2 px-2 text-[11px] font-medium tracking-[0.16em] text-karsa-faint uppercase">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      className={[
                        "block cursor-pointer rounded-md px-2.5 py-2 transition-colors",
                        active
                          ? "bg-karsa-accent-soft text-karsa-accent-strong"
                          : "text-karsa-muted hover:bg-karsa-surface-hover hover:text-karsa-text",
                      ].join(" ")}
                    >
                      <span className="block text-sm font-medium">
                        {item.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-karsa-border-subtle px-5 py-4">
        <p className="text-xs text-karsa-faint">Signed in as</p>
        <p className="truncate text-sm text-karsa-muted">
          demo@sample-studio.local
        </p>
        <p className="mt-1 text-xs capitalize text-karsa-faint">Role: admin</p>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Reset all demo data in this browser to the starter sample?",
              )
            ) {
              resetDemoState();
              window.location.hash = "#/dashboard";
              window.location.reload();
            }
          }}
          className="mt-3 cursor-pointer text-xs text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          Reset demo data
        </button>
      </div>
    </aside>
  );
}

export function ShellLayout() {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { quickActionsOrder } = useDemoStore();
  const widgetChips = useMemo(
    () => orderQuickActions(quickActionsOrder),
    [quickActionsOrder],
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-karsa-bg text-karsa-text">
      <div className="sticky top-0 hidden h-screen md:block">
        <DemoSidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-40 md:static">
          <div className="border-b border-karsa-accent/30 bg-karsa-accent-soft px-4 py-2 text-sm md:px-10">
            <p>
              <span className="font-medium text-karsa-accent-strong">Demo</span>
              <span className="text-karsa-muted">
                {" "}
                — identical UI to Karsaro; data stays in this browser only (no
                server, no database).
              </span>
            </p>
          </div>

          <header className="flex items-center justify-between border-b border-karsa-border-subtle bg-karsa-bg px-4 py-3 md:hidden">
            <Link to="/dashboard" aria-label="Karsaro Booking — Dashboard">
              <KarsaroLogo size="sm" />
            </Link>
            <button
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-10 items-center justify-center rounded-md border border-karsa-border text-karsa-text"
            >
              {menuOpen ? (
                <span className="text-lg leading-none">×</span>
              ) : (
                <span className="flex flex-col gap-1.5" aria-hidden>
                  <span className="block h-0.5 w-5 bg-karsa-text" />
                  <span className="block h-0.5 w-5 bg-karsa-text" />
                  <span className="block h-0.5 w-5 bg-karsa-text" />
                </span>
              )}
            </button>
          </header>

          <nav className="flex gap-2 overflow-x-auto border-b border-karsa-border-subtle bg-karsa-bg px-3 py-2 md:hidden">
            {widgetChips.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="shrink-0 cursor-pointer rounded-md bg-karsa-surface px-3 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface-hover hover:text-karsa-text"
              >
                {CHIP_LABEL[item.href] ?? item.label}
              </Link>
            ))}
          </nav>
        </div>

        {menuOpen ? (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/55"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 h-full w-[min(20rem,88vw)] overflow-hidden bg-karsa-bg-elevated shadow-lg">
              <DemoSidebar onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        ) : null}

        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          <HistoryNav />
          <EntityModalsProvider>
            <Outlet />
          </EntityModalsProvider>
        </main>
      </div>
    </div>
  );
}
