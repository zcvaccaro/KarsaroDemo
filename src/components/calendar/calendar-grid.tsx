import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  CLOSED_HOURS_OVERLAY_CLASS,
  COMFORT_HOUR_PX,
  DENSE_HOUR_PX,
  formatDisplayTimeFromMinutes,
  getClosedOverlayBands,
  gridHourCount,
  layoutOverlappingAppointments,
  type CalendarAppointment,
  type CalendarGridBounds,
  type CalendarLocationHour,
} from "../../lib/calendar-utils";
import { formatTime12 } from "../../lib/format-hm";
import { getServiceColor } from "../../lib/service-colors";

export type GridHover = {
  columnIndex: number;
  y: number;
  label: string;
  clientX: number;
  clientY: number;
};

export type DragState = {
  appt: CalendarAppointment;
  mode: "move" | "resize-start" | "resize-end";
  durationMin: number;
  grabOffsetMin: number;
  dayIndex: number;
  topMin: number;
  moved: boolean;
};

export type CreateMenuState = {
  x: number;
  y: number;
  day: Date;
  time: string;
};

export type GridPointerLike = {
  currentTarget: EventTarget & HTMLElement;
  clientX: number;
  clientY: number;
  target: EventTarget;
};

export type DayColumnGridHandlers = {
  onGridMouseMove?: (e: ReactMouseEvent<HTMLDivElement>) => void;
  onGridMouseLeave?: () => void;
  onGridClick?: (e: GridPointerLike) => void;
};

function appointmentBufferPct(appt: CalendarAppointment): number {
  const serviceMin = Math.max(
    1,
    (new Date(appt.endIso).getTime() - new Date(appt.startIso).getTime()) /
      60_000,
  );
  const buffer = Math.max(0, appt.bufferMinutes ?? 0);
  if (buffer <= 0) return 0;
  return (buffer / (serviceMin + buffer)) * 100;
}

function BufferOverlay({ percent }: { percent: number }) {
  if (percent <= 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-[4]"
      style={{
        height: `${percent}%`,
        background: "rgba(60, 64, 72, 0.32)",
      }}
      aria-hidden
    />
  );
}

export function formatTime(iso: string) {
  return formatTime12(new Date(iso));
}

export function hourLabel(hour: number) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return formatTime12(d, { includeMinutes: false });
}

export function isInteractiveTarget(target: EventTarget | null) {
  return Boolean((target as HTMLElement | null)?.closest("a, button"));
}

export function AppointmentBlock({
  appt,
  style,
  dense,
  dragging,
  onPointerDown,
  onResizePointerDown,
  suppressNav,
  onOpen,
}: {
  appt: CalendarAppointment;
  style: CSSProperties;
  dense: boolean;
  dragging?: boolean;
  onPointerDown?: (e: ReactPointerEvent<HTMLDivElement>) => void;
  onResizePointerDown?: (
    edge: "start" | "end",
    e: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  suppressNav?: () => boolean;
  onOpen?: (appt: CalendarAppointment) => void;
}) {
  const color = getServiceColor(appt.colorId);
  const bufferPct = appointmentBufferPct(appt);

  return (
    <div
      role="button"
      tabIndex={0}
      className={[
        "absolute z-10 cursor-grab overflow-hidden rounded-md border px-1.5 py-1 text-left shadow-sm transition-colors select-none hover:z-20 active:cursor-grabbing",
        dragging ? "opacity-35" : "",
      ].join(" ")}
      style={{
        ...style,
        backgroundColor: color.bg,
        borderColor: color.border,
      }}
      title={`${formatTime(appt.startIso)} · ${appt.clientName} (drag to move · edges to resize)`}
      onPointerDown={onPointerDown}
      onClick={(e) => {
        e.stopPropagation();
        if (dragging || suppressNav?.()) return;
        onOpen?.(appt);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen?.(appt);
        }
      }}
    >
      {onResizePointerDown ? (
        <>
          <div
            className="absolute inset-x-0 top-0 z-20 h-2 cursor-ns-resize"
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizePointerDown("start", e);
            }}
            aria-hidden
          />
          <div
            className="absolute inset-x-0 z-20 h-2 cursor-ns-resize"
            style={{ bottom: bufferPct > 0 ? `${bufferPct}%` : 0 }}
            onPointerDown={(e) => {
              e.stopPropagation();
              onResizePointerDown("end", e);
            }}
            aria-hidden
          />
        </>
      ) : null}
      <p
        className={`font-medium text-karsa-text ${dense ? "truncate text-[10px] leading-tight" : "text-xs leading-snug"}`}
      >
        {formatTime(appt.startIso)}
        {!dense ? ` – ${formatTime(appt.endIso)}` : ""}
      </p>
      <p
        className={`text-karsa-text ${dense ? "truncate text-[10px] leading-tight" : "mt-0.5 text-sm leading-snug"}`}
      >
        {appt.clientName}
      </p>
      {!dense ? (
        <>
          <p className="mt-0.5 truncate text-xs text-karsa-muted">
            {appt.serviceName}
          </p>
          <p className="truncate text-xs text-karsa-faint">{appt.employeeName}</p>
          {appt.locationName ? (
            <p className="truncate text-xs text-karsa-faint">
              {appt.locationName}
            </p>
          ) : null}
        </>
      ) : (
        <p className="truncate text-[10px] leading-tight text-karsa-muted">
          {appt.serviceName}
          {appt.locationName ? ` · ${appt.locationName}` : ""}
        </p>
      )}
      <BufferOverlay percent={bufferPct} />
    </div>
  );
}

function ClosedHoursOverlay({
  day,
  hours,
  hourPx,
  mode,
  bounds,
}: {
  day: Date;
  hours: CalendarLocationHour[];
  hourPx: number;
  mode: "location" | "employee";
  bounds: CalendarGridBounds;
}) {
  const bands = getClosedOverlayBands(hours, day, hourPx, mode, bounds);
  if (bands.length === 0) return null;

  return (
    <>
      {bands.map((band, i) =>
        band.full ? (
          <div
            key={i}
            className={`pointer-events-none absolute inset-0 z-[2] ${CLOSED_HOURS_OVERLAY_CLASS}`}
            aria-hidden
          />
        ) : (
          <div
            key={i}
            className={`pointer-events-none absolute right-0 left-0 z-[2] ${CLOSED_HOURS_OVERLAY_CLASS}`}
            style={{ top: band.top, height: band.height }}
            aria-hidden
          />
        ),
      )}
    </>
  );
}

export function DayColumn({
  day,
  appointments,
  dense,
  locationHours,
  hoursMode,
  bounds,
  hourPx: hourPxOverride,
  gridHandlers,
  dragApptId,
  onAppointmentPointerDown,
  onAppointmentResizePointerDown,
  suppressNav,
  onOpenAppointment,
}: {
  day: Date;
  appointments: CalendarAppointment[];
  dense: boolean;
  locationHours: CalendarLocationHour[];
  hoursMode: "location" | "employee";
  bounds: CalendarGridBounds;
  hourPx?: number;
  gridHandlers?: DayColumnGridHandlers;
  dragApptId?: string | null;
  onAppointmentPointerDown?: (
    appt: CalendarAppointment,
    e: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  onAppointmentResizePointerDown?: (
    appt: CalendarAppointment,
    edge: "start" | "end",
    e: ReactPointerEvent<HTMLDivElement>,
  ) => void;
  suppressNav?: () => boolean;
  onOpenAppointment?: (appt: CalendarAppointment) => void;
}) {
  const hourPx = hourPxOverride ?? (dense ? DENSE_HOUR_PX : COMFORT_HOUR_PX);
  const hours = gridHourCount(bounds);
  const gridHeight = hours * hourPx;
  const laidOut = layoutOverlappingAppointments(appointments, bounds);

  return (
    <div className="relative" style={{ height: gridHeight }}>
      {Array.from({ length: hours }, (_, i) => (
        <div
          key={i}
          className="absolute right-0 left-0 border-t border-karsa-border-subtle"
          style={{ top: i * hourPx }}
        />
      ))}

      {gridHandlers ? (
        <div
          className="absolute inset-0 z-[1]"
          onMouseMove={gridHandlers.onGridMouseMove}
          onMouseLeave={gridHandlers.onGridMouseLeave}
          onPointerUp={(e) => {
            if (e.pointerType !== "touch") return;
            gridHandlers.onGridClick?.(e);
          }}
          onClick={gridHandlers.onGridClick}
          role="presentation"
        />
      ) : null}

      <ClosedHoursOverlay
        day={day}
        hours={locationHours}
        hourPx={hourPx}
        mode={hoursMode}
        bounds={bounds}
      />

      {laidOut.map((appt) => {
        const top = (appt.topMin / 60) * hourPx;
        const height = Math.max(
          ((appt.endMin - appt.topMin) / 60) * hourPx,
          dense ? 22 : 36,
        );
        const gap = 2;
        const widthPct = 100 / appt.columnCount;
        const leftPct = appt.column * widthPct;
        return (
          <AppointmentBlock
            key={appt.id}
            appt={appt}
            dense={dense}
            dragging={dragApptId === appt.id}
            suppressNav={suppressNav}
            onOpen={onOpenAppointment}
            onPointerDown={
              onAppointmentPointerDown
                ? (e) => onAppointmentPointerDown(appt, e)
                : undefined
            }
            onResizePointerDown={
              onAppointmentResizePointerDown
                ? (edge, e) => onAppointmentResizePointerDown(appt, edge, e)
                : undefined
            }
            style={{
              top,
              height,
              left: `calc(${leftPct}% + ${gap}px)`,
              width: `calc(${widthPct}% - ${gap * 2}px)`,
              right: "auto",
            }}
          />
        );
      })}
    </div>
  );
}

export function GridHoverGuide({ hover }: { hover: GridHover }) {
  return (
    <>
      <div
        className="pointer-events-none absolute right-0 left-0 z-20 border-t border-karsa-accent/70"
        style={{ top: hover.y }}
      />
      <div
        className="pointer-events-none fixed z-50 rounded-md border border-karsa-border bg-karsa-bg px-2 py-1 text-xs font-medium text-karsa-text shadow-md"
        style={{
          left: hover.clientX + 14,
          top: hover.clientY + 14,
        }}
      >
        {hover.label}
      </div>
    </>
  );
}

export function DragGhost({
  drag,
  hourPx,
  columnCount,
  dense,
  bounds,
}: {
  drag: DragState;
  hourPx: number;
  columnCount: number;
  dense?: boolean;
  bounds: CalendarGridBounds;
}) {
  const topPx = (drag.topMin / 60) * hourPx;
  const buffer = Math.max(0, drag.appt.bufferMinutes ?? 0);
  const height = Math.max(
    ((drag.durationMin + buffer) / 60) * hourPx,
    dense ? 22 : 36,
  );
  const colWidthPct = 100 / columnCount;
  const color = getServiceColor(drag.appt.colorId);
  const bufferPct =
    buffer > 0 ? (buffer / (drag.durationMin + buffer)) * 100 : 0;

  return (
    <div
      className="pointer-events-none absolute z-30 overflow-hidden rounded-md border px-1.5 py-1 shadow-lg"
      style={{
        top: topPx,
        height,
        left: `calc(${drag.dayIndex * colWidthPct}% + 2px)`,
        width: `calc(${colWidthPct}% - 4px)`,
        backgroundColor: color.bg,
        borderColor: color.border,
      }}
    >
      <p className="relative z-[6] truncate text-[10px] font-medium text-karsa-text">
        {formatDisplayTimeFromMinutes(bounds.startHour * 60 + drag.topMin)} ·{" "}
        {drag.appt.clientName}
      </p>
      <BufferOverlay percent={bufferPct} />
    </div>
  );
}

export function CreateMenuPopup({
  menu,
  onClose,
  onBook,
  onBreak,
}: {
  menu: CreateMenuState;
  onClose: () => void;
  onBook: () => void;
  onBreak: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const armedRef = useRef(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    armedRef.current = false;
    const id = window.setTimeout(() => {
      armedRef.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, [menu.x, menu.y]);

  useLayoutEffect(() => {
    function clamp() {
      const el = menuRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pad = 8;
      let dx = 0;
      let dy = 0;
      if (rect.right > window.innerWidth - pad) {
        dx -= rect.right - (window.innerWidth - pad);
      }
      if (rect.bottom > window.innerHeight - pad) {
        dy -= rect.bottom - (window.innerHeight - pad);
      }
      if (rect.left + dx < pad) dx += pad - (rect.left + dx);
      if (rect.top + dy < pad) dy += pad - (rect.top + dy);
      setOffset({ x: dx, y: dy });
    }
    clamp();
    window.addEventListener("resize", clamp);
    window.addEventListener("scroll", clamp, true);
    return () => {
      window.removeEventListener("resize", clamp);
      window.removeEventListener("scroll", clamp, true);
    };
  }, [menu.x, menu.y]);

  function closeIfArmed() {
    if (armedRef.current) onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onPointerDown={closeIfArmed}
        role="presentation"
      />
      <div
        ref={menuRef}
        className="absolute z-50 min-w-[11rem] overflow-hidden rounded-md border border-karsa-border bg-karsa-bg py-1 shadow-lg"
        style={{ left: menu.x + offset.x, top: menu.y + offset.y }}
        role="menu"
      >
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm text-karsa-text transition-colors hover:bg-karsa-surface"
          role="menuitem"
          onClick={() => {
            onBook();
            onClose();
          }}
        >
          Book an appointment
        </button>
        <button
          type="button"
          className="block w-full px-3 py-2 text-left text-sm text-karsa-text transition-colors hover:bg-karsa-surface"
          role="menuitem"
          onClick={() => {
            onBreak();
            onClose();
          }}
        >
          Add a break
        </button>
      </div>
    </>
  );
}

export function TimeGutter({
  dense,
  bounds,
  hourPx: hourPxOverride,
}: {
  dense: boolean;
  bounds: CalendarGridBounds;
  hourPx?: number;
}) {
  const hourPx = hourPxOverride ?? (dense ? DENSE_HOUR_PX : COMFORT_HOUR_PX);
  const hours = gridHourCount(bounds);
  return (
    <div
      className="relative w-14 shrink-0 select-none"
      style={{ height: hours * hourPx }}
    >
      {Array.from({ length: hours }, (_, i) => (
        <div
          key={i}
          className={`absolute right-2 text-[10px] text-karsa-faint ${
            i === 0 ? "" : "-translate-y-1/2"
          }`}
          style={{ top: i === 0 ? 4 : i * hourPx }}
        >
          {hourLabel(bounds.startHour + i)}
        </div>
      ))}
    </div>
  );
}
