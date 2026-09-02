import { useMemo, useState } from "react";
import { PageLink } from "./PageLink";
import {
  BILLING_PLANS,
  EXTRA_PRACTITIONER_USD,
  annualTotalUsd,
  cheapestPlanId,
  extraPractitioners,
  monthlyTotalUsd,
  type BillingPlan,
} from "../lib/billing-plans";

function formatUsd(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export function BillingPlans({
  currentPlanId = "trial",
}: {
  currentPlanId?: string;
}) {
  const [annual, setAnnual] = useState(false);
  const [bookableCount, setBookableCount] = useState(1);
  const bestId = useMemo(
    () => cheapestPlanId(bookableCount),
    [bookableCount],
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
          Google Calendar is on every plan; Drive and SMS start at Studio.
        </p>
      </section>

      <section className="flex flex-col gap-4 rounded-md border border-karsa-border-subtle p-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-karsa-faint uppercase">
            Bookable practitioners
          </p>
          <p className="mt-1 text-xs text-karsa-faint">
            Admins and receptionists who are not bookable do not count. Extra
            seats are {formatUsd(EXTRA_PRACTITIONER_USD)} each on Solo and
            Studio.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              aria-label="Fewer practitioners"
              disabled={bookableCount <= 1}
              onClick={() => setBookableCount((n) => Math.max(1, n - 1))}
              className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-text disabled:opacity-40"
            >
              −
            </button>
            <span className="min-w-[2ch] text-center font-display text-2xl text-karsa-text">
              {bookableCount}
            </span>
            <button
              type="button"
              aria-label="More practitioners"
              onClick={() => setBookableCount((n) => Math.min(40, n + 1))}
              className="rounded-md border border-karsa-border px-3 py-1.5 text-sm text-karsa-text"
            >
              +
            </button>
          </div>
        </div>
        <div className="flex rounded-md border border-karsa-border p-1">
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
              current={currentPlanId === plan.id}
              recommended={bestId === plan.id}
            />
          ))}
        </ul>
      </section>

      <p className="text-xs leading-relaxed text-karsa-faint">
        Annual billing charges 11 months and includes the 12th free. Extra
        practitioners use the same first-month-free math.{" "}
        <PageLink to="/dashboard/settings/google">Google Calendar</PageLink> is
        on every plan;{" "}
        <PageLink to="/dashboard/settings/drive">Google Drive</PageLink> and SMS
        are Studio and Practice. Client payments still go through your own
        payment link under{" "}
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
  current,
  recommended,
}: {
  plan: BillingPlan;
  annual: boolean;
  bookableCount: number;
  current: boolean;
  recommended: boolean;
}) {
  const monthly = monthlyTotalUsd(plan, bookableCount);
  const annualTotal = annualTotalUsd(plan, bookableCount);
  const extras = extraPractitioners(plan, bookableCount);

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
        {annual ? `${formatUsd(annualTotal)}/yr` : `${formatUsd(monthly)}/mo`}
      </p>
      <p className="mt-1 text-xs text-karsa-faint">
        {annual
          ? `${formatUsd(plan.monthlyUsd)}/mo list · first month free`
          : `${formatUsd(plan.monthlyUsd)}/mo list`}
        {extras > 0
          ? ` · ${extras} extra × ${formatUsd(EXTRA_PRACTITIONER_USD)}`
          : plan.includedPractitioners != null
            ? ` · ${plan.includedPractitioners} included`
            : " · unlimited seats"}
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
