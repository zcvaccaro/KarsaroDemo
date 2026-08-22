import { useCallback, useEffect, useRef, useState } from "react";

const INSERT_FIELDS = [
  { key: "first_name", label: "Name", token: "[Name]" },
  { key: "service_name", label: "Service", token: "[Service]" },
  { key: "date", label: "Date", token: "[Date]" },
  { key: "time", label: "Time", token: "[Time]" },
  { key: "duration", label: "Duration", token: "[Duration]" },
  { key: "payment_link_block", label: "Payment link", token: "[Payment link]" },
] as const;

const PREVIEW_SAMPLES: Record<string, string> = {
  first_name: "Alex",
  service_name: "Deep Tissue",
  date: "July 25, 2026",
  time: "2:00 PM",
  duration: "60 min",
  payment_link_block:
    '<p>Please complete your deposit to hold your appointment.</p><p><a href="#" style="display:inline-block;padding:12px 20px;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">Complete payment</a></p>',
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokensToMerge(text: string) {
  let out = text ?? "";
  for (const field of INSERT_FIELDS) {
    out = out.replaceAll(field.token, `{{${field.key}}}`);
  }
  return out;
}

function mergeToTokens(text: string) {
  let out = text ?? "";
  for (const field of INSERT_FIELDS) {
    out = out.replaceAll(`{{${field.key}}}`, field.token);
  }
  return out;
}

function stripToPlain(html: string) {
  let text = html ?? "";
  text = text
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "")
    .replace(/<\/?h2[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "");
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function plainToParagraphs(text: string) {
  const blocks = text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return "";
  return blocks
    .map((b) => `<p>${escapeHtml(b).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

export function confirmationStorageToParts(stored: string): {
  heading: string;
  body: string;
} {
  const raw = stored ?? "";
  const headingMatch = raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  let heading = "";
  let bodyHtml = raw;
  if (headingMatch) {
    heading = stripToPlain(headingMatch[1] ?? "");
    bodyHtml = raw.replace(headingMatch[0], "");
  }
  return {
    heading: mergeToTokens(heading),
    body: mergeToTokens(stripToPlain(bodyHtml)),
  };
}

export function confirmationPartsToStorage(heading: string, body: string): string {
  const h = tokensToMerge(heading).trim();
  const b = tokensToMerge(body);
  const parts: string[] = [];
  if (h) {
    parts.push(`<h2>${escapeHtml(h).replace(/\n/g, " ")}</h2>`);
  }
  const bodyHtml = plainToParagraphs(b);
  if (bodyHtml) parts.push(bodyHtml);
  return parts.join("");
}

function fillPreview(html: string) {
  let out = html;
  for (const [key, sample] of Object.entries(PREVIEW_SAMPLES)) {
    out = out.replaceAll(`{{${key}}}`, sample);
  }
  for (const field of INSERT_FIELDS) {
    out = out.replaceAll(field.token, PREVIEW_SAMPLES[field.key] ?? field.token);
  }
  return out;
}

type FocusField = "heading" | "body";

export function ConfirmationMessageEditor({
  value,
  onChange,
  buttonLabel = "Continue",
}: {
  value: string;
  onChange: (storedHtml: string) => void;
  buttonLabel?: string;
}) {
  const headingRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [heading, setHeading] = useState(
    () => confirmationStorageToParts(value).heading,
  );
  const [body, setBody] = useState(() => confirmationStorageToParts(value).body);
  const [focusField, setFocusField] = useState<FocusField>("body");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFilter, setMenuFilter] = useState("");
  const [atIndex, setAtIndex] = useState<number | null>(null);

  useEffect(() => {
    const parts = confirmationStorageToParts(value);
    setHeading(parts.heading);
    setBody(parts.body);
  }, [value]);

  const storedHtml = confirmationPartsToStorage(heading, body);
  const previewHtml = fillPreview(storedHtml);

  const commit = useCallback(
    (nextHeading: string, nextBody: string) => {
      setHeading(nextHeading);
      setBody(nextBody);
      onChange(confirmationPartsToStorage(nextHeading, nextBody));
    },
    [onChange],
  );

  const insertToken = useCallback(
    (token: string, replaceAt?: { start: number; end: number }) => {
      const isHeading = focusField === "heading";
      const el = isHeading ? headingRef.current : bodyRef.current;
      const current = isHeading ? heading : body;
      const start = replaceAt?.start ?? el?.selectionStart ?? current.length;
      const end = replaceAt?.end ?? el?.selectionEnd ?? current.length;
      const next = current.slice(0, start) + token + current.slice(end);
      if (isHeading) commit(next, body);
      else commit(heading, next);
      setMenuOpen(false);
      setMenuFilter("");
      setAtIndex(null);
      requestAnimationFrame(() => {
        if (!el) return;
        const pos = start + token.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    [body, commit, focusField, heading],
  );

  function handleFieldChange(field: FocusField, next: string) {
    if (field === "heading") commit(next, body);
    else commit(heading, next);

    const el = field === "heading" ? headingRef.current : bodyRef.current;
    const caret = el?.selectionStart ?? next.length;
    const before = next.slice(0, caret);
    const at = before.lastIndexOf("@");
    if (at >= 0) {
      const fragment = before.slice(at + 1);
      if (
        !fragment.includes(" ") &&
        !fragment.includes("\n") &&
        fragment.length <= 24
      ) {
        setFocusField(field);
        setAtIndex(at);
        setMenuFilter(fragment.toLowerCase());
        setMenuOpen(true);
        return;
      }
    }
    setMenuOpen(false);
    setAtIndex(null);
  }

  const filtered = INSERT_FIELDS.filter(
    (f) =>
      !menuFilter ||
      f.label.toLowerCase().includes(menuFilter) ||
      f.token.toLowerCase().includes(menuFilter),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-sm text-karsa-muted">
          Write what clients see. Use the buttons to insert booking details, or
          type <span className="font-medium text-karsa-text">@</span> in either
          field.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {INSERT_FIELDS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => insertToken(f.token)}
              className={
                f.key === "payment_link_block"
                  ? "rounded-md border border-karsa-accent/40 bg-karsa-accent-soft px-3 py-1.5 text-sm text-karsa-accent-strong transition-colors hover:bg-karsa-accent/20"
                  : "rounded-md border border-karsa-border bg-karsa-surface px-3 py-1.5 text-sm text-karsa-text transition-colors hover:bg-karsa-surface-hover"
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative mt-4 space-y-3">
          <div>
            <label className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
              Large text
            </label>
            <input
              ref={headingRef}
              type="text"
              value={heading}
              onFocus={() => setFocusField("heading")}
              onChange={(e) => handleFieldChange("heading", e.target.value)}
              placeholder="You're all set"
              className="mt-1.5 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2.5 text-lg font-medium text-karsa-text outline-none ring-karsa-accent/40 placeholder:text-karsa-faint focus:ring-2"
            />
          </div>

          <div>
            <label className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
              Message
            </label>
            <textarea
              ref={bodyRef}
              rows={5}
              value={body}
              onFocus={() => setFocusField("body")}
              onChange={(e) => handleFieldChange("body", e.target.value)}
              placeholder="Thanks, [Name]! Your appointment is booked for [Date] at [Time]."
              className="mt-1.5 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2.5 text-sm leading-relaxed text-karsa-text outline-none ring-karsa-accent/40 placeholder:text-karsa-faint focus:ring-2"
            />
          </div>

          {menuOpen && filtered.length > 0 ? (
            <ul className="absolute z-20 w-full max-w-xs overflow-hidden rounded-md border border-karsa-border bg-karsa-bg-elevated py-1 shadow-lg">
              {filtered.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-karsa-text hover:bg-karsa-surface-hover"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      const current = focusField === "heading" ? heading : body;
                      if (atIndex == null) {
                        insertToken(f.token);
                        return;
                      }
                      const el =
                        focusField === "heading"
                          ? headingRef.current
                          : bodyRef.current;
                      const caret = el?.selectionStart ?? current.length;
                      insertToken(f.token, { start: atIndex, end: caret });
                    }}
                  >
                    {f.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
          Preview
        </p>
        <div className="mt-1.5 rounded-md border border-karsa-border bg-[#f7f3ec] p-5 text-stone-800 shadow-sm">
          {previewHtml ? (
            <div
              className="space-y-3 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:text-stone-900 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-stone-600"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-sm text-stone-400">Your message will appear here.</p>
          )}
          <div className="mt-6">
            <span className="inline-block rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white">
              {buttonLabel}
            </span>
          </div>
          <p className="mt-4 text-[11px] text-stone-400">
            Sample data: Alex · Deep Tissue · July 25, 2026 · 2:00 PM · 60 min
          </p>
        </div>
      </div>
    </div>
  );
}
