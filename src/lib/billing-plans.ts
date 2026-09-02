export const EXTRA_PRACTITIONER_USD = 12;

export type BillingPlanId = "solo" | "studio" | "practice";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  monthlyUsd: number;
  includedPractitioners: number | null;
  locations: number | null;
  googleCalendar: boolean;
  googleDrive: boolean;
  sms: boolean;
  blurb: string;
  features: string[];
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "solo",
    name: "Solo",
    monthlyUsd: 29,
    includedPractitioners: 1,
    locations: 1,
    googleCalendar: true,
    googleDrive: false,
    sms: false,
    blurb:
      "One studio, one included bookable practitioner. Add teammates at $12 each without leaving this plan.",
    features: [
      "1 bookable practitioner included",
      "+$12 per extra bookable practitioner",
      "1 location",
      "Unlimited appointments",
      "Forms, waitlist, and email reminders",
      "Google Calendar sync",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    monthlyUsd: 59,
    includedPractitioners: 5,
    locations: 2,
    googleCalendar: true,
    googleDrive: true,
    sms: true,
    blurb:
      "Small teams: five included practitioners, two locations, Drive folders, and SMS.",
    features: [
      "5 bookable practitioners included",
      "+$12 per extra bookable practitioner",
      "2 locations",
      "Everything in Solo",
      "Google Drive sync",
      "SMS reminders",
    ],
  },
  {
    id: "practice",
    name: "Practice",
    monthlyUsd: 99,
    includedPractitioners: null,
    locations: null,
    googleCalendar: true,
    googleDrive: true,
    sms: true,
    blurb:
      "No seat or location math. Calendar, Drive, and SMS included.",
    features: [
      "Unlimited bookable practitioners",
      "Unlimited locations",
      "Everything in Studio",
      "Google Calendar and Drive sync",
      "SMS reminders",
    ],
  },
];

export function extraPractitioners(
  plan: BillingPlan,
  bookableCount: number,
): number {
  if (plan.includedPractitioners == null) return 0;
  return Math.max(0, bookableCount - plan.includedPractitioners);
}

export function monthlyTotalUsd(
  plan: BillingPlan,
  bookableCount: number,
): number {
  return (
    plan.monthlyUsd + extraPractitioners(plan, bookableCount) * EXTRA_PRACTITIONER_USD
  );
}

/** Annual is billed as 11 months (first month free). */
export function annualTotalUsd(
  plan: BillingPlan,
  bookableCount: number,
): number {
  return monthlyTotalUsd(plan, bookableCount) * 11;
}

export function cheapestPlanId(bookableCount: number): BillingPlanId {
  let best: BillingPlan = BILLING_PLANS[0]!;
  let bestPrice = monthlyTotalUsd(best, bookableCount);
  for (const plan of BILLING_PLANS.slice(1)) {
    const price = monthlyTotalUsd(plan, bookableCount);
    if (price < bestPrice) {
      best = plan;
      bestPrice = price;
    }
  }
  return best.id;
}
