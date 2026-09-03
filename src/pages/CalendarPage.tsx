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
import { PageLink } from "../components/PageLink";
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
  mergeLocationHours,
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
import { useEntityModals } from "../components/EntityModals";
import { bindCalendarDragPointer, lockPageScrollForDrag } from "../lib/long-press-drag";
import { DEFAULT_SERVICE_COLOR_ID } from "../lib/service-colors";
import {
  clientDisplayName,
  showsOnCalendar,
  upsertAppointment,
  type Appointment,
  type Client,
  type Employee,
  type Location,
  type Service,
  type WaitlistEntry,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";
import {
  filterEmployeesForLocation,
  filterServicesForLocation,
  isAppointmentAtLocation,
  isServiceAvailableAtLocation,
  useDemoLocationScope,
} from "../lib/location-filter";

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
  const { openWaitlist } = useEntityModals();
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
                <button
                  type="button"
                  className="block w-full truncate px-2.5 py-1.5 text-left text-xs text-karsa-muted transition-colors hover:bg-karsa-warning/20 hover:text-karsa-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    openWaitlist(item.id);
                  }}
                >
                  {item.clientName}
                  {item.serviceName ? ` Â· ${item.serviceName}` : ""}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="min-h-0 overflow-hidden">
            {items.map((item) => (
              <li key={item.id} className="pt-1">
                <button
                  type="button"
                  className="block w-full truncate rounded-md border border-dashed border-karsa-warning/50 bg-karsa-warning/10 px-1.5 py-1 text-left text-[10px] text-karsa-muted transition-colors hover:border-karsa-warning hover:bg-karsa-warning/20 hover:text-karsa-text"
                  onClick={(e) => {
                    e.stopPropagation();
                    openWaitlist(item.id);
                  }}
                >
                  {item.clientName}
                  {item.serviceName ? ` Â· ${item.serviceName}` : ""}
                </button>
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

function locationNameForService(
  service: Pick<Service, "locationIds"> | undefined,
  locations: Location[],
) {
  const ids = service?.locationIds ?? [];
  if (ids.length === 0) {
    return locations.length === 1 ? locations[0]!.name : null;
  }
  return locations.find((location) => location.id === ids[0])?.name ?? null;
}

function toCalendarAppointments(
  appointments: Appointment[],
  employees: Employee[],
  clients: Client[],
  services: Service[],
  locations: Location[],
  showLocation: boolean,
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
      locationName: showLocation
        ? locationNameForService(service, locations)
        : null,
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
        Showing {hourLabel(bounds.startHour)}â€“{hourLabel(bounds.endHour)}. Dark
        orange marks closed hours â€” bookings must start in open hours.
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
                ? `In the live app this adds a staff break (${pending.start} â€“ ${pending.end}).`
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
          {closed ? " Â· Closed" : ""}
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
                ? `In the live app this adds a staff break (${pending.start} â€“ ${pending.end}).`
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
  const { locationId } = useDemoLocationScope();
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

  const scopedEmployees = useMemo(
    () => filterEmployeesForLocation(state.employees, locationId),
    [locationId, state.employees],
  );
  const scopedServices = useMemo(
    () => filterServicesForLocation(state.services, locationId),
    [locationId, state.services],
  );

  const locationHours = useMemo<CalendarLocationHour[]>(() => {
    const toHours = (hours: Location["hours"] | undefined): CalendarLocationHour[] =>
      (hours ?? []).map((h) => ({
        dayOfWeek: h.dayOfWeek,
        startTime: h.startTime,
        endTime: h.endTime,
        closed: h.closed,
      }));

    if (locationId) {
      const hours = toHours(
        state.locations.find((l) => l.id === locationId)?.hours,
      );
      if (hours.length) return hours;
    } else {
      const merged = mergeLocationHours(
        state.locations
          .filter((location) => location.active)
          .map((location) => toHours(location.hours)),
      );
      if (merged.length) return merged;
    }

    return Array.from({ length: 7 }, (_, dayOfWeek) => ({
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      closed: dayOfWeek === 0,
    }));
  }, [locationId, state.locations]);
  const hoursMode: "location" | "employee" = employeeId ? "employee" : "location";
  const gridBounds = useMemo(
    () => computeLocationGridBounds(locationHours),
    [locationHours],
  );

  const calendarAppointments = useMemo(
    () =>
      toCalendarAppointments(
        state.appointments
          .filter(showsOnCalendar)
          .filter((a) =>
            isAppointmentAtLocation(a, locationId, state.services),
          ),
        state.employees,
        state.clients,
        state.services,
        state.locations,
        !locationId,
      ).filter((a) => !employeeId || a.employeeId === employeeId),
    [
      employeeId,
      locationId,
      state.appointments,
      state.clients,
      state.employees,
      state.locations,
      state.services,
    ],
  );

  const calendarWaitlist = useMemo<WaitlistChip[]>(
    () =>
      state.waitlistEntries
        .filter((e) => e.status === "waiting" || e.status === "offered")
        .filter((e) => e.preferredDate1)
        .filter((e) =>
          isServiceAvailableAtLocation(
            e.serviceId
              ? state.services.find((s) => s.id === e.serviceId)?.locationIds
              : undefined,
            locationId,
          ),
        )
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
    [locationId, state.waitlistEntries, state.clients, state.services],
  );

  const [bookModal, setBookModal] = useState<BookModalDefaults | null>(null);
  const { openAppointment } = useEntityModals();

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
    return `${weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" })} â€“ ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
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
    openAppointment(appt.id);
  }

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
        You can also book from{" "}
        <PageLink to="/dashboard/bookings/new">Book Now</PageLink>.
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
        {scopedEmployees.map((e) => (
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
          employees={scopedEmployees}
          clients={state.clients}
          services={scopedServices}
          onClose={() => setBookModal(null)}
          onSave={(form) => {
            const [hh, mm] = form.time.split(":").map(Number);
            const startMin = (hh || 0) * 60 + (mm || 0);
            const id = crypto.randomUUID();
            upsertAppointment({
              id,
              employeeId: form.employeeId,
              clientId: form.clientId,
              serviceId: form.serviceId,
              date: form.date,
              startMin,
              durationMin: form.durationMin,
              status: "scheduled",
            });
            setBookModal(null);
            openAppointment(id);
          }}
        />
      ) : null}
    </div>
  );
}
