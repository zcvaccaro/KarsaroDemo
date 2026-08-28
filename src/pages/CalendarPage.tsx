import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CalendarBookModal,
  type BookModalDefaults,
} from "../components/calendar/CalendarBookModal";
import {
  CreateMenuPopup,
  DayColumn,
  DragGhost,
  GridHoverGuide,
  TimeGutter,
  formatTime,
  hourLabel,
  isInteractiveTarget,
  type CreateMenuState,
  type DragState,
  type GridHover,
} from "../components/calendar/calendar-grid";
import {
  CLOSED_HOURS_OVERLAY_CLASS,
  COMFORT_HOUR_PX,
  WEEK_HOUR_PX,
  addDays,
  addMinutesToDatetimeLocal,
  appointmentsForDay,
  computeLocationGridBounds,
  formatDisplayTimeFromMinutes,
  formatHmFromMinutes,
  formatYmd,
  gridHourCount,
  isDayFullyClosed,
  isStartWithinHours,
  isToday,
  localDateTimeIso,
  minutesFromGridStart,
  minutesToPixelY,
  parseYmd,
  pixelYToMinutes,
  roundMinutesTo15,
  startOfMonth,
  startOfWeek,
  toDatetimeLocalValue,
  type CalendarAppointment,
  type CalendarGridBounds,
  type CalendarLocationHour,
} from "../lib/calendar-utils";
import { CalendarPeriodControls } from "../components/CalendarPeriodControls";
import { DateInput } from "../components/inputs/DateInput";
import { HmTimeSelect } from "../components/inputs/HmTimeSelect";
import { KarsaSelect } from "../components/inputs/KarsaSelect";
import { bindCalendarDragPointer, lockPageScrollForDrag } from "../lib/long-press-drag";
import { DEFAULT_SERVICE_COLOR_ID } from "../lib/service-colors";
import {
  clientDisplayName,
  deleteAppointment,
  upsertAppointment,
  type Appointment,
  type Client,
  type DemoState,
  type Employee,
  type WaitlistEntry,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

export type CalendarView = "day" | "week" | "month";

type WaitlistChip = {
  id: string;
  clientName: string;
  serviceName: string | null;
  preferredDate1: string;
  status: WaitlistEntry["status"];
};

function waitlistForDay(
  entries: WaitlistChip[],
  day: Date,
): WaitlistChip[] {
  const ymd = formatYmd(day);
  return entries.filter((e) => e.preferredDate1 === ymd);
}

function WaitlistChevron({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 10 6"
      className={className ?? "size-2.5"}
      fill="currentColor"
      aria-hidden
    >
      <path d="M5 6L0 0h10L5 6Z" />
    </svg>
  );
}

function DayWaitlistDropdown({
  items,
  compact,
  placement = "default",
}: {
  items: WaitlistChip[];
  compact?: boolean;
  placement?: "default" | "day-header";
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  const isHeader = placement === "day-header";

  return (
    <div
      className={`relative ${
        isHeader
          ? "flex shrink-0 flex-col items-end"
          : compact
            ? ""
            : "mt-1.5"
      }`}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        aria-expanded={open}
        className={`flex items-center justify-center gap-1.5 rounded font-medium tracking-wide text-karsa-warning transition-colors hover:bg-karsa-warning/15 ${
          isHeader
            ? "px-2.5 py-1.5 text-xs"
            : "gap-1 px-1 py-0.5 text-[10px]"
        } ${open ? "bg-karsa-warning/10" : ""}`}
        onClick={() => setOpen((v) => !v)}
      >
        <WaitlistChevron
          className={`shrink-0 transition-transform duration-200 ${
            isHeader ? "size-2.5" : "size-2"
          } ${open ? "rotate-180" : ""}`}
        />
        <span>Waitlist{items.length > 1 ? ` (${items.length})` : ""}</span>
        <WaitlistChevron
          className={`shrink-0 transition-transform duration-200 ${
            isHeader ? "size-2.5" : "size-2"
          } ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`${
          isHeader
            ? `w-full min-w-[11rem] overflow-hidden transition-[max-height,opacity] duration-200 ease-out ${
                open ? "mt-1.5 max-h-64 opacity-100" : "max-h-0 opacity-0"
              }`
            : `grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`
        }`}
      >
        {isHeader ? (
          <ul className="overflow-y-auto rounded-md border border-dashed border-karsa-warning/50 bg-karsa-warning/10 py-1">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  to={`/dashboard/waitlist/${item.id}`}
                  className="block truncate px-2.5 py-1.5 text-xs text-karsa-muted transition-colors hover:bg-karsa-warning/20 hover:text-karsa-text"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.clientName}
                  {item.serviceName ? ` · ${item.serviceName}` : ""}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="min-h-0 overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="pt-1">
                <Link
                  to={`/dashboard/waitlist/${item.id}`}
                  className="block truncate rounded-md border border-dashed border-karsa-warning/50 bg-karsa-warning/10 px-1.5 py-1 text-[10px] text-karsa-muted transition-colors hover:border-karsa-warning hover:bg-karsa-warning/20 hover:text-karsa-text"
                  onClick={(e) => e.stopPropagation()}
                >
                  {item.clientName}
                  {item.serviceName ? ` · ${item.serviceName}` : ""}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function buildHref(opts: {
  view: CalendarView;
  date: string;
  employeeId?: string | null;
}) {
  const params = new URLSearchParams();
  params.set("view", opts.view);
  params.set("date", opts.date);
  if (opts.employeeId) params.set("employeeId", opts.employeeId);
  return `/dashboard/calendar?${params.toString()}`;
}

function parseView(raw: string | null): CalendarView {
  if (raw === "day" || raw === "month" || raw === "week") return raw;
  return "week";
}

function gridClickInfo(
  e: ReactMouseEvent<HTMLElement>,
  day: Date,
  hourPx: number,
  bounds: CalendarGridBounds,
) {
  const rect = e.currentTarget.getBoundingClientRect();
  const y = e.clientY - rect.top;
  const minutes = roundMinutesTo15(pixelYToMinutes(y, hourPx, bounds), bounds);
  return {
    ymd: formatYmd(day),
    time: formatHmFromMinutes(minutes),
    startDatetime: toDatetimeLocalValue(day, minutes),
    endDatetime: addMinutesToDatetimeLocal(
      toDatetimeLocalValue(day, minutes),
      30,
    ),
  };
}

function toCalendarAppointments(
  appointments: Appointment[],
  employees: Employee[],
  clients: Client[],
  services: { id: string; name: string; colorId?: string }[],
): CalendarAppointment[] {
  return appointments.map((a) => {
    const emp = employees.find((e) => e.id === a.employeeId);
    const client = clients.find((c) => c.id === a.clientId);
    const service = services.find((s) => s.id === a.serviceId);
    return {
      id: a.id,
      startIso: localDateTimeIso(a.date, a.startMin),
      endIso: localDateTimeIso(a.date, a.startMin + a.durationMin),
      status: null,
      clientName: client ? clientDisplayName(client) : "Client",
      employeeName: emp?.name ?? "Staff",
      employeeId: a.employeeId,
      serviceName: service?.name ?? "Service",
      colorId: service?.colorId ?? DEFAULT_SERVICE_COLOR_ID,
    };
  });
}

function applyReschedule(
  storeAppts: Appointment[],
  apptId: string,
  day: Date,
  startMinutes: number,
  durationMin: number,
) {
  const existing = storeAppts.find((a) => a.id === apptId);
  if (!existing) return;
  upsertAppointment({
    ...existing,
    date: formatYmd(day),
    startMin: startMinutes,
    durationMin,
  });
}

function WeekView({
  weekStart,
  appointments,
  waitlist,
  employeeId,
  locationHours,
  hoursMode,
  bounds,
  storeAppts,
  onOpenBook,
  onOpenAppointment,
}: {
  weekStart: Date;
  appointments: CalendarAppointment[];
  waitlist: WaitlistChip[];
  employeeId: string | null;
  locationHours: CalendarLocationHour[];
  hoursMode: "location" | "employee";
  bounds: CalendarGridBounds;
  storeAppts: Appointment[];
  onOpenBook: (state: BookModalDefaults) => void;
  onOpenAppointment: (appt: CalendarAppointment) => void;
}) {
  const hourPx = WEEK_HOUR_PX;
  const hoursSpan = gridHourCount(bounds);
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<GridHover | null>(null);
  const [createMenu, setCreateMenu] = useState<CreateMenuState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [hoursNotice, setHoursNotice] = useState<string | null>(null);
  const pendingBreakRef = useRef<{ start: string; end: string } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const ignoreClickUntil = useRef(0);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const updateHoverFromEvent = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (dragRef.current) return;
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const colWidth = rect.width / days.length;
      const columnIndex = Math.min(
        days.length - 1,
        Math.max(0, Math.floor(x / colWidth)),
      );
      const minutes = roundMinutesTo15(
        pixelYToMinutes(y, hourPx, bounds),
        bounds,
      );
      setHover({
        columnIndex,
        y: minutesToPixelY(minutes, hourPx, bounds),
        label: formatDisplayTimeFromMinutes(minutes),
        clientX: e.clientX,
        clientY: e.clientY,
      });
    },
    [bounds, days.length, hourPx],
  );

  const openCreateMenu = useCallback(
    (columnIndex: number, e: ReactMouseEvent<HTMLDivElement>) => {
      if (dragRef.current?.moved) return;
      if (Date.now() < ignoreClickUntil.current) return;
      if (isInteractiveTarget(e.target)) return;
      const day = days[columnIndex];
      const info = gridClickInfo(e, day, hourPx, bounds);
      if (!isStartWithinHours(locationHours, day, info.time, hoursMode)) {
        setHoursNotice(
          isDayFullyClosed(locationHours, day, hoursMode)
            ? "Location is closed on this day."
            : "Appointments must start during operating hours.",
        );
        return;
      }
      setHoursNotice(null);
      setCreateMenu({
        x: e.clientX,
        y: e.clientY,
        day,
        time: info.time,
      });
      pendingBreakRef.current = {
        start: info.startDatetime,
        end: info.endDatetime,
      };
    },
    [bounds, days, hourPx, hoursMode, locationHours],
  );

  const beginDrag = useCallback(
    (
      appt: CalendarAppointment,
      dayIndex: number,
      e: ReactPointerEvent,
      mode: DragState["mode"] = "move",
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const start = new Date(appt.startIso);
      const end = new Date(appt.endIso);
      const durationMin = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60_000),
      );
      const apptTopMin = Math.max(0, minutesFromGridStart(start, bounds));
      const pointerMin =
        pixelYToMinutes(y, hourPx, bounds) - bounds.startHour * 60;
      const session: DragState = {
        appt,
        mode,
        durationMin,
        grabOffsetMin: pointerMin - apptTopMin,
        dayIndex,
        topMin: apptTopMin,
        moved: false,
      };
      setDrag(session);
      dragRef.current = session;
      setDragError(null);
    },
    [bounds, hourPx],
  );

  const onGridPointerMove = useCallback(
    (e: PointerEvent) => {
      const session = dragRef.current;
      const grid = gridRef.current;
      if (!session || !grid) return;
      const rect = grid.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const colWidth = rect.width / days.length;
      const dayIndex =
        session.mode === "move"
          ? Math.min(days.length - 1, Math.max(0, Math.floor(x / colWidth)))
          : session.dayIndex;
      const pointerMinFromStart =
        pixelYToMinutes(y, hourPx, bounds) - bounds.startHour * 60;
      const snappedPointer = Math.round(pointerMinFromStart / 15) * 15;

      let topMin = session.topMin;
      let durationMin = session.durationMin;
      const endMin = session.topMin + session.durationMin;

      if (session.mode === "move") {
        topMin =
          Math.round((pointerMinFromStart - session.grabOffsetMin) / 15) * 15;
        const maxTop = hoursSpan * 60 - durationMin;
        topMin = Math.max(0, Math.min(maxTop, topMin));
      } else if (session.mode === "resize-start") {
        topMin = Math.max(0, Math.min(endMin - 15, snappedPointer));
        durationMin = endMin - topMin;
      } else {
        const nextEnd = Math.max(
          topMin + 15,
          Math.min(hoursSpan * 60, snappedPointer),
        );
        durationMin = nextEnd - topMin;
      }

      const next: DragState = {
        ...session,
        dayIndex,
        topMin,
        durationMin,
        moved:
          session.moved ||
          dayIndex !== session.dayIndex ||
          Math.abs(topMin - session.topMin) >= 15 ||
          Math.abs(durationMin - session.durationMin) >= 15 ||
          Math.hypot(e.movementX, e.movementY) > 4,
      };
      setDrag(next);
      dragRef.current = next;
      if (session.mode === "move") {
        setHover(null);
      } else {
        const edgeMinutes =
          session.mode === "resize-start"
            ? bounds.startHour * 60 + topMin
            : bounds.startHour * 60 + topMin + durationMin;
        setHover({
          columnIndex: dayIndex,
          y: minutesToPixelY(edgeMinutes, hourPx, bounds),
          label: formatDisplayTimeFromMinutes(edgeMinutes),
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
    },
    [bounds, days.length, hourPx, hoursSpan],
  );

  const endDrag = useCallback(() => {
    const session = dragRef.current;
    setDrag(null);
    dragRef.current = null;
    setHover(null);
    if (!session?.moved) return;
    ignoreClickUntil.current = Date.now() + 400;

    const day = days[session.dayIndex];
    const startMinutes = bounds.startHour * 60 + session.topMin;
    if (
      !isStartWithinHours(
        locationHours,
        day,
        formatHmFromMinutes(startMinutes),
        hoursMode,
      )
    ) {
      setDragError(
        isDayFullyClosed(locationHours, day, hoursMode)
          ? "Location is closed on this day."
          : "Appointments must start during operating hours.",
      );
      return;
    }
    applyReschedule(
      storeAppts,
      session.appt.id,
      day,
      startMinutes,
      session.durationMin,
    );
  }, [bounds, days, hoursMode, locationHours, storeAppts]);

  useEffect(() => {
    if (!drag) return;
    const unlock = lockPageScrollForDrag();
    function onMove(e: PointerEvent) {
      onGridPointerMove(e);
    }
    function onUp() {
      endDrag();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      unlock();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, endDrag, onGridPointerMove]);

  return (
    <div className="overflow-x-auto rounded-lg border border-karsa-border-subtle">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] border-b border-karsa-border-subtle bg-karsa-surface">
          <div />
          {days.map((day, columnIndex) => {
            const closed = isDayFullyClosed(locationHours, day, hoursMode);
            return (
              <div
                key={formatYmd(day)}
                className={`relative border-l border-karsa-border-subtle px-2 py-2 text-center ${
                  closed
                    ? CLOSED_HOURS_OVERLAY_CLASS
                    : isToday(day) || hover?.columnIndex === columnIndex
                      ? "bg-karsa-accent-soft/40"
                      : ""
                }`}
              >
                <p className="text-[10px] tracking-wide text-karsa-faint uppercase">
                  {day.toLocaleDateString(undefined, { weekday: "short" })}
                </p>
                <p
                  className={`mt-0.5 text-sm font-medium ${
                    closed
                      ? "text-karsa-text"
                      : isToday(day) || hover?.columnIndex === columnIndex
                        ? "text-karsa-accent-strong"
                        : "text-karsa-text"
                  }`}
                >
                  {day.getDate()}
                </p>
                {closed ? (
                  <p className="mt-0.5 text-[9px] text-karsa-text/80">Closed</p>
                ) : null}
                <DayWaitlistDropdown
                  items={waitlistForDay(waitlist, day)}
                  compact
                />
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[3.5rem_repeat(7,minmax(0,1fr))]">
          <TimeGutter dense bounds={bounds} hourPx={hourPx} />
          <div
            ref={gridRef}
            className="relative col-span-7 grid grid-cols-7"
            onMouseMove={updateHoverFromEvent}
            onMouseLeave={() => {
              if (!dragRef.current) setHover(null);
            }}
          >
            {days.map((day, columnIndex) => (
              <div
                key={formatYmd(day)}
                className={`relative border-l border-karsa-border-subtle ${
                  isToday(day) || hover?.columnIndex === columnIndex
                    ? "bg-karsa-accent-soft/10"
                    : ""
                }`}
              >
                <DayColumn
                  day={day}
                  appointments={appointmentsForDay(appointments, day)}
                  dense
                  hourPx={hourPx}
                  locationHours={locationHours}
                  hoursMode={hoursMode}
                  bounds={bounds}
                  dragApptId={drag?.appt.id}
                  suppressNav={() => Date.now() < ignoreClickUntil.current}
                  onOpenAppointment={onOpenAppointment}
                  onAppointmentPointerDown={(appt, e) =>
                    bindCalendarDragPointer(e, (ev) =>
                      beginDrag(appt, columnIndex, ev, "move"),
                    )
                  }
                  onAppointmentResizePointerDown={(appt, edge, e) =>
                    bindCalendarDragPointer(e, (ev) =>
                      beginDrag(
                        appt,
                        columnIndex,
                        ev,
                        edge === "start" ? "resize-start" : "resize-end",
                      ),
                    )
                  }
                  gridHandlers={{
                    onGridMouseMove: updateHoverFromEvent,
                    onGridMouseLeave: () => {
                      if (!dragRef.current) setHover(null);
                    },
                    onGridClick: (e) => openCreateMenu(columnIndex, e),
                  }}
                />
              </div>
            ))}
            {hover ? <GridHoverGuide hover={hover} /> : null}
            {drag ? (
              <DragGhost
                drag={drag}
                hourPx={hourPx}
                columnCount={days.length}
                dense
                bounds={bounds}
              />
            ) : null}
          </div>
        </div>
      </div>
      <p className="border-t border-karsa-border-subtle px-3 py-2 text-[11px] text-karsa-faint">
        Showing {hourLabel(bounds.startHour)}–{hourLabel(bounds.endHour)}. Dark
        orange marks closed hours — bookings must start in open hours.
      </p>
      {hoursNotice ? (
        <p className="border-t border-karsa-border-subtle px-3 py-2 text-xs text-karsa-warning">
          {hoursNotice}
        </p>
      ) : null}
      {dragError ? (
        <p className="border-t border-karsa-border-subtle px-3 py-2 text-xs text-karsa-danger">
          {dragError}
        </p>
      ) : null}

      {createMenu ? (
        <CreateMenuPopup
          menu={createMenu}
          onClose={() => setCreateMenu(null)}
          onBook={() => {
            onOpenBook({
              date: formatYmd(createMenu.day),
              time: createMenu.time,
              employeeId,
            });
          }}
          onBreak={() => {
            const pending = pendingBreakRef.current;
            window.alert(
              pending
                ? `In the live app this adds a staff break (${pending.start} – ${pending.end}).`
                : "In the live app this adds a staff break on the calendar.",
            );
          }}
        />
      ) : null}
    </div>
  );
}

function DayView({
  day,
  appointments,
  waitlist,
  employeeId,
  locationHours,
  hoursMode,
  bounds,
  storeAppts,
  onOpenBook,
  onOpenAppointment,
}: {
  day: Date;
  appointments: CalendarAppointment[];
  waitlist: WaitlistChip[];
  employeeId: string | null;
  locationHours: CalendarLocationHour[];
  hoursMode: "location" | "employee";
  bounds: CalendarGridBounds;
  storeAppts: Appointment[];
  onOpenBook: (state: BookModalDefaults) => void;
  onOpenAppointment: (appt: CalendarAppointment) => void;
}) {
  const hourPx = COMFORT_HOUR_PX;
  const hoursSpan = gridHourCount(bounds);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<GridHover | null>(null);
  const [createMenu, setCreateMenu] = useState<CreateMenuState | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dragError, setDragError] = useState<string | null>(null);
  const [hoursNotice, setHoursNotice] = useState<string | null>(null);
  const pendingBreakRef = useRef<{ start: string; end: string } | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const ignoreClickUntil = useRef(0);

  useEffect(() => {
    dragRef.current = drag;
  }, [drag]);

  const updateHoverFromEvent = useCallback(
    (e: ReactMouseEvent<HTMLElement>) => {
      if (dragRef.current) return;
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const minutes = roundMinutesTo15(
        pixelYToMinutes(y, hourPx, bounds),
        bounds,
      );
      setHover({
        columnIndex: 0,
        y: minutesToPixelY(minutes, hourPx, bounds),
        label: formatDisplayTimeFromMinutes(minutes),
        clientX: e.clientX,
        clientY: e.clientY,
      });
    },
    [bounds, hourPx],
  );

  const openCreateMenu = useCallback(
    (e: ReactMouseEvent<HTMLDivElement>) => {
      if (dragRef.current?.moved) return;
      if (Date.now() < ignoreClickUntil.current) return;
      if (isInteractiveTarget(e.target)) return;
      const info = gridClickInfo(e, day, hourPx, bounds);
      if (!isStartWithinHours(locationHours, day, info.time, hoursMode)) {
        setHoursNotice(
          isDayFullyClosed(locationHours, day, hoursMode)
            ? "Location is closed on this day."
            : "Appointments must start during operating hours.",
        );
        return;
      }
      setHoursNotice(null);
      setCreateMenu({
        x: e.clientX,
        y: e.clientY,
        day,
        time: info.time,
      });
      pendingBreakRef.current = {
        start: info.startDatetime,
        end: info.endDatetime,
      };
    },
    [bounds, day, hourPx, hoursMode, locationHours],
  );

  const beginDrag = useCallback(
    (
      appt: CalendarAppointment,
      e: ReactPointerEvent,
      mode: DragState["mode"] = "move",
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const grid = gridRef.current;
      if (!grid) return;
      const rect = grid.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const start = new Date(appt.startIso);
      const end = new Date(appt.endIso);
      const durationMin = Math.max(
        15,
        Math.round((end.getTime() - start.getTime()) / 60_000),
      );
      const apptTopMin = Math.max(0, minutesFromGridStart(start, bounds));
      const pointerMin =
        pixelYToMinutes(y, hourPx, bounds) - bounds.startHour * 60;
      const session: DragState = {
        appt,
        mode,
        durationMin,
        grabOffsetMin: pointerMin - apptTopMin,
        dayIndex: 0,
        topMin: apptTopMin,
        moved: false,
      };
      setDrag(session);
      dragRef.current = session;
      setDragError(null);
    },
    [bounds, hourPx],
  );

  const onGridPointerMove = useCallback(
    (e: PointerEvent) => {
      const session = dragRef.current;
      const grid = gridRef.current;
      if (!session || !grid) return;
      const rect = grid.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const pointerMinFromStart =
        pixelYToMinutes(y, hourPx, bounds) - bounds.startHour * 60;
      const snappedPointer = Math.round(pointerMinFromStart / 15) * 15;

      let topMin = session.topMin;
      let durationMin = session.durationMin;
      const endMin = session.topMin + session.durationMin;

      if (session.mode === "move") {
        topMin =
          Math.round((pointerMinFromStart - session.grabOffsetMin) / 15) * 15;
        const maxTop = hoursSpan * 60 - durationMin;
        topMin = Math.max(0, Math.min(maxTop, topMin));
      } else if (session.mode === "resize-start") {
        topMin = Math.max(0, Math.min(endMin - 15, snappedPointer));
        durationMin = endMin - topMin;
      } else {
        const nextEnd = Math.max(
          topMin + 15,
          Math.min(hoursSpan * 60, snappedPointer),
        );
        durationMin = nextEnd - topMin;
      }

      const next: DragState = {
        ...session,
        topMin,
        durationMin,
        moved:
          session.moved ||
          Math.abs(topMin - session.topMin) >= 15 ||
          Math.abs(durationMin - session.durationMin) >= 15 ||
          Math.abs(e.movementY) > 3,
      };
      setDrag(next);
      dragRef.current = next;
      if (session.mode === "move") {
        setHover(null);
      } else {
        const edgeMinutes =
          session.mode === "resize-start"
            ? bounds.startHour * 60 + topMin
            : bounds.startHour * 60 + topMin + durationMin;
        setHover({
          columnIndex: 0,
          y: minutesToPixelY(edgeMinutes, hourPx, bounds),
          label: formatDisplayTimeFromMinutes(edgeMinutes),
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
    },
    [bounds, hourPx, hoursSpan],
  );

  const endDrag = useCallback(() => {
    const session = dragRef.current;
    setDrag(null);
    dragRef.current = null;
    setHover(null);
    if (!session?.moved) return;
    ignoreClickUntil.current = Date.now() + 400;
    const startMinutes = bounds.startHour * 60 + session.topMin;
    if (
      !isStartWithinHours(
        locationHours,
        day,
        formatHmFromMinutes(startMinutes),
        hoursMode,
      )
    ) {
      setDragError(
        isDayFullyClosed(locationHours, day, hoursMode)
          ? "Location is closed on this day."
          : "Appointments must start during operating hours.",
      );
      return;
    }
    applyReschedule(
      storeAppts,
      session.appt.id,
      day,
      startMinutes,
      session.durationMin,
    );
  }, [bounds, day, hoursMode, locationHours, storeAppts]);

  useEffect(() => {
    if (!drag) return;
    const unlock = lockPageScrollForDrag();
    function onMove(e: PointerEvent) {
      onGridPointerMove(e);
    }
    function onUp() {
      endDrag();
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      unlock();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, endDrag, onGridPointerMove]);

  const closed = isDayFullyClosed(locationHours, day, hoursMode);

  return (
    <div className="overflow-hidden rounded-lg border border-karsa-border-subtle">
      <div
        className={`border-b border-karsa-border-subtle px-4 py-3 ${
          closed ? CLOSED_HOURS_OVERLAY_CLASS : "bg-karsa-surface"
        }`}
      >
        <p className="text-xs tracking-wide text-karsa-faint uppercase">
          {day.toLocaleDateString(undefined, { weekday: "long" })}
          {closed ? " · Closed" : ""}
        </p>
        <h2 className="mt-0.5 font-display text-xl text-karsa-text">
          {day.toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </h2>
        <div className="mt-2 flex justify-end">
          <DayWaitlistDropdown
            items={waitlistForDay(waitlist, day)}
            placement="day-header"
          />
        </div>
      </div>
      <div className="flex">
        <TimeGutter dense={false} bounds={bounds} />
        <div
          ref={gridRef}
          className={`relative min-w-0 flex-1 border-l border-karsa-border-subtle ${
            hover ? "bg-karsa-accent-soft/10" : ""
          }`}
          onMouseMove={updateHoverFromEvent}
          onMouseLeave={() => {
            if (!dragRef.current) setHover(null);
          }}
        >
          <DayColumn
            day={day}
            appointments={appointmentsForDay(appointments, day)}
            dense={false}
            locationHours={locationHours}
            hoursMode={hoursMode}
            bounds={bounds}
            dragApptId={drag?.appt.id}
            suppressNav={() => Date.now() < ignoreClickUntil.current}
            onOpenAppointment={onOpenAppointment}
            onAppointmentPointerDown={(appt, e) =>
              bindCalendarDragPointer(e, (ev) => beginDrag(appt, ev, "move"))
            }
            onAppointmentResizePointerDown={(appt, edge, e) =>
              bindCalendarDragPointer(e, (ev) =>
                beginDrag(
                  appt,
                  ev,
                  edge === "start" ? "resize-start" : "resize-end",
                ),
              )
            }
            gridHandlers={{
              onGridMouseMove: updateHoverFromEvent,
              onGridMouseLeave: () => {
                if (!dragRef.current) setHover(null);
              },
              onGridClick: openCreateMenu,
            }}
          />
          {hover ? <GridHoverGuide hover={hover} /> : null}
          {drag ? (
            <DragGhost
              drag={drag}
              hourPx={hourPx}
              columnCount={1}
              dense={false}
              bounds={bounds}
            />
          ) : null}
        </div>
      </div>
      {hoursNotice ? (
        <p className="border-t border-karsa-border-subtle px-3 py-2 text-xs text-karsa-warning">
          {hoursNotice}
        </p>
      ) : null}
      {dragError ? (
        <p className="border-t border-karsa-border-subtle px-3 py-2 text-xs text-karsa-danger">
          {dragError}
        </p>
      ) : null}

      {createMenu ? (
        <CreateMenuPopup
          menu={createMenu}
          onClose={() => setCreateMenu(null)}
          onBook={() => {
            onOpenBook({
              date: formatYmd(createMenu.day),
              time: createMenu.time,
              employeeId,
            });
          }}
          onBreak={() => {
            const pending = pendingBreakRef.current;
            window.alert(
              pending
                ? `In the live app this adds a staff break (${pending.start} – ${pending.end}).`
                : "In the live app this adds a staff break on the calendar.",
            );
          }}
        />
      ) : null}
    </div>
  );
}

function MonthView({
  monthStart,
  appointments,
  waitlist,
  locationHours,
  hoursMode,
  onSelectDay,
}: {
  monthStart: Date;
  appointments: CalendarAppointment[];
  waitlist: WaitlistChip[];
  locationHours: CalendarLocationHour[];
  hoursMode: "location" | "employee";
  onSelectDay: (day: Date) => void;
}) {
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(
    monthStart.getFullYear(),
    monthStart.getMonth() + 1,
    0,
  ).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="overflow-hidden rounded-lg border border-karsa-border-subtle">
      <div className="grid grid-cols-7 border-b border-karsa-border-subtle bg-karsa-surface">
        {weekdays.map((w) => (
          <div
            key={w}
            className="px-2 py-2 text-center text-[10px] tracking-wide text-karsa-faint uppercase"
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[88px] border-t border-r border-karsa-border-subtle bg-karsa-bg/40"
              />
            );
          }
          const dayAppts = appointmentsForDay(appointments, day);
          const count = dayAppts.length;
          const today = isToday(day);
          const closed = isDayFullyClosed(locationHours, day, hoursMode);
          const shown = Math.min(2, dayAppts.length);
          const dayWait = waitlistForDay(waitlist, day);

          return (
            <button
              key={formatYmd(day)}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`relative min-h-[88px] border-t border-r border-karsa-border-subtle p-2 text-left transition-colors hover:bg-karsa-surface ${
                closed
                  ? CLOSED_HOURS_OVERLAY_CLASS
                  : today
                    ? "bg-karsa-accent-soft/20"
                    : ""
              }`}
            >
              <div className="flex flex-col items-stretch gap-0.5 md:flex-row md:items-center md:gap-1">
                {dayWait.length > 0 ? (
                  <div className="order-1 md:order-2 md:min-w-0">
                    <DayWaitlistDropdown items={dayWait} compact />
                  </div>
                ) : null}
                <span
                  className={`order-2 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm md:order-1 ${
                    today && !closed
                      ? "bg-karsa-accent font-medium text-karsa-bg"
                      : "text-karsa-text"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              {closed ? (
                <p className="mt-1 text-[10px] text-karsa-text/85">Closed</p>
              ) : null}
              {count > 0 ? (
                <div className="mt-2 space-y-1">
                  {dayAppts.slice(0, 2).map((a) => (
                    <p
                      key={a.id}
                      className="truncate rounded bg-karsa-accent-soft px-1.5 py-0.5 text-[10px] text-karsa-text"
                    >
                      {formatTime(a.startIso)} {a.clientName}
                    </p>
                  ))}
                  {count > shown ? (
                    <p className="text-[10px] text-karsa-faint">
                      +{count - shown} more
                    </p>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const state = useDemoStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = parseView(searchParams.get("view"));
  const anchorYmd =
    searchParams.get("date") ?? formatYmd(startOfWeek(new Date()));
  const employeeId = searchParams.get("employeeId");

  const anchor = useMemo(() => {
    try {
      return parseYmd(anchorYmd);
    } catch {
      return new Date();
    }
  }, [anchorYmd]);

  const locationHours = useMemo<CalendarLocationHour[]>(() => {
    const hours = state.locations[0]?.hours;
    if (!hours?.length) {
      return Array.from({ length: 7 }, (_, dayOfWeek) => ({
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        closed: dayOfWeek === 0,
      }));
    }
    return hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      startTime: h.startTime,
      endTime: h.endTime,
      closed: h.closed,
    }));
  }, [state.locations]);
  const hoursMode: "location" | "employee" = employeeId ? "employee" : "location";
  const gridBounds = useMemo(
    () => computeLocationGridBounds(locationHours),
    [locationHours],
  );

  const calendarAppointments = useMemo(
    () =>
      toCalendarAppointments(
        state.appointments,
        state.employees,
        state.clients,
        state.services,
      ).filter((a) => !employeeId || a.employeeId === employeeId),
    [employeeId, state.appointments, state.clients, state.employees, state.services],
  );

  const calendarWaitlist = useMemo<WaitlistChip[]>(
    () =>
      state.waitlistEntries
        .filter((e) => e.status === "waiting" || e.status === "offered")
        .filter((e) => e.preferredDate1)
        .map((e) => {
          const client = state.clients.find((c) => c.id === e.clientId);
          const service = e.serviceId
            ? state.services.find((s) => s.id === e.serviceId)
            : null;
          return {
            id: e.id,
            clientName: client ? clientDisplayName(client) : "Client",
            serviceName: service?.name ?? null,
            preferredDate1: e.preferredDate1!,
            status: e.status,
          };
        }),
    [state.waitlistEntries, state.clients, state.services],
  );

  const [bookModal, setBookModal] = useState<BookModalDefaults | null>(null);
  const [detailAppt, setDetailAppt] = useState<CalendarAppointment | null>(
    null,
  );
  const [detailEditing, setDetailEditing] = useState(false);

  const weekStart = useMemo(() => startOfWeek(anchor), [anchor]);
  const monthStart = useMemo(() => startOfMonth(anchor), [anchor]);

  const title = useMemo(() => {
    if (view === "month") {
      return anchor.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "day") {
      return anchor.toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    const end = addDays(weekStart, 6);
    return `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }, [anchor, view, weekStart]);

  const pushParams = useCallback(
    (next: { view?: CalendarView; date?: string; employeeId?: string | null }) => {
      const params = new URLSearchParams();
      params.set("view", next.view ?? view);
      params.set("date", next.date ?? anchorYmd);
      const emp =
        next.employeeId === undefined ? employeeId : next.employeeId;
      if (emp) params.set("employeeId", emp);
      setSearchParams(params, { replace: false });
    },
    [anchorYmd, employeeId, setSearchParams, view],
  );

  const navigate = useCallback(
    (delta: number) => {
      let next = anchor;
      if (view === "month") {
        next = new Date(anchor.getFullYear(), anchor.getMonth() + delta, 1);
      } else if (view === "day") {
        next = addDays(anchor, delta);
      } else {
        next = addDays(weekStart, delta * 7);
      }
      pushParams({ date: formatYmd(next) });
    },
    [anchor, pushParams, view, weekStart],
  );

  const goToday = () => {
    pushParams({ date: formatYmd(new Date()) });
  };

  const goToDayView = useCallback(
    (day: Date) => {
      pushParams({ view: "day", date: formatYmd(day) });
    },
    [pushParams],
  );

  function onOpenAppointment(appt: CalendarAppointment) {
    setDetailEditing(false);
    setDetailAppt(appt);
  }

  const linkedForms = useMemo(
    () =>
      state.forms.filter(
        (f) => f.showInCalendarDescription && f.active && !f.isDraft,
      ),
    [state.forms],
  );

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Schedule
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Calendar
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-karsa-muted">
        See everyone&apos;s appointments for the day, week, or month. Click an
        empty time to book someone, or drag a visit to a new time. What you
        schedule here shows up on Overview and on that client&apos;s profile.
      </p>

      <CalendarPeriodControls
        view={view}
        onViewChange={(next) =>
          pushParams({ view: next })
        }
        title={title}
        onPrev={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToday}
      />

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          to={buildHref({ view, date: anchorYmd })}
          className={[
            "rounded-md px-3 py-1.5 text-xs",
            !employeeId
              ? "bg-karsa-accent-soft text-karsa-accent-strong"
              : "border border-karsa-border text-karsa-muted",
          ].join(" ")}
        >
          All employees
        </Link>
        {state.employees.map((e) => (
          <Link
            key={e.id}
            to={buildHref({
              view,
              date: anchorYmd,
              employeeId: e.id,
            })}
            className={[
              "rounded-md px-3 py-1.5 text-xs",
              employeeId === e.id
                ? "bg-karsa-accent-soft text-karsa-accent-strong"
                : "border border-karsa-border text-karsa-muted",
            ].join(" ")}
          >
            <span
              className="mr-1.5 inline-block size-2 rounded-full"
              style={{ background: e.color }}
            />
            {e.name}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        {view === "week" ? (
          <WeekView
            weekStart={weekStart}
            appointments={calendarAppointments}
            waitlist={calendarWaitlist}
            employeeId={employeeId}
            locationHours={locationHours}
            hoursMode={hoursMode}
            bounds={gridBounds}
            storeAppts={state.appointments}
            onOpenBook={setBookModal}
            onOpenAppointment={onOpenAppointment}
          />
        ) : null}
        {view === "day" ? (
          <DayView
            day={anchor}
            appointments={calendarAppointments}
            waitlist={calendarWaitlist}
            employeeId={employeeId}
            locationHours={locationHours}
            hoursMode={hoursMode}
            bounds={gridBounds}
            storeAppts={state.appointments}
            onOpenBook={setBookModal}
            onOpenAppointment={onOpenAppointment}
          />
        ) : null}
        {view === "month" ? (
          <MonthView
            monthStart={monthStart}
            appointments={calendarAppointments}
            waitlist={calendarWaitlist}
            locationHours={locationHours}
            hoursMode={hoursMode}
            onSelectDay={goToDayView}
          />
        ) : null}
      </div>

      {bookModal ? (
        <CalendarBookModal
          defaults={bookModal}
          employees={state.employees}
          clients={state.clients}
          services={state.services}
          onClose={() => setBookModal(null)}
          onSave={(form) => {
            const [hh, mm] = bookModal.time.split(":").map(Number);
            const startMin = (hh || 0) * 60 + (mm || 0);
            upsertAppointment({
              id: crypto.randomUUID(),
              employeeId: form.employeeId,
              clientId: form.clientId,
              serviceId: form.serviceId,
              date: bookModal.date,
              startMin,
              durationMin: form.durationMin,
            });
            setBookModal(null);
          }}
        />
      ) : null}

      {detailAppt ? (
        <DemoAppointmentDetail
          appt={detailAppt}
          editing={detailEditing}
          onEditingChange={setDetailEditing}
          store={state}
          linkedForms={linkedForms}
          onClose={() => {
            setDetailEditing(false);
            setDetailAppt(null);
          }}
        />
      ) : null}
    </div>
  );
}

function minToHm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hmToMin(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function DemoAppointmentDetail({
  appt,
  editing,
  onEditingChange,
  store,
  linkedForms,
  onClose,
}: {
  appt: CalendarAppointment;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  store: DemoState;
  linkedForms: { id: string; name: string; audience: string }[];
  onClose: () => void;
}) {
  const row = store.appointments.find((a) => a.id === appt.id);
  const [date, setDate] = useState(row?.date ?? "");
  const [time, setTime] = useState(minToHm(row?.startMin ?? 0));
  const [durationMin, setDurationMin] = useState(row?.durationMin ?? 60);
  const [serviceId, setServiceId] = useState(row?.serviceId ?? "");
  const [employeeId, setEmployeeId] = useState(row?.employeeId ?? "");

  useEffect(() => {
    const next = store.appointments.find((a) => a.id === appt.id);
    setDate(next?.date ?? "");
    setTime(minToHm(next?.startMin ?? 0));
    setDurationMin(next?.durationMin ?? 60);
    setServiceId(next?.serviceId ?? "");
    setEmployeeId(next?.employeeId ?? "");
  }, [appt.id, store.appointments, editing]);

  function save() {
    if (!row) return;
    upsertAppointment({
      ...row,
      date,
      startMin: hmToMin(time),
      serviceId,
      employeeId,
      durationMin: Math.max(15, durationMin || row.durationMin),
    });
    onEditingChange(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-10">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-karsa-border bg-karsa-bg p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appt-detail-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
              Details
            </p>
            <h2
              id="appt-detail-title"
              className="mt-1 font-display text-2xl text-karsa-text"
            >
              Appointment
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

        {editing && row ? (
          <div className="mt-6 space-y-4 border-t border-karsa-border-subtle pt-4">
            <label className="block text-xs text-karsa-faint">
              Date
              <div className="mt-1">
                <DateInput value={date} onChange={setDate} />
              </div>
            </label>
            <label className="block text-xs text-karsa-faint">
              Time
              <div className="mt-1">
                <HmTimeSelect
                  value={time}
                  onChange={setTime}
                  minHm="07:00"
                  maxHm="21:00"
                  aria-label="Start time"
                />
              </div>
            </label>
            <label className="block text-xs text-karsa-faint">
              Service
              <div className="mt-1">
                <KarsaSelect
                  value={serviceId}
                  options={store.services.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  onChange={(id) => {
                    setServiceId(id);
                    const service = store.services.find((s) => s.id === id);
                    if (service) setDurationMin(service.durationMin);
                  }}
                />
              </div>
            </label>
            <label className="block text-xs text-karsa-faint">
              Duration (minutes)
              <input
                type="number"
                min={15}
                step={15}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value) || 15)}
                className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
              />
            </label>
            <label className="block text-xs text-karsa-faint">
              Staff
              <div className="mt-1">
                <KarsaSelect
                  value={employeeId}
                  options={store.employees.map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                  onChange={setEmployeeId}
                />
              </div>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => onEditingChange(false)}
                className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="mt-6 space-y-3 border-t border-karsa-border-subtle pt-4 text-sm text-karsa-muted">
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Client</dt>
              <dd className="mt-1 text-karsa-text">{appt.clientName}</dd>
            </div>
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Service</dt>
              <dd className="mt-1 text-karsa-text">{appt.serviceName}</dd>
            </div>
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Time</dt>
              <dd className="mt-1 text-karsa-text">
                {formatTime(appt.startIso)} – {formatTime(appt.endIso)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Employee</dt>
              <dd className="mt-1 text-karsa-text">{appt.employeeName}</dd>
            </div>
          </dl>
        )}

        <div className="mt-6 space-y-3 border-t border-karsa-border-subtle pt-4">
          <p className="text-sm text-karsa-muted">
            In the live app, appointment-linked forms appear here so staff can
            open and fill Client Intake, Session Notes, and other linked forms
            for this visit.
          </p>
          {linkedForms.length === 0 ? (
            <p className="text-xs text-karsa-faint">
              No appointment-linked forms in this demo yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {linkedForms.map((f) => (
                <li key={f.id}>
                  <div className="inline-flex w-full items-center gap-2 rounded-md border border-karsa-border px-3 py-1.5 text-left text-sm text-karsa-text opacity-80">
                    <span className="text-karsa-warning">○</span>
                    {f.name}
                    <span className="ml-auto text-[11px] text-karsa-faint">
                      {f.audience === "staff" ? "Staff" : "Client"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => onEditingChange(true)}
              className="rounded-md border border-karsa-accent/40 px-4 py-2 text-sm font-medium text-karsa-accent-strong"
            >
              Edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              deleteAppointment(appt.id);
              onClose();
            }}
            className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted hover:border-karsa-danger hover:text-karsa-danger"
          >
            Remove from demo
          </button>
        </div>
      </div>
    </div>
  );
}

