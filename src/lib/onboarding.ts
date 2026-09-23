export type OnboardingStep = {
  id: string;
  title: string;
  body: string;
  href: string;
  spotlight?: "help" | "import";
};

export function onboardingStepIndex(
  pathname: string,
  steps: OnboardingStep[],
): number {
  let best = -1;
  let bestLen = -1;
  steps.forEach((step, index) => {
    const exact = pathname === step.href;
    const nested = pathname.startsWith(`${step.href}/`);
    if (!exact && !nested) return;
    if (step.href.length > bestLen) {
      best = index;
      bestLen = step.href.length;
    }
  });
  return best;
}

export const DEMO_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "overview",
    title: "Welcome",
    body: "This is Overview — today’s snapshot and shortcuts. The next slides walk through each setup page. Nothing here is saved until you edit and save on that page.",
    href: "/dashboard",
  },
  {
    id: "business",
    title: "Business settings",
    body: "Set timezone, buffers, reminders, deposits, Stripe, and the policy wording used on forms.",
    href: "/dashboard/settings",
  },
  {
    id: "locations",
    title: "Locations",
    body: "Add each studio and its operating hours. Closed days block the calendar.",
    href: "/dashboard/locations",
  },
  {
    id: "services",
    title: "Services",
    body: "Add the services you offer, colors, durations, and prices. Assign them on employee profiles.",
    href: "/dashboard/services",
  },
  {
    id: "employees",
    title: "Employees",
    body: "Add staff, set availability, assign services, and choose roles.",
    href: "/dashboard/employees",
  },
  {
    id: "clients",
    title: "Clients",
    body: "Open a client profile to see contact details, appointment history, and the forms attached to each visit.",
    href: "/dashboard/clients",
  },
  {
    id: "import-clients",
    title: "Import clients",
    body: "Moving from another booking product? Export a CSV and map columns here to bring clients into Karsaro.",
    href: "/dashboard/clients/import",
  },
  {
    id: "forms",
    title: "Form editor",
    body: "Edit the required Booking Form. Toggle sections and save. Intake and Session Notes are optional.",
    href: "/dashboard/forms",
  },
  {
    id: "booking-flow",
    title: "Booking flow",
    body: "Arrange client forms left to right and mark where the appointment is created. Use Test your flow.",
    href: "/dashboard/settings/booking-flow",
  },
  {
    id: "messaging",
    title: "Messaging",
    body: "Review confirmation, reminder, waitlist, and cancellation emails. SMS is on Studio and Practice.",
    href: "/dashboard/settings/email",
  },
  {
    id: "calendar",
    title: "Calendar",
    body: "Click a blank time to book, add a break, or waitlist. Click an appointment or grey break for details.",
    href: "/dashboard/calendar",
  },
  {
    id: "help",
    title: "Helper",
    body: "The Help button in the lower right answers how Karsaro works. Ask a specific question any time — it does not see live appointments or clients.",
    href: "/dashboard/calendar",
    spotlight: "help",
  },
];
