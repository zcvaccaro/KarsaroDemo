/** Shared timeframe bounds for Insights pages. */

export function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export function rangeBounds(range: string): { start: Date; end: Date } {
  const now = new Date();
  if (range === "7d") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "30d") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "90d") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    const start = new Date(now);
    start.setDate(start.getDate() - 89);
    start.setHours(0, 0, 0, 0);
    return { start, end };
  }
  if (range === "12m") {
    const end = addMonths(startOfMonth(now), 1);
    const start = addMonths(startOfMonth(now), -11);
    return { start, end };
  }
  const start = startOfMonth(now);
  const end = addMonths(start, 1);
  return { start, end };
}

export function formatYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Axis ticks for an empty metrics chart so the plot does not collapse. */
export function rangeAxisBuckets(range: string): string[] {
  const { start, end } = rangeBounds(range);
  if (range === "12m") {
    const out: string[] = [];
    let cursor = startOfMonth(start);
    const last = startOfMonth(new Date(end.getTime() - 1));
    while (cursor <= last) {
      out.push(
        `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`,
      );
      cursor = addMonths(cursor, 1);
    }
    return out;
  }
  const out: string[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  while (cursor < end) {
    out.push(formatYmd(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export const INSIGHTS_RANGE_OPTIONS = [
  { value: "month", label: "This month" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "12m", label: "Last 12 months" },
] as const;
