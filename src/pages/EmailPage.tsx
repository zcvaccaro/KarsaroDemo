import { useMemo, useState } from "react";
import { EmailMessageEditor } from "../components/EmailMessageEditor";
import { PageLink } from "../components/PageLink";
import { KarsaToggleField } from "../components/karsa-toggle-switch";
import { upsertEmailTemplate, type EmailTemplate } from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

const BUILTIN_ORDER = [
  "confirmation",
  "reminder",
  "sms_reminder",
  "cancellation",
  "waitlist",
] as const;

function templateTitle(type: string) {
  if (type === "reminder") return "Email reminder";
  if (type === "sms_reminder") return "SMS reminder";
  if (type === "confirmation") return "Confirmation";
  if (type === "cancellation") return "Cancellation";
  if (type === "waitlist") return "Waitlist";
  if (type.startsWith("custom_")) {
    return type
      .replace(/^custom_/, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return type;
}

function insertSetFor(type: string) {
  if (type === "waitlist") return "waitlist" as const;
  if (type === "sms_reminder") return "sms" as const;
  return "appointment" as const;
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
          subject:
            template.templateType === "sms_reminder" ? "SMS reminder" : subject,
          htmlContent,
          active,
        });
        setMessage("Template saved.");
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-karsa-text">
          {templateTitle(template.templateType)}
        </h2>
      </div>
      {template.templateType === "sms_reminder" ? (
        <p className="text-xs text-karsa-faint">
          This text is sent as an SMS on Studio and Practice.
        </p>
      ) : null}
      <EmailMessageEditor
        value={htmlContent}
        onChange={setHtmlContent}
        clientForms={clientForms}
        businessName="Sample Studio"
        insertSet={insertSetFor(template.templateType)}
        subject={subject}
        onSubjectChange={setSubject}
        showSubject={template.templateType !== "sms_reminder"}
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
          (f) => f.audience === "client" && f.active && !f.isDraft,
        )
        .reduce<{ id: string; name: string }[]>((list, f) => {
          const name = f.name.trim() || "Form";
          if (list.some((row) => row.name.toLowerCase() === name.toLowerCase())) {
            return list;
          }
          return [...list, { id: f.id, name }];
        }, []),
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
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Settings · Communications
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Messaging
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Write the emails and SMS clients get when a visit is booked, reminded,
        cancelled, or when a <PageLink to="/dashboard/waitlist">waitlist</PageLink>{" "}
        opening appears. Waitlist emails can include preferred date/time tokens
        and a Book now button. In the full product these send automatically; here you can
        edit the wording and preview how it looks.
      </p>
      <div className="mt-5 max-w-2xl space-y-2 text-sm leading-relaxed text-karsa-muted">
        <p>
          <span className="font-medium text-karsa-text">Confirmation</span>{" "}
          emails send automatically when a visit is booked.
        </p>
        <p>
          <span className="font-medium text-karsa-text">Email reminder</span>{" "}
          and SMS reminder send 28 hours before the appointment start. Change
          that timing in{" "}
          <PageLink to="/dashboard/settings">Business settings</PageLink>.
        </p>
        <p>
          <span className="font-medium text-karsa-text">Waitlist</span> emails
          are sent from an individual{" "}
          <PageLink to="/dashboard/waitlist">waitlist entry</PageLink> when you
          choose Send waitlist email.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
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
