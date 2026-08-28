import { useState, type TransitionEvent } from "react";
import { Link } from "react-router-dom";
import {
  addDays,
  appointmentsForDay,
  formatYmd,
  isToday,
  parseYmd,
  startOfWeek,
  type CalendarAppointment,
} from "../lib/calendar-utils";
import { formatTime12 } from "../lib/format-hm";

export type MiniCalAppointment = CalendarAppointment;

type Props = {
  weekStartYmd: string;
  appointments: MiniCalAppointment[];
};

function weekDays(weekStart: Date) {
  return Array.from({ length: 7 }, (_, offset) => addDays(weekStart, offset));
}

function rangeLabelFor(days: Date[]) {
  return `${days[0]!.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} – ${days[6]!.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function OverviewMiniCalendar({
  weekStartYmd: initial,
  appointments,
}: Props) {
  const [weekStartYmd, setWeekStartYmd] = useState(initial);
  const [shift, setShift] = useState(0);
  const [animate, setAnimate] = useState(true);
  const sliding = shift !== 0;

  const weekStart = parseYmd(weekStartYmd);
  const visibleStart = addDays(weekStart, shift * 7);
  const panels = [
    addDays(weekStart, -7),
    weekStart,
    addDays(weekStart, 7),
  ];
  const days = weekDays(visibleStart);
  const monthLabel = days[0]!.toLocaleString(undefined, {
    month: "short",
    year: "numeric",
  });

  function goWeek(dir: -1 | 1) {
    if (sliding) return;
    setAnimate(true);
    setShift(dir);
  }

  function goToday() {
    const todayWeek = formatYmd(startOfWeek(new Date()));
    if (todayWeek === weekStartYmd || sliding) return;
    const deltaDays =
      (parseYmd(todayWeek).getTime() - weekStart.getTime()) / 86_400_000;
    if (deltaDays === 7) {
      goWeek(1);
      return;
    }
    if (deltaDays === -7) {
      goWeek(-1);
      return;
    }
    setWeekStartYmd(todayWeek);
  }

  function handleTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget) return;
    if (e.propertyName !== "transform" || shift === 0) return;
    setAnimate(false);
    setWeekStartYmd(formatYmd(addDays(weekStart, shift * 7)));
    setShift(0);
  }

  return (
    <section className="flex h-full min-h-[18rem] flex-col">
      <div>
        <h2 className="text-sm font-medium text-karsa-text">Calendar</h2>
        <p className="mt-0.5 text-xs text-karsa-faint">{monthLabel}</p>
      </div>
      <div className="mt-3 border-t border-karsa-border-subtle pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToday}
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface-hover hover:text-karsa-text"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => goWeek(-1)}
            aria-label="Previous week"
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface-hover hover:text-karsa-text"
          >
            ‹
          </button>
          <p className="min-w-0 flex-1 text-center text-sm font-medium text-karsa-text">
            {rangeLabelFor(days)}
          </p>
          <button
            type="button"
            onClick={() => goWeek(1)}
            aria-label="Next week"
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface-hover hover:text-karsa-text"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden">
        <div
          className="flex h-full"
          style={{
            transform: `translateX(${(-1 - shift) * 100}%)`,
            transition: animate ? "transform 280ms ease" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {panels.map((panelStart) => (
            <div
              key={formatYmd(panelStart)}
              className="grid h-full w-full shrink-0 basis-full grid-cols-7 gap-1"
            >
              {weekDays(panelStart).map((day) => {
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
                        <li className="px-1 text-[10px] text-karsa-faint/70">
                          —
                        </li>
                      ) : null}
                    </ul>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Link
        to={`/dashboard/calendar?view=week&date=${weekStartYmd}`}
        className="mt-4 text-sm text-karsa-accent-strong underline-offset-4 transition-colors hover:underline"
      >
        Open full calendar
      </Link>
    </section>
  );
}
