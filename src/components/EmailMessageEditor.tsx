import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const BOOK_NOW_TOKEN = "[Book now button]";
export const BOOK_NOW_BUTTON_HTML =
  '<p><a href="{{book_now_url}}" style="display:inline-block;padding:12px 20px;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">Book this appointment</a></p>';

export type EmailInsertSet = "appointment" | "waitlist" | "sms";

type InsertField = { key: string; label: string; token: string };

const APPOINTMENT_FIELDS: InsertField[] = [
  { key: "client_name", label: "Client name", token: "[Client name]" },
  { key: "business_name", label: "Business name", token: "[Business name]" },
  { key: "employee_name", label: "Practitioner", token: "[Practitioner]" },
  { key: "service_name", label: "Service", token: "[Service]" },
  { key: "duration", label: "Duration", token: "[Duration]" },
  { key: "start_time", label: "Date & time", token: "[Date & time]" },
  { key: "payment_link_block", label: "Payment link", token: "[Payment link]" },
];

const WAITLIST_FIELDS: InsertField[] = [
  { key: "client_name", label: "Client name", token: "[Client name]" },
  { key: "business_name", label: "Business name", token: "[Business name]" },
  { key: "service_name", label: "Service", token: "[Service]" },
  { key: "duration", label: "Duration", token: "[Duration]" },
  {
    key: "service_name_block",
    label: "Service mention",
    token: "[Service mention]",
  },
  { key: "notes_block", label: "Opening note", token: "[Opening note]" },
];

const SMS_FIELDS: InsertField[] = [
  { key: "client_name", label: "Client name", token: "[Client name]" },
  { key: "business_name", label: "Business name", token: "[Business name]" },
  { key: "employee_name", label: "Practitioner", token: "[Practitioner]" },
  { key: "service_name", label: "Service", token: "[Service]" },
  { key: "duration", label: "Duration", token: "[Duration]" },
  { key: "start_time", label: "Date & time", token: "[Date & time]" },
];

function fieldsFor(insertSet: EmailInsertSet): InsertField[] {
  if (insertSet === "waitlist") return WAITLIST_FIELDS;
  if (insertSet === "sms") return SMS_FIELDS;
  return APPOINTMENT_FIELDS;
}

const ALL_TEXT_FIELDS: InsertField[] = (() => {
  const seen = new Set<string>();
  const out: InsertField[] = [];
  for (const field of [...APPOINTMENT_FIELDS, ...WAITLIST_FIELDS, ...SMS_FIELDS]) {
    if (seen.has(field.key)) continue;
    seen.add(field.key);
    out.push(field);
  }
  return out;
})();

const SUBJECT_FIELD_KEYS = new Set([
  "client_name",
  "business_name",
  "employee_name",
  "service_name",
  "duration",
  "start_time",
]);

function isSubjectField(key: string) {
  return SUBJECT_FIELD_KEYS.has(key);
}

function previewSamples(businessName: string): Record<string, string> {
  return {
    client_name: "Alex Rivera",
    business_name: businessName || "Your studio",
    employee_name: "Jamie Chen",
    service_name: "Deep Tissue",
    duration: "60 min",
    start_time: "July 25, 2026 at 2:00 PM",
    payment_link_block:
      '<p>Please complete your deposit to hold your appointment.</p><p><a href="#" style="display:inline-block;padding:12px 20px;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">Complete payment</a></p>',
    service_name_block: " for Deep Tissue",
    notes_block: "A cancellation just opened Friday at 2:00 PM.",
    book_now_url: "#",
  };
}

export type ClientFormLinkOption = {
  id: string;
  name: string;
};

const EMPTY_FORMS: ClientFormLinkOption[] = [];

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function tokensToMerge(text: string, fields: InsertField[] = ALL_TEXT_FIELDS) {
  let out = text ?? "";
  for (const field of fields) {
    out = out.replaceAll(field.token, `{{${field.key}}}`);
  }
  return out;
}

/** "Booking form" stays as-is; "Client Intake" becomes "Client Intake form". */
export function formActionLabel(name: string) {
  const trimmed = (name ?? "").trim() || "Form";
  return /\bform\b/i.test(trimmed) ? trimmed : `${trimmed} form`;
}

function formLinkToken(formName: string) {
  return `[${formActionLabel(formName)} button]`;
}

function formLinkTokenAliases(formName: string) {
  const label = formActionLabel(formName);
  return Array.from(
    new Set([
      `[${label} button]`,
      `[${formName} form button]`,
      `[${formName} form form button]`,
      `[${formName} button]`,
    ]),
  );
}

function formButtonHtml(formId: string, formName: string) {
  const label = escapeHtml(formActionLabel(formName));
  return `<p><a href="{{form_link_${formId}}}" style="display:inline-block;padding:12px 20px;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">${label}</a></p>`;
}

function extractButtonsToTokens(
  html: string,
  formLinks: ClientFormLinkOption[],
) {
  let out = html ?? "";
  out = out.replaceAll(BOOK_NOW_BUTTON_HTML, BOOK_NOW_TOKEN);
  out = out.replace(
    /<p>\s*<a href="\{\{book_now_url\}\}"[\s\S]*?<\/a>\s*<\/p>/gi,
    BOOK_NOW_TOKEN,
  );
  out = out.replaceAll("{{book_now_url}}", BOOK_NOW_TOKEN);
  for (const form of formLinks) {
    const token = formLinkToken(form.name);
    out = out.replaceAll(formButtonHtml(form.id, form.name), token);
    out = out.replace(
      new RegExp(
        `<p>\\s*<a href="\\{\\{form_link_${form.id}\\}\\}"[\\s\\S]*?<\\/a>\\s*<\\/p>`,
        "gi",
      ),
      token,
    );
  }
  return out;
}

function mergeToTokens(text: string, fields: InsertField[] = ALL_TEXT_FIELDS) {
  let out = text ?? "";
  for (const field of fields) {
    out = out.replaceAll(`{{${field.key}}}`, field.token);
  }
  return out;
}

export function subjectStorageToEditor(subject: string) {
  return mergeToTokens(subject ?? "");
}

export function subjectEditorToStorage(subject: string) {
  return tokensToMerge(subject ?? "");
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

/** Load stored HTML into the single message field (legacy h2 headings fold into body). */
export function emailStorageToBody(
  stored: string,
  formLinks: ClientFormLinkOption[],
  insertSet: EmailInsertSet = "appointment",
): string {
  const fields = fieldsFor(insertSet);
  const raw = extractButtonsToTokens(stored ?? "", formLinks);
  const headingMatch = raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  let heading = "";
  let bodyHtml = raw;
  if (headingMatch) {
    heading = stripToPlain(headingMatch[1] ?? "");
    bodyHtml = raw.replace(headingMatch[0], "");
  }
  const body = mergeToTokens(stripToPlain(bodyHtml), fields);
  const headingTokens = mergeToTokens(heading, fields);
  if (headingTokens && body) return `${headingTokens}\n\n${body}`;
  return headingTokens || body;
}

export function emailBodyToStorage(
  body: string,
  formLinks: ClientFormLinkOption[],
  insertSet: EmailInsertSet = "appointment",
): string {
  const fields = fieldsFor(insertSet);
  let remaining = tokensToMerge(body, fields);
  const parts: string[] = [];
  const specials: { token: string; html: string }[] = [];

  if (insertSet === "waitlist") {
    specials.push({ token: BOOK_NOW_TOKEN, html: BOOK_NOW_BUTTON_HTML });
  }
  if (insertSet !== "sms") {
    for (const form of formLinks) {
      const html = formButtonHtml(form.id, form.name);
      for (const token of formLinkTokenAliases(form.name)) {
        specials.push({ token, html });
      }
    }
  }

  while (remaining.length) {
    let earliest = -1;
    let hit: (typeof specials)[number] | null = null;
    for (const special of specials) {
      const index = remaining.indexOf(special.token);
      if (index >= 0 && (earliest < 0 || index < earliest)) {
        earliest = index;
        hit = special;
      }
    }
    if (!hit || earliest < 0) {
      if (remaining.trim()) parts.push(plainToParagraphs(remaining));
      break;
    }
    const before = remaining.slice(0, earliest);
    if (before.trim()) parts.push(plainToParagraphs(before));
    parts.push(hit.html);
    remaining = remaining.slice(earliest + hit.token.length);
  }

  return parts.join("");
}

/** @deprecated Prefer emailStorageToBody — kept for any older call sites. */
export function emailStorageToParts(
  stored: string,
  formLinks: ClientFormLinkOption[],
): { heading: string; body: string } {
  return { heading: "", body: emailStorageToBody(stored, formLinks) };
}

/** @deprecated Prefer emailBodyToStorage */
export function emailPartsToStorage(
  _heading: string,
  body: string,
  formLinks: ClientFormLinkOption[],
): string {
  return emailBodyToStorage(body, formLinks);
}

function fillPreview(
  html: string,
  formLinks: ClientFormLinkOption[],
  businessName: string,
  fields: InsertField[],
) {
  const samples = previewSamples(businessName);
  let out = html;
  for (const [key, sample] of Object.entries(samples)) {
    out = out.replaceAll(`{{${key}}}`, sample);
  }
  for (const field of fields) {
    out = out.replaceAll(field.token, samples[field.key] ?? field.token);
  }
  out = out.replaceAll(BOOK_NOW_TOKEN, BOOK_NOW_BUTTON_HTML.replace(
    "{{book_now_url}}",
    "#",
  ));
  for (const form of formLinks) {
    out = out.replaceAll(
      `{{form_link_${form.id}}}`,
      `https://book.example.com/form/${form.id}`,
    );
  }
  return out;
}

export function EmailMessageEditor({
  value,
  onChange,
  clientForms = [],
  businessName = "Your studio",
  insertSet = "appointment",
  subject,
  onSubjectChange,
  showSubject = false,
}: {
  value: string;
  onChange: (storedHtml: string) => void;
  clientForms?: ClientFormLinkOption[];
  businessName?: string;
  insertSet?: EmailInsertSet;
  subject?: string;
  onSubjectChange?: (storedSubject: string) => void;
  showSubject?: boolean;
}) {
  const fields = fieldsFor(insertSet);
  const formLinks = insertSet === "sms" ? EMPTY_FORMS : clientForms;
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const [insertTarget, setInsertTarget] = useState<"subject" | "body">("body");
  const [body, setBody] = useState(() =>
    emailStorageToBody(value, formLinks, insertSet),
  );
  const [subjectText, setSubjectText] = useState(() =>
    subjectStorageToEditor(subject ?? ""),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFilter, setMenuFilter] = useState("");
  const [atIndex, setAtIndex] = useState<number | null>(null);

  useEffect(() => {
    setBody(emailStorageToBody(value, formLinks, insertSet));
  }, [value, formLinks, insertSet]);

  useEffect(() => {
    if (showSubject) setSubjectText(subjectStorageToEditor(subject ?? ""));
  }, [subject, showSubject]);

  const storedHtml = emailBodyToStorage(body, formLinks, insertSet);
  const previewHtml = fillPreview(storedHtml, formLinks, businessName, fields);
  const subjectPreview = fillPreview(
    subjectEditorToStorage(subjectText),
    [],
    businessName,
    ALL_TEXT_FIELDS,
  );
  const smsPreviewText = useMemo(
    () => stripToPlain(previewHtml),
    [previewHtml],
  );

  const commitBody = useCallback(
    (nextBody: string) => {
      setBody(nextBody);
      onChange(emailBodyToStorage(nextBody, formLinks, insertSet));
    },
    [formLinks, insertSet, onChange],
  );

  const commitSubject = useCallback(
    (next: string) => {
      setSubjectText(next);
      onSubjectChange?.(subjectEditorToStorage(next));
    },
    [onSubjectChange],
  );

  const insertInto = useCallback(
    (
      target: "subject" | "body",
      token: string,
      replaceAt?: { start: number; end: number },
    ) => {
      if (target === "subject" && showSubject) {
        const el = subjectRef.current;
        const current = subjectText;
        const start = replaceAt?.start ?? el?.selectionStart ?? current.length;
        const end = replaceAt?.end ?? el?.selectionEnd ?? current.length;
        const next = current.slice(0, start) + token + current.slice(end);
        commitSubject(next);
        setInsertTarget("subject");
        requestAnimationFrame(() => {
          if (!el) return;
          const pos = start + token.length;
          el.focus();
          el.setSelectionRange(pos, pos);
        });
        return;
      }

      const el = bodyRef.current;
      const current = body;
      const start = replaceAt?.start ?? el?.selectionStart ?? current.length;
      const end = replaceAt?.end ?? el?.selectionEnd ?? current.length;
      const next = current.slice(0, start) + token + current.slice(end);
      commitBody(next);
      setInsertTarget("body");
      requestAnimationFrame(() => {
        if (!el) return;
        const pos = start + token.length;
        el.focus();
        el.setSelectionRange(pos, pos);
      });
    },
    [body, commitBody, commitSubject, showSubject, subjectText],
  );

  const insertToken = useCallback(
    (
      token: string,
      options?: {
        fieldKey?: string;
        bodyOnly?: boolean;
        replaceAt?: { start: number; end: number };
      },
    ) => {
      const bodyOnly = options?.bodyOnly || Boolean(options?.fieldKey && !isSubjectField(options.fieldKey));
      const target =
        !bodyOnly && showSubject && insertTarget === "subject"
          ? "subject"
          : "body";
      insertInto(target, token, options?.replaceAt);
      setMenuOpen(false);
      setMenuFilter("");
      setAtIndex(null);
    },
    [insertInto, insertTarget, showSubject],
  );

  function handleBodyChange(next: string) {
    commitBody(next);

    const el = bodyRef.current;
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
        setAtIndex(at);
        setMenuFilter(fragment.toLowerCase());
        setMenuOpen(true);
        return;
      }
    }
    setMenuOpen(false);
    setAtIndex(null);
  }

  const menuItems = [
    ...fields.map((f) => ({
      key: f.key,
      label: f.label,
      token: f.token,
      fieldKey: f.key,
      bodyOnly: !isSubjectField(f.key),
    })),
    ...(insertSet === "waitlist"
      ? [
          {
            key: "book_now",
            label: "Book now button",
            token: BOOK_NOW_TOKEN,
            bodyOnly: true,
          },
        ]
      : []),
    ...formLinks.map((f) => ({
      key: `form-${f.id}`,
      label: `${formActionLabel(f.name)} button`,
      token: formLinkToken(f.name),
      bodyOnly: true,
    })),
  ];

  const filtered = menuItems.filter(
    (f) =>
      !menuFilter ||
      f.label.toLowerCase().includes(menuFilter) ||
      f.token.toLowerCase().includes(menuFilter),
  );

  const showFormSection =
    insertSet !== "sms" &&
    (formLinks.length > 0 || insertSet === "waitlist");

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-sm text-karsa-muted">
          Write what clients receive. Click a subject or message field, then
          insert appointment details — or type{" "}
          <span className="font-medium text-karsa-text">@</span> in the
          message.
        </p>

        <div className="mt-4">
          <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Appointment details
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {fields.map((f) => (
              <button
                key={f.key}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => insertToken(f.token, { fieldKey: f.key })}
                className="rounded-md border border-karsa-border bg-karsa-surface px-3 py-1.5 text-sm text-karsa-text transition-colors hover:bg-karsa-surface-hover"
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {showFormSection ? (
          <div className="mt-4">
            <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
              {insertSet === "waitlist" && formLinks.length > 0
                ? "Form and booking buttons"
                : insertSet === "waitlist"
                  ? "Booking buttons"
                  : "Form buttons"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {insertSet === "waitlist" ? (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertToken(BOOK_NOW_TOKEN, { bodyOnly: true })}
                  className="rounded-md border border-karsa-accent/40 bg-karsa-accent-soft px-3 py-1.5 text-sm text-karsa-accent-strong transition-colors hover:bg-karsa-accent/20"
                >
                  Book now button
                </button>
              ) : null}
              {formLinks.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() =>
                    insertToken(formLinkToken(f.name), { bodyOnly: true })
                  }
                  className="rounded-md border border-karsa-accent/40 bg-karsa-accent-soft px-3 py-1.5 text-sm text-karsa-accent-strong transition-colors hover:bg-karsa-accent/20"
                >
                  {formActionLabel(f.name)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showSubject ? (
          <div className="mt-4">
            <label className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
              Subject
            </label>
            <input
              ref={subjectRef}
              value={subjectText}
              onFocus={() => setInsertTarget("subject")}
              onChange={(e) => commitSubject(e.target.value)}
              placeholder="Reminder: [Service] at [Date & time]"
              className="mt-1.5 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 placeholder:text-karsa-faint focus:ring-2"
            />
          </div>
        ) : null}

        <div className="relative mt-4">
          <label className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Message
          </label>
          <textarea
            ref={bodyRef}
            rows={insertSet === "sms" ? 6 : 8}
            value={body}
            onFocus={() => setInsertTarget("body")}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder={
              insertSet === "sms"
                ? "Hi [Client name], reminder: [Service] on [Date & time]."
                : "Hi [Client name], your [Service] is booked for [Date & time]."
            }
            className="mt-1.5 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2.5 text-sm leading-relaxed text-karsa-text outline-none ring-karsa-accent/40 placeholder:text-karsa-faint focus:ring-2"
          />
          {insertSet === "sms" ? (
            <p className="mt-1.5 text-xs text-karsa-faint">
              {smsPreviewText.length} characters
              {smsPreviewText.length > 160
                ? " · may send as more than one SMS"
                : " · typically 1 SMS"}
            </p>
          ) : null}

          {menuOpen && filtered.length > 0 ? (
            <ul className="absolute z-20 w-full max-w-xs overflow-hidden rounded-md border border-karsa-border bg-karsa-bg-elevated py-1 shadow-lg">
              {filtered.map((f) => (
                <li key={f.key}>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-karsa-text hover:bg-karsa-surface-hover"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (atIndex == null) {
                        insertToken(f.token, {
                          fieldKey: "fieldKey" in f ? f.fieldKey : undefined,
                          bodyOnly: f.bodyOnly,
                        });
                        return;
                      }
                      const el = bodyRef.current;
                      const caret = el?.selectionStart ?? body.length;
                      insertToken(f.token, {
                        fieldKey: "fieldKey" in f ? f.fieldKey : undefined,
                        bodyOnly: f.bodyOnly,
                        replaceAt: { start: atIndex, end: caret },
                      });
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
        {insertSet === "sms" ? (
          <div className="pointer-events-none mt-1.5 select-none">
            <div className="mx-auto max-w-[16rem] rounded-[1.75rem] border border-karsa-border bg-stone-900 p-3 shadow-sm">
              <div className="rounded-[1.25rem] bg-[#f7f3ec] px-3 py-6">
                <div className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-stone-800 px-3 py-2 text-sm leading-relaxed text-white">
                  {smsPreviewText || "Your message will appear here."}
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-stone-400">
              Sample SMS preview — sending is included on Studio and Practice.
            </p>
          </div>
        ) : (
          <div className="pointer-events-none mt-1.5 select-none rounded-md border border-karsa-border bg-[#f7f3ec] p-5 text-stone-800 shadow-sm">
            {showSubject ? (
              <p className="mb-4 border-b border-stone-200 pb-3 text-sm font-medium text-stone-900">
                {subjectPreview || (
                  <span className="font-normal text-stone-400">
                    Subject will appear here.
                  </span>
                )}
              </p>
            ) : null}
            {previewHtml ? (
              <div
                className="space-y-3 [&_a]:pointer-events-none [&_a]:no-underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:text-stone-900 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-stone-600"
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            ) : (
              <p className="text-sm text-stone-400">
                Your message will appear here.
              </p>
            )}
            <p className="mt-4 text-[11px] text-stone-400">
              Sample preview only — not clickable. Buttons link when the email
              is sent.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
