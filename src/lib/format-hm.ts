/** Format HH:MM (24h storage) as a 12-hour display label, e.g. "2:30 PM". */
export function formatHm12(hm: string): string {
  const [hRaw, mRaw] = String(hm ?? "")
    .slice(0, 5)
    .split(":")
    .map(Number);
  const h = Number.isFinite(hRaw) ? hRaw : 0;
  const m = Number.isFinite(mRaw) ? mRaw : 0;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** Format minutes-from-midnight as 12-hour display. */
export function formatMinutesAsHm12(totalMinutes: number): string {
  const normalized =
    ((Math.floor(totalMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return formatHm12(
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
  );
}

/** Always 12-hour clock for Date display (en-US). */
export function formatTime12(
  date: Date,
  opts?: { includeMinutes?: boolean },
): string {
  const includeMinutes = opts?.includeMinutes !== false;
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    ...(includeMinutes ? { minute: "2-digit" as const } : {}),
    hour12: true,
  });
}
