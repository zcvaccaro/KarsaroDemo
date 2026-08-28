import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { KarsaToggleSwitch } from "../components/karsa-toggle-switch";
import { TemplateFormPreview } from "../components/TemplateFormPreview";
import {
  createFormFromTemplate,
  deleteForm,
  FORM_TEMPLATE_STARTERS,
  setFormFields,
  setFormSections,
  uid,
  updateFormMeta,
  type DemoForm,
  type FormField,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

const inputClass =
  "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";
const btnPrimary =
  "w-full rounded-md bg-karsa-accent px-3 py-2.5 text-sm font-medium text-karsa-bg transition-colors hover:bg-karsa-accent-strong disabled:opacity-60";
const btnSecondary =
  "w-full rounded-md border border-karsa-border bg-karsa-surface px-3 py-2 text-sm text-karsa-text transition-colors hover:bg-karsa-surface-hover disabled:opacity-60";

const WAITLIST_DATE_OPTION_MIN = 1;
const WAITLIST_DATE_OPTION_MAX = 3;

const HIDDEN_MAIN_SECTION_KEYS = new Set([
  "payment",
  "custom_fields",
  "health_information",
  "session",
  "service_selection",
]);

const LEGAL_SECTION_KEYS = new Set([
  "consent",
  "privacy_policy",
  "cancellation_policy",
]);

function displayFormName(form: DemoForm) {
  if (
    form.templateKey === "soap" &&
    (form.name === "SOAP Notes" || form.name === "SOAP")
  ) {
    return "Session Notes";
  }
  return form.name;
}

function isGeneralUse(form: DemoForm) {
  return (
    form.active &&
    !form.isDraft &&
    !form.showInCalendarDescription &&
    form.templateKey !== "booking" &&
    form.templateKey !== "waitlist"
  );
}

function fieldAutofillsFromAppointment(field: FormField) {
  const label = field.label.trim().toLowerCase();
  return (
    field.locked ||
    label === "treatment/client" ||
    label === "date & time" ||
    label === "appointment id"
  );
}

function CreateFormPanel() {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
        Starter templates
      </p>
      <p className="mt-1 text-sm text-karsa-muted">
        Shared across every business — pick one to customize. Nothing is saved
        to your account until you click Save form.
      </p>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FORM_TEMPLATE_STARTERS.map((t) => (
          <li key={t.key}>
            <Link
              to={`/dashboard/forms/new/${t.key}`}
              className="block h-full rounded-md border border-karsa-border-subtle bg-karsa-bg-elevated p-4 transition-colors hover:border-karsa-accent hover:bg-karsa-surface-hover"
            >
              <p className="text-sm font-medium text-karsa-text">{t.name}</p>
              <p className="mt-1 text-[11px] tracking-wide text-karsa-faint uppercase">
                {t.audience === "staff" ? "Staff / internal" : "Client"}
                {t.key === "blank" ? " · from scratch" : ""}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-karsa-muted">
                {t.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FormListItem({ form }: { form: DemoForm }) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const general = isGeneralUse(form);

  return (
    <li className="border border-karsa-border-subtle px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/dashboard/forms/${form.id}`}
          className="min-w-0 flex-1 transition-colors hover:text-karsa-accent-strong"
        >
          <p className="font-medium text-karsa-text">{displayFormName(form)}</p>
          <p className="mt-1 text-xs text-karsa-muted">
            {form.audience}
            {" · "}
            {form.templateKey === "soap" ? "session notes" : form.templateKey}
            {form.templateKey === "booking"
              ? " · Book Now extras (list on appointment)"
              : ""}
            {form.showInCalendarDescription ? " · calendar link" : ""}
            {general ? " · general use" : ""}
            {form.isDraft ? " · draft" : ""}
          </p>
        </Link>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span
            className={
              form.active
                ? "text-xs text-karsa-accent-strong"
                : "text-xs text-karsa-warning"
            }
          >
            {form.isDraft ? "Draft" : form.active ? "Active" : "Inactive"}
          </span>
          {general ? (
            <button
              type="button"
              onClick={() =>
                window.alert(
                  "In the live app this opens a fill-out modal (client or staff subject). Demo skips submission.",
                )
              }
              className="rounded-md bg-karsa-accent px-2.5 py-1 text-xs font-medium text-karsa-bg transition-colors hover:bg-karsa-accent-strong"
            >
              Fill out this form
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-md bg-[#c17a45] px-2.5 py-1 text-xs font-medium text-[#f7f1ea] hover:bg-[#a86f45]"
          >
            Delete
          </button>
        </div>
      </div>

      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div
            className="absolute inset-0"
            onClick={() => setDeleteOpen(false)}
            role="presentation"
          />
          <div className="relative z-10 w-full max-w-md rounded-lg border border-karsa-border bg-karsa-bg-elevated p-5 shadow-lg">
            <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
              Confirm
            </p>
            <h2 className="mt-1 font-display text-xl text-karsa-text">
              Delete this form?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-karsa-muted">
              Are you sure you want to delete{" "}
              <span className="text-karsa-text">“{form.name}”</span>?
            </p>
            <p className="mt-3 text-sm leading-relaxed text-karsa-muted">
              If you delete it, anything already filled out with this form will
              no longer be available to open or print. This cannot be undone.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted hover:bg-karsa-surface"
              >
                Keep form
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteForm(form.id);
                  setDeleteOpen(false);
                }}
                className="rounded-md bg-[#c17a45] px-4 py-2 text-sm font-medium text-[#f7f1ea] hover:bg-[#a86f45]"
              >
                Yes, delete form
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function FormsListPage() {
  const { forms } = useDemoStore();
  const saved = forms.filter((f) => !f.isDraft);

  return (
    <div className="mx-auto max-w-4xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Forms
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Forms
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Create and edit the paperwork clients and staff fill out (intake,
        booking questions, session notes, and more). Turn sections on or off,
        then save. Saved forms can be added to Booking flow and paired with a
        confirmation message.
      </p>
      <p className="mt-4 rounded-md border border-karsa-accent/25 bg-karsa-accent-soft/40 px-3 py-2.5 text-sm leading-relaxed text-karsa-muted md:hidden">
        Form previews work on this screen, but they&apos;re easier to review on
        a desktop or tablet.
      </p>

      <div className="mt-8">
        <CreateFormPanel />
      </div>

      <p className="mt-10 text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
        Your saved forms
      </p>
      <ul className="mt-3 space-y-3">
        {saved.map((form) => (
          <FormListItem key={form.id} form={form} />
        ))}
        {saved.length === 0 ? (
          <li className="text-sm text-karsa-faint">
            No saved forms yet. Choose a starter template above, customize it,
            then click Save form.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

/** Creates a draft from a template key, then redirects into the editor. */
export function NewFormPage() {
  const { templateKey = "blank" } = useParams();
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const form = createFormFromTemplate(templateKey);
    navigate(`/dashboard/forms/${form.id}`, { replace: true });
  }, [templateKey, navigate]);

  return (
    <p className="text-sm text-karsa-muted">Opening template editor…</p>
  );
}

export function FormCustomizerPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { forms, services, employees } = useDemoStore();
  const form = forms.find((f) => f.id === formId);
  const [formName, setFormName] = useState(form?.name ?? "");
  const [audience, setAudience] = useState<"client" | "staff">(
    form?.audience ?? "client",
  );
  const [showInCalendarDescription, setShowInCalendarDescription] = useState(
    form?.showInCalendarDescription ?? false,
  );
  const [savedFlash, setSavedFlash] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState("");

  useEffect(() => {
    if (!form) return;
    setFormName(form.name);
    setAudience(form.audience);
    setShowInCalendarDescription(form.showInCalendarDescription);
  }, [form?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- sync when navigating forms

  const templateKey = form?.templateKey ?? "blank";
  const lockedAudience =
    templateKey === "booking" || templateKey === "waitlist";

  const visibleSections = useMemo(() => {
    if (!form) return [];
    return form.sections.filter((s) => {
      if (s.key === "contact") {
        return templateKey === "booking" || templateKey === "waitlist";
      }
      if (HIDDEN_MAIN_SECTION_KEYS.has(s.key)) return false;
      if (audience === "staff" && LEGAL_SECTION_KEYS.has(s.key)) return false;
      return true;
    });
  }, [form, audience, templateKey]);

  if (!form) {
    return (
      <p className="text-sm text-karsa-danger">
        Form not found.{" "}
        <Link to="/dashboard/forms" className="underline">
          Back to forms
        </Link>
      </p>
    );
  }

  const currentForm = form;

  function save() {
    updateFormMeta(currentForm.id, {
      name: formName.trim() || currentForm.name,
      audience: lockedAudience ? "client" : audience,
      showInCalendarDescription: lockedAudience
        ? false
        : showInCalendarDescription,
      isDraft: false,
      active: true,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  }

  function toggleSection(sectionId: string, next: boolean) {
    setFormSections(
      currentForm.id,
      currentForm.sections.map((s) =>
        s.id === sectionId ? { ...s, enabled: next } : s,
      ),
    );
  }

  function setDateOptionCount(sectionId: string, next: number) {
    const clamped = Math.min(
      WAITLIST_DATE_OPTION_MAX,
      Math.max(WAITLIST_DATE_OPTION_MIN, next),
    );
    setFormSections(
      currentForm.id,
      currentForm.sections.map((s) =>
        s.id === sectionId ? { ...s, dateOptionCount: clamped } : s,
      ),
    );
  }

  function toggleField(fieldId: string, next: boolean) {
    const target = currentForm.fields.find((f) => f.id === fieldId);
    if (target?.locked && !next) return;
    setFormFields(
      currentForm.id,
      currentForm.fields.map((f) =>
        f.id === fieldId ? { ...f, enabled: next } : f,
      ),
    );
  }

  function removeField(fieldId: string) {
    setFormFields(
      currentForm.id,
      currentForm.fields.filter((f) => f.id !== fieldId),
    );
  }

  function addCustomField(e: React.FormEvent) {
    e.preventDefault();
    const label = newFieldLabel.trim();
    if (!label) return;
    const customSection = currentForm.sections.find(
      (s) => s.key === "custom_fields",
    );
    if (customSection && !customSection.enabled) {
      setFormSections(
        currentForm.id,
        currentForm.sections.map((s) =>
          s.id === customSection.id ? { ...s, enabled: true } : s,
        ),
      );
    }
    setFormFields(currentForm.id, [
      ...currentForm.fields,
      {
        id: uid("fld"),
        sectionKey: "custom_fields",
        label,
        enabled: true,
      },
    ]);
    setNewFieldLabel("");
  }

  function handleAudienceChange(next: "client" | "staff") {
    setAudience(next);
    if (next === "staff") {
      setShowInCalendarDescription(true);
    } else {
      setShowInCalendarDescription(false);
    }
  }

  function handleDeleteForm() {
    if (currentForm.isDraft) {
      deleteForm(currentForm.id);
      navigate("/dashboard/forms");
      return;
    }
    if (
      !window.confirm(
        `Delete "${currentForm.name}"? This cannot be undone.`,
      )
    ) {
      return;
    }
    deleteForm(currentForm.id);
    navigate("/dashboard/forms");
  }

  function fieldsInSection(sectionKey: string) {
    return currentForm.fields.filter((f) => f.sectionKey === sectionKey);
  }

  const customFields = fieldsInSection("custom_fields");

  return (
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Forms
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        {formName || form.name}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-karsa-muted">
        Turn sections and questions on or off, then preview on the right. When
        you save, this form can be used in Booking flow and paired with a
        confirmation message under Confirmations.
      </p>
      <p className="mt-4 rounded-md border border-karsa-accent/25 bg-karsa-accent-soft/40 px-3 py-2.5 text-sm leading-relaxed text-karsa-muted md:hidden">
        Form previews work on this screen, but they&apos;re easier to review on
        a desktop or tablet.
      </p>

      <div className="mt-8 space-y-6">
        {form.isDraft ? (
          <div className="rounded-md border border-karsa-warning/40 bg-karsa-warning/10 px-3 py-2 text-sm text-karsa-text">
            Unsaved — customize below, then Save form to add to your list.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
          <div className="min-w-0 space-y-6">
            <div className="border border-karsa-border-subtle p-4">
              <div className="space-y-6">
                <div>
                  <label className="text-xs text-karsa-faint">Form name</label>
                  <input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={inputClass}
                  />
                  <p className="mt-1 text-[11px] text-karsa-faint">
                    Shown in your Forms list, on the form itself, and on
                    appointments when this form is linked.
                  </p>
                </div>

                <div className="space-y-3">
                  <h2 className="text-sm font-medium text-karsa-text">
                    This form is for
                  </h2>
                  {templateKey === "booking" ? (
                    <>
                      <div className="rounded-md border border-karsa-accent/40 bg-karsa-accent-soft/40 px-3 py-2.5 text-xs leading-relaxed text-karsa-text">
                        <p className="font-medium text-karsa-accent-strong">
                          Booking form (client use only)
                        </p>
                        <p className="mt-1.5 text-karsa-muted">
                          This is the required Book Now form. It cannot be
                          switched to internal use. Contact and scheduling are
                          software-required; extras (reason for visit, custom
                          fields) appear as a list on appointment details.
                        </p>
                      </div>
                      <p className="text-xs text-karsa-faint">
                        Audience is locked to <strong>Client use</strong>.
                      </p>
                    </>
                  ) : templateKey === "waitlist" ? (
                    <>
                      <div className="rounded-md border border-karsa-accent/40 bg-karsa-accent-soft/40 px-3 py-2.5 text-xs leading-relaxed text-karsa-text">
                        <p className="font-medium text-karsa-accent-strong">
                          Waitlist form (public link)
                        </p>
                        <p className="mt-1.5 text-karsa-muted">
                          Clients reach this via the Waitlist link on your
                          booking form or{" "}
                          <code className="text-[11px]">
                            /book/[slug]/waitlist
                          </code>
                          . It is not added as a booking-flow step.
                        </p>
                      </div>
                      <p className="text-xs text-karsa-faint">
                        Audience is locked to <strong>Client use</strong>.
                      </p>
                    </>
                  ) : (
                    <>
                      <div
                        className="grid grid-cols-2 gap-2"
                        role="radiogroup"
                        aria-label="Form audience"
                      >
                        <button
                          type="button"
                          onClick={() => handleAudienceChange("client")}
                          className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                            audience === "client"
                              ? "bg-karsa-accent text-karsa-bg"
                              : "border border-karsa-border bg-karsa-surface text-karsa-muted hover:bg-karsa-surface-hover"
                          }`}
                        >
                          Client use
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAudienceChange("staff")}
                          className={`rounded-md px-3 py-2.5 text-sm transition-colors ${
                            audience === "staff"
                              ? "bg-karsa-accent text-karsa-bg"
                              : "border border-karsa-border bg-karsa-surface text-karsa-muted hover:bg-karsa-surface-hover"
                          }`}
                        >
                          Employee / internal
                        </button>
                      </div>
                      <div
                        className="grid grid-cols-1 gap-2"
                        role="radiogroup"
                        aria-label={
                          audience === "staff"
                            ? "Internal form type"
                            : "Client form type"
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setShowInCalendarDescription(true)}
                          className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            showInCalendarDescription
                              ? "bg-karsa-accent-soft text-karsa-accent-strong ring-1 ring-karsa-accent/40"
                              : "border border-karsa-border text-karsa-muted hover:bg-karsa-surface"
                          }`}
                        >
                          <span className="font-medium">
                            Link to appointment
                          </span>
                          <span className="mt-0.5 block text-xs opacity-80">
                            {audience === "staff"
                              ? "Staff open and fill from the appointment"
                              : "Shows on each appointment and the client profile"}
                          </span>
                          {audience === "client" ? (
                            <span className="mt-1 block text-xs opacity-80">
                              Appointment linked forms will be available to add
                              to your booking flow.
                            </span>
                          ) : null}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowInCalendarDescription(false)}
                          className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                            !showInCalendarDescription
                              ? "bg-karsa-accent-soft text-karsa-accent-strong ring-1 ring-karsa-accent/40"
                              : "border border-karsa-border text-karsa-muted hover:bg-karsa-surface"
                          }`}
                        >
                          <span className="font-medium">General use form</span>
                          <span className="mt-0.5 block text-xs opacity-80">
                            Fill in anytime from Forms — not tied to an
                            appointment in any way.
                          </span>
                        </button>
                      </div>
                    </>
                  )}
                  {audience === "client" &&
                  templateKey !== "booking" &&
                  !form.isDraft ? (
                    <p className="text-xs text-karsa-muted">
                      <Link
                        to={`/dashboard/forms/confirmations/${form.id}`}
                        className="font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
                      >
                        Customize this form&apos;s confirmation message
                      </Link>
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  {savedFlash ? (
                    <p className="text-sm text-karsa-accent-strong">Saved.</p>
                  ) : null}
                  <button type="button" onClick={save} className={btnPrimary}>
                    {form.isDraft ? "Save form" : "Save changes"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-karsa-border-subtle overflow-hidden">
              <div className="border-b border-karsa-border-subtle bg-karsa-surface px-4 py-2">
                <p className="text-xs font-medium tracking-wide text-karsa-faint uppercase">
                  Live preview
                </p>
                <p className="text-sm text-karsa-muted">
                  Try fields, explore the cream public layout — nothing is
                  submitted.
                </p>
              </div>
              <TemplateFormPreview
                form={{
                  ...form,
                  name: formName || form.name,
                  audience,
                  sections:
                    audience === "staff"
                      ? form.sections.map((s) =>
                          LEGAL_SECTION_KEYS.has(s.key)
                            ? { ...s, enabled: false }
                            : s,
                        )
                      : form.sections,
                }}
                formName={formName || form.name}
                businessName="Sample Studio"
                services={services}
                employees={employees}
                mode="sandbox"
              />
            </div>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-4 xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto">
            <section className="border border-karsa-border-subtle p-4">
              <h2 className="text-sm font-medium text-karsa-text">
                Form sections
              </h2>
              <p className="mt-1 text-xs text-karsa-faint">
                Toggle sections on or off. Locked sections are always included.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-karsa-muted">
                Shared fields autofill across forms on the same appointment when
                labels match (for example Reason for Visit). Client answers can
                fill client or internal forms; internal answers never fill client
                forms. Session Notes also autofill Treatment/Client, Date &amp;
                Time, and Appointment ID from the appointment.
              </p>
              {templateKey === "booking" ? (
                <p className="mt-2 text-xs leading-relaxed text-karsa-muted">
                  Body charts / problem areas are not available here because
                  booking extras are stored as a simple answer list on the
                  appointment. Use an Intake form for charts and longer
                  questionnaires. Consent, privacy, cancellation, and custom
                  policy blocks can be toggled on — edit their wording in
                  Settings → Business.
                </p>
              ) : (
                <p className="mt-2 text-xs leading-relaxed text-karsa-muted">
                  Consent, privacy, cancellation, and custom policy blocks use
                  the wording from Settings → Business. Toggle them on when you
                  want them on this form.
                </p>
              )}
              <ul className="mt-4 space-y-2">
                {visibleSections.map((section) => {
                  const on = section.enabled !== false;
                  const dateOptionCount =
                    section.key === "requested_times"
                      ? (section.dateOptionCount ?? 1)
                      : null;
                  return (
                    <li
                      key={section.id}
                      className="rounded-md border border-karsa-border-subtle px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm text-karsa-text">
                            {section.key === "contact" ||
                            section.key === "personal_information"
                              ? "Personal Information"
                              : section.label}
                            {section.key === "consent" ? (
                              <span className="font-normal text-karsa-faint">
                                {" "}
                                (include on booking or intake for legal reasons)
                              </span>
                            ) : null}
                          </p>
                          {section.key === "scheduling" ? (
                            <p className="mt-0.5 text-xs text-karsa-faint">
                              {section.description ??
                                "Location appears here only when you have more than one saved location — clients pick from those locations only."}
                            </p>
                          ) : null}
                          {section.uiOnly &&
                          !LEGAL_SECTION_KEYS.has(section.key) ? (
                            <p className="mt-0.5 text-xs text-karsa-faint">
                              Display-only block
                            </p>
                          ) : null}
                          {section.key === "consent" ? (
                            <p className="mt-0.5 text-xs text-karsa-faint">
                              Wording from Settings → Business. Shows message +
                              checkbox.
                            </p>
                          ) : null}
                          {section.key === "privacy_policy" ||
                          section.key === "cancellation_policy" ? (
                            <p className="mt-0.5 text-xs text-karsa-faint">
                              Wording from Settings → Business. Display-only
                              block with clickable policy links.
                            </p>
                          ) : null}
                          {section.key === "waitlist_cta" ? (
                            <p className="mt-0.5 text-xs text-karsa-faint">
                              Requires a saved Waitlist form and Waitlist
                              enabled in Settings → Business. Without both,
                              clients will not see this button.
                            </p>
                          ) : null}
                          {section.key === "requested_times" ? (
                            <p className="mt-0.5 text-xs text-karsa-faint">
                              How many preferred dates clients can submit (
                              {WAITLIST_DATE_OPTION_MIN}–
                              {WAITLIST_DATE_OPTION_MAX}).
                            </p>
                          ) : null}
                          {section.locked ? (
                            <p className="mt-0.5 text-xs text-karsa-accent-strong">
                              Always included
                            </p>
                          ) : null}
                          {section.key === "contact" ||
                          section.key === "personal_information" ? (
                            <div className="mt-2">
                              <p className="text-xs text-karsa-faint">
                                {templateKey === "booking"
                                  ? "Always on for this form — first name, last name, email, and phone."
                                  : "First name, last name, email, and phone. Autopopulated from the booking form when we already have this client."}
                              </p>
                              <ul className="mt-2 space-y-1">
                                {[
                                  "First Name",
                                  "Last Name",
                                  "Email Address",
                                  "Phone Number",
                                ].map((label) => (
                                  <li
                                    key={label}
                                    className="flex items-center justify-between gap-2 text-sm text-karsa-muted"
                                  >
                                    <span>{label}</span>
                                    <span className="text-[11px] text-karsa-accent-strong">
                                      Always on
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                        {section.locked ? (
                          <span className="shrink-0 text-xs text-karsa-accent-strong">
                            On
                          </span>
                        ) : (
                          <KarsaToggleSwitch
                            checked={on}
                            onChange={(next) =>
                              toggleSection(section.id, next)
                            }
                            ariaLabel={section.label}
                          />
                        )}
                      </div>
                      {dateOptionCount != null ? (
                        <div className="mt-2.5 flex items-center gap-3 border-t border-karsa-border-subtle pt-2.5">
                          <span className="text-xs text-karsa-muted">
                            Date options
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={
                                dateOptionCount <= WAITLIST_DATE_OPTION_MIN
                              }
                              onClick={() =>
                                setDateOptionCount(
                                  section.id,
                                  dateOptionCount - 1,
                                )
                              }
                              className="flex size-7 items-center justify-center rounded border border-karsa-border text-sm text-karsa-text hover:bg-karsa-surface disabled:opacity-40"
                              aria-label="Fewer date options"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm font-medium text-karsa-text">
                              {dateOptionCount}
                            </span>
                            <button
                              type="button"
                              disabled={
                                dateOptionCount >= WAITLIST_DATE_OPTION_MAX
                              }
                              onClick={() =>
                                setDateOptionCount(
                                  section.id,
                                  dateOptionCount + 1,
                                )
                              }
                              className="flex size-7 items-center justify-center rounded border border-karsa-border text-sm text-karsa-text hover:bg-karsa-surface disabled:opacity-40"
                              aria-label="More date options"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {(["health_information", "session"] as const).map(
                (sectionKey) => {
                  const sectionFields = fieldsInSection(sectionKey);
                  if (sectionFields.length === 0) return null;
                  const title =
                    sectionKey === "session"
                      ? "Session notes fields"
                      : "Health information";
                  return (
                    <div
                      key={sectionKey}
                      className="mt-4 rounded-md border border-karsa-border-subtle px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-karsa-text">
                        {title}
                      </p>
                      <p className="mt-0.5 text-xs text-karsa-faint">
                        {sectionKey === "session"
                          ? "Treatment/Client, Date & Time, and Appointment ID always stay on and autofill from the appointment. Digital Signature is filled by the practitioner — required on Session Notes, optional on other internal forms."
                          : "Toggle medical conditions and allergies individually. Reason for Visit is its own section above."}
                      </p>
                      <ul className="mt-3 space-y-2">
                        {sectionFields.map((field) => {
                          const on = field.enabled !== false;
                          const locked = Boolean(field.locked);
                          const autofills = fieldAutofillsFromAppointment(field);
                          const isSignature =
                            field.label.trim().toLowerCase() ===
                            "digital signature";
                          return (
                            <li
                              key={field.id}
                              className="rounded-md border border-karsa-border-subtle px-3 py-2"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm text-karsa-text">
                                    {field.label}
                                  </p>
                                  {locked ? (
                                    <p className="mt-0.5 text-xs text-karsa-accent-strong">
                                      Always included
                                      {autofills
                                        ? " · autofilled from the appointment"
                                        : isSignature
                                          ? " · signed by the practitioner"
                                          : ""}
                                    </p>
                                  ) : isSignature ? (
                                    <p className="mt-0.5 text-xs text-karsa-faint">
                                      Optional — filled by the practitioner
                                    </p>
                                  ) : field.label
                                      .toLowerCase()
                                      .includes("reason for visit") ? (
                                    <p className="mt-0.5 text-xs text-karsa-faint">
                                      Autofills from matching Reason for Visit
                                      answers on this appointment
                                    </p>
                                  ) : null}
                                </div>
                                {!locked ? (
                                  <KarsaToggleSwitch
                                    checked={on}
                                    onChange={(next) =>
                                      toggleField(field.id, next)
                                    }
                                    ariaLabel={field.label}
                                  />
                                ) : (
                                  <span className="shrink-0 text-xs text-karsa-accent-strong">
                                    On
                                  </span>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                },
              )}
            </section>

            <form
              onSubmit={addCustomField}
              className="space-y-3 border border-karsa-border-subtle p-4"
            >
              <h2 className="text-sm font-medium text-karsa-text">
                Add custom field
              </h2>
              <div>
                <label className="text-xs text-karsa-faint">Field label</label>
                <input
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <button type="submit" className={btnSecondary}>
                Add field
              </button>
            </form>

            {customFields.length > 0 ? (
              <section className="border border-karsa-border-subtle p-4">
                <h2 className="text-sm font-medium text-karsa-text">
                  Custom fields
                </h2>
                <p className="mt-1 text-xs text-karsa-faint">
                  Each field has its own on/off switch — there is no blanket
                  custom fields toggle.
                </p>
                <ul className="mt-3 space-y-2">
                  {customFields.map((field) => {
                    const on = field.enabled !== false;
                    return (
                      <li
                        key={field.id}
                        className="rounded-md border border-karsa-border-subtle px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm text-karsa-text">
                              {field.label}
                            </p>
                            <button
                              type="button"
                              className="mt-0.5 text-xs text-karsa-danger hover:underline"
                              onClick={() => removeField(field.id)}
                            >
                              Remove
                            </button>
                          </div>
                          <KarsaToggleSwitch
                            checked={on}
                            onChange={(next) => toggleField(field.id, next)}
                            ariaLabel={field.label}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ) : null}

            <div className="border border-karsa-border-subtle p-4">
              <button
                type="button"
                onClick={handleDeleteForm}
                className="rounded-md text-sm text-karsa-danger hover:underline"
              >
                {form.isDraft ? "Cancel" : "Delete form"}
              </button>
            </div>
          </aside>
        </div>

        <button type="button" onClick={save} className={`${btnPrimary} mt-2`}>
          {form.isDraft ? "Save form" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
