/** Digits only for date typing (MMDDYYYY → max 8). */
export function dateDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

/**
 * Insert slashes while typing: MM/DD/YYYY (or MM/DD/YY while incomplete).
 */
export function formatDateInput(value: string): string {
  const d = dateDigits(value);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

/** Expand 2-digit year: 00–69 → 2000–2069, 70–99 → 1970–1999. */
export function expandTwoDigitYear(yy: number): number {
  return yy <= 69 ? 2000 + yy : 1900 + yy;
}

/**
 * Parse display MM/DD/YYYY or MM/DD/YY → ISO yyyy-mm-dd, or null if invalid.
 */
export function parseDisplayDateToIso(display: string): string | null {
  const trimmed = display.trim();
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/.exec(trimmed);
  if (!m) return null;
  const month = Number(m[1]);
  const day = Number(m[2]);
  let year = Number(m[3]);
  if (m[3].length === 2) year = expandTwoDigitYear(year);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** ISO yyyy-mm-dd → MM/DD/YYYY display. */
export function isoToDisplayDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) {
    if (/^\d{1,2}\//.test(iso)) return formatDateInput(iso);
    return "";
  }
  return `${m[2]}/${m[3]}/${m[1]}`;
}
