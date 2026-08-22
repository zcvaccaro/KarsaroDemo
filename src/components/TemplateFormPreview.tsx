import { useState } from "react";
import type { DemoForm, Employee, FormField, Service } from "../lib/store";
import { DateInput } from "./inputs/DateInput";
import { KarsaSelect } from "./inputs/KarsaSelect";

const inputClass =
  "mt-1 w-full rounded border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 shadow-sm outline-none ring-stone-400/30 focus:ring-2 disabled:bg-stone-50 disabled:text-stone-500";
const labelClass = "block text-sm font-medium text-stone-700";
const legendClass = "px-1 text-base font-semibold text-stone-800";

const DEFAULT_CONSENT =
  "By checking this box, I consent to receiving services from this business and confirm that the information I provide is accurate to the best of my knowledge. I understand that the business’s appointment policies (including cancellation or no-show fees, if applicable) may apply.\n\nThis is a general template provided by Karsaro. Customize it for your practice and local requirements.";

const DEFAULT_PRIVACY =
  "Privacy Policy (template)\n\nThis business collects personal information you provide—such as your name, contact details, and any health-related information needed to deliver services—to schedule appointments, provide care, and communicate with you about your visits.\n\nYour information is used for business operations related to your services. It is not sold to third parties. Access is limited to authorized staff who need it to do their jobs.\n\nYou may request access to or correction of your personal information by contacting the business directly.\n\nThis is a general, non-specific template provided by Karsaro. Please customize or replace it to match your legal and professional requirements.";

const DEFAULT_CANCELLATION =
  "Cancellation policy (template)\n\nPlease cancel or reschedule at least 24 hours before your appointment. Late cancellations or missed appointments may be subject to a fee at the business’s discretion.\n\nContact the business as soon as possible if you need to change your appointment.\n\nThis is a general template provided by Karsaro. Customize it for your practice.";

const SAMPLE_SLOTS = [
  { value: "slot-1000", label: "10:00 AM" },
  { value: "slot-1130", label: "11:30 AM" },
  { value: "slot-1400", label: "2:00 PM" },
  { value: "slot-1530", label: "3:30 PM" },
];

function isSectionEnabled(key: string, form: DemoForm) {
  const section = form.sections.find((s) => s.key === key);
  return section?.enabled !== false && Boolean(section);
}

function fieldsForSection(sectionKey: string, form: DemoForm) {
  return form.fields.filter(
    (f) => f.sectionKey === sectionKey && f.enabled !== false,
  );
}

function waitlistDateOptionLabel(idx: number, count: number) {
  if (count <= 1) return "Preferred date";
  if (idx === 0) return "1st choice date";
  if (idx === 1) return "2nd choice date";
  return "3rd choice date";
}

function waitlistTimesLegend(count: number) {
  if (count <= 1) return "Preferred appointment time";
  return `Preferred appointment times (${count} options)`;
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const label = field.label;
  const lower = label.toLowerCase();
  const asTextarea =
    lower.includes("reason") ||
    lower.includes("note") ||
    lower.includes("condition") ||
    lower.includes("allerg") ||
    lower.includes("complaint") ||
    lower.includes("assessment") ||
    lower.includes("plan") ||
    lower.includes("reassess") ||
    lower.includes("treatment") ||
    lower.includes("signature");

  if (lower.includes("date of birth") || lower === "dob") {
    return (
      <div className="form-group">
        <label className={labelClass}>{label}</label>
        <DateInput
          variant="light"
          value={value}
          onChange={onChange}
          className={inputClass}
        />
      </div>
    );
  }

  if (asTextarea) {
    return (
      <div className="form-group">
        <label className={labelClass}>{label}</label>
        <textarea
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={label}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div className="form-group">
      <label className={labelClass}>{label}</label>
      <input
        type={
          lower.includes("email")
            ? "email"
            : lower.includes("phone")
              ? "tel"
              : "text"
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          lower.includes("phone") ? "(555) 123-4567" : `Enter ${label.toLowerCase()}`
        }
        className={inputClass}
      />
    </div>
  );
}

function ContactBlock({
  values,
  onChange,
}: {
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <>
      <div className="form-row grid gap-4 sm:grid-cols-2">
        <div className="form-group">
          <label className={labelClass}>First Name</label>
          <input
            value={values.firstName ?? ""}
            onChange={(e) => onChange("firstName", e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="form-group">
          <label className={labelClass}>Last Name</label>
          <input
            value={values.lastName ?? ""}
            onChange={(e) => onChange("lastName", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div className="form-group">
        <label className={labelClass}>Email Address</label>
        <input
          type="email"
          value={values.email ?? ""}
          onChange={(e) => onChange("email", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="form-group">
        <label className={labelClass}>Phone Number</label>
        <input
          type="tel"
          placeholder="(555) 123-4567"
          value={values.phone ?? ""}
          onChange={(e) => onChange("phone", e.target.value)}
          className={inputClass}
        />
      </div>
    </>
  );
}

function SchedulingBlock({
  services,
  employees,
  includeDateTime,
  values,
  onChange,
}: {
  services: Service[];
  employees: Employee[];
  includeDateTime: boolean;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const serviceOptions =
    services.length > 0
      ? services.map((s) => ({
          value: s.id,
          label: `${s.name} · ${s.durationMin}m`,
        }))
      : [
          { value: "1", label: "Deep Tissue · 60m" },
          { value: "2", label: "Swedish · 60m" },
        ];
  const employeeOptions = [
    { value: "any", label: "Any available" },
    ...(employees.length > 0
      ? employees.map((e) => ({ value: e.id, label: e.name }))
      : [{ value: "alex", label: "Alex Rivera" }]),
  ];
  const serviceId = values.serviceId || serviceOptions[0]?.value || "";
  const employeeId = values.employeeId || employeeOptions[0]?.value || "";
  const slotId = values.slotId || SAMPLE_SLOTS[0]?.value || "";

  return (
    <>
      <div className="form-group">
        <label className={labelClass}>Service</label>
        <KarsaSelect
          variant="public"
          value={serviceId}
          onChange={(next) => onChange("serviceId", next)}
          className={inputClass}
          options={serviceOptions}
        />
      </div>
      <div className="form-group">
        <label className={labelClass}>Practitioner</label>
        <KarsaSelect
          variant="public"
          value={employeeId}
          onChange={(next) => onChange("employeeId", next)}
          className={inputClass}
          options={employeeOptions}
        />
      </div>
      {includeDateTime ? (
        <div className="form-row grid gap-4 sm:grid-cols-2">
          <div className="form-group">
            <label className={labelClass}>Date</label>
            <DateInput
              variant="light"
              value={values.date ?? ""}
              onChange={(next) => onChange("date", next)}
              className={inputClass}
            />
          </div>
          <div className="form-group">
            <label className={labelClass}>Available Times</label>
            <KarsaSelect
              variant="public"
              value={slotId}
              onChange={(next) => onChange("slotId", next)}
              className={inputClass}
              options={SAMPLE_SLOTS}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

type Props = {
  form: DemoForm;
  formName?: string;
  businessName?: string;
  services?: Service[];
  employees?: Employee[];
  mode?: "preview" | "sandbox";
  className?: string;
};

export function TemplateFormPreview({
  form,
  formName,
  businessName = "Sample Studio",
  services = [],
  employees = [],
  mode = "sandbox",
  className,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>({});
  const title = formName || form.name;
  const interactive = mode === "sandbox";

  function set(key: string, value: string) {
    if (!interactive) return;
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function renderFields(sectionKey: string) {
    return fieldsForSection(sectionKey, form).map((field) => (
      <FieldInput
        key={field.id}
        field={field}
        value={values[field.id] ?? ""}
        onChange={(v) => set(field.id, v)}
      />
    ));
  }

  const requestedTimesSection = form.sections.find(
    (s) => s.key === "requested_times",
  );
  const dateOptionCount = requestedTimesSection?.dateOptionCount ?? 2;

  const showContact = isSectionEnabled("contact", form);
  const showPersonal = isSectionEnabled("personal_information", form);
  const showNameEmailPhone =
    !showContact &&
    (isSectionEnabled("name", form) ||
      isSectionEnabled("email", form) ||
      isSectionEnabled("phone", form));

  return (
    <div
      className={[
        "public-form-shell rounded-md bg-[#f7f4ef] px-4 py-8 text-stone-900 sm:px-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <section className="reservation-section mx-auto max-w-2xl">
        <div className="mb-6">
          <p className="text-sm font-medium tracking-wide text-stone-600">
            {businessName}
          </p>
        </div>
        <h2 className="font-display text-3xl text-stone-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          Try fields below — nothing is submitted in this demo.
        </p>

        <div className="reservation-form mt-8 space-y-2">
          {showContact ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Contact information</legend>
              <ContactBlock values={values} onChange={set} />
            </fieldset>
          ) : null}

          {showNameEmailPhone ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Contact information</legend>
              {isSectionEnabled("name", form) ? (
                <div className="form-row grid gap-4 sm:grid-cols-2">
                  {renderFields("name")}
                </div>
              ) : null}
              {isSectionEnabled("email", form) ||
              isSectionEnabled("phone", form) ? (
                <div
                  className={`form-row grid gap-4 ${
                    isSectionEnabled("name", form) ? "mt-4" : ""
                  } ${
                    isSectionEnabled("email", form) &&
                    isSectionEnabled("phone", form)
                      ? "sm:grid-cols-2"
                      : ""
                  }`}
                >
                  {isSectionEnabled("email", form)
                    ? renderFields("email")
                    : null}
                  {isSectionEnabled("phone", form)
                    ? renderFields("phone")
                    : null}
                </div>
              ) : null}
            </fieldset>
          ) : null}

          {showPersonal ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Personal Information</legend>
              <ContactBlock values={values} onChange={set} />
            </fieldset>
          ) : null}

          {isSectionEnabled("dob", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Date of Birth</legend>
              {fieldsForSection("dob", form).length > 0 ? (
                renderFields("dob")
              ) : (
                <div className="form-group">
                  <label className={labelClass}>Date of Birth</label>
                  <DateInput
                    variant="light"
                    value={values.dob ?? ""}
                    onChange={(v) => set("dob", v)}
                    className={inputClass}
                  />
                </div>
              )}
            </fieldset>
          ) : null}

          {isSectionEnabled("address", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Address</legend>
              {fieldsForSection("address", form).length > 0 ? (
                renderFields("address")
              ) : (
                <div className="form-group">
                  <label className={labelClass}>Address</label>
                  <input
                    value={values.address ?? ""}
                    onChange={(e) => set("address", e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </fieldset>
          ) : null}

          {isSectionEnabled("occupation", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Occupation</legend>
              {fieldsForSection("occupation", form).length > 0 ? (
                renderFields("occupation")
              ) : (
                <div className="form-group">
                  <label className={labelClass}>Occupation</label>
                  <input
                    value={values.occupation ?? ""}
                    onChange={(e) => set("occupation", e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </fieldset>
          ) : null}

          {isSectionEnabled("treatment_notes", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Reason for Visit</legend>
              {fieldsForSection("treatment_notes", form).length > 0 ? (
                renderFields("treatment_notes")
              ) : (
                <div className="form-group">
                  <label className={labelClass}>Reason for Visit</label>
                  <textarea
                    rows={4}
                    value={values.treatmentNotes ?? ""}
                    onChange={(e) => set("treatmentNotes", e.target.value)}
                    placeholder="What brings you in today?"
                    className={inputClass}
                  />
                </div>
              )}
            </fieldset>
          ) : null}

          {isSectionEnabled("scheduling", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Service & appointment time</legend>
              <SchedulingBlock
                services={services}
                employees={employees}
                includeDateTime
                values={values}
                onChange={set}
              />
            </fieldset>
          ) : null}

          {isSectionEnabled("service_selection", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Service selection</legend>
              <SchedulingBlock
                services={services}
                employees={employees}
                includeDateTime={false}
                values={values}
                onChange={set}
              />
            </fieldset>
          ) : null}

          {isSectionEnabled("waitlist_cta", form) ? (
            <div className="form-group my-6 text-center">
              <p className="mb-2 text-sm text-stone-600">
                Don&apos;t see the date or time you&apos;re looking for?
              </p>
              <button
                type="button"
                className="text-sm font-medium text-stone-900 underline underline-offset-4 transition-colors hover:text-stone-700"
              >
                Join the waitlist
              </button>
            </div>
          ) : null}

          {isSectionEnabled("health_information", form) &&
          fieldsForSection("health_information", form).length > 0 ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Health Information</legend>
              <div className="space-y-4">
                {renderFields("health_information")}
              </div>
            </fieldset>
          ) : null}

          {isSectionEnabled("problem_areas", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Problem Areas</legend>
              <p className="text-sm text-stone-600">
                Circle areas on the diagrams where you feel discomfort or pain.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex h-36 items-center justify-center rounded border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
                  Body chart (preview) — Front
                </div>
                <div className="flex h-36 items-center justify-center rounded border border-dashed border-stone-300 bg-stone-50 text-sm text-stone-500">
                  Body chart (preview) — Back
                </div>
              </div>
            </fieldset>
          ) : null}

          {isSectionEnabled("requested_times", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>
                {waitlistTimesLegend(dateOptionCount)}
              </legend>
              {Array.from({ length: dateOptionCount }, (_, idx) => (
                <div
                  key={idx}
                  className="form-row mb-4 grid gap-4 sm:grid-cols-2"
                >
                  <div className="form-group">
                    <label className={labelClass}>
                      {waitlistDateOptionLabel(idx, dateOptionCount)}
                    </label>
                    <DateInput
                      variant="light"
                      value={values[`date_${idx + 1}`] ?? ""}
                      onChange={(next) => set(`date_${idx + 1}`, next)}
                      className={inputClass}
                    />
                  </div>
                  <div className="form-group">
                    <label className={labelClass}>Preferred time</label>
                    <KarsaSelect
                      variant="public"
                      value={values[`time_${idx + 1}`] ?? SAMPLE_SLOTS[0].value}
                      onChange={(next) => set(`time_${idx + 1}`, next)}
                      className={inputClass}
                      options={SAMPLE_SLOTS}
                    />
                  </div>
                </div>
              ))}
            </fieldset>
          ) : null}

          {fieldsForSection("custom_fields", form).length > 0 ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Custom fields</legend>
              <div className="space-y-4">{renderFields("custom_fields")}</div>
            </fieldset>
          ) : null}

          {isSectionEnabled("session", form) &&
          fieldsForSection("session", form).length > 0 ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Session notes</legend>
              <div className="space-y-4">{renderFields("session")}</div>
            </fieldset>
          ) : null}

          {isSectionEnabled("consent", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Consent</legend>
              <div className="terms-box max-h-48 overflow-y-auto rounded border border-stone-200 bg-stone-50 p-4 text-sm whitespace-pre-wrap text-stone-900">
                {DEFAULT_CONSENT}
              </div>
              <label className="mt-4 flex items-start gap-3 text-sm text-stone-900">
                <input
                  type="checkbox"
                  checked={values.consent === "true"}
                  onChange={(e) =>
                    set("consent", e.target.checked ? "true" : "false")
                  }
                  className="mt-1 size-4 rounded border-stone-300"
                />
                <span>
                  <strong>I agree</strong> to the consent terms above.
                </span>
              </label>
            </fieldset>
          ) : null}

          {isSectionEnabled("privacy_policy", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Privacy policy</legend>
              <div className="terms-box max-h-56 overflow-y-auto rounded border border-stone-200 bg-stone-50 p-4 text-sm whitespace-pre-wrap text-stone-900">
                {DEFAULT_PRIVACY}
              </div>
            </fieldset>
          ) : null}

          {isSectionEnabled("cancellation_policy", form) ? (
            <fieldset className="mt-6 rounded-lg border border-stone-200 bg-white/60 p-4">
              <legend className={legendClass}>Cancellation policy</legend>
              <div className="terms-box max-h-56 overflow-y-auto rounded border border-stone-200 bg-stone-50 p-4 text-sm whitespace-pre-wrap text-stone-900">
                {DEFAULT_CANCELLATION}
              </div>
            </fieldset>
          ) : null}

          {mode === "sandbox" ? (
            <div className="mt-8">
              <button
                type="button"
                className="rounded-md bg-stone-900 px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Submit
              </button>
            </div>
          ) : (
            <div className="mt-8">
              <span className="inline-block rounded-md bg-stone-900 px-6 py-3 text-sm font-medium text-white opacity-80">
                Submit
              </span>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
