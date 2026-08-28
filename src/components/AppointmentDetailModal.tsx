import { useEffect, useMemo, useState } from "react";
import { formatTime } from "./calendar/calendar-grid";
import { DateInput } from "./inputs/DateInput";
import { HmTimeSelect } from "./inputs/HmTimeSelect";
import { KarsaSelect } from "./inputs/KarsaSelect";
import { localDateTimeIso } from "../lib/calendar-utils";
import {
  clientDisplayName,
  deleteAppointment,
  upsertAppointment,
} from "../lib/store";
import { useDemoStore } from "../lib/use-demo-store";

function minToHm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hmToMin(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function AppointmentDetailModal({
  appointmentId,
  onClose,
}: {
  appointmentId: string;
  onClose: () => void;
}) {
  const store = useDemoStore();
  const [editing, setEditing] = useState(false);
  const row = store.appointments.find((a) => a.id === appointmentId);
  const client = store.clients.find((c) => c.id === row?.clientId);
  const service = store.services.find((s) => s.id === row?.serviceId);
  const employee = store.employees.find((e) => e.id === row?.employeeId);

  const [date, setDate] = useState(row?.date ?? "");
  const [time, setTime] = useState(minToHm(row?.startMin ?? 0));
  const [durationMin, setDurationMin] = useState(row?.durationMin ?? 60);
  const [serviceId, setServiceId] = useState(row?.serviceId ?? "");
  const [employeeId, setEmployeeId] = useState(row?.employeeId ?? "");

  useEffect(() => {
    const next = store.appointments.find((a) => a.id === appointmentId);
    setDate(next?.date ?? "");
    setTime(minToHm(next?.startMin ?? 0));
    setDurationMin(next?.durationMin ?? 60);
    setServiceId(next?.serviceId ?? "");
    setEmployeeId(next?.employeeId ?? "");
  }, [appointmentId, store.appointments, editing]);

  const linkedForms = useMemo(
    () =>
      store.forms.filter(
        (f) => f.showInCalendarDescription && f.active && !f.isDraft,
      ),
    [store.forms],
  );

  if (!row) {
    return (
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-10">
        <div className="absolute inset-0" onClick={onClose} role="presentation" />
        <div className="relative z-10 w-full max-w-lg rounded-lg border border-karsa-border bg-karsa-bg p-6">
          <p className="text-sm text-karsa-danger">Appointment not found.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const startIso = localDateTimeIso(row.date, row.startMin);
  const endIso = localDateTimeIso(row.date, row.startMin + row.durationMin);

  function save() {
    if (!row) return;
    upsertAppointment({
      ...row,
      date,
      startMin: hmToMin(time),
      serviceId,
      employeeId,
      durationMin: Math.max(15, durationMin || row.durationMin),
    });
    setEditing(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 p-4 py-10">
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
      />
      <div
        className="relative z-10 w-full max-w-lg rounded-lg border border-karsa-border bg-karsa-bg p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appt-detail-title"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-karsa-faint uppercase">
              Details
            </p>
            <h2
              id="appt-detail-title"
              className="mt-1 font-display text-2xl text-karsa-text"
            >
              Appointment
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-muted hover:bg-karsa-surface"
          >
            Close
          </button>
        </div>

        {editing ? (
          <div className="mt-6 space-y-4 border-t border-karsa-border-subtle pt-4">
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
              Service
              <div className="mt-1">
                <KarsaSelect
                  value={serviceId}
                  options={store.services.map((s) => ({
                    value: s.id,
                    label: s.name,
                  }))}
                  onChange={(id) => {
                    setServiceId(id);
                    const next = store.services.find((s) => s.id === id);
                    if (next) setDurationMin(next.durationMin);
                  }}
                />
              </div>
            </label>
            <label className="block text-xs text-karsa-faint">
              Duration (minutes)
              <input
                type="number"
                min={15}
                step={15}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value) || 15)}
                className="mt-1 w-full rounded-md border border-karsa-border bg-karsa-bg px-3 py-2 text-sm text-karsa-text outline-none ring-karsa-accent/40 focus:ring-2"
              />
            </label>
            <label className="block text-xs text-karsa-faint">
              Staff
              <div className="mt-1">
                <KarsaSelect
                  value={employeeId}
                  options={store.employees.map((e) => ({
                    value: e.id,
                    label: e.name,
                  }))}
                  onChange={setEmployeeId}
                />
              </div>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={save}
                className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <dl className="mt-6 space-y-3 border-t border-karsa-border-subtle pt-4 text-sm text-karsa-muted">
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Client</dt>
              <dd className="mt-1 text-karsa-text">
                {client ? clientDisplayName(client) : "Client"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Service</dt>
              <dd className="mt-1 text-karsa-text">
                {service?.name ?? "Service"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Time</dt>
              <dd className="mt-1 text-karsa-text">
                {formatTime(startIso)} – {formatTime(endIso)}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-karsa-faint uppercase">Employee</dt>
              <dd className="mt-1 text-karsa-text">
                {employee?.name ?? "Staff"}
              </dd>
            </div>
          </dl>
        )}

        <div className="mt-6 space-y-3 border-t border-karsa-border-subtle pt-4">
          <p className="text-sm text-karsa-muted">
            In the live app, appointment-linked forms appear here so staff can
            open and fill Client Intake, Session Notes, and other linked forms
            for this visit.
          </p>
          {linkedForms.length === 0 ? (
            <p className="text-xs text-karsa-faint">
              No appointment-linked forms in this demo yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {linkedForms.map((f) => (
                <li key={f.id}>
                  <div className="inline-flex w-full items-center gap-2 rounded-md border border-karsa-border px-3 py-1.5 text-left text-sm text-karsa-text opacity-80">
                    <span className="text-karsa-warning">○</span>
                    {f.name}
                    <span className="ml-auto text-[11px] text-karsa-faint">
                      {f.audience === "staff" ? "Staff" : "Client"}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-karsa-accent/40 px-4 py-2 text-sm font-medium text-karsa-accent-strong"
            >
              Edit
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-karsa-accent px-4 py-2 text-sm font-medium text-karsa-bg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              deleteAppointment(appointmentId);
              onClose();
            }}
            className="rounded-md border border-karsa-border px-4 py-2 text-sm text-karsa-muted hover:border-karsa-danger hover:text-karsa-danger"
          >
            Remove from demo
          </button>
        </div>
      </div>
    </div>
  );
}
