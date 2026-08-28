import { Link } from "react-router-dom";
import { clientDisplayName, todayISO } from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

function shortDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function WaitlistDetailModal({
  waitlistId,
  onClose,
}: {
  waitlistId: string;
  onClose: () => void;
}) {
  const { waitlistEntries, clients, services, employees } = useDemoStore();
  const entry = waitlistEntries.find((e) => e.id === waitlistId);
  const client = clients.find((c) => c.id === entry?.clientId);
  const service = services.find((s) => s.id === entry?.serviceId);
  const employee = employees[0];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-10">
      <div className="absolute inset-0" onClick={onClose} role="presentation" />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-karsa-border bg-karsa-bg p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="waitlist-detail-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
              Waitlist
            </p>
            <h2
              id="waitlist-detail-title"
              className="mt-1 font-display text-2xl text-karsa-text"
            >
              {client ? clientDisplayName(client) : "Waitlist entry"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface"
          >
            Close
          </button>
        </div>

        {!entry ? (
          <p className="mt-6 text-sm text-karsa-danger">
            Waitlist entry not found.
          </p>
        ) : (
          <>
            <p className="mt-4 text-sm text-karsa-muted">
              {service?.name ?? "Any service"} · Status:{" "}
              <span className="capitalize text-karsa-accent-strong">
                {entry.status}
              </span>
            </p>

            <section className="mt-6 border border-karsa-border-subtle p-4">
              <h3 className="text-sm font-medium text-karsa-text">
                Preferred dates
              </h3>
              <p className="mt-3 text-sm text-karsa-text">
                {entry.preferredDate1
                  ? shortDate(entry.preferredDate1)
                  : "No date specified"}
              </p>
              <p className="mt-2 text-xs text-karsa-faint">
                Preferred practitioner (sample): {employee?.name ?? "Any"}
              </p>
            </section>

            <section className="mt-6 flex flex-wrap gap-3">
              <Link
                to={`/dashboard/bookings/new?clientId=${entry.clientId}`}
                onClick={onClose}
                className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
              >
                Book this client
              </Link>
              <Link
                to={`/dashboard/calendar?view=day&date=${entry.preferredDate1 ?? todayISO()}`}
                onClick={onClose}
                className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
              >
                View preferred day on calendar
              </Link>
              <Link
                to={`/dashboard/clients/${entry.clientId}`}
                onClick={onClose}
                className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
              >
                Open client profile
              </Link>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
