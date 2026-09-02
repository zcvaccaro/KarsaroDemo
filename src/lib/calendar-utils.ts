/** Local calendar date helpers — avoid UTC `toISOString()` nav bugs. */

import { formatMinutesAsHm12 } from "./format-hm";

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfWeek(date: Date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - d.getDay());
  return d;
}

/** Normalize any date string into the Sunday week-start YMD used by startOfWeek. */
export function weekStartParam(raw?: string | null): string {
  if (!raw) return formatYmd(startOfWeek(new Date()));
  try {
    return formatYmd(startOfWeek(parseYmd(raw)));
  } catch {
    return formatYmd(startOfWeek(new Date()));
  }
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addDays(date: Date, n: number) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date: Date) {
  return sameDay(date, new Date());
}

/** Demo default: 8am–6pm. */
export const DEFAULT_GRID_BOUNDS = { startHour: 8, endHour: 18 } as const;

export type CalendarGridBounds = {
  startHour: number;
  endHour: number;
};

export function gridHourCount(bounds: CalendarGridBounds): number {
  return Math.max(1, bounds.endHour - bounds.startHour);
}

export function computeLocationGridBounds(
  hours: CalendarLocationHour[],
): CalendarGridBounds {
  const open = hours.filter((h) => !h.closed);
  if (open.length === 0) {
    return { ...DEFAULT_GRID_BOUNDS };
  }
  let earliest = Number.POSITIVE_INFINITY;
  let latest = Number.NEGATIVE_INFINITY;
  for (const h of open) {
    earliest = Math.min(earliest, parseHmToMinutes(h.startTime));
    latest = Math.max(latest, parseHmToMinutes(h.endTime));
  }
  if (!Number.isFinite(earliest) || !Number.isFinite(latest) || latest <= earliest) {
    return { ...DEFAULT_GRID_BOUNDS };
  }
  const startHour = Math.max(0, Math.min(23, Math.floor(earliest / 60)));
  const endHour = Math.max(
    startHour + 1,
    Math.min(24, Math.ceil(latest / 60)),
  );
  return { startHour, endHour };
}

export function minutesFromGridStart(
  date: Date,
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
): number {
  return date.getHours() * 60 + date.getMinutes() - bounds.startHour * 60;
}

export function clampToGrid(
  startMin: number,
  endMin: number,
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
) {
  const span = gridHourCount(bounds) * 60;
  const start = Math.max(0, Math.min(span, startMin));
  const end = Math.max(start + 15, Math.min(span, endMin));
  return { start, end };
}

export function pixelYToMinutes(
  y: number,
  hourPx: number,
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
): number {
  return bounds.startHour * 60 + (y / hourPx) * 60;
}

export function roundMinutesTo15(
  totalMinutes: number,
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
): number {
  const rounded = Math.round(totalMinutes / 15) * 15;
  const min = bounds.startHour * 60;
  const max = bounds.endHour * 60 - 15;
  return Math.max(min, Math.min(max, rounded));
}

export function formatHmFromMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatDisplayTimeFromMinutes(totalMinutes: number): string {
  return formatMinutesAsHm12(totalMinutes);
}

export function minutesToPixelY(
  totalMinutes: number,
  hourPx: number,
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
): number {
  return ((totalMinutes - bounds.startHour * 60) / 60) * hourPx;
}

export function toDatetimeLocalValue(day: Date, totalMinutes: number): string {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  d.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

export function addMinutesToDatetimeLocal(value: string, minutes: number): string {
  const d = new Date(value);
  d.setMinutes(d.getMinutes() + minutes);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${mo}-${da}T${h}:${mi}`;
}

export const DENSE_HOUR_PX = 48;
export const COMFORT_HOUR_PX = 64;
export const WEEK_HOUR_PX = 72;

export type CalendarAppointment = {
  id: string;
  startIso: string;
  endIso: string;
  status: string | null;
  clientName: string;
  employeeName: string;
  employeeId: string | null;
  serviceName: string;
  colorId?: string | null;
  locationName?: string | null;
};

export type CalendarLocationHour = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  closed: boolean;
};

export const CLOSED_HOURS_OVERLAY_CLASS = "bg-[rgba(154,74,28,0.1)]";

export function parseHmToMinutes(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function hmFromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function mergeLocationHours(
  hoursByLocation: CalendarLocationHour[][],
): CalendarLocationHour[] {
  const participating = hoursByLocation.filter((hours) => hours.length > 0);
  if (participating.length === 0) return [];
  if (participating.length === 1) return participating[0] ?? [];

  const days = new Set<number>();
  for (const hours of participating) {
    for (const hour of hours) days.add(hour.dayOfWeek);
  }

  return [...days]
    .sort((a, b) => a - b)
    .map((dayOfWeek) => {
      const rows = participating.flatMap((hours) =>
        hours.filter((hour) => hour.dayOfWeek === dayOfWeek),
      );
      const open = rows.filter((hour) => !hour.closed);
      if (open.length === 0) {
        return {
          dayOfWeek,
          startTime: rows[0]?.startTime ?? "09:00",
          endTime: rows[0]?.endTime ?? "17:00",
          closed: true,
        };
      }
      let start = parseHmToMinutes(open[0]!.startTime);
      let end = parseHmToMinutes(open[0]!.endTime);
      for (const hour of open) {
        start = Math.min(start, parseHmToMinutes(hour.startTime));
        end = Math.max(end, parseHmToMinutes(hour.endTime));
      }
      return {
        dayOfWeek,
        startTime: hmFromMinutes(start),
        endTime: hmFromMinutes(end),
        closed: false,
      };
    });
}

export function getLocationHourForDay(
  hours: CalendarLocationHour[],
  day: Date,
): CalendarLocationHour | undefined {
  return hours.find((h) => h.dayOfWeek === day.getDay());
}

export function isLocationClosedOnDay(
  hours: CalendarLocationHour[],
  day: Date,
): boolean {
  if (hours.length === 0) return false;
  const hour = getLocationHourForDay(hours, day);
  return !hour || hour.closed === true;
}

export function isStartTimeWithinLocationHours(
  hours: CalendarLocationHour[],
  day: Date,
  timeHm: string,
): boolean {
  if (hours.length === 0) return true;
  const hour = getLocationHourForDay(hours, day);
  if (!hour || hour.closed) return false;
  const start = parseHmToMinutes(timeHm);
  const locStart = parseHmToMinutes(hour.startTime);
  const locEnd = parseHmToMinutes(hour.endTime);
  return start >= locStart && start < locEnd;
}

export function getOpenWindowsForDay(
  hours: CalendarLocationHour[],
  day: Date,
): { start: number; end: number }[] {
  const dow = day.getDay();
  const windows = hours
    .filter((h) => h.dayOfWeek === dow && !h.closed)
    .map((h) => ({
      start: parseHmToMinutes(h.startTime),
      end: parseHmToMinutes(h.endTime),
    }))
    .filter((w) => w.end > w.start)
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];
  for (const window of windows) {
    const last = merged[merged.length - 1];
    if (!last || window.start > last.end) merged.push({ ...window });
    else last.end = Math.max(last.end, window.end);
  }
  return merged;
}

export function getClosedOverlayBands(
  hours: CalendarLocationHour[],
  day: Date,
  hourPx: number,
  mode: "location" | "employee",
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
): { top: number; height: number; full?: boolean }[] {
  const gridStart = bounds.startHour * 60;
  const gridEnd = bounds.endHour * 60;

  if (mode === "location") {
    if (hours.length === 0) return [];
    if (isLocationClosedOnDay(hours, day)) {
      return [{ top: 0, height: ((gridEnd - gridStart) / 60) * hourPx, full: true }];
    }
    const hour = getLocationHourForDay(hours, day);
    if (!hour) return [];
    const openStart = Math.max(gridStart, parseHmToMinutes(hour.startTime));
    const openEnd = Math.min(gridEnd, parseHmToMinutes(hour.endTime));
    const bands: { top: number; height: number }[] = [];
    if (openStart > gridStart) {
      bands.push({
        top: 0,
        height: ((openStart - gridStart) / 60) * hourPx,
      });
    }
    if (openEnd < gridEnd) {
      bands.push({
        top: ((openEnd - gridStart) / 60) * hourPx,
        height: ((gridEnd - openEnd) / 60) * hourPx,
      });
    }
    return bands;
  }

  if (hours.length === 0) {
    return [{ top: 0, height: ((gridEnd - gridStart) / 60) * hourPx, full: true }];
  }
  const open = getOpenWindowsForDay(hours, day)
    .map((w) => ({
      start: Math.max(gridStart, w.start),
      end: Math.min(gridEnd, w.end),
    }))
    .filter((w) => w.end > w.start);

  if (open.length === 0) {
    return [{ top: 0, height: ((gridEnd - gridStart) / 60) * hourPx, full: true }];
  }

  const bands: { top: number; height: number }[] = [];
  let cursor = gridStart;
  for (const window of open) {
    if (window.start > cursor) {
      bands.push({
        top: ((cursor - gridStart) / 60) * hourPx,
        height: ((window.start - cursor) / 60) * hourPx,
      });
    }
    cursor = Math.max(cursor, window.end);
  }
  if (cursor < gridEnd) {
    bands.push({
      top: ((cursor - gridStart) / 60) * hourPx,
      height: ((gridEnd - cursor) / 60) * hourPx,
    });
  }
  return bands;
}

export function isDayFullyClosed(
  hours: CalendarLocationHour[],
  day: Date,
  mode: "location" | "employee",
): boolean {
  if (mode === "location") return isLocationClosedOnDay(hours, day);
  if (hours.length === 0) return true;
  return getOpenWindowsForDay(hours, day).length === 0;
}

export function isStartWithinHours(
  hours: CalendarLocationHour[],
  day: Date,
  timeHm: string,
  mode: "location" | "employee",
): boolean {
  if (mode === "location") {
    return isStartTimeWithinLocationHours(hours, day, timeHm);
  }
  if (hours.length === 0) return false;
  const start = parseHmToMinutes(timeHm);
  return getOpenWindowsForDay(hours, day).some(
    (w) => start >= w.start && start < w.end,
  );
}

export function appointmentsForDay(
  items: CalendarAppointment[],
  day: Date,
): CalendarAppointment[] {
  return items.filter((a) => sameDay(new Date(a.startIso), day));
}

export type LaidOutAppointment = CalendarAppointment & {
  topMin: number;
  endMin: number;
  column: number;
  columnCount: number;
};

/** Pack overlapping appointments into side-by-side columns (Google Calendar style). */
export function layoutOverlappingAppointments(
  items: CalendarAppointment[],
  bounds: CalendarGridBounds = DEFAULT_GRID_BOUNDS,
): LaidOutAppointment[] {
  const prepared = items
    .map((appt) => {
      const start = new Date(appt.startIso);
      const end = new Date(appt.endIso);
      const { start: topMin, end: endMin } = clampToGrid(
        minutesFromGridStart(start, bounds),
        minutesFromGridStart(end, bounds),
        bounds,
      );
      return { ...appt, topMin, endMin };
    })
    .sort((a, b) => a.topMin - b.topMin || a.endMin - b.endMin);

  const columnEnds: number[] = [];
  const withColumns: (Omit<LaidOutAppointment, "columnCount"> & {
    columnCount?: number;
  })[] = [];

  for (const appt of prepared) {
    let column = columnEnds.findIndex((end) => end <= appt.topMin);
    if (column === -1) {
      column = columnEnds.length;
      columnEnds.push(appt.endMin);
    } else {
      columnEnds[column] = appt.endMin;
    }
    withColumns.push({ ...appt, column });
  }

  const result: LaidOutAppointment[] = withColumns.map((a) => ({
    ...a,
    columnCount: 1,
  }));

  for (let i = 0; i < result.length; i++) {
    const group = [result[i]];
    for (let j = 0; j < result.length; j++) {
      if (i === j) continue;
      if (
        result[i].topMin < result[j].endMin &&
        result[j].topMin < result[i].endMin
      ) {
        group.push(result[j]);
      }
    }
    const maxCol = Math.max(...group.map((g) => g.column)) + 1;
    for (const g of group) {
      g.columnCount = Math.max(g.columnCount, maxCol);
    }
  }

  return result;
}

/** Simple Mon–Sun 8:00–18:00 for the portfolio demo. */
export const DEMO_LOCATION_HOURS: CalendarLocationHour[] = Array.from(
  { length: 7 },
  (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: "08:00",
    endTime: "18:00",
    closed: false,
  }),
);

/** Local datetime string without Z so Date parses in local TZ. */
export function localDateTimeIso(ymd: string, startMin: number): string {
  const h = Math.floor(startMin / 60);
  const m = startMin % 60;
  return `${ymd}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
}
