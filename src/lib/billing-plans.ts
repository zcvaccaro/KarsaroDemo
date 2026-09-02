export const EXTRA_PRACTITIONER_USD = 12;
export const EXTRA_LOCATION_USD = 69;

export type BillingPlanId = "solo" | "studio" | "practice";

export type BillingPlan = {
  id: BillingPlanId;
  name: string;
  monthlyUsd: number;
  /** Included bookable people. Null = unlimited. */
  includedPractitioners: number | null;
  /** Null = no seat cap. */
  maxPractitioners: number | null;
  includedLocations: number;
  /** Null = no cap. */
  maxLocations: number | null;
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
    maxPractitioners: null,
    includedLocations: 1,
    maxLocations: 1,
    googleCalendar: true,
    googleDrive: false,
    sms: false,
    blurb:
      "One location, one included bookable practitioner. Add teammates at $12 each. Calendar sync; email reminders only.",
    features: [
      "1 bookable practitioner included",
      "+$12 per extra bookable practitioner",
      "1 location (cannot add more)",
      "Unlimited appointments",
      "Forms, waitlist, and email reminders",
      "Google Calendar sync",
    ],
  },
  {
    id: "studio",
    name: "Studio",
    monthlyUsd: 69,
    includedPractitioners: 5,
    maxPractitioners: 10,
    includedLocations: 1,
    maxLocations: 2,
    googleCalendar: true,
    googleDrive: false,
    sms: true,
    blurb:
      "Five included bookable people, up to 10. A second location is $69 and does not add seats. SMS and Calendar; Drive is on Practice.",
    features: [
      "5 bookable practitioners included",
      "+$12 per extra bookable practitioner (max 10)",
      "1 location included · second +$69 (max 2)",
      "Everything in Solo",
      "SMS reminders",
      "Google Calendar sync",
    ],
  },
  {
    id: "practice",
    name: "Practice",
    monthlyUsd: 99,
    includedPractitioners: null,
    maxPractitioners: null,
    includedLocations: 1,
    maxLocations: null,
    googleCalendar: true,
    googleDrive: true,
    sms: true,
    blurb:
      "Unlimited bookable people. Extra locations $69 each. Calendar, SMS, and Drive.",
    features: [
      "Unlimited bookable practitioners",
      "1 location included · extra locations +$69",
      "Everything in Studio",
      "Google Drive sync",
      "SMS reminders",
      "Google Calendar sync",
    ],
  },
];

export function planFitsLocations(
  plan: BillingPlan,
  locationCount: number,
): boolean {
  return plan.maxLocations == null || locationCount <= plan.maxLocations;
}

export function planFitsPractitioners(
  plan: BillingPlan,
  bookableCount: number,
): boolean {
  return plan.maxPractitioners == null || bookableCount <= plan.maxPractitioners;
}

export function extraLocations(
  plan: BillingPlan,
  locationCount: number,
): number {
  if (!planFitsLocations(plan, locationCount)) return 0;
  return Math.max(0, locationCount - plan.includedLocations);
}

export function extraPractitioners(
  plan: BillingPlan,
  bookableCount: number,
): number {
  if (plan.includedPractitioners == null) return 0;
  return Math.max(0, bookableCount - plan.includedPractitioners);
}

export function planUnavailableReason(
  plan: BillingPlan,
  bookableCount: number,
  locationCount: number,
): string | null {
  const locOk = planFitsLocations(plan, locationCount);
  const seatOk = planFitsPractitioners(plan, bookableCount);
  if (locOk && seatOk) return null;
  if (!locOk && !seatOk) {
    return `Up to ${plan.maxLocations} locations and ${plan.maxPractitioners} practitioners`;
  }
  if (!locOk) {
    return plan.maxLocations === 1
      ? "One location only"
      : `Up to ${plan.maxLocations} locations`;
  }
  return `Up to ${plan.maxPractitioners} practitioners`;
}

/** Null when this plan cannot cover the team or location count. */
export function monthlyTotalUsd(
  plan: BillingPlan,
  bookableCount: number,
  locationCount: number,
): number | null {
  if (!planFitsLocations(plan, locationCount)) return null;
  if (!planFitsPractitioners(plan, bookableCount)) return null;
  return (
    plan.monthlyUsd +
    extraLocations(plan, locationCount) * EXTRA_LOCATION_USD +
    extraPractitioners(plan, bookableCount) * EXTRA_PRACTITIONER_USD
  );
}

/** Annual is billed as 11 months (first month free). */
export function annualTotalUsd(
  plan: BillingPlan,
  bookableCount: number,
  locationCount: number,
): number | null {
  const monthly = monthlyTotalUsd(plan, bookableCount, locationCount);
  return monthly == null ? null : monthly * 11;
}

export function cheapestPlanId(
  bookableCount: number,
  locationCount: number,
): BillingPlanId | null {
  let best: BillingPlan | null = null;
  let bestPrice = Infinity;
  for (const plan of BILLING_PLANS) {
    const price = monthlyTotalUsd(plan, bookableCount, locationCount);
    if (price == null) continue;
    if (price < bestPrice) {
      best = plan;
      bestPrice = price;
    }
  }
  return best?.id ?? null;
}
