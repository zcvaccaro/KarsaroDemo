import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { OverviewMiniCalendar } from "../components/OverviewMiniCalendar";
import { QuickActionsGrid } from "../components/QuickActionsGrid";
import {
  addDays,
  formatYmd,
  parseYmd,
  weekStartParam,
  type CalendarAppointment,
} from "../lib/calendar-utils";
import { useDemoStore } from "../lib/use-demo-store";
import { clientDisplayName, type Appointment } from "../lib/store";

function toLocalIso(date: Date): string {
  const ymd = formatYmd(date);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  return `${ymd}T${h}:${m}:${s}`;
}

function appointmentToCal(
  a: Appointment,
  clientName: string,
  serviceName: string,
  employeeName: string,
): CalendarAppointment {
  const [y, m, d] = a.date.split("-").map(Number);
  const start = new Date(
    y,
    m - 1,
    d,
    Math.floor(a.startMin / 60),
    a.startMin % 60,
  );
  const end = new Date(start.getTime() + a.durationMin * 60_000);
  return {
    id: a.id,
    startIso: toLocalIso(start),
    endIso: toLocalIso(end),
    status: "confirmed",
    clientName,
    employeeName,
    employeeId: a.employeeId,
    serviceName,
  };
}

export function OverviewPage() {
  const state = useDemoStore();
  const [searchParams] = useSearchParams();
  const weekStartYmd = weekStartParam(searchParams.get("week"));
  const weekStart = parseYmd(weekStartYmd);
  const weekEndYmd = formatYmd(addDays(weekStart, 7));

  const weekAppointments = useMemo(() => {
    return state.appointments
      .filter((a) => a.date >= weekStartYmd && a.date < weekEndYmd)
      .map((a) => {
        const client = state.clients.find((c) => c.id === a.clientId);
        const service = state.services.find((s) => s.id === a.serviceId);
        const employee = state.employees.find((e) => e.id === a.employeeId);
        return appointmentToCal(
          a,
          client ? clientDisplayName(client) : "Client",
          service?.name ?? "Service",
          employee?.name ?? "",
        );
      })
      .sort((a, b) => a.startIso.localeCompare(b.startIso));
  }, [
    state.appointments,
    state.clients,
    state.services,
    state.employees,
    weekStartYmd,
    weekEndYmd,
  ]);

  const upcomingRows = useMemo(() => {
    const nowMs = Date.now();
    return state.appointments
      .map((a) => {
        const client = state.clients.find((c) => c.id === a.clientId);
        const service = state.services.find((s) => s.id === a.serviceId);
        const cal = appointmentToCal(
          a,
          client ? clientDisplayName(client) : "Client",
          service?.name ?? "Service",
          "",
        );
        return {
          id: a.id,
          start: new Date(cal.startIso),
          clientName: cal.clientName,
          serviceName: cal.serviceName,
        };
      })
      .filter((row) => row.start.getTime() >= nowMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .slice(0, 5);
  }, [state.appointments, state.clients, state.services]);

  const waitlistRows = useMemo(() => {
    return [...state.waitlistEntries]
      .filter((w) => w.status !== "cancelled" && w.status !== "booked")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .slice(0, 5)
      .map((w) => {
        const client = state.clients.find((c) => c.id === w.clientId);
        const service = w.serviceId
          ? state.services.find((s) => s.id === w.serviceId)
          : null;
        return {
          id: w.id,
          clientName: client ? clientDisplayName(client) : "Client",
          serviceName: service?.name ?? null,
          preferredDate1: w.preferredDate1,
        };
      });
  }, [state.waitlistEntries, state.clients, state.services]);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="relative overflow-hidden rounded-2xl border border-karsa-border-subtle bg-[radial-gradient(ellipse_at_top_left,_rgba(154,175,157,0.12),_transparent_55%),linear-gradient(180deg,_#1a1d26_0%,_#12141a_100%)] px-6 py-7 md:px-10 md:py-9">
        <p className="text-xs font-medium tracking-[0.18em] text-karsa-faint uppercase">
          Dashboard · trial
        </p>
        <h1 className="mt-3 max-w-xl font-display text-4xl tracking-tight text-karsa-text md:text-5xl">
          Sample Studio
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-karsa-muted">
          Your home base for Sample Studio. See what&apos;s coming up this week,
          then jump into everyday tasks. Everything you change here stays in
          this browser only.
        </p>

        <p className="mt-4 rounded-md border border-karsa-accent/25 bg-karsa-bg/40 px-3 py-2.5 text-sm leading-relaxed text-karsa-text">
          <span className="font-medium text-karsa-accent-strong">Start here:</span>{" "}
          <Link
            to="/dashboard/calendar"
            className="text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            Calendar
          </Link>{" "}
          to browse this month&apos;s bookings (click an empty time to add one).
          Then open{" "}
          <Link
            to="/dashboard/forms"
            className="text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            Forms
          </Link>{" "}
          to customize what clients fill out, and{" "}
          <Link
            to="/dashboard/settings/booking-flow"
            className="text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            Booking flow
          </Link>{" "}
          to set the steps of Book Now.
        </p>

        <p className="mt-4 text-xs text-karsa-faint">
          In the full product, clients book through your public studio link.
        </p>

        <div className="mt-8 grid gap-8 border-t border-karsa-border-subtle/80 pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-stretch">
          <section>
            <QuickActionsGrid initialOrder={state.quickActionsOrder} />
          </section>

          <div className="rounded-xl border border-karsa-border-subtle bg-karsa-bg-elevated/40 px-4 py-4 md:px-5 md:py-5">
            <OverviewMiniCalendar
              weekStartYmd={weekStartYmd}
              appointments={weekAppointments}
            />
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-8 md:grid-cols-2">
        <section>
          <h2 className="text-sm font-medium text-karsa-text">Up next</h2>
          {upcomingRows.length === 0 ? (
            <p className="mt-3 text-sm text-karsa-faint">
              No upcoming appointments.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-karsa-border-subtle border-y border-karsa-border-subtle">
              {upcomingRows.map((row) => {
                return (
                  <li key={row.id}>
                    <Link
                      to={`/dashboard/calendar`}
                      className="flex cursor-pointer items-baseline justify-between gap-3 py-3 text-sm text-karsa-text transition-colors hover:text-karsa-accent-strong"
                    >
                      <span className="min-w-0 truncate">
                        {row.clientName}
                        <span className="text-karsa-faint">
                          {" "}
                          · {row.serviceName}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-karsa-muted">
                        {row.start.toLocaleString([], {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-medium text-karsa-text">Waitlist</h2>
          {waitlistRows.length === 0 ? (
            <p className="mt-3 text-sm text-karsa-faint">Waitlist is empty.</p>
          ) : (
            <ul className="mt-3 divide-y divide-karsa-border-subtle border-y border-karsa-border-subtle">
              {waitlistRows.map((row) => {
                const pref = row.preferredDate1
                  ? row.preferredDate1.slice(0, 10)
                  : null;
                return (
                  <li key={row.id}>
                    <Link
                      to={`/dashboard/waitlist/${row.id}`}
                      className="flex cursor-pointer items-baseline justify-between gap-3 py-3 text-sm text-karsa-text transition-colors hover:text-karsa-accent-strong"
                    >
                      <span className="min-w-0 truncate">
                        {row.clientName}
                        <span className="text-karsa-faint">
                          {" "}
                          · {row.serviceName ?? "Any service"}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-karsa-muted">
                        {pref ?? "No date"}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
