import { useEffect, useMemo, useState } from "react";
import { DateInput } from "../inputs/DateInput";
import { HmTimeSelect } from "../inputs/HmTimeSelect";
import { KarsaSelect } from "../inputs/KarsaSelect";
import { formatHm12 } from "../../lib/format-hm";
import {
  clientDisplayName,
  isBookableEmployee,
  upsertClient,
  type Client,
  type Employee,
  type Service,
} from "../../lib/store";

export type BookModalDefaults = {
  date: string;
  time: string;
  employeeId: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2";

export function CalendarBookModal({
  defaults,
  employees,
  clients,
  services,
  onClose,
  onSave,
  lockedClientId,
}: {
  defaults: BookModalDefaults;
  employees: Employee[];
  clients: Client[];
  services: Service[];
  onClose: () => void;
  lockedClientId?: string;
  onSave: (form: {
    clientId: string;
    serviceId: string;
    employeeId: string;
    durationMin: number;
    date: string;
    time: string;
  }) => void;
}) {
  const [mode, setMode] = useState<"lookup" | "new">("lookup");
  const [query, setQuery] = useState("");
  const [clientId, setClientId] = useState(
    lockedClientId ?? clients[0]?.id ?? "",
  );
  const [date, setDate] = useState(defaults.date);
  const [time, setTime] = useState(defaults.time);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [employeeId, setEmployeeId] = useState(
    defaults.employeeId &&
      employees.some(
        (e) => e.id === defaults.employeeId && isBookableEmployee(e),
      )
      ? defaults.employeeId
      : (employees.find(isBookableEmployee)?.id ?? ""),
  );
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const lockedClient = lockedClientId
    ? clients.find((c) => c.id === lockedClientId)
    : undefined;
  const service = services.find((s) => s.id === serviceId);

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

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const employeeOptions = employees.filter(isBookableEmployee).map((e) => ({
    value: e.id,
    label: e.name,
  }));
  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.durationMin}m)`,
  }));

  function resolveClientId(): string | null {
    if (lockedClientId) return lockedClientId;
    if (mode === "lookup") {
      return clientId || null;
    }
    if (!newFirst.trim() || !newLast.trim()) return null;
    const created = upsertClient({
      firstName: newFirst.trim(),
      lastName: newLast.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
    });
    return created.id;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-10">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="relative z-10 w-full max-w-md rounded-lg border border-karsa-border bg-karsa-bg p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-book-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
              Calendar
            </p>
            <h2
              id="calendar-book-title"
              className="mt-1 font-display text-2xl text-karsa-text"
            >
              Book an appointment
            </h2>
            <p className="mt-1 text-sm text-karsa-muted">
              {lockedClient
                ? clientDisplayName(lockedClient)
                : `${date} · around ${formatHm12(time)}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface"
          >
            Close
          </button>
        </div>

        <div className="mt-6 space-y-4">
          {!lockedClientId ? (
          <>
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
              Find existing
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
            <div className="space-y-3">
              <label className="block text-xs text-karsa-faint">
                Search by name or email
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Start typing…"
                  className={fieldClass}
                />
              </label>
              <label className="block text-xs text-karsa-faint">
                Client
                <KarsaSelect
                  aria-label="Client"
                  value={clientId}
                  onChange={setClientId}
                  options={lookupResults.map((c) => ({
                    value: c.id,
                    label: clientDisplayName(c),
                  }))}
                  className={fieldClass}
                  placeholder="Select client…"
                />
              </label>
              {lookupResults.length === 0 ? (
                <p className="text-xs text-karsa-faint">No matches.</p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-md border border-karsa-border-subtle p-3">
              <p className="text-xs text-karsa-muted">
                New client is saved in this browser demo only.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs text-karsa-faint">
                  First name
                  <input
                    required
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-xs text-karsa-faint">
                  Last name
                  <input
                    required
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-xs text-karsa-faint">
                  Email
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className={fieldClass}
                  />
                </label>
                <label className="block text-xs text-karsa-faint">
                  Phone
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className={fieldClass}
                  />
                </label>
              </div>
            </div>
          )}
          </>
          ) : null}

          <label className="block text-xs text-karsa-faint">
            Date
            <div className="mt-1">
              <DateInput value={date} onChange={setDate} />
            </div>
          </label>
          <label className="block text-xs text-karsa-faint">
            Time
            <div className="mt-1">
              <HmTimeSelect
                value={time}
                onChange={setTime}
                minHm="07:00"
                maxHm="21:00"
                aria-label="Start time"
              />
            </div>
          </label>

          <label className="block text-xs text-karsa-faint">
            Practitioner
            <KarsaSelect
              aria-label="Practitioner"
              value={employeeId}
              onChange={setEmployeeId}
              options={employeeOptions}
              className={fieldClass}
              placeholder="Select practitioner…"
            />
          </label>
          <label className="block text-xs text-karsa-faint">
            Service
            <KarsaSelect
              aria-label="Service"
              value={serviceId}
              onChange={setServiceId}
              options={serviceOptions}
              className={fieldClass}
              placeholder="Select service…"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              const resolvedClientId = resolveClientId();
              if (!resolvedClientId || !serviceId || !employeeId) return;
              onSave({
                clientId: resolvedClientId,
                serviceId,
                employeeId,
                durationMin: service?.durationMin ?? 60,
                date,
                time,
              });
            }}
            className="rounded-md bg-karsa-accent px-3 py-1.5 text-sm font-medium text-karsa-bg"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
