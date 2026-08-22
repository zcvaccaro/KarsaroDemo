import { useMemo, useState } from "react";
import { EmailMessageEditor } from "../components/EmailMessageEditor";
import { KarsaToggleField } from "../components/karsa-toggle-switch";
import { upsertEmailTemplate, type EmailTemplate } from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

const inputClass =
  "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";

const BUILTIN_ORDER = [
  "confirmation",
  "reminder",
  "cancellation",
  "waitlist",
] as const;

function templateTitle(type: string) {
  if (type.startsWith("custom_")) {
    return type
      .replace(/^custom_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return type;
}

function TemplateEditor({
  template,
  clientForms,
}: {
  template: EmailTemplate;
  clientForms: { id: string; name: string }[];
}) {
  const [subject, setSubject] = useState(template.subject);
  const [htmlContent, setHtmlContent] = useState(template.htmlContent);
  const [active, setActive] = useState(template.active);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      className="space-y-4 border border-karsa-border-subtle p-4"
      onSubmit={(e) => {
        e.preventDefault();
        upsertEmailTemplate({
          id: template.id,
          templateType: template.templateType,
          subject,
          htmlContent,
          active,
        });
        setMessage("Template saved.");
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium capitalize text-karsa-text">
          {templateTitle(template.templateType)}
        </h2>
      </div>
      <div>
        <label className="text-xs text-karsa-faint">Subject</label>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        />
      </div>
      <EmailMessageEditor
        value={htmlContent}
        onChange={setHtmlContent}
        clientForms={clientForms}
        businessName="Sample Studio"
      />
      <KarsaToggleField label="Active" checked={active} onChange={setActive} />
      {message ? (
        <p className="text-sm text-karsa-accent-strong">{message}</p>
      ) : null}
      <button
        type="submit"
        className="rounded-md bg-karsa-accent px-3 py-2 text-sm font-medium text-karsa-bg"
      >
        Save template
      </button>
    </form>
  );
}

export function EmailPage() {
  const { emailTemplates, forms } = useDemoStore();

  const clientForms = useMemo(
    () =>
      forms
        .filter(
          (f) =>
            f.audience === "client" &&
            f.active &&
            !f.isDraft &&
            f.showInCalendarDescription,
        )
        .map((f) => ({ id: f.id, name: f.name })),
    [forms],
  );

  const byType = new Map(emailTemplates.map((t) => [t.templateType, t]));
  const ordered: EmailTemplate[] = [
    ...BUILTIN_ORDER.map((type) => byType.get(type)).filter(
      (t): t is EmailTemplate => t != null,
    ),
    ...emailTemplates.filter(
      (t) => !(BUILTIN_ORDER as readonly string[]).includes(t.templateType),
    ),
  ];

  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Settings · Communications
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Email templates
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Write the emails clients get when a visit is booked, reminded, cancelled,
        or when a waitlist opening appears. In the full product these send
        automatically; here you can edit the wording and preview how it looks.
      </p>

      <div className="mt-8 space-y-6">
        {ordered.map((t) => (
          <TemplateEditor
            key={`${t.templateType}-${t.id}`}
            template={t}
            clientForms={clientForms}
          />
        ))}
      </div>
    </div>
  );
}
