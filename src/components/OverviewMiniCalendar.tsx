import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addDays,
  appointmentsForDay,
  formatYmd,
  isToday,
  parseYmd,
  type CalendarAppointment,
} from "../lib/calendar-utils";
import { formatTime12 } from "../lib/format-hm";

export type MiniCalAppointment = CalendarAppointment;

type Props = {
  weekStartYmd: string;
  appointments: MiniCalAppointment[];
};

/** Full week strip (Sun–Sat) for the week containing weekStartYmd. */
export function OverviewMiniCalendar({ weekStartYmd, appointments }: Props) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const weekStart = parseYmd(weekStartYmd);
  const days = Array.from({ length: 7 }, (_, offset) =>
    addDays(weekStart, offset),
  );
  const monthLabel = days[0]!.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });

  useEffect(() => {
    setVisible(false);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [weekStartYmd]);

  function goWeek(delta: number) {
    const next = addDays(weekStart, delta * 7);
    navigate(`/dashboard?week=${formatYmd(next)}`);
  }

  return (
    <section className="flex h-full min-h-[18rem] flex-col">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-karsa-text">Calendar</h2>
          <p className="mt-0.5 text-xs text-karsa-faint">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goWeek(-1)}
            aria-label="Previous week"
            className="rounded-md px-2 py-1.5 text-sm text-karsa-muted transition-colors hover:bg-karsa-surface-hover hover:text-karsa-text"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goWeek(1)}
            aria-label="Next week"
            className="rounded-md px-2 py-1.5 text-sm text-karsa-muted transition-colors hover:bg-karsa-surface-hover hover:text-karsa-text"
          >
            ›
          </button>
        </div>
      </div>

      <div
        className={`mt-4 grid flex-1 grid-cols-7 gap-1 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        {days.map((day) => {
          const ymd = formatYmd(day);
          const dayAppts = appointmentsForDay(appointments, day);
          const today = isToday(day);
          const weekday = day.toLocaleDateString(undefined, {
            weekday: "short",
          });
          return (
            <Link
              key={ymd}
              to={`/dashboard/calendar?view=day&date=${ymd}`}
              className={`flex min-h-[12rem] flex-col rounded-lg border px-1 py-2 transition-colors hover:border-karsa-accent/50 hover:bg-karsa-surface-hover ${
                today
                  ? "border-karsa-accent/40 bg-karsa-accent-soft/30"
                  : "border-karsa-border-subtle bg-karsa-surface/40"
              }`}
            >
              <div className="px-0.5 text-center">
                <p className="text-[10px] tracking-wide text-karsa-faint uppercase">
                  {weekday}
                </p>
                <p
                  className={`mt-0.5 text-sm font-medium ${
                    today ? "text-karsa-accent-strong" : "text-karsa-text"
                  }`}
                >
                  {day.getDate()}
                </p>
              </div>
              <ul className="mt-2 flex-1 space-y-1 overflow-hidden">
                {dayAppts.slice(0, 4).map((appt) => {
                  const time = formatTime12(new Date(appt.startIso));
                  return (
                    <li
                      key={appt.id}
                      className="truncate rounded bg-karsa-bg-elevated px-1 py-0.5 text-[10px] leading-tight text-karsa-muted"
                      title={`${time} · ${appt.clientName}`}
                    >
                      <span className="text-karsa-faint">{time}</span>{" "}
                      {appt.clientName}
                    </li>
                  );
                })}
                {dayAppts.length > 4 ? (
                  <li className="px-1 text-[10px] text-karsa-faint">
                    +{dayAppts.length - 4} more
                  </li>
                ) : null}
                {dayAppts.length === 0 ? (
                  <li className="px-1 text-[10px] text-karsa-faint/70">—</li>
                ) : null}
              </ul>
            </Link>
          );
        })}
      </div>

      <Link
        to={`/dashboard/calendar?view=week&date=${formatYmd(weekStart)}`}
        className="mt-4 text-sm text-karsa-accent-strong underline-offset-4 transition-colors hover:underline"
      >
        Open full calendar
      </Link>
    </section>
  );
}
