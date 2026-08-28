import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { INSIGHTS_RANGE_OPTIONS, rangeAxisBuckets } from "../lib/insights-range";
import { KarsaSelect } from "./inputs/KarsaSelect";
import { KarsaToggleField } from "./karsa-toggle-switch";

export type MetricPoint = {
  id: string;
  day: string;
  status: string;
  serviceId: string;
  serviceName: string;
  color: string;
  employeeId: string | null;
};

export type MetricService = {
  id: string;
  name: string;
  color: string;
  active: boolean;
  listPrice: number;
};

export type MetricEmployee = {
  id: string;
  label: string;
};

type SeriesKind = "booked" | "cancelled" | "no_show";

function statusMatchesBookedMode(
  status: string,
  mode: "all" | "scheduled" | "completed",
) {
  if (mode === "scheduled") return status === "scheduled";
  if (mode === "completed") return status === "completed";
  return status === "scheduled" || status === "completed";
}

function strokeForKind(kind: SeriesKind) {
  if (kind === "cancelled") return "6 4";
  if (kind === "no_show") return "2 4";
  return undefined;
}

function buildBuckets(days: string[], range: string) {
  if (days.length === 0) return [] as string[];
  const unique = [...new Set(days)].sort();
  if (range === "12m") {
    return [...new Set(unique.map((d) => d.slice(0, 7)))].sort();
  }
  return unique;
}

function bucketOf(day: string, range: string) {
  return range === "12m" ? day.slice(0, 7) : day;
}

function formatBucketLabel(bucket: string, range: string) {
  if (range === "12m") {
    const [y, m] = bucket.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString(undefined, {
      month: "short",
      year: "2-digit",
    });
  }
  const [y, m, d] = bucket.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function MetricsClient({
  range,
  employeeId,
  points,
  services,
  employees,
}: {
  range: string;
  employeeId: string | null;
  points: MetricPoint[];
  services: MetricService[];
  employees: MetricEmployee[];
}) {
  const navigate = useNavigate();
  const activeServices = services.filter((s) => s.active);
  const [enabledServices, setEnabledServices] = useState<Record<string, boolean>>(
    () => Object.fromEntries(activeServices.map((s) => [s.id, true])),
  );
  const [showBooked, setShowBooked] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const [showNoShow, setShowNoShow] = useState(false);
  const [showScheduledOnly, setShowScheduledOnly] = useState(false);
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const filteredPoints = useMemo(() => {
    let rows = points;
    if (employeeId) {
      rows = rows.filter((p) => p.employeeId === employeeId);
    }
    return rows;
  }, [points, employeeId]);

  const buckets = useMemo(() => {
    const days = filteredPoints.map((p) => p.day);
    return buildBuckets(days, range);
  }, [filteredPoints, range]);

  const chartBuckets =
    buckets.length > 0 ? buckets : rangeAxisBuckets(range);

  const bookedMode: "all" | "scheduled" | "completed" | "off" =
    showScheduledOnly
      ? "scheduled"
      : showCompletedOnly
        ? "completed"
        : showBooked
          ? "all"
          : "off";

  const kinds = useMemo(() => {
    const list: SeriesKind[] = [];
    if (bookedMode !== "off") list.push("booked");
    if (showCancelled) list.push("cancelled");
    if (showNoShow) list.push("no_show");
    return list;
  }, [bookedMode, showCancelled, showNoShow]);

  const series = useMemo(() => {
    const result: {
      key: string;
      serviceId: string;
      name: string;
      color: string;
      kind: SeriesKind;
      values: number[];
    }[] = [];

    for (const service of activeServices) {
      if (!enabledServices[service.id]) continue;
      for (const kind of kinds) {
        const values = buckets.map((bucket) => {
          let count = 0;
          for (const p of filteredPoints) {
            if (p.serviceId !== service.id) continue;
            if (bucketOf(p.day, range) !== bucket) continue;
            if (kind === "booked") {
              if (
                bookedMode === "off" ||
                !statusMatchesBookedMode(p.status, bookedMode)
              ) {
                continue;
              }
            } else if (kind === "cancelled") {
              if (p.status !== "cancelled") continue;
            } else if (p.status !== "no_show") {
              continue;
            }
            count += 1;
          }
          return count;
        });
        const suffix =
          kind === "cancelled"
            ? " · cancelled"
            : kind === "no_show"
              ? " · no-show"
              : bookedMode === "scheduled"
                ? " · scheduled"
                : bookedMode === "completed"
                  ? " · completed"
                  : "";
        result.push({
          key: `${service.id}:${kind}`,
          serviceId: service.id,
          name: `${service.name}${suffix}`,
          color: service.color,
          kind,
          values,
        });
      }
    }
    return result;
  }, [
    activeServices,
    enabledServices,
    kinds,
    buckets,
    filteredPoints,
    range,
    bookedMode,
  ]);

  const maxY = Math.max(1, ...series.flatMap((s) => s.values), 1);

  const totals = useMemo(() => {
    const t = { booked: 0, completed: 0, cancelled: 0, noShow: 0 };
    for (const p of filteredPoints) {
      if (!enabledServices[p.serviceId]) continue;
      if (p.status === "cancelled") t.cancelled += 1;
      else if (p.status === "no_show") t.noShow += 1;
      else if (p.status === "completed") {
        t.completed += 1;
        t.booked += 1;
      } else if (p.status === "scheduled") t.booked += 1;
    }
    return t;
  }, [filteredPoints, enabledServices]);

  function pushQuery(next: { range?: string; employeeId?: string | null }) {
    const params = new URLSearchParams();
    const r = next.range ?? range;
    if (r !== "month") params.set("range", r);
    const emp =
      next.employeeId === undefined ? employeeId : next.employeeId;
    if (emp) params.set("employeeId", emp);
    const qs = params.toString();
    navigate(
      qs
        ? `/dashboard/insights/metrics?${qs}`
        : "/dashboard/insights/metrics",
    );
  }

  const width = 720;
  const height = 280;
  const pad = { top: 16, right: 16, bottom: 36, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  function xAt(i: number) {
    if (chartBuckets.length <= 1) return pad.left + plotW / 2;
    return pad.left + (i / (chartBuckets.length - 1)) * plotW;
  }

  function yAt(v: number) {
    return pad.top + plotH - (v / maxY) * plotH;
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="block min-w-[11rem] text-xs font-medium tracking-wide text-karsa-faint uppercase">
          Timeframe
          <div className="mt-1">
            <KarsaSelect
              aria-label="Timeframe"
              value={range}
              options={[...INSIGHTS_RANGE_OPTIONS]}
              onChange={(value) => pushQuery({ range: value })}
            />
          </div>
        </label>
        <label className="block min-w-[14rem] flex-1 text-xs font-medium tracking-wide text-karsa-faint uppercase">
          Practitioner
          <div className="mt-1">
            <KarsaSelect
              aria-label="Practitioner"
              value={employeeId ?? ""}
              options={[
                { value: "", label: "All employees" },
                ...employees.map((e) => ({ value: e.id, label: e.label })),
              ]}
              onChange={(value) =>
                pushQuery({ employeeId: value || null })
              }
            />
          </div>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Booked", totals.booked],
          ["Completed", totals.completed],
          ["Cancelled", totals.cancelled],
          ["No-show", totals.noShow],
        ].map(([label, value]) => (
          <div
            key={label as string}
            className="rounded-md border border-karsa-border-subtle px-4 py-3"
          >
            <p className="text-xs tracking-wide text-karsa-faint uppercase">
              {label}
            </p>
            <p className="mt-1 font-display text-2xl text-karsa-text">
              {value as number}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-md border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Chart series</h2>
        <p className="mt-1 text-xs text-karsa-faint">
          Solid lines are booked volume by service color. Turn on cancellations
          or no-shows for dashed / dotted overlays in the same colors.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <KarsaToggleField
            label="Booked (scheduled + completed)"
            description="Main solid lines per service."
            checked={showBooked && !showScheduledOnly && !showCompletedOnly}
            onChange={(on) => {
              setShowBooked(on);
              if (on) {
                setShowScheduledOnly(false);
                setShowCompletedOnly(false);
              }
            }}
          />
          <KarsaToggleField
            label="Scheduled only"
            description="Solid lines count upcoming scheduled visits only."
            checked={showScheduledOnly}
            onChange={(on) => {
              setShowScheduledOnly(on);
              if (on) {
                setShowCompletedOnly(false);
                setShowBooked(true);
              }
            }}
          />
          <KarsaToggleField
            label="Completed only"
            description="Solid lines count completed visits only."
            checked={showCompletedOnly}
            onChange={(on) => {
              setShowCompletedOnly(on);
              if (on) {
                setShowScheduledOnly(false);
                setShowBooked(true);
              }
            }}
          />
          <KarsaToggleField
            label="Cancellations"
            description="Dashed lines per service."
            checked={showCancelled}
            onChange={setShowCancelled}
          />
          <KarsaToggleField
            label="No-shows"
            description="Dotted lines per service."
            checked={showNoShow}
            onChange={setShowNoShow}
          />
        </div>
      </section>

      <section className="rounded-md border border-karsa-border-subtle p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium text-karsa-text">Services</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="text-xs text-karsa-accent-strong underline-offset-4 hover:underline"
              onClick={() =>
                setEnabledServices(
                  Object.fromEntries(activeServices.map((s) => [s.id, true])),
                )
              }
            >
              Show all
            </button>
            <button
              type="button"
              className="text-xs text-karsa-faint underline-offset-4 hover:underline"
              onClick={() =>
                setEnabledServices(
                  Object.fromEntries(activeServices.map((s) => [s.id, false])),
                )
              }
            >
              Hide all
            </button>
          </div>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {activeServices.map((s) => {
            const on = enabledServices[s.id] !== false;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() =>
                    setEnabledServices((prev) => ({
                      ...prev,
                      [s.id]: !on,
                    }))
                  }
                  className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                    on
                      ? "border-karsa-accent/40 bg-karsa-accent-soft/40 text-karsa-text"
                      : "border-karsa-border-subtle text-karsa-faint"
                  }`}
                >
                  <span
                    className="size-2.5 rounded-sm"
                    style={{ background: s.color }}
                    aria-hidden
                  />
                  {s.name}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="overflow-x-auto rounded-md border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Volume over time</h2>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-4 w-full min-w-[520px] text-karsa-faint"
          role="img"
          aria-label="Appointment volume line chart by service"
        >
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const y = yAt(maxY * t);
            return (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={width - pad.right}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  strokeOpacity={0.25}
                />
                <text
                  x={pad.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-karsa-faint"
                  fontSize={10}
                >
                  {Math.round(maxY * t)}
                </text>
              </g>
            );
          })}
          {chartBuckets.map((b, i) => {
            const show =
              chartBuckets.length <= 8 ||
              i === 0 ||
              i === chartBuckets.length - 1 ||
              i % Math.ceil(chartBuckets.length / 6) === 0;
            if (!show) return null;
            return (
              <text
                key={b}
                x={xAt(i)}
                y={height - 10}
                textAnchor="middle"
                className="fill-karsa-faint"
                fontSize={10}
              >
                {formatBucketLabel(b, range)}
              </text>
            );
          })}
          {series.map((s) => {
            const d = s.values
              .map((v, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(v)}`)
              .join(" ");
            return (
              <path
                key={s.key}
                d={d}
                fill="none"
                stroke={s.color}
                strokeWidth={2.25}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={strokeForKind(s.kind)}
                opacity={s.kind === "booked" ? 1 : 0.85}
              />
            );
          })}
        </svg>
        {series.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-karsa-muted">
            {series.map((s) => (
              <li key={s.key} className="inline-flex items-center gap-2">
                <span
                  className="inline-block h-0.5 w-5"
                  style={{
                    background: s.color,
                    borderTop:
                      s.kind === "cancelled"
                        ? `2px dashed ${s.color}`
                        : s.kind === "no_show"
                          ? `2px dotted ${s.color}`
                          : undefined,
                    backgroundColor:
                      s.kind === "booked" ? s.color : "transparent",
                  }}
                  aria-hidden
                />
                {s.name}
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
