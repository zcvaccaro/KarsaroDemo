import { useMemo, useState } from "react";
import { PageLink } from "./PageLink";
import {
  BILLING_PLANS,
  EXTRA_LOCATION_USD,
  EXTRA_PRACTITIONER_USD,
  annualTotalUsd,
  cheapestPlanId,
  extraLocations,
  extraPractitioners,
  includedPractitioners,
  monthlyTotalUsd,
  type BillingPlan,
} from "../lib/billing-plans";

function formatUsd(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

function CountStepper({
  label,
  hint,
  value,
  min,
  max,
  onChange,
  decrementLabel,
  incrementLabel,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
  decrementLabel: string;
  incrementLabel: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
        {label}
      </p>
      <p className="mt-1 text-xs text-karsa-faint">{hint}</p>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          aria-label={decrementLabel}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-text disabled:opacity-40"
        >
          −
        </button>
        <span className="min-w-[2ch] text-center font-display text-2xl text-karsa-text">
          {value}
        </span>
        <button
          type="button"
          aria-label={incrementLabel}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-text disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function BillingPlans({
  currentPlanId = "trial",
}: {
  currentPlanId?: string;
}) {
  const [annual, setAnnual] = useState(false);
  const [bookableCount, setBookableCount] = useState(1);
  const [locationCount, setLocationCount] = useState(1);
  const bestId = useMemo(
    () => cheapestPlanId(bookableCount, locationCount),
    [bookableCount, locationCount],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-karsa-border-subtle p-4">
        <h2 className="text-sm font-medium text-karsa-text">Current plan</h2>
        <p className="mt-2 font-display text-2xl capitalize text-karsa-text">
          {currentPlanId}
        </p>
        <p className="mt-2 text-xs leading-relaxed text-karsa-faint">
          Checkout is not live in this demo. Prices below are the launch SKUs —
          Google Calendar on every plan, SMS from Studio, Drive on Practice.
        </p>
      </section>

      <section className="flex flex-col gap-6 rounded-md border border-karsa-border-subtle p-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <CountStepper
            label="Bookable practitioners"
            hint={`Admins and receptionists who are not bookable do not count. Extra seats are ${formatUsd(EXTRA_PRACTITIONER_USD)} on Solo and Studio.`}
            value={bookableCount}
            min={1}
            max={40}
            onChange={setBookableCount}
            decrementLabel="Fewer practitioners"
            incrementLabel="More practitioners"
          />
          <CountStepper
            label="Locations"
            hint={`Solo is one site. Studio can add a second for ${formatUsd(EXTRA_LOCATION_USD)} and five more seats. Practice adds sites at ${formatUsd(EXTRA_LOCATION_USD)} each.`}
            value={locationCount}
            min={1}
            max={12}
            onChange={setLocationCount}
            decrementLabel="Fewer locations"
            incrementLabel="More locations"
          />
        </div>
        <div className="flex rounded-md border border-karsa-border p-1 self-start">
          <button
            type="button"
            onClick={() => setAnnual(false)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              !annual
                ? "bg-karsa-accent text-karsa-bg"
                : "text-karsa-muted"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setAnnual(true)}
            className={`rounded px-3 py-1.5 text-xs font-medium ${
              annual
                ? "bg-karsa-accent text-karsa-bg"
                : "text-karsa-muted"
            }`}
          >
            Annual · first month free
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-karsa-text">Plans</h2>
        <ul className="grid gap-3 lg:grid-cols-3">
          {BILLING_PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              annual={annual}
              bookableCount={bookableCount}
              locationCount={locationCount}
              current={currentPlanId === plan.id}
              recommended={bestId === plan.id}
            />
          ))}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-karsa-faint">
        Annual billing charges 11 months and includes the 12th free. Extra
        practitioners and locations use the same first-month-free math.{" "}
        <PageLink to="/dashboard/settings/google">Google Calendar</PageLink> is
        on every plan. SMS starts at Studio.{" "}
        <PageLink to="/dashboard/settings/drive">Google Drive</PageLink> is
        Practice. Client payments still go through your own payment link under{" "}
        <PageLink to="/dashboard/settings">Business settings</PageLink> — this
        page is only the Karsaro software subscription.
      </p>
    </div>
  );
}

function PlanCard({
  plan,
  annual,
  bookableCount,
  locationCount,
  current,
  recommended,
}: {
  plan: BillingPlan;
  annual: boolean;
  bookableCount: number;
  locationCount: number;
  current: boolean;
  recommended: boolean;
}) {
  const monthly = monthlyTotalUsd(plan, bookableCount, locationCount);
  const annualTotal = annualTotalUsd(plan, bookableCount, locationCount);
  const available = monthly != null && annualTotal != null;
  const extras = extraPractitioners(plan, bookableCount, locationCount);
  const extraSites = extraLocations(plan, locationCount);
  const includedSeats = includedPractitioners(plan, locationCount);

  const priceBits: string[] = [];
  if (available) {
    priceBits.push(
      annual
        ? `${formatUsd(plan.monthlyUsd)}/mo list · first month free`
        : `${formatUsd(plan.monthlyUsd)}/mo list`,
    );
    if (extraSites > 0) {
      priceBits.push(
        `${extraSites} extra location${extraSites === 1 ? "" : "s"} × ${formatUsd(EXTRA_LOCATION_USD)}`,
      );
    }
    if (extras > 0) {
      priceBits.push(
        `${extras} extra × ${formatUsd(EXTRA_PRACTITIONER_USD)}`,
      );
    } else if (includedSeats != null) {
      priceBits.push(`${includedSeats} included`);
    } else {
      priceBits.push("unlimited seats");
    }
  }

  return (
    <li
      className={`flex flex-col rounded-md border px-4 py-4 ${
        current
          ? "border-karsa-accent/50 bg-karsa-accent-soft/20"
          : recommended
            ? "border-karsa-accent/35"
            : "border-karsa-border-subtle"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-karsa-text">{plan.name}</p>
        {current ? (
          <span className="text-xs text-karsa-accent-strong">Current</span>
        ) : recommended ? (
          <span className="text-xs text-karsa-accent-strong">
            Best for this team
          </span>
        ) : null}
      </div>
      <p className="mt-2 font-display text-2xl text-karsa-text">
        {!available
          ? "—"
          : annual
            ? `${formatUsd(annualTotal)}/yr`
            : `${formatUsd(monthly)}/mo`}
      </p>
      <p className="mt-1 text-xs text-karsa-faint">
        {available
          ? priceBits.join(" · ")
          : plan.maxLocations === 1
            ? "One location only"
            : `Up to ${plan.maxLocations} locations`}
      </p>
      <p className="mt-3 text-xs leading-relaxed text-karsa-muted">{plan.blurb}</p>
      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-karsa-muted">
        {plan.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-4 cursor-not-allowed rounded-md border border-karsa-border px-3 py-2 text-xs text-karsa-faint"
        title="Checkout coming soon"
      >
        {current ? "Selected" : "Coming soon"}
      </button>
    </li>
  );
}
