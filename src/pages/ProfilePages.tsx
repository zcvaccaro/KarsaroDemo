import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ConfirmationEditor } from "../components/ConfirmationEditor";
import { HmTimeSelect } from "../components/inputs/HmTimeSelect";
import {
  clientDisplayName,
  formatClock,
  formatServiceOptionLabel,
  setEmployeeAvailability,
  setEmployeeServices,
  todayISO,
  updateClient,
  type EmployeeAvailability,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function shortDate(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function UnavailableEdge({
  selected,
  onToggle,
}: {
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={`flex min-h-[4.75rem] w-[6.5rem] shrink-0 items-center justify-center rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-karsa-accent/40 ${
        selected
          ? "border-[#a86f45] bg-[#a86f45] text-[#f7f1ea] hover:border-[#9a643c] hover:bg-[#9a643c]"
          : "border-karsa-border bg-karsa-bg text-karsa-muted hover:border-karsa-accent hover:bg-karsa-accent-soft hover:text-karsa-accent-strong"
      }`}
    >
      Unavailable
    </button>
  );
}

export function ClientProfilePage() {
  const { clientId } = useParams();
  const { clients, appointments, services, forms } = useDemoStore();
  const client = clients.find((c) => c.id === clientId);
  const today = todayISO();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!client) return;
    setFirstName(client.firstName);
    setLastName(client.lastName);
    setEmail(client.email);
    setPhone(client.phone);
    setDateOfBirth(client.dateOfBirth ?? "");
    setNotes(client.notes ?? "");
    setSaved(false);
  }, [client]);

  if (!client) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-karsa-danger">Client not found.</p>
        <Link
          to="/dashboard/clients"
          className="mt-4 inline-block text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          ← Clients
        </Link>
      </div>
    );
  }

  const appts = [...appointments]
    .filter((a) => a.clientId === client.id)
    .sort((a, b) =>
      a.date === b.date ? b.startMin - a.startMin : b.date.localeCompare(a.date),
    );
  const linkedForms = forms.filter(
    (f) => f.showInCalendarDescription && !f.isDraft && f.active,
  );

  const inputClass =
    "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";
  const labelClass = "text-xs text-karsa-faint";

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/dashboard/clients"
        className="text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
      >
        ← Clients
      </Link>
      <p className="mt-6 text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Client history
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-karsa-text">
            {clientDisplayName(client)}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
            {client.email || "No email"}
            {client.phone ? ` · ${client.phone}` : ""}
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-karsa-muted">
            Contact details and visit history for this person. Book them again
            from here; new appointments also show on the Calendar.
          </p>
        </div>
        <Link
          to={`/dashboard/bookings/new?clientId=${client.id}`}
          className="shrink-0 rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg transition-colors hover:bg-karsa-accent-strong"
        >
          Make a booking for this client
        </Link>
      </div>

      <section className="mt-8 border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Profile</h2>
        <p className="mt-1 text-xs text-karsa-faint">
          Profile data comes from booking. You can fill in missing details here.
        </p>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateClient(client.id, {
              firstName: firstName.trim() || client.firstName,
              lastName: lastName.trim() || client.lastName,
              email: email.trim(),
              phone: phone.trim(),
              dateOfBirth: dateOfBirth.trim() || null,
              notes: notes.trim() || null,
            });
            setSaved(true);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              First name
              <input
                required
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Last name
              <input
                required
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Phone
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Date of birth
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </label>
            <label className={`${labelClass} sm:col-span-2`}>
              Notes
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setSaved(false);
                }}
                className={inputClass}
              />
            </label>
          </div>
          {saved ? (
            <p className="text-sm text-karsa-accent-strong">Client updated.</p>
          ) : null}
          <button
            type="submit"
            className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
          >
            Save changes
          </button>
        </form>
      </section>

      {appts.length === 0 ? (
        <section className="mt-8 mb-12 border border-dashed border-karsa-border-subtle p-6">
          <h2 className="text-sm font-medium text-karsa-text">
            Appointments × linked forms
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-karsa-muted">
            In the live app this profile becomes a grid: one Appointments column
            (details pulled from the booking form) plus a column for each
            appointment-linked form. Staff see Submitted / Not started per visit
            and can open Client Intake, Session Notes, and other linked forms
            without leaving the profile.
          </p>
          <p className="mt-3 text-sm text-karsa-faint">
            None yet — book this client to populate the matrix.
          </p>
          {linkedForms.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {linkedForms.map((f) => (
                <li
                  key={f.id}
                  className="rounded-md border border-karsa-border-subtle px-3 py-1.5 text-xs text-karsa-muted"
                >
                  {f.name}
                  <span className="text-karsa-faint">
                    {" "}
                    · {f.audience === "staff" ? "Internal" : "Client"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : (
        <section
          className="mt-8 mb-12 grid gap-6"
          style={{
            gridTemplateColumns:
              1 + linkedForms.length <= 1
                ? "minmax(0, 1fr)"
                : `repeat(auto-fit, minmax(11rem, 1fr))`,
          }}
        >
          <div>
            <h2 className="text-sm font-medium text-karsa-text">Appointments</h2>
            <p className="mt-1 text-[11px] text-karsa-faint">
              Details pulled from booking form
            </p>
            <ul className="mt-4 space-y-2">
              {appts.map((a) => {
                const svc = services.find((s) => s.id === a.serviceId);
                return (
                  <li
                    key={a.id}
                    className="border border-karsa-border-subtle px-3 py-2 text-sm"
                  >
                    <span className="text-karsa-text">
                      {shortDate(a.date)}
                      {svc ? ` · ${svc.name}` : ""}
                    </span>
                    <span className="mt-0.5 block text-xs text-karsa-muted">
                      {formatClock(a.startMin)}
                      {a.date >= today ? " · upcoming" : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {linkedForms.map((form) => (
            <div key={form.id}>
              <h2 className="text-sm font-medium text-karsa-text">{form.name}</h2>
              <p className="mt-1 text-[11px] text-karsa-faint">
                {form.audience === "staff" ? "Internal" : "Client"} · per
                appointment
              </p>
              <p className="mt-4 text-sm leading-relaxed text-karsa-muted">
                In the live app each linked form shows Submitted / Not started
                per appointment so you can fill Client Intake and other forms
                from the profile.
              </p>
              <ul className="mt-3 space-y-2">
                {appts.map((a) => (
                  <li
                    key={`${a.id}:${form.id}`}
                    className="flex items-center gap-2 border border-karsa-border-subtle px-3 py-2 text-sm"
                  >
                    <span className="text-karsa-warning">○</span>
                    <span className="min-w-0">
                      <span className="block truncate text-karsa-text">
                        {shortDate(a.date)}
                      </span>
                      <span className="mt-0.5 block text-xs text-karsa-muted">
                        Not started (demo)
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

export function EmployeeProfilePage() {
  const { id } = useParams();
  const { employees, services, locations, appointments } = useDemoStore();
  const employee = employees.find((e) => e.id === id);

  const [availability, setAvailability] = useState<EmployeeAvailability[]>([]);
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [servicesSaved, setServicesSaved] = useState(false);

  useEffect(() => {
    if (!employee) return;
    setAvailability(employee.availability.map((row) => ({ ...row })));
    setServiceIds([...employee.serviceIds]);
    setHoursSaved(false);
    setServicesSaved(false);
  }, [employee]);

  const activeServices = useMemo(
    () => services.filter((s) => s.active),
    [services],
  );

  if (!employee) {
    return (
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-karsa-danger">Employee not found.</p>
        <Link
          to="/dashboard/employees"
          className="mt-4 inline-block text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          ← Employees
        </Link>
      </div>
    );
  }

  const appts = appointments.filter((a) => a.employeeId === employee.id);
  const inputClass =
    "rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2 disabled:opacity-50";

  function updateDay(
    dayOfWeek: number,
    patch: Partial<EmployeeAvailability>,
  ) {
    setAvailability((prev) =>
      prev.map((row) =>
        row.dayOfWeek === dayOfWeek ? { ...row, ...patch } : row,
      ),
    );
    setHoursSaved(false);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/dashboard/employees"
        className="text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
      >
        ← Employees
      </Link>
      <p className="mt-6 text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        People · Employee
      </p>
      <div className="mt-2 flex items-center gap-3">
        <span
          className="size-4 rounded-full"
          style={{ background: employee.color }}
        />
        <h1 className="font-display text-3xl tracking-tight text-karsa-text">
          {employee.name}
        </h1>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-karsa-muted">
        Who this staff member is, which services they can do, and their hours.
        They appear by name on the Calendar when you book or filter the
        schedule.
      </p>

      <section className="mt-8 border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Profile</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs text-karsa-faint">
            Display name
            <input
              readOnly
              value={employee.name}
              className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text"
            />
          </label>
          <label className="text-xs text-karsa-faint">
            Role
            <input
              readOnly
              value="Practitioner"
              className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text"
            />
          </label>
        </div>
      </section>

      <section className="mt-8 border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Weekly hours</h2>
        <p className="mt-1 text-xs text-karsa-faint">
          Practitioner hours for booking — independent of location open hours in
          this demo.
        </p>
        <div className="mt-4 space-y-2">
          {availability.map((day) => (
            <div
              key={day.dayOfWeek}
              className="flex flex-wrap items-stretch gap-3 rounded-md border border-karsa-border-subtle p-2 sm:p-3"
            >
              <UnavailableEdge
                selected={day.unavailable}
                onToggle={() =>
                  updateDay(day.dayOfWeek, {
                    unavailable: !day.unavailable,
                  })
                }
              />
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
                <p className="text-sm font-medium text-karsa-text">
                  {DAY_LABELS[day.dayOfWeek]}
                </p>
                {day.unavailable ? (
                  <p className="text-xs text-karsa-faint">Not available</p>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <HmTimeSelect
                      value={day.startTime}
                      onChange={(v) =>
                        updateDay(day.dayOfWeek, { startTime: v })
                      }
                      aria-label={`${DAY_LABELS[day.dayOfWeek]} start`}
                      className={inputClass}
                    />
                    <span className="text-xs text-karsa-faint">to</span>
                    <HmTimeSelect
                      value={day.endTime}
                      onChange={(v) =>
                        updateDay(day.dayOfWeek, { endTime: v })
                      }
                      aria-label={`${DAY_LABELS[day.dayOfWeek]} end`}
                      className={inputClass}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {hoursSaved ? (
          <p className="mt-3 text-sm text-karsa-accent-strong">
            Weekly hours saved.
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
          onClick={() => {
            setEmployeeAvailability(employee.id, availability);
            setHoursSaved(true);
          }}
        >
          Save weekly hours
        </button>
      </section>

      <section className="mt-8 border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">
          Services provided
        </h2>
        <p className="mt-1 text-xs text-karsa-faint">
          Checked services appear when booking this practitioner.
        </p>
        <div className="mt-3 space-y-2">
          {activeServices.map((s) => (
            <label
              key={s.id}
              className="flex items-center justify-between gap-3 border border-karsa-border-subtle px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-karsa-muted">
                <input
                  type="checkbox"
                  checked={serviceIds.includes(s.id)}
                  onChange={(e) => {
                    setServiceIds((prev) =>
                      e.target.checked
                        ? [...prev, s.id]
                        : prev.filter((id) => id !== s.id),
                    );
                    setServicesSaved(false);
                  }}
                />
                <span className="text-karsa-text">{s.name}</span>
              </span>
              <span className="text-xs text-karsa-muted">
                {s.options?.[0]
                  ? formatServiceOptionLabel(s.options[0])
                  : `${s.durationMin}m · $${s.price}`}
              </span>
            </label>
          ))}
          {activeServices.length === 0 ? (
            <p className="text-sm text-karsa-faint">No active services.</p>
          ) : null}
        </div>
        {servicesSaved ? (
          <p className="mt-3 text-sm text-karsa-accent-strong">
            Services saved.
          </p>
        ) : null}
        <button
          type="button"
          className="mt-4 rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
          onClick={() => {
            setEmployeeServices(employee.id, serviceIds);
            setServicesSaved(true);
          }}
        >
          Save services
        </button>
      </section>

      <section className="mt-8 border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Locations</h2>
        <p className="mt-1 text-xs text-karsa-faint">Read-only in this demo.</p>
        <ul className="mt-3 space-y-2">
          {locations.map((loc) => (
            <li
              key={loc.id}
              className="border border-karsa-border-subtle px-3 py-2 text-sm text-karsa-text"
            >
              {loc.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-medium text-karsa-text">
          Upcoming on calendar
        </h2>
        <p className="mt-1 text-xs text-karsa-faint">
          {appts.length} appointment{appts.length === 1 ? "" : "s"} in the demo
          store.
        </p>
        <Link
          to={`/dashboard/calendar?employeeId=${employee.id}`}
          className="mt-3 inline-block text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          Open calendar filtered to {employee.name} →
        </Link>
      </section>
    </div>
  );
}

export function WaitlistDetailPage() {
  const { id } = useParams();
  const { waitlistEntries, clients, services, employees } = useDemoStore();
  const entry = waitlistEntries.find((e) => e.id === id);

  if (!entry) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-karsa-danger">Waitlist entry not found.</p>
        <Link
          to="/dashboard/waitlist"
          className="mt-4 inline-block text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          ← Waitlist
        </Link>
      </div>
    );
  }

  const client = clients.find((c) => c.id === entry.clientId);
  const service = services.find((s) => s.id === entry.serviceId);
  const employee = employees[0];

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/dashboard/waitlist"
        className="text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
      >
        ← Waitlist
      </Link>
      <p className="mt-6 text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Schedule · Waitlist
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        {client ? clientDisplayName(client) : "Client"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-karsa-muted">
        {service?.name ?? "Any service"} · Status:{" "}
        <span className="capitalize text-karsa-accent-strong">
          {entry.status}
        </span>
        . Prefer a date below, then book them into a real slot with Book Now —
        that fills the Calendar.
      </p>

      <section className="mt-8 border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Preferred dates</h2>
        <p className="mt-3 text-sm text-karsa-text">
          {entry.preferredDate1
            ? shortDate(entry.preferredDate1)
            : "No date specified"}
        </p>
        <p className="mt-2 text-xs text-karsa-faint">
          Preferred practitioner (sample): {employee?.name ?? "Any"}
        </p>
      </section>

      <section className="mt-6 flex flex-wrap gap-3">
        <Link
          to={`/dashboard/bookings/new?clientId=${entry.clientId}`}
          className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
        >
          Book this client
        </Link>
        <Link
          to={`/dashboard/calendar?view=day&date=${entry.preferredDate1 ?? todayISO()}`}
          className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
        >
          View preferred day on calendar
        </Link>
        <Link
          to={`/dashboard/clients/${entry.clientId}`}
          className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
        >
          Open client profile
        </Link>
      </section>
    </div>
  );
}

export function ConfirmationEditorPage() {
  const { formId } = useParams();
  const { forms } = useDemoStore();
  const form = forms.find((f) => f.id === formId);

  if (!form) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-karsa-danger">Form not found.</p>
        <Link
          to="/dashboard/forms/confirmations"
          className="mt-4 inline-block text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          ← Confirmations
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/dashboard/forms/confirmations"
        className="text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
      >
        ← Confirmations
      </Link>
      <p className="mt-6 text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Forms · Confirmations
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        {form.name} Confirmation
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        Edit the thank-you message for{" "}
        <span className="text-karsa-text">{form.name}</span>. This text shows
        after that form is finished in Book Now when Booking flow includes it.
      </p>

      <ConfirmationEditor formId={form.id} formName={form.name} />
    </div>
  );
}
