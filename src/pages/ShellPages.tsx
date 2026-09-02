import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BillingPlans } from "../components/BillingPlans";
import { FullVersionNote } from "../components/FullVersionNote";
import { EntityOpenButton } from "../components/EntityModals";
import { PageLink } from "../components/PageLink";
import { DateInput } from "../components/inputs/DateInput";
import { HmTimeSelect } from "../components/inputs/HmTimeSelect";
import { KarsaSelect } from "../components/inputs/KarsaSelect";
import { KarsaToggleField } from "../components/karsa-toggle-switch";
import { MetricsClient } from "../components/MetricsClient";
import { rangeBounds } from "../lib/insights-range";
import { getServiceColor } from "../lib/service-colors";
import {
  appointmentStatus,
  clientDisplayName,
  confirmationPageTitle,
  isBookableEmployee,
  todayISO,
  upsertAppointment,
  upsertClient,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

function PageChrome({
  eyebrow,
  title,
  blurb,
  maxWidth = "max-w-4xl",
  children,
}: {
  eyebrow: string;
  title: string;
  blurb: React.ReactNode;
  maxWidth?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`mx-auto ${maxWidth}`}>
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-relaxed text-karsa-muted">
        {blurb}
      </p>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

/** Optional small slot for a future Loom/mp4 — keep out of the way. */
function VideoSlot({ label }: { label: string }) {
  return (
    <p className="text-[11px] text-karsa-faint">
      Optional walkthrough: {label}
    </p>
  );
}

function formatPrefDate(iso: string | null) {
  if (!iso) return "Flexible";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function BookNowPage() {
  const { clients, employees, services } = useDemoStore();
  const [searchParams] = useSearchParams();
  const [clientId, setClientId] = useState(
    () => searchParams.get("clientId") ?? "",
  );
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const bookableEmployees = employees.filter(isBookableEmployee);
  const [employeeId, setEmployeeId] = useState(
    bookableEmployees[0]?.id ?? "",
  );
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("10:00");
  const [done, setDone] = useState(false);
  const [mode, setMode] = useState<"lookup" | "new">("lookup");
  const [query, setQuery] = useState("");
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  useEffect(() => {
    const fromUrl = searchParams.get("clientId");
    if (fromUrl) setClientId(fromUrl);
  }, [searchParams]);

  const lookupResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        clientDisplayName(c).toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q),
    );
  }, [clients, query]);

  if (!clientId) {
    return (
      <PageChrome
        eyebrow="Step 1"
        title="New booking"
        blurb={
          <>
            Find someone already in your list, or add a new person, then finish
            booking them. New visits land on the{" "}
            <PageLink to="/dashboard/calendar">Calendar</PageLink> and on that
            person&apos;s client page.
          </>
        }
      >
        <div className="max-w-xl space-y-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("lookup")}
              className={[
                "rounded-md px-3 py-1.5 text-sm",
                mode === "lookup"
                  ? "bg-karsa-accent-soft text-karsa-accent-strong"
                  : "border border-karsa-border text-karsa-muted",
              ].join(" ")}
            >
              Find existing client
            </button>
            <button
              type="button"
              onClick={() => setMode("new")}
              className={[
                "rounded-md px-3 py-1.5 text-sm",
                mode === "new"
                  ? "bg-karsa-accent-soft text-karsa-accent-strong"
                  : "border border-karsa-border text-karsa-muted",
              ].join(" ")}
            >
              Book for new client
            </button>
          </div>

          {mode === "lookup" ? (
            <div className="space-y-4">
              <label className="block text-xs text-karsa-faint">
                Search by name or email
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Start typing…"
                  className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
                />
              </label>
              <ul className="space-y-2">
                {lookupResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setClientId(c.id)}
                      className="flex w-full items-center justify-between rounded-md border border-karsa-border-subtle px-4 py-3 text-left transition-colors hover:border-karsa-accent hover:bg-karsa-surface-hover"
                    >
                      <span>
                        <span className="block text-sm font-medium text-karsa-text">
                          {clientDisplayName(c)}
                        </span>
                        <span className="text-xs text-karsa-faint">
                          {c.email}
                        </span>
                      </span>
                      <span className="text-xs text-karsa-accent-strong">
                        Select
                      </span>
                    </button>
                  </li>
                ))}
                {lookupResults.length === 0 ? (
                  <li className="text-sm text-karsa-faint">No matches.</li>
                ) : null}
              </ul>
            </div>
          ) : (
            <form
              className="space-y-3 rounded-md border border-karsa-border-subtle p-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newFirst.trim() || !newLast.trim()) return;
                const created = upsertClient({
                  firstName: newFirst.trim(),
                  lastName: newLast.trim(),
                  email: newEmail.trim(),
                  phone: newPhone.trim(),
                });
                setClientId(created.id);
              }}
            >
              <p className="text-sm text-karsa-muted">
                Add a client to continue booking. Saved in this browser demo
                only.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-karsa-faint">
                  First name
                  <input
                    required
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
                  />
                </label>
                <label className="block text-xs text-karsa-faint">
                  Last name
                  <input
                    required
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
                  />
                </label>
                <label className="block text-xs text-karsa-faint">
                  Email
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
                  />
                </label>
                <label className="block text-xs text-karsa-faint">
                  Phone
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
                  />
                </label>
              </div>
              <button
                type="submit"
                className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
              >
                Continue
              </button>
            </form>
          )}
        </div>
      </PageChrome>
    );
  }

  const client = clients.find((c) => c.id === clientId);

  return (
    <PageChrome
      eyebrow="Schedule · Book Now"
      title="New booking"
      blurb={
        <>
          Choose the service, staff member, day, and time for{" "}
          {client ? clientDisplayName(client) : "this client"}. When you save,
          the visit appears on the{" "}
          <PageLink to="/dashboard/calendar">Calendar</PageLink> and under their
          client profile.
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-karsa-muted">
          Service
          <KarsaSelect
            aria-label="Service"
            value={serviceId}
            onChange={setServiceId}
            options={services.map((s) => ({
              value: s.id,
              label: `${s.name} · ${s.durationMin}m · $${s.price}`,
            }))}
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
            placeholder="Select service…"
          />
        </label>
        <label className="block text-sm text-karsa-muted">
          Practitioner
          <KarsaSelect
            aria-label="Practitioner"
            value={employeeId}
            onChange={setEmployeeId}
            options={bookableEmployees.map((e) => ({
              value: e.id,
              label: e.name,
            }))}
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
            placeholder="Select practitioner…"
          />
        </label>
        <label className="block text-sm text-karsa-muted">
          Date
          <DateInput
            variant="dark"
            value={date}
            onChange={setDate}
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
          />
        </label>
        <label className="block text-sm text-karsa-muted">
          Time
          <HmTimeSelect
            value={time}
            onChange={setTime}
            minHm="07:00"
            maxHm="21:00"
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
            aria-label="Time"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
          onClick={() => {
            setClientId("");
            setDone(false);
          }}
        >
          Change client
        </button>
        <button
          type="button"
          className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
          onClick={() => {
            const [hh, mm] = time.split(":").map(Number);
            const svc = services.find((s) => s.id === serviceId);
            if (!serviceId || !employeeId || Number.isNaN(hh) || Number.isNaN(mm)) {
              return;
            }
            upsertAppointment({
              id: `a-${Date.now()}`,
              employeeId,
              clientId,
              serviceId,
              date,
              startMin: hh * 60 + mm,
              durationMin: svc?.durationMin ?? 60,
              status: "scheduled",
            });
            setDone(true);
          }}
        >
          Create appointment
        </button>
      </div>
      {done ? (
        <p className="text-sm text-karsa-accent-strong">
          Appointment added to the demo calendar (browser only).{" "}
          <Link
            to="/dashboard/calendar"
            className="underline underline-offset-4"
          >
            Open calendar →
          </Link>
        </p>
      ) : null}
    </PageChrome>
  );
}

export function WaitlistPage() {
  const { waitlistEntries, clients, services } = useDemoStore();

  const rows = useMemo(() => {
    return waitlistEntries
      .filter((e) => e.status === "waiting" || e.status === "offered")
      .map((e) => {
        const client = clients.find((c) => c.id === e.clientId);
        const service = services.find((s) => s.id === e.serviceId);
        return {
          ...e,
          clientName: client ? clientDisplayName(client) : "Client",
          serviceName: service?.name ?? "Any service",
        };
      });
  }, [waitlistEntries, clients, services]);

  return (
    <PageChrome
      eyebrow="Schedule"
      title="Waitlist"
      blurb={
        <>
          People waiting for an opening. When a time frees up, you reach out
          yourself and book them — nothing is claimed automatically. Booking
          them uses <PageLink to="/dashboard/bookings/new">Book Now</PageLink>{" "}
          and fills the <PageLink to="/dashboard/calendar">Calendar</PageLink>.
        </>
      }
    >
      <FullVersionNote more="You can offer opened slots from the calendar, track preferred dates, mark entries offered/booked/cancelled, and jump straight into Book Now for that client — with live availability and audit history." />
      <ul className="space-y-3">
        {rows.length === 0 ? (
          <li className="text-sm text-karsa-faint">No open waitlist entries.</li>
        ) : (
          rows.map((e) => (
            <li key={e.id}>
              <EntityOpenButton
                kind="waitlist"
                id={e.id}
                className="flex w-full flex-wrap items-center justify-between gap-3 border border-karsa-border-subtle px-4 py-3 text-left transition-colors hover:border-karsa-accent"
              >
                <div>
                  <p className="text-sm font-medium text-karsa-text">
                    {e.clientName}
                  </p>
                  <p className="mt-1 text-xs text-karsa-muted">
                    {e.serviceName} · Prefers {formatPrefDate(e.preferredDate1)}
                  </p>
                </div>
                <span className="rounded-md bg-karsa-accent-soft px-2 py-1 text-xs capitalize text-karsa-accent-strong">
                  {e.status}
                </span>
              </EntityOpenButton>
            </li>
          ))
        )}
      </ul>
      <VideoSlot label="Waitlist offers" />
    </PageChrome>
  );
}

export function ClientsPage() {
  const { clients } = useDemoStore();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "alpha">("alpha");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = clients;
    if (query) {
      rows = clients.filter(
        (c) =>
          clientDisplayName(c).toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.phone.toLowerCase().includes(query),
      );
    }
    const sorted = [...rows];
    if (sort === "alpha") {
      sorted.sort((a, b) =>
        clientDisplayName(a).localeCompare(clientDisplayName(b), undefined, {
          sensitivity: "base",
        }),
      );
    } else {
      sorted.reverse();
    }
    return sorted;
  }, [clients, q, sort]);

  return (
    <PageChrome
      eyebrow="People"
      title="Clients"
      blurb={
        <>
          Your people list — search, open a profile, or book them again. New
          clients are added when someone books (here or in the full product’s
          public booking page). Open a profile to edit details or use{" "}
          <PageLink to="/dashboard/bookings/new">Book Now</PageLink>.
        </>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-medium tracking-wide text-karsa-faint uppercase">
            Filter clients
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, or phone"
            className="mt-2 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
          />
        </div>
        <div className="sm:w-48">
          <label
            htmlFor="demo-client-sort"
            className="text-xs font-medium tracking-wide text-karsa-faint uppercase"
          >
            Sort by
          </label>
          <div className="mt-2">
            <KarsaSelect
              id="demo-client-sort"
              value={sort}
              onChange={(v) => setSort(v as "recent" | "alpha")}
              options={[
                { value: "recent", label: "Most recent" },
                { value: "alpha", label: "Alphabetical" },
              ]}
            />
          </div>
        </div>
      </div>

      <FullVersionNote more="Full CRM includes appointment history, submitted forms, notes, and one-click rebooking against real availability — not just this sample list." />

      <section>
        <h2 className="text-sm font-medium text-karsa-text">
          {q.trim() ? "Matching clients" : "Clients"}
        </h2>
        <ul className="mt-4 space-y-2">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to={`/dashboard/clients/${c.id}`}
                className="block border border-karsa-border-subtle px-4 py-3 transition-colors hover:border-karsa-accent"
              >
                <p className="font-medium text-karsa-text">
                  {clientDisplayName(c)}
                </p>
                <p className="mt-1 text-xs text-karsa-muted">
                  {c.email}
                  {c.phone ? ` · ${c.phone}` : ""}
                </p>
              </Link>
            </li>
          ))}
          {filtered.length === 0 ? (
            <li className="text-sm text-karsa-faint">
              {clients.length === 0
                ? "No clients yet. They appear here after a booking."
                : "No clients match that filter."}
            </li>
          ) : null}
        </ul>
      </section>
    </PageChrome>
  );
}

export function EmployeesPage() {
  const { employees } = useDemoStore();

  return (
    <PageChrome
      eyebrow="People"
      title="Employees"
      blurb={
        <>
          The team who can take appointments. Open someone to see which{" "}
          <PageLink to="/dashboard/services">services</PageLink> they offer.
          Their names and colors show up on the{" "}
          <PageLink to="/dashboard/calendar">Calendar</PageLink> when you filter
          or book.
        </>
      }
    >
      <FullVersionNote more="Staff profiles support weekly hours per location, service assignments, calendar sync mapping, and role-based access that this demo only sketches." />
      <div className="space-y-3">
        {employees.map((e) => (
          <Link
            key={e.id}
            to={`/dashboard/employees/${e.id}`}
            className="block border border-karsa-border-subtle px-4 py-3 transition-colors hover:border-karsa-accent"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ background: e.color }}
                />
                <div>
                  <p className="font-medium text-karsa-text">{e.name}</p>
                  <p className="text-sm text-karsa-faint">
                    Practitioner · Bookable
                  </p>
                </div>
              </div>
              <span className="text-xs text-karsa-accent-strong">Active</span>
            </div>
          </Link>
        ))}
      </div>
      <VideoSlot label="Employee hours" />
    </PageChrome>
  );
}

export function ConfirmationsPage() {
  const { forms } = useDemoStore();
  const clientForms = forms.filter(
    (f) => f.audience === "client" && !f.isDraft,
  );

  return (
    <PageChrome
      eyebrow="Forms · Confirmations"
      title="Confirmations"
      blurb={
        <>
          The short “you’re all set” message shown after someone finishes a
          form. Edit the wording here;{" "}
          <PageLink to="/dashboard/settings/booking-flow">Booking flow</PageLink>{" "}
          decides which forms (and their confirmations) appear in{" "}
          <PageLink to="/dashboard/bookings/new">Book Now</PageLink>.
        </>
      }
    >
      <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
        Paired with your client forms
      </p>
      <ul className="space-y-3">
        {clientForms.map((f) => (
          <li
            key={f.id}
            className="border border-karsa-border-subtle px-4 py-3"
          >
            <Link
              to={`/dashboard/forms/confirmations/${f.id}`}
              className="block min-w-0 transition-colors hover:text-karsa-accent-strong"
            >
              <p className="font-medium text-karsa-text">
                {confirmationPageTitle(f.name)}
              </p>
              <p className="mt-1 text-xs text-karsa-muted">
                Paired with{" "}
                <span className="text-karsa-text">{f.name}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </PageChrome>
  );
}

export function BusinessPage() {
  const [reminders, setReminders] = useState(true);
  const [waitlist, setWaitlist] = useState(true);

  return (
    <PageChrome
      eyebrow="Settings"
      title="Business settings"
      blurb={
        <>
          Studio-wide basics: timezone, how early someone can book, reminders,
          and the policy text that can appear on forms. Hours themselves are
          edited under <PageLink to="/dashboard/locations">Locations</PageLink>{" "}
          and affect the <PageLink to="/dashboard/calendar">Calendar</PageLink>.
        </>
      }
      maxWidth="max-w-6xl"
    >
      <section className="rounded-md border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Operating hours</h2>
        <p className="mt-1 text-xs leading-relaxed text-karsa-faint">
          Open and closed days are set per{" "}
          <PageLink to="/dashboard/locations">location</PageLink>. The{" "}
          <PageLink to="/dashboard/calendar">Calendar</PageLink> and{" "}
          <PageLink to="/dashboard/bookings/new">Book Now</PageLink> slots
          follow those hours — closed days appear with a dark orange overlay,
          and appointments cannot be scheduled outside operating hours.
        </p>
        <Link
          to="/dashboard/locations"
          className="mt-3 inline-block text-sm text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          Manage locations &amp; hours →
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Business name", "Sample Studio"],
          ["Timezone", "America/New_York"],
          ["Payment link URL", "https://pay.example.com/sample"],
        ].map(([label, value]) => (
          <label key={label} className="block text-sm text-karsa-muted">
            {label}
            <input
              readOnly
              value={value}
              className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
            />
          </label>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <p className="text-sm text-karsa-muted">Default buffer (minutes)</p>
          <input
            readOnly
            value="15"
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
          />
          <p className="mt-1.5 text-xs text-karsa-faint">
            Added after each appointment as unbookable time so staff can reset
            the room or finish service breakdown. Individual services can
            override this.
          </p>
        </div>
        <div>
          <p className="text-sm text-karsa-muted">Reminder hours before</p>
          <input
            readOnly
            value="28"
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
          />
          <p className="mt-1.5 text-xs text-karsa-faint">
            Your{" "}
            <Link
              to="/dashboard/settings/email"
              className="text-karsa-accent-strong underline-offset-4 hover:underline"
            >
              customized reminder email
            </Link>{" "}
            is sent this many hours before the appointment start time.
          </p>
        </div>
        <div>
          <p className="text-sm text-karsa-muted">
            Public booking cutoff (hours)
          </p>
          <input
            readOnly
            value="2"
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
          />
          <p className="mt-1.5 text-xs text-karsa-faint">
            Slots starting within this many hours are hidden on the public book
            page. 0 = only block past times.
          </p>
        </div>
      </div>

      <div className="space-y-4 border border-karsa-border-subtle p-4">
        <KarsaToggleField
          label="Reminder emails enabled"
          description="Send reminder emails before appointments."
          checked={reminders}
          onChange={setReminders}
        />
        <KarsaToggleField
          label="Waitlist enabled"
          description="Allow clients to join the public waitlist."
          checked={waitlist}
          onChange={setWaitlist}
        />
      </div>

      <FullVersionNote more="Business owners edit timezone, buffers, public booking cutoff, payment link URL, reminder toggles, and the consent / privacy / policy copy that appears on live forms — all persisted per tenant." />
    </PageChrome>
  );
}

export function SyncSetupPage() {
  return (
    <PageChrome
      eyebrow="Sync"
      title="Sync setup"
      blurb={
        <>
          Connect Google so appointments and files stay in one place. This demo
          only shows the steps — the full product does the real sign-in and
          keeps <PageLink to="/dashboard/calendar">Calendar</PageLink> visits
          matched to Google calendars.
        </>
      }
      maxWidth="max-w-3xl"
    >
      <ol className="space-y-8">
        <li className="border border-karsa-border-subtle p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Step 1 · Google Calendar
          </p>
          <h2 className="mt-2 text-lg font-medium text-karsa-text">
            Connect a Google account
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
            Authorize your Workspace (or Gmail) account. Karsaro uses it to
            create and update calendar events for each appointment and to pull
            free/busy so double-booking is harder.
          </p>
          <p className="mt-3 text-sm text-karsa-text">
            Status:{" "}
            <span className="text-karsa-warning">
              Not connected (demo — no OAuth)
            </span>
          </p>
          <Link
            to="/dashboard/settings/google"
            className="mt-4 inline-flex cursor-pointer rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg transition-colors hover:bg-karsa-accent-strong"
          >
            Connect Calendar
          </Link>
        </li>

        <li className="border border-karsa-border-subtle p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Step 2 · Employee calendars
          </p>
          <h2 className="mt-2 text-lg font-medium text-karsa-text">
            Map each practitioner
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
            On the{" "}
            <PageLink to="/dashboard/settings/google">Google Calendar</PageLink>{" "}
            page, choose which Google calendar belongs to each employee. New
            bookings write to that calendar; changes in either place stay
            aligned.
          </p>
          <Link
            to="/dashboard/settings/google"
            className="mt-4 inline-block cursor-pointer text-sm font-medium text-karsa-accent-strong underline-offset-4 hover:underline"
          >
            Open calendar mapping →
          </Link>
        </li>

        <li className="border border-karsa-border-subtle p-5">
          <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Step 3 · Google Drive
          </p>
          <h2 className="mt-2 text-lg font-medium text-karsa-text">
            Optional paperwork folders
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
            Drive sync stores submitted forms and exports in a folder structure
            per client. Turn it on after{" "}
            <PageLink to="/dashboard/settings/google">Calendar</PageLink> is
            working so you are not debugging two systems at once.
          </p>
          <p className="mt-3 text-sm text-karsa-text">
            Status: <span className="text-karsa-muted">Off / not configured</span>
          </p>
          <Link
            to="/dashboard/settings/drive"
            className="mt-4 inline-flex cursor-pointer rounded-md border border-karsa-border px-4 py-2.5 text-sm font-medium text-karsa-text transition-colors hover:border-karsa-accent/40 hover:text-karsa-accent-strong"
          >
            Configure Google Drive
          </Link>
        </li>
      </ol>

      <FullVersionNote more="Live OAuth connects Google Workspace, maps each employee calendar, and optionally turns on Drive folders for form PDFs — with connection health and re-auth from this same flow." />

      <section className="border border-dashed border-karsa-border-subtle p-5">
        <h2 className="text-sm font-medium text-karsa-text">How sync behaves</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-karsa-muted">
          <li>
            Bookings created in Karsaro push to the employee&apos;s mapped Google
            calendar.
          </li>
          <li>
            Cancellations and reschedules update the same event when possible.
          </li>
          <li>
            Busy times from Google help block slots on public{" "}
            <PageLink to="/dashboard/bookings/new">Book Now</PageLink> and staff
            booking.
            booking.
          </li>
          <li>
            Drive sync is additive — it does not replace your Forms archive in
            Karsaro.
          </li>
        </ul>
      </section>
    </PageChrome>
  );
}

export function GooglePage() {
  const { employees } = useDemoStore();

  return (
    <PageChrome
      eyebrow="Settings · Integrations"
      title="Google Calendar"
      blurb={
        <>
          Link each staff member to a Google calendar. In the full product, new
          bookings and changes here show up there too. This demo page explains
          the idea without a live Google login. Map people from{" "}
          <PageLink to="/dashboard/employees">Employees</PageLink>.
        </>
      }
      maxWidth="max-w-3xl"
    >
      <div className="border border-karsa-border-subtle px-4 py-3">
        <p className="text-sm text-karsa-text">Connection status</p>
        <p className="mt-1 text-xs text-karsa-warning">
          Demo · Not connected (no OAuth in portfolio shell)
        </p>
      </div>

      <FullVersionNote more="Connect a Workspace account, pick which Google calendar belongs to each practitioner, and keep bookings two-way synced — including busy times that block public Book Now." />

      <section>
        <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
          Employee calendar mapping
        </p>
        <ul className="mt-3 space-y-2">
          {employees.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-3 border border-karsa-border-subtle px-4 py-3"
            >
              <span className="text-sm font-medium text-karsa-text">
                {e.name}
              </span>
              <span className="text-xs text-karsa-faint">Not mapped</span>
            </li>
          ))}
        </ul>
      </section>
      <VideoSlot label="Google Calendar connect" />
    </PageChrome>
  );
}

export function DrivePage() {
  const { forms } = useDemoStore();
  const syncForms = forms.filter((f) => !f.isDraft);

  return (
    <PageChrome
      eyebrow="Settings · Integrations"
      title="Google Drive"
      blurb={
        <>
          Optional: save filled-out form PDFs into Google Drive folders. Uses
          the same Google connection as{" "}
          <PageLink to="/dashboard/settings/google">Google Calendar</PageLink>.
          Not connected in this demo.
        </>
      }
      maxWidth="max-w-3xl"
    >
      <p className="text-sm text-karsa-muted">
        Connect Google first under{" "}
        <Link
          to="/dashboard/settings/google"
          className="text-karsa-accent-strong underline-offset-4 hover:underline"
        >
          Settings → Google Calendar
        </Link>
        .
      </p>

      <div className="border border-karsa-border-subtle px-4 py-3">
        <p className="text-sm text-karsa-text">Drive sync</p>
        <p className="mt-1 text-xs text-karsa-faint">
          Off in this demo — enable in the live product after Google connect.
        </p>
      </div>

      <FullVersionNote more="After Google is connected, create a root Drive folder, map per-form destinations, and toggle PDF export for submissions so paperwork lands beside the calendar sync." />

      <section>
        <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
          Forms eligible for PDF sync
        </p>
        <ul className="mt-3 space-y-2">
          {syncForms.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-3 border border-karsa-border-subtle px-4 py-3"
            >
              <span className="text-sm font-medium text-karsa-text">
                {f.name}
              </span>
              <span className="text-xs text-karsa-faint">Sync off</span>
            </li>
          ))}
        </ul>
      </section>
      <VideoSlot label="Drive PDF sync" />
    </PageChrome>
  );
}

export function MetricsPage() {
  const [searchParams] = useSearchParams();
  const range = searchParams.get("range") ?? "month";
  const employeeFilter = searchParams.get("employeeId") || null;
  const { appointments, services, employees } = useDemoStore();
  const { start, end } = rangeBounds(range);

  const points = appointments
    .filter((a) => {
      const [y, m, d] = a.date.split("-").map(Number);
      const t = new Date(y, m - 1, d).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .map((a) => {
      const service = services.find((s) => s.id === a.serviceId);
      return {
        id: a.id,
        day: a.date,
        status: appointmentStatus(a),
        serviceId: a.serviceId,
        serviceName: service?.name ?? "Service",
        color: getServiceColor(service?.colorId).swatch,
        employeeId: a.employeeId,
      };
    });

  const serviceMeta = services.map((s) => ({
    id: s.id,
    name: s.name,
    color: getServiceColor(s.colorId).swatch,
    active: s.active !== false,
    listPrice: s.price,
  }));

  const employeeMeta = employees.map((e) => ({
    id: e.id,
    label: e.name,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
        Insights
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight text-karsa-text">
        Metrics
      </h1>
      <p className="mt-3 max-w-2xl text-base text-karsa-muted">
        Appointment volume over time by service. Toggle services, filter by
        practitioner, and optionally overlay cancellations.
      </p>

      <MetricsClient
        range={range}
        employeeId={employeeFilter}
        points={points}
        services={serviceMeta}
        employees={employeeMeta}
      />
    </div>
  );
}

export function IncomePage() {
  return (
    <PageChrome
      eyebrow="Insights"
      title="Estimated income"
      blurb="A rough money picture: finished visits multiplied by each service’s listed price. Karsaro does not take payments — this is just a planning estimate. Live numbers appear in the full product."
      maxWidth="max-w-6xl"
    >
      <FullVersionNote more="Full Karsaro multiplies completed appointments by each service’s list price, with the same timeframe and practitioner filters as Metrics, clearly labeled as estimated revenue." />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-karsa-border-subtle px-4 py-3">
          <p className="text-xs tracking-wide text-karsa-faint uppercase">
            Estimated income
          </p>
          <p className="mt-1 font-display text-3xl text-karsa-faint">—</p>
        </div>
        <div className="rounded-md border border-karsa-border-subtle px-4 py-3">
          <p className="text-xs tracking-wide text-karsa-faint uppercase">
            Completed visits
          </p>
          <p className="mt-1 font-display text-3xl text-karsa-faint">—</p>
        </div>
      </div>
    </PageChrome>
  );
}

export function BillingPage() {
  return (
    <PageChrome
      eyebrow="Settings"
      title="Billing"
      blurb="Your Karsaro software plan for this studio (not client payments). Client card charges never go through Karsaro — this page is only the subscription."
      maxWidth="max-w-5xl"
    >
      <FullVersionNote more="The live app will run checkout here. This demo uses the same Solo / Studio / Practice prices, extra-seat math, and annual first-month-free billing so you can see how a 3–4 person team stays on Solo." />
      <BillingPlans currentPlanId="trial" />
    </PageChrome>
  );
}
