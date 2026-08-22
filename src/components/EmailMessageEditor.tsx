import { useCallback, useEffect, useRef, useState } from "react";

const INSERT_FIELDS = [
  { key: "client_name", label: "Client name", token: "[Client name]" },
  { key: "business_name", label: "Business name", token: "[Business name]" },
  { key: "employee_name", label: "Practitioner", token: "[Practitioner]" },
  { key: "service_name", label: "Service", token: "[Service]" },
  { key: "start_time", label: "Date & time", token: "[Date & time]" },
  { key: "payment_link_block", label: "Payment link", token: "[Payment link]" },
] as const;

function previewSamples(businessName: string): Record<string, string> {
  return {
    client_name: "Alex Rivera",
    business_name: businessName || "Your studio",
    employee_name: "Jamie Chen",
    service_name: "Deep Tissue",
    start_time: "July 25, 2026 at 2:00 PM",
    payment_link_block:
      '<p>Please complete your deposit to hold your appointment.</p><p><a href="#" style="display:inline-block;padding:12px 20px;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">Complete payment</a></p>',
  };
}

export type ClientFormLinkOption = {
  id: string;
  name: string;
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

function mergeToTokens(text: string, formLinks: ClientFormLinkOption[]) {
  let out = text ?? "";
  for (const field of INSERT_FIELDS) {
    out = out.replaceAll(`{{${field.key}}}`, field.token);
  }
  for (const form of formLinks) {
    out = out.replaceAll(
      formButtonHtml(form.id, form.name),
      formLinkToken(form.name),
    );
  }
  return out;
}

function formLinkToken(formName: string) {
  return `[${formName} form button]`;
}

function formButtonHtml(formId: string, formName: string) {
  const label = escapeHtml(formName);
  return `<p><a href="{{form_link_${formId}}}" style="display:inline-block;padding:12px 20px;background:#1c1917;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:500;">${label}</a></p>`;
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

export function emailStorageToBody(
  stored: string,
  formLinks: ClientFormLinkOption[],
): string {
  const raw = stored ?? "";
  const headingMatch = raw.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  let heading = "";
  let bodyHtml = raw;
  if (headingMatch) {
    heading = stripToPlain(headingMatch[1] ?? "");
    bodyHtml = raw.replace(headingMatch[0], "");
  }
  const body = mergeToTokens(stripToPlain(bodyHtml), formLinks);
  const headingTokens = mergeToTokens(heading, formLinks);
  if (headingTokens && body) return `${headingTokens}\n\n${body}`;
  return headingTokens || body;
}

export function emailBodyToStorage(
  body: string,
  formLinks: ClientFormLinkOption[],
): string {
  const parts: string[] = [];
  let remaining = tokensToMerge(body);
  let insertedFormButton = false;

  for (const form of formLinks) {
    const token = formLinkToken(form.name);
    if (!remaining.includes(token)) continue;
    insertedFormButton = true;
    const segments = remaining.split(token);
    if (segments[0]?.trim()) {
      parts.push(plainToParagraphs(segments[0]));
    }
    parts.push(formButtonHtml(form.id, form.name));
    remaining = segments.slice(1).join(token);
  }

  if (remaining.trim()) {
    parts.push(plainToParagraphs(remaining));
  } else if (!insertedFormButton) {
    return parts.join("");
  }

  return parts.join("");
}

function fillPreview(
  html: string,
  formLinks: ClientFormLinkOption[],
  businessName: string,
) {
  const samples = previewSamples(businessName);
  let out = html;
  for (const [key, sample] of Object.entries(samples)) {
    out = out.replaceAll(`{{${key}}}`, sample);
  }
  for (const field of INSERT_FIELDS) {
    out = out.replaceAll(field.token, samples[field.key] ?? field.token);
  }
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
  businessName = "Sample Studio",
}: {
  value: string;
  onChange: (storedHtml: string) => void;
  clientForms?: ClientFormLinkOption[];
  businessName?: string;
}) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [body, setBody] = useState(() =>
    emailStorageToBody(value, clientForms),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuFilter, setMenuFilter] = useState("");
  const [atIndex, setAtIndex] = useState<number | null>(null);

  useEffect(() => {
    setBody(emailStorageToBody(value, clientForms));
  }, [value, clientForms]);

  const storedHtml = emailBodyToStorage(body, clientForms);
  const previewHtml = fillPreview(storedHtml, clientForms, businessName);

  const commit = useCallback(
    (nextBody: string) => {
      setBody(nextBody);
      onChange(emailBodyToStorage(nextBody, clientForms));
    },
    [clientForms, onChange],
  );

  const insertToken = useCallback(
    (token: string, replaceAt?: { start: number; end: number }) => {
      const el = bodyRef.current;
      const current = body;
      const start = replaceAt?.start ?? el?.selectionStart ?? current.length;
      const end = replaceAt?.end ?? el?.selectionEnd ?? current.length;
      const next = current.slice(0, start) + token + current.slice(end);
      commit(next);
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
    [body, commit],
  );

  function handleBodyChange(next: string) {
    commit(next);

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
    ...INSERT_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      token: f.token,
    })),
    ...clientForms.map((f) => ({
      key: `form-${f.id}`,
      label: `${f.name} button`,
      token: formLinkToken(f.name),
    })),
  ];

  const filtered = menuItems.filter(
    (f) =>
      !menuFilter ||
      f.label.toLowerCase().includes(menuFilter) ||
      f.token.toLowerCase().includes(menuFilter),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <p className="text-sm text-karsa-muted">
          Write what clients receive. Use the buttons to insert appointment
          details, or type <span className="font-medium text-karsa-text">@</span>{" "}
          in the message.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {INSERT_FIELDS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => insertToken(f.token)}
              className="rounded-md border border-karsa-border bg-karsa-surface px-3 py-1.5 text-sm text-karsa-text transition-colors hover:bg-karsa-surface-hover"
            >
              {f.label}
            </button>
          ))}
          {clientForms.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => insertToken(formLinkToken(f.name))}
              className="rounded-md border border-karsa-accent/40 bg-karsa-accent-soft px-3 py-1.5 text-sm text-karsa-accent-strong transition-colors hover:bg-karsa-accent/20"
            >
              {f.name} form
            </button>
          ))}
        </div>

        <div className="relative mt-4">
          <label className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Message
          </label>
          <textarea
            ref={bodyRef}
            rows={8}
            value={body}
            onChange={(e) => handleBodyChange(e.target.value)}
            placeholder="Hi [Client name], your [Service] is booked for [Date & time]."
            className="mt-1.5 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2.5 text-sm leading-relaxed text-karsa-text outline-none ring-karsa-accent/40 placeholder:text-karsa-faint focus:ring-2"
          />

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
                        insertToken(f.token);
                        return;
                      }
                      const el = bodyRef.current;
                      const caret = el?.selectionStart ?? body.length;
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
        <div className="pointer-events-none mt-1.5 select-none rounded-md border border-karsa-border bg-[#f7f3ec] p-5 text-stone-800 shadow-sm">
          {previewHtml ? (
            <div
              className="space-y-3 [&_a]:pointer-events-none [&_a]:no-underline [&_h2]:font-display [&_h2]:text-2xl [&_h2]:tracking-tight [&_h2]:text-stone-900 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-stone-600"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          ) : (
            <p className="text-sm text-stone-400">Your message will appear here.</p>
          )}
          <p className="mt-4 text-[11px] text-stone-400">
            Sample preview only — not clickable. Form buttons link when the
            email is sent.
          </p>
        </div>
      </div>
    </div>
  );
}
