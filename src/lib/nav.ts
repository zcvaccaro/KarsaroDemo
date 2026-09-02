export type NavItem = {
  href: string;
  label: string;
  description: string;
  mode: "interactive" | "shell";
};

export type NavGroup = { label: string; items: NavItem[] };

/** Mirrors production `dashboardNav` — paths match the real app. */
export const demoNav: NavGroup[] = [
  {
    label: "Schedule",
    items: [
      {
        href: "/dashboard",
        label: "Overview",
        description: "Day snapshot and shortcuts",
        mode: "interactive",
      },
      {
        href: "/dashboard/calendar",
        label: "Calendar",
        description: "Master calendar across employees",
        mode: "interactive",
      },
      {
        href: "/dashboard/bookings/new",
        label: "Book Now",
        description: "Create an appointment for a client",
        mode: "interactive",
      },
      {
        href: "/dashboard/waitlist",
        label: "Waitlist",
        description: "Manual offers when slots open",
        mode: "shell",
      },
    ],
  },
  {
    label: "People",
    items: [
      {
        href: "/dashboard/clients",
        label: "Clients",
        description: "CRM and returning lookup",
        mode: "shell",
      },
      {
        href: "/dashboard/employees",
        label: "Employees",
        description: "Staff, hours, and services",
        mode: "shell",
      },
    ],
  },
  {
    label: "Forms",
    items: [
      {
        href: "/dashboard/forms",
        label: "Forms",
        description: "Booking, intake, Session Notes, custom",
        mode: "interactive",
      },
      {
        href: "/dashboard/forms/confirmations",
        label: "Confirmations",
        description: "Messages paired with each client form",
        mode: "interactive",
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        href: "/dashboard/insights/metrics",
        label: "Metrics",
        description: "Appointments and cancellations over time",
        mode: "shell",
      },
      {
        href: "/dashboard/insights/income",
        label: "Estimated income",
        description: "List-price value from completed visits",
        mode: "shell",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        href: "/dashboard/settings/booking-flow",
        label: "Booking flow",
        description: "Book Now step chain and confirmations",
        mode: "interactive",
      },
      {
        href: "/dashboard/settings",
        label: "Business",
        description: "Timezone, buffers, reminders",
        mode: "shell",
      },
      {
        href: "/dashboard/services",
        label: "Services",
        description: "Durations, buffers, pricing",
        mode: "interactive",
      },
      {
        href: "/dashboard/locations",
        label: "Locations",
        description: "Studios and addresses",
        mode: "interactive",
      },
      {
        href: "/dashboard/settings/email",
        label: "Messaging",
        description: "Templates and payment link",
        mode: "interactive",
      },
      {
        href: "/dashboard/settings/billing",
        label: "Billing",
        description: "Karsaro subscription plan",
        mode: "interactive",
      },
    ],
  },
  {
    label: "Sync",
    items: [
      {
        href: "/dashboard/settings/sync",
        label: "Sync setup",
        description: "How Calendar and Drive sync works",
        mode: "shell",
      },
      {
        href: "/dashboard/settings/google",
        label: "Google Calendar",
        description: "Workspace connect and sync",
        mode: "shell",
      },
      {
        href: "/dashboard/settings/drive",
        label: "Google Drive",
        description: "Folders and sync rules",
        mode: "shell",
      },
    ],
  },
];

export function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard" || href === "/dashboard/settings") {
    return pathname === href;
  }
  if (href === "/dashboard/forms") {
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !pathname.startsWith("/dashboard/forms/confirmations"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
