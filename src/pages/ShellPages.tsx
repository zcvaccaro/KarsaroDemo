import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BillingPlans } from "../components/BillingPlans";
import { FullVersionNote } from "../components/FullVersionNote";
import { EntityOpenButton } from "../components/EntityModals";
import { PageLink } from "../components/PageLink";
import { DateInput } from "../components/inputs/DateInput";
import { HmTimeSelect } from "../components/inputs/HmTimeSelect";
import { KarsaSelect } from "../components/inputs/KarsaSelect";
import { MetricsClient } from "../components/MetricsClient";
import { rangeBounds } from "../lib/insights-range";
import { getServiceColor } from "../lib/service-colors";
import {
  appointmentStatus,
  clientDisplayName,
  confirmationPageTitle,
  formatClock,
  importDemoAttachment,
  isBookableEmployee,
  todayISO,
  upsertAppointment,
  upsertClient,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";
import {
  filterEmployeesForLocation,
  filterServicesForLocation,
  isAppointmentAtLocation,
  isServiceAvailableAtLocation,
  useDemoLocationScope,
} from "../lib/location-filter";

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
  const { locationId } = useDemoLocationScope();
  const [searchParams] = useSearchParams();
  const [clientId, setClientId] = useState(
    () => searchParams.get("clientId") ?? "",
  );
  const ANY_EMPLOYEE_ID = "__any__";
  const scopedServices = useMemo(
    () => filterServicesForLocation(services, locationId),
    [locationId, services],
  );
  const bookableEmployees = useMemo(
    () =>
      filterEmployeesForLocation(
        employees.filter(isBookableEmployee),
        locationId,
      ),
    [employees, locationId],
  );
  const [employeeId, setEmployeeId] = useState(ANY_EMPLOYEE_ID);
  const [serviceId, setServiceId] = useState("");
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

  useEffect(() => {
    if (serviceId && !scopedServices.some((s) => s.id === serviceId)) {
      setServiceId("");
    }
  }, [scopedServices, serviceId]);

  useEffect(() => {
    if (
      employeeId !== ANY_EMPLOYEE_ID &&
      !bookableEmployees.some((e) => e.id === employeeId)
    ) {
      setEmployeeId(ANY_EMPLOYEE_ID);
    }
  }, [bookableEmployees, employeeId]);

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

  const visibleServices = useMemo(() => {
    if (employeeId === ANY_EMPLOYEE_ID) return scopedServices;
    const emp = employees.find((e) => e.id === employeeId);
    const allowed = new Set(emp?.serviceIds ?? []);
    return scopedServices.filter((s) => allowed.has(s.id));
  }, [employeeId, employees, scopedServices]);

  const visibleEmployees = useMemo(() => {
    if (!serviceId) return bookableEmployees;
    return bookableEmployees.filter((e) => e.serviceIds.includes(serviceId));
  }, [bookableEmployees, serviceId]);

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
          Employee
          <KarsaSelect
            aria-label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
            options={[
              { value: ANY_EMPLOYEE_ID, label: "Select an employee" },
              ...visibleEmployees.map((e) => ({
                value: e.id,
                label: e.name,
              })),
            ]}
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
            placeholder="Select an employee"
          />
        </label>
        <label className="block text-sm text-karsa-muted">
          Service
          <KarsaSelect
            aria-label="Service"
            value={serviceId}
            onChange={setServiceId}
            options={[
              { value: "", label: "Select a service" },
              ...visibleServices.map((s) => ({
                value: s.id,
                label: `${s.name} · ${s.durationMin}m · $${s.price}`,
              })),
            ]}
            className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-karsa-text"
            placeholder="Select a service"
          />
        </label>
        <label className="block text-sm text-karsa-muted">
          Date
          <DateInput
            variant="dark"
            value={date}
            onChange={setDate}
            min={todayISO()}
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
            const resolvedEmployeeId =
              employeeId === ANY_EMPLOYEE_ID
                ? (visibleEmployees[0]?.id ?? "")
                : employeeId;
            if (!serviceId || !resolvedEmployeeId || Number.isNaN(hh) || Number.isNaN(mm)) {
              return;
            }
            upsertAppointment({
              id: `a-${Date.now()}`,
              employeeId: resolvedEmployeeId,
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
  const { locationId } = useDemoLocationScope();

  const rows = useMemo(() => {
    return waitlistEntries
      .filter((e) => e.status === "waiting" || e.status === "offered")
      .filter((e) =>
        isServiceAvailableAtLocation(
          e.serviceId
            ? services.find((s) => s.id === e.serviceId)?.locationIds
            : undefined,
          locationId,
        ),
      )
      .map((e) => {
        const client = clients.find((c) => c.id === e.clientId);
        const service = services.find((s) => s.id === e.serviceId);
        return {
          ...e,
          clientName: client ? clientDisplayName(client) : "Client",
          serviceName: service?.name ?? "Any service",
        };
      });
  }, [waitlistEntries, clients, services, locationId]);

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
  const { clients, appointments, services } = useDemoStore();
  const { locationId } = useDemoLocationScope();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"recent" | "alpha">("alpha");

  const locationClients = useMemo(() => {
    if (!locationId) return clients;
    const ids = new Set(
      appointments
        .filter((a) => appointmentStatus(a) !== "cancelled")
        .filter((a) => isAppointmentAtLocation(a, locationId, services))
        .map((a) => a.clientId),
    );
    return clients.filter((c) => ids.has(c.id));
  }, [appointments, clients, locationId, services]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = locationClients;
    if (query) {
      rows = locationClients.filter(
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
  }, [locationClients, q, sort]);

  return (
    <PageChrome
      eyebrow="People"
      title="Clients"
      blurb={
        <>
          Your people list — search, open a profile, or book them again. New
          clients are added when someone books (here or in the full product’s
          public booking page). Open a profile to edit details or use{" "}
          <PageLink to="/dashboard/bookings/new">Book Now</PageLink>. You can{" "}
          <PageLink
            to="/dashboard/clients/import"
            className="karsaro-onboarding-import-target"
          >
            import client data
          </PageLink>{" "}
          from your previous booking software here as well.
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
              {locationClients.length === 0
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
  const { locationId } = useDemoLocationScope();
  const scopedEmployees = useMemo(
    () => filterEmployeesForLocation(employees, locationId),
    [employees, locationId],
  );

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
        {scopedEmployees.map((e) => (
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
      blurb="Each client-side appointment form gets its own confirmation message automatically upon creation. These confirmations will be seen by clients when they book online. Here is where you can edit those confirmation messages."
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

      <section className="rounded-md border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Payments</h2>
        <p className="mt-1 text-xs leading-relaxed text-karsa-faint">
          Connect Stripe so staff can charge from any appointment — manual card
          entry, a card on file, or a Stripe Terminal reader. Money goes to the
          business Stripe account. Square can be added later.
        </p>
        <p className="mt-3 text-sm text-karsa-accent-strong">
          Stripe connected (demo) · charges enabled
        </p>
        <p className="mt-1 text-xs text-karsa-faint">
          Live Karsaro uses Stripe Connect Express onboarding from this page.
        </p>
      </section>

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
              customized email reminder
            </Link>{" "}
            (and SMS reminder on Studio and Practice) is sent this many hours
            before the appointment start time.
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

      <p className="text-sm leading-relaxed text-karsa-muted">
        Reminder emails send when the{" "}
        <PageLink to="/dashboard/settings/email">Email reminder</PageLink>{" "}
        template is active. The public waitlist is available whenever you have
        an active waitlist form — no separate toggle here. Returning client
        lookup on Book Now is always on.
      </p>

      <section className="rounded-md border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Policies</h2>
        <p className="mt-1 text-xs leading-relaxed text-karsa-faint">
          Consent, privacy, cancellation, and employee agreement wording live
          here in the full product. Toggle those blocks on the matching forms.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            "Consent message",
            "Privacy policy",
            "Cancellation policy",
            "Employee agreement",
          ].map((title) => (
            <div
              key={title}
              className="rounded-md border border-karsa-border-subtle px-3 py-2.5"
            >
              <p className="text-sm font-medium text-karsa-text">{title}</p>
              <p className="mt-1 text-xs text-karsa-faint">
                {title === "Employee agreement"
                  ? "Shown on the Employee agreement form for hire signing."
                  : "Shown on client forms when that block is toggled on."}
              </p>
            </div>
          ))}
        </div>
      </section>

      <FullVersionNote more="Business owners edit timezone, buffers, public booking cutoff, Stripe Connect, and the consent / privacy / cancellation / employee-agreement copy that appears on live forms — all persisted per tenant." />
    </PageChrome>
  );
}

function DemoImportForms() {
  const { clients, employees, forms } = useDemoStore();
  const [subjectType, setSubjectType] = useState<"client" | "employee">("client");
  const savedForms = forms.filter((f) => !f.isDraft && f.active && f.templateKey !== "booking");
  const [formId, setFormId] = useState(savedForms[0]?.id ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const selected = savedForms.find((f) => f.id === formId);
  const needsDate = subjectType === "client" && Boolean(selected?.showInCalendarDescription);
  const people = subjectType === "client" ? clients : employees;
  const fieldClass =
    "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const subjectId = String(data.get("subjectId") ?? "");
        const visitDate = String(data.get("visitDate") ?? "");
        const file = data.get("file");
        const filename =
          file instanceof File && file.name ? file.name : "Imported scan.pdf";
        if (!subjectId || !formId) return;
        const result = importDemoAttachment({
          formId,
          filename,
          subjectType,
          subjectId,
          visitDate: needsDate ? visitDate : undefined,
        });
        if (result.createdPlaceholder) {
          setMessage(
            `Saved as ${selected?.name ?? "form"}. A filler visit card was added so it lines up on the client profile.`,
          );
        } else if (result.matchedVisit) {
          setMessage(`Saved as ${selected?.name ?? "form"} on the matching visit.`);
        } else {
          setMessage(`Saved as ${selected?.name ?? "form"} on that profile.`);
        }
      }}
    >
      <div className="grid items-end gap-3 sm:grid-cols-2">
        <label className="text-xs text-karsa-faint">
          Save to
          <select
            name="subjectType"
            value={subjectType}
            onChange={(event) =>
              setSubjectType(event.target.value === "employee" ? "employee" : "client")
            }
            className={fieldClass}
          >
            <option value="client">Client profile</option>
            <option value="employee">Employee profile</option>
          </select>
        </label>
        <label className="text-xs text-karsa-faint">
          {subjectType === "client" ? "Client" : "Employee"}
          <select name="subjectId" required className={fieldClass}>
            {people.map((person) => (
              <option key={person.id} value={person.id}>
                {"firstName" in person
                  ? clientDisplayName(person)
                  : person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-karsa-faint">
          Saved form name
          <select
            name="formId"
            required
            value={formId}
            onChange={(event) => setFormId(event.target.value)}
            className={fieldClass}
          >
            {savedForms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </select>
        </label>
        {needsDate ? (
          <label className="text-xs text-karsa-faint">
            Visit date
            <input type="date" name="visitDate" required className={fieldClass} />
          </label>
        ) : null}
        <label className="text-xs text-karsa-faint sm:col-span-2">
          Scan or file
          <input
            type="file"
            name="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,.doc,.docx,application/pdf,image/*"
            className={`${fieldClass} file:mr-3 file:rounded-md file:border-0 file:bg-karsa-accent-soft file:px-3 file:py-1 file:text-xs file:text-karsa-text`}
          />
        </label>
      </div>
      <p className="text-xs leading-relaxed text-karsa-faint">
        Demo stores the filename only. Appointment-linked forms sit next to that
        visit; if none exists, a filler card is added.
      </p>
      {message ? (
        <p className="text-sm text-karsa-accent-strong">{message}</p>
      ) : null}
      <button
        type="submit"
        className="rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg"
      >
        Save file
      </button>
    </form>
  );
}

export function ImportPage() {
  return (
    <PageChrome
      eyebrow="Sync"
      title="Import"
      blurb={
        <>
          Bring clients in from another product, and attach scans or files to a
          client or employee as one of your saved forms. Take data the other way
          on <PageLink to="/dashboard/settings/export">Export</PageLink>.
        </>
      }
      maxWidth="max-w-3xl"
    >
      <section className="border border-karsa-border-subtle p-5">
        <h2 className="text-lg font-medium text-karsa-text">Client import</h2>
        <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
          Export a client CSV from the product you are leaving, then map names,
          emails, phones, and notes.
        </p>
        <Link
          to="/dashboard/clients/import"
          className="mt-4 inline-flex cursor-pointer rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg transition-colors hover:bg-karsa-accent-strong"
        >
          Open client CSV import
        </Link>
      </section>
      <section className="border border-karsa-border-subtle p-5">
        <h2 className="text-lg font-medium text-karsa-text">Forms and notes</h2>
        <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
          Upload a scan or file, pick a client or employee, and pick one of your
          saved forms as the name.
        </p>
        <DemoImportForms />
      </section>
    </PageChrome>
  );
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ExportPage() {
  const { clients, appointments, employees, services, importedFiles } =
    useDemoStore();

  return (
    <PageChrome
      eyebrow="Sync"
      title="Export"
      blurb={
        <>
          Download your demo data as CSVs. Live Karsaro also includes
          appointment notes and imported-file lists. Bring data the other way on{" "}
          <PageLink to="/dashboard/settings/import">Import</PageLink>.
        </>
      }
      maxWidth="max-w-3xl"
    >
      <section className="border border-karsa-border-subtle p-5">
        <h2 className="text-lg font-medium text-karsa-text">Clients</h2>
        <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
          Names, emails, phones, and profile notes.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg"
          onClick={() => {
            const header = "first_name,last_name,email,phone,notes";
            const lines = clients.map((c) =>
              [c.firstName, c.lastName, c.email, c.phone, c.notes]
                .map(csvCell)
                .join(","),
            );
            downloadText("karsaro-clients.csv", [header, ...lines].join("\r\n"));
          }}
        >
          Download Clients CSV
        </button>
      </section>
      <section className="border border-karsa-border-subtle p-5">
        <h2 className="text-lg font-medium text-karsa-text">Appointments</h2>
        <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
          Visit dates, status, payment, client, employee, and service.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg"
          onClick={() => {
            const header =
              "date,start,status,payment_status,source,client,employee,service";
            const lines = appointments.map((a) => {
              const client = clients.find((c) => c.id === a.clientId);
              const employee = employees.find((e) => e.id === a.employeeId);
              const service = services.find((s) => s.id === a.serviceId);
              return [
                a.date,
                formatClock(a.startMin),
                appointmentStatus(a),
                a.paymentStatus ?? "",
                a.source ?? "karsaro",
                client ? clientDisplayName(client) : "",
                employee?.name ?? "",
                service?.name ?? "",
              ]
                .map(csvCell)
                .join(",");
            });
            downloadText(
              "karsaro-appointments.csv",
              [header, ...lines].join("\r\n"),
            );
          }}
        >
          Download Appointments CSV
        </button>
      </section>
      <section className="border border-karsa-border-subtle p-5">
        <h2 className="text-lg font-medium text-karsa-text">Imported files</h2>
        <p className="mt-2 text-sm leading-relaxed text-karsa-muted">
          Scans attached on Import, with the form name and profile.
        </p>
        <button
          type="button"
          className="mt-4 rounded-md bg-karsa-accent px-4 py-2.5 text-sm font-medium text-karsa-bg"
          onClick={() => {
            const header = "filename,form_name,client,employee,date";
            const lines = importedFiles.map((f) => {
              const client = clients.find((c) => c.id === f.clientId);
              const employee = employees.find((e) => e.id === f.employeeId);
              return [
                f.filename,
                f.formName,
                client ? clientDisplayName(client) : "",
                employee?.name ?? "",
                f.date ?? "",
              ]
                .map(csvCell)
                .join(",");
            });
            downloadText("karsaro-files.csv", [header, ...lines].join("\r\n"));
          }}
        >
          Download Files CSV
        </button>
      </section>
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
          matched to Google calendars. Use{" "}
          <PageLink to="/dashboard/settings/import">Import</PageLink> and{" "}
          <PageLink to="/dashboard/settings/export">Export</PageLink> to move
          data in or out.
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

const GOOGLE_PRIVACY_KEY = "karsaro-google-event-privacy";

function GoogleEventPrivacyRadios() {
  const [privacy, setPrivacy] = useState<
    "minimal" | "baa_signed" | "baa_not_required"
  >("minimal");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(GOOGLE_PRIVACY_KEY);
      if (
        raw === "minimal" ||
        raw === "baa_signed" ||
        raw === "baa_not_required"
      ) {
        setPrivacy(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <>
      <fieldset className="mt-4 space-y-3">
        <legend className="sr-only">Google event details</legend>
        {(
          [
            {
              value: "minimal" as const,
              label: "Keep events as a time block (no names)",
            },
            {
              value: "baa_signed" as const,
              label: "We have signed the Google BAA",
            },
            {
              value: "baa_not_required" as const,
              label: "We were told we do not have to sign a BAA",
            },
          ]
        ).map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-start gap-2 text-sm text-karsa-muted"
          >
            <input
              type="radio"
              name="google-event-privacy"
              value={option.value}
              className="mt-1 cursor-pointer"
              checked={privacy === option.value}
              onChange={() => {
                setPrivacy(option.value);
                setSaved(true);
                try {
                  localStorage.setItem(GOOGLE_PRIVACY_KEY, option.value);
                } catch {
                  /* ignore */
                }
              }}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>
      <p className="mt-3 text-xs leading-relaxed text-karsa-faint">
        This is a practice attestation, not legal advice. Existing Google
        events keep their current titles until the appointment is changed in
        Karsaro.
      </p>
      {saved ? (
        <p className="mt-2 text-sm text-karsa-accent-strong">
          Saved. This will apply when you connect Google.
        </p>
      ) : null}
    </>
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

      <section className="border border-karsa-border-subtle p-5">
        <h2 className="text-sm font-medium text-karsa-text">
          What goes on Google events
        </h2>
        <p className="mt-2 text-sm text-karsa-muted">
          By default Karsaro only blocks the time. If you have signed Google’s
          business agreement (BAA), or you were told you do not have to, choose
          that below. Karsaro then puts client name and service on new and
          updated Google events automatically.
        </p>
        <p className="mt-2 text-sm text-karsa-faint">
          You can choose now. The setting is remembered in this browser.
        </p>
        <GoogleEventPrivacyRadios />
      </section>

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
  const { locationId } = useDemoLocationScope();
  const { start, end } = rangeBounds(range);

  const points = appointments
    .filter((a) => {
      const [y, m, d] = a.date.split("-").map(Number);
      const t = new Date(y, m - 1, d).getTime();
      return t >= start.getTime() && t < end.getTime();
    })
    .filter((a) => isAppointmentAtLocation(a, locationId, services))
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

  const serviceMeta = filterServicesForLocation(services, locationId).map(
    (s) => ({
      id: s.id,
      name: s.name,
      color: getServiceColor(s.colorId).swatch,
      active: s.active !== false,
      listPrice: s.price,
    }),
  );

  const employeeMeta = filterEmployeesForLocation(employees, locationId).map(
    (e) => ({
      id: e.id,
      label: e.name,
    }),
  );

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

function money(cents: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function IncomePage() {
  const { locations, appointments, employees, services } = useDemoStore();
  const [locationId, setLocationId] = useState("all");
  const [employeeId, setEmployeeId] = useState("");

  const paid = useMemo(() => {
    return appointments.filter((a) => {
      if (appointmentStatus(a) !== "completed") return false;
      if (a.paymentStatus !== "paid") return false;
      if (a.source === "import_placeholder") return false;
      if (employeeId && a.employeeId !== employeeId) return false;
      if (locationId !== "all") {
        const service = services.find((s) => s.id === a.serviceId);
        if (
          service &&
          !isServiceAvailableAtLocation(service.locationIds, locationId)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [appointments, employeeId, locationId, services]);

  const collectedCents = paid.reduce((sum, a) => {
    const service = services.find((s) => s.id === a.serviceId);
    const price = Math.round((service?.price ?? 0) * 100);
    return sum + price + (a.tipCents ?? 0);
  }, 0);
  const tipCents = paid.reduce((sum, a) => sum + (a.tipCents ?? 0), 0);

  const tipRows = useMemo(() => {
    const map = new Map<string, { id: string; label: string; tipCents: number; visits: number }>();
    for (const a of paid) {
      if (!a.tipCents) continue;
      const employee = employees.find((e) => e.id === a.employeeId);
      const id = a.employeeId || "unassigned";
      const cur = map.get(id);
      if (cur) {
        cur.tipCents += a.tipCents;
        cur.visits += 1;
      } else {
        map.set(id, {
          id,
          label: employee?.name ?? "Unassigned",
          tipCents: a.tipCents,
          visits: 1,
        });
      }
    }
    return [...map.values()].sort((a, b) => b.tipCents - a.tipCents);
  }, [paid, employees]);

  return (
    <PageChrome
      eyebrow="Insights"
      title="Income"
      blurb="Collected includes gratuity. The Gratuity section below is what to pay out per employee for this filter."
      maxWidth="max-w-6xl"
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium tracking-wide text-karsa-faint uppercase">
          Location
          <div className="mt-1">
            <KarsaSelect
              aria-label="Location"
              value={locationId}
              options={[
                { value: "all", label: "All locations" },
                ...locations.map((l) => ({ value: l.id, label: l.name })),
              ]}
              onChange={setLocationId}
            />
          </div>
        </label>
        <label className="block text-xs font-medium tracking-wide text-karsa-faint uppercase">
          Employee
          <div className="mt-1">
            <KarsaSelect
              aria-label="Employee"
              value={employeeId}
              options={[
                { value: "", label: "All employees" },
                ...employees.map((e) => ({ value: e.id, label: e.name })),
              ]}
              onChange={setEmployeeId}
            />
          </div>
        </label>
      </div>
      <div className="grid gap-3 min-[1198px]:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-md border border-karsa-border-subtle px-4 py-3">
          <p className="text-xs tracking-wide text-karsa-faint uppercase">
            Collected
          </p>
          <p className="mt-1 font-display text-3xl text-karsa-text">
            {money(collectedCents)}
          </p>
          <p className="mt-1 text-xs text-karsa-faint">Includes gratuity</p>
        </div>
        <div className="rounded-md border border-karsa-border-subtle px-4 py-3">
          <p className="text-xs tracking-wide text-karsa-faint uppercase">
            Gratuity
          </p>
          <p className="mt-1 font-display text-3xl text-karsa-text">
            {money(tipCents)}
          </p>
          <p className="mt-1 text-xs text-karsa-faint">To pay out to staff</p>
        </div>
        <div className="rounded-md border border-karsa-border-subtle px-4 py-3">
          <p className="text-xs tracking-wide text-karsa-faint uppercase">
            Paid visits
          </p>
          <p className="mt-1 font-display text-3xl text-karsa-text">
            {paid.length}
          </p>
        </div>
      </div>
      <section className="rounded-md border border-karsa-border-subtle">
        <div className="border-b border-karsa-border-subtle px-4 py-3">
          <h2 className="text-sm font-medium text-karsa-text">
            Gratuity by employee
          </h2>
          <p className="mt-1 text-xs text-karsa-faint">
            Gratuity portion of paid visits. Use this list to decide payouts.
          </p>
        </div>
        {tipRows.length === 0 ? (
          <p className="px-4 py-6 text-sm text-karsa-faint">
            No gratuity in this filter.
          </p>
        ) : (
          <ul className="divide-y divide-karsa-border-subtle">
            {tipRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-karsa-text">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-xs text-karsa-faint">
                    {row.visits}{" "}
                    {row.visits === 1
                      ? "payment with gratuity"
                      : "payments with gratuity"}
                  </p>
                </div>
                <p className="text-sm font-medium text-karsa-text">
                  {money(row.tipCents)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageChrome>
  );
}

export function BillingPage() {
  return (
    <PageChrome
      eyebrow="Settings"
      title="Billing"
      blurb="Your Karsaro software plan for this studio. Client card charges go to the business Stripe account from appointment Charge Payment — this page is only the subscription."
      maxWidth="max-w-5xl"
    >
      <FullVersionNote more="The live app will run checkout here. This demo uses the same Solo / Studio / Practice prices, extra-seat and extra-location math, and annual first-month-free billing." />
      <BillingPlans currentPlanId="trial" />
    </PageChrome>
  );
}
