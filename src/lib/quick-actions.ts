export const DASHBOARD_QUICK_ACTIONS = [
  {
    href: "/dashboard/calendar",
    label: "Manage calendar",
    icon: "calendar",
  },
  {
    href: "/dashboard/bookings/new",
    label: "Book Now",
    icon: "book",
  },
  {
    href: "/dashboard/settings/booking-flow",
    label: "Booking flow",
    icon: "flow",
  },
  {
    href: "/dashboard/waitlist",
    label: "Waitlist",
    icon: "list",
  },
  {
    href: "/dashboard/settings",
    label: "Business settings",
    icon: "settings",
  },
  {
    href: "/dashboard/locations",
    label: "Locations",
    icon: "pin",
  },
  {
    href: "/dashboard/settings/email",
    label: "Messaging",
    icon: "email",
  },
  {
    href: "/dashboard/services",
    label: "Services",
    icon: "spark",
  },
  {
    href: "/dashboard/forms",
    label: "Forms",
    icon: "clipboard",
  },
  {
    href: "/dashboard/clients",
    label: "View clients",
    icon: "person",
  },
  {
    href: "/dashboard/employees",
    label: "Employees",
    icon: "team",
  },
  {
    href: "/dashboard/settings/sync",
    label: "Sync",
    icon: "sync",
  },
] as const;

export type QuickActionIcon = (typeof DASHBOARD_QUICK_ACTIONS)[number]["icon"];
export type QuickActionDef = {
  href: string;
  label: string;
  icon: QuickActionIcon;
};

export function orderQuickActions(
  savedOrder: string[] | null | undefined,
): QuickActionDef[] {
  const byHref = new Map<string, QuickActionDef>(
    DASHBOARD_QUICK_ACTIONS.map((action) => [action.href, action]),
  );
  const seen = new Set<string>();
  const ordered: QuickActionDef[] = [];

  for (const href of savedOrder ?? []) {
    const action = byHref.get(href);
    if (!action || seen.has(href)) continue;
    ordered.push(action);
    seen.add(href);
  }

  for (const action of DASHBOARD_QUICK_ACTIONS) {
    if (seen.has(action.href)) continue;
    ordered.push(action);
  }

  return ordered;
}
