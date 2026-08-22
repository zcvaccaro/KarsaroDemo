import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { KarsaroLogo } from "./Logo";
import { demoNav, isNavActive } from "../lib/nav";
import { resetDemoState } from "../lib/store";

const MOBILE_LINKS = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/bookings/new", label: "Book Now" },
  { href: "/dashboard/waitlist", label: "Waitlist" },
  { href: "/dashboard/clients", label: "Clients" },
  { href: "/dashboard/forms", label: "Forms" },
  { href: "/dashboard/settings", label: "Settings" },
];

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

export function ShellLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-karsa-bg text-karsa-text">
      <div className="sticky top-0 hidden h-screen md:block">
        <aside className="flex h-full w-64 shrink-0 flex-col border-r border-karsa-border bg-karsa-bg-elevated">
          <div className="border-b border-karsa-border-subtle px-4 py-4">
            <Link
              to="/dashboard"
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
            <p className="mt-1 text-xs capitalize text-karsa-faint">
              Role: admin
            </p>
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
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-karsa-accent/30 bg-karsa-accent-soft px-4 py-2 text-sm md:px-10">
          <p>
            <span className="font-medium text-karsa-accent-strong">
              Portfolio demo
            </span>
            <span className="text-karsa-muted">
              {" "}
              — identical UI to Karsaro; data stays in this browser only (no
              server, no database).
            </span>
          </p>
        </div>

        <header className="flex items-center justify-between border-b border-karsa-border-subtle px-4 py-3 md:hidden">
          <Link to="/dashboard" aria-label="Karsaro Booking — Dashboard">
            <KarsaroLogo size="sm" />
          </Link>
          <span className="text-xs text-karsa-faint">Demo</span>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-karsa-border-subtle px-3 py-2 md:hidden">
          {MOBILE_LINKS.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="shrink-0 cursor-pointer rounded-md bg-karsa-surface px-3 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-surface-hover hover:text-karsa-text"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          <HistoryNav />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
