export type EmployeeAvailability = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  unavailable: boolean;
};

export type Employee = {
  id: string;
  name: string;
  color: string;
  role: "practitioner";
  serviceIds: string[];
  availability: EmployeeAvailability[];
};

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string | null;
  notes?: string | null;
};

export function clientDisplayName(
  c: Pick<Client, "firstName" | "lastName" | "email">,
) {
  const full = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
  return full || c.email || "Client";
}

export type ServiceOption = {
  durationMinutes: number;
  price: number;
  label: string | null;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  bufferMinutes: number;
  colorId: string;
  active: boolean;
  options: ServiceOption[];
  locationIds: string[];
  /** Derived from first option — used by calendar / Book Now */
  durationMin: number;
  price: number;
};

export type LocationHour = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  closed: boolean;
};

export type Location = {
  id: string;
  name: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  timezone: string;
  active: boolean;
  hours: LocationHour[];
};

export type EmailTemplate = {
  id: string;
  templateType: string;
  subject: string;
  htmlContent: string;
  active: boolean;
};

export type Appointment = {
  id: string;
  employeeId: string;
  clientId: string;
  serviceId: string;
  /** Local date YYYY-MM-DD */
  date: string;
  /** Minutes from midnight */
  startMin: number;
  durationMin: number;
};

export type WaitlistEntry = {
  id: string;
  clientId: string;
  serviceId: string | null;
  /** Preferred date YYYY-MM-DD */
  preferredDate1: string | null;
  status: "waiting" | "offered" | "cancelled" | "booked";
  createdAt: string;
};

export type FormSection = {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  locked?: boolean;
  description?: string;
  uiOnly?: boolean;
  /** Waitlist requested_times: how many preferred dates (1–3). */
  dateOptionCount?: number;
};

export type FormField = {
  id: string;
  sectionKey: string;
  label: string;
  enabled: boolean;
  locked?: boolean;
};

export type DemoForm = {
  id: string;
  name: string;
  templateKey: string;
  audience: "client" | "staff";
  /** Appointment-linked when true; general use when false */
  showInCalendarDescription: boolean;
  active: boolean;
  isDraft?: boolean;
  sections: FormSection[];
  fields: FormField[];
};

export type FlowStepType = "schedule" | "contact" | "form" | "confirmation";

export type FlowStep = {
  id: string;
  stepType: FlowStepType;
  formId: string | null;
  formName: string | null;
  confirmationHtml: string | null;
};

export type DemoState = {
  employees: Employee[];
  clients: Client[];
  services: Service[];
  locations: Location[];
  emailTemplates: EmailTemplate[];
  appointments: Appointment[];
  waitlistEntries: WaitlistEntry[];
  /** Ordered quick-action hrefs; null = default product order */
  quickActionsOrder: string[] | null;
  forms: DemoForm[];
  flowSteps: FlowStep[];
  appointmentCreatedAfterStepOrder: number;
  /** YYYY-MM — sample calendar is rebuilt when the visitor’s month changes */
  seedCalendarMonth: string;
};

const STORAGE_KEY = "karsaro-demo-shell-v6";
const PREV_STORAGE_KEYS = [
  "karsaro-demo-shell-v5",
  "karsaro-demo-shell-v4",
  "karsaro-demo-shell-v3",
  "karsaro-demo-shell-v2",
  "karsaro-demo-shell-v1",
];

/** Matches production LEGAL_SECTION_DEFS — appended to client templates. */
const LEGAL_SECTIONS: { key: string; label: string }[] = [
  { key: "consent", label: "Consent message" },
  { key: "privacy_policy", label: "Privacy policy" },
  { key: "cancellation_policy", label: "Cancellation policy" },
];

/** Blank-template sections that start off (matches production build-draft). */
const BLANK_DEFAULT_OFF = new Set([
  "consent",
  "privacy_policy",
  "cancellation_policy",
  "waitlist_cta",
  "scheduling",
  "requested_times",
  "session",
  "health_information",
  "problem_areas",
  "custom_fields",
]);

export const FORM_TEMPLATE_STARTERS: {
  key: string;
  name: string;
  audience: "client" | "staff";
  description: string;
}[] = [
  {
    key: "booking",
    name: "Booking form",
    audience: "client",
    description:
      "Contact + service, practitioner, date, and time for Book Now.",
  },
  {
    key: "intake",
    name: "Client Intake",
    audience: "client",
    description:
      "Health history, body chart, and policies — typical pre-visit intake.",
  },
  {
    key: "waitlist",
    name: "Waitlist request",
    audience: "client",
    description:
      "Preferred service and dates via a public waitlist link (not a booking-flow step).",
  },
  {
    key: "soap",
    name: "Session Notes",
    audience: "staff",
    description:
      "Staff session notes after a visit — not shown on the public book flow.",
  },
  {
    key: "blank",
    name: "Custom form",
    audience: "client",
    description: "Empty canvas with optional sections you turn on as needed.",
  },
];

export function bookingConfirmationHtml() {
  return (
    "<h2>Booking confirmation</h2>" +
    "<p>Thanks, {{first_name}}! Your appointment is booked for {{date}} at {{time}}.</p>"
  );
}

export function formConfirmationHtml(formName: string) {
  const title = `${formName} Confirmation`;
  return (
    `<h2>${title}</h2>` +
    `<p>Thanks, {{first_name}}! Your ${formName.toLowerCase()} details have been submitted.</p>`
  );
}

export function confirmationPageTitle(sourceName: string) {
  return `${sourceName} Confirmation`;
}

function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Matches production FORM_TEMPLATES + build-draft legal append (keys/labels/locked/uiOnly). */
export function sectionsForTemplate(templateKey: string): FormSection[] {
  const mk = (
    key: string,
    label: string,
    opts?: {
      locked?: boolean;
      enabled?: boolean;
      description?: string;
      uiOnly?: boolean;
      dateOptionCount?: number;
    },
  ): FormSection => ({
    id: `s-${templateKey}-${key}`,
    key,
    label,
    enabled: opts?.enabled ?? true,
    locked: opts?.locked,
    description: opts?.description,
    uiOnly: opts?.uiOnly,
    dateOptionCount: opts?.dateOptionCount,
  });

  const withLegal = (sections: FormSection[], isStaff: boolean) => {
    if (isStaff) return sections;
    const existing = new Set(sections.map((s) => s.key));
    return [
      ...sections,
      ...LEGAL_SECTIONS.filter((d) => !existing.has(d.key)).map((d) =>
        mk(d.key, d.label, { enabled: false, uiOnly: true }),
      ),
    ];
  };

  switch (templateKey) {
    case "booking":
      return withLegal(
        [
          mk("contact", "Contact information", { locked: true }),
          mk("scheduling", "Service & appointment time", {
            locked: true,
            description:
              "Includes location when the business has more than one saved location",
          }),
          mk("waitlist_cta", "Waitlist link", {
            description:
              "Link for clients who can't find their preferred time",
            uiOnly: true,
          }),
          mk("treatment_notes", "Reason for visit"),
          mk("custom_fields", "Custom fields"),
        ],
        false,
      );
    case "intake":
      return withLegal(
        [
          mk("personal_information", "Personal Information", {
            locked: true,
          }),
          mk("dob", "Date of Birth"),
          mk("address", "Address"),
          mk("occupation", "Occupation"),
          mk("treatment_notes", "Reason for Visit"),
          mk("health_information", "Health Information"),
          mk("problem_areas", "Problem Areas", {
            description: "Body chart for marking discomfort areas",
            uiOnly: true,
          }),
          mk("custom_fields", "Custom fields"),
        ],
        false,
      );
    case "waitlist":
      return withLegal(
        [
          mk("contact", "Contact information", { locked: true }),
          mk("service_selection", "Service selection", { locked: true }),
          mk("requested_times", "Requested appointment times", {
            locked: true,
            dateOptionCount: 1,
          }),
          mk("custom_fields", "Custom fields"),
        ],
        false,
      );
    case "soap":
      return [mk("session", "Session notes", { locked: true })];
    default: {
      // blank / Custom form — production BLANK_FORM_SECTIONS + build-draft defaults
      const blankDefs: {
        key: string;
        label: string;
        uiOnly?: boolean;
      }[] = [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "phone", label: "Phone" },
        { key: "dob", label: "Date of birth" },
        { key: "address", label: "Address" },
        { key: "occupation", label: "Occupation" },
        { key: "scheduling", label: "Service & appointment time" },
        { key: "waitlist_cta", label: "Waitlist link", uiOnly: true },
        { key: "treatment_notes", label: "Reason for visit" },
        { key: "health_information", label: "Health information" },
        {
          key: "problem_areas",
          label: "Problem areas (body chart)",
          uiOnly: true,
        },
        { key: "requested_times", label: "Requested appointment times" },
        { key: "session", label: "Session notes" },
        { key: "custom_fields", label: "Custom fields" },
        { key: "consent", label: "Consent message", uiOnly: true },
        { key: "privacy_policy", label: "Privacy policy", uiOnly: true },
        {
          key: "cancellation_policy",
          label: "Cancellation policy",
          uiOnly: true,
        },
      ];
      return blankDefs.map((s) =>
        mk(s.key, s.label, {
          enabled: !BLANK_DEFAULT_OFF.has(s.key),
          uiOnly: s.uiOnly,
          dateOptionCount:
            s.key === "requested_times" ? 1 : undefined,
        }),
      );
    }
  }
}

/** Fields for nested toggles (health / session) and custom fields — matches production templates. */
export function fieldsForTemplate(templateKey: string): FormField[] {
  const mk = (
    sectionKey: string,
    key: string,
    label: string,
    opts?: { locked?: boolean; enabled?: boolean },
  ): FormField => ({
    id: `fld-${templateKey}-${key}`,
    sectionKey,
    label,
    enabled: opts?.enabled ?? true,
    locked: opts?.locked,
  });

  switch (templateKey) {
    case "intake":
      return [
        mk(
          "health_information",
          "conditions",
          "Do you have any medical conditions we should be aware of?",
        ),
        mk(
          "health_information",
          "allergies",
          "Please list any allergies (medications, oils, scents, etc.)",
        ),
      ];
    case "soap":
      return [
        mk("session", "treatment_client", "Treatment/Client", {
          locked: true,
        }),
        mk("session", "date_time", "Date & Time", { locked: true }),
        mk("session", "reason_for_visit", "Reason for Visit"),
        mk("session", "chief_complaints", "Chief Complaints"),
        mk("session", "assessment_plan", "Assessment & Plan"),
        mk("session", "reassessment", "Reassessment"),
        mk("session", "future_treatment_plan", "Future Treatment Plan"),
        mk("session", "appointment_id", "Appointment ID", { locked: true }),
        mk("session", "digital_signature", "Digital Signature", {
          locked: true,
        }),
      ];
    case "blank":
      // Client blank: session fields are seeded only when audience becomes staff.
      return [
        mk("name", "first_name", "First Name"),
        mk("name", "last_name", "Last Name"),
        mk("email", "email", "Email Address"),
        mk("phone", "phone", "Phone Number"),
        mk("treatment_notes", "reason_for_visit", "Reason for Visit"),
        mk("dob", "dob", "Date of Birth"),
        mk("address", "address", "Address"),
        mk("occupation", "occupation", "Occupation"),
      ];
    default:
      return [];
  }
}

/** Seed includes Client Intake after booking confirmation so the Appointment created slider is visible. */
export function defaultFlowSteps(): FlowStep[] {
  return [
    {
      id: "fs-schedule",
      stepType: "schedule",
      formId: null,
      formName: null,
      confirmationHtml: null,
    },
    {
      id: "fs-contact",
      stepType: "contact",
      formId: null,
      formName: null,
      confirmationHtml: null,
    },
    {
      id: "fs-booking-confirm",
      stepType: "confirmation",
      formId: null,
      formName: null,
      confirmationHtml: bookingConfirmationHtml(),
    },
    {
      id: "fs-intake",
      stepType: "form",
      formId: "f-intake",
      formName: "Client Intake",
      confirmationHtml: null,
    },
    {
      id: "fs-intake-confirm",
      stepType: "confirmation",
      formId: "f-intake",
      formName: "Client Intake",
      confirmationHtml: formConfirmationHtml("Client Intake"),
    },
  ];
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Sunday start — matches demo calendar week view. */
function startOfWeekSunday(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}

/**
 * Fill only the visitor’s current calendar month (denser in the current week).
 * Other months stay empty so the demo never looks permanently packed.
 */
function buildCurrentMonthAppointments(
  employees: Employee[],
  clients: Client[],
  services: Service[],
): Appointment[] {
  if (!employees.length || !clients.length || !services.length) return [];

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weekStart = startOfWeekSunday(now);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const denseSlots = [9 * 60, 11 * 60, 13 * 60 + 30, 15 * 60 + 30];
  const lightSlots = [10 * 60, 14 * 60];
  const saturdaySlots = [10 * 60];

  const out: Appointment[] = [];
  let n = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dow = date.getDay();
    if (dow === 0) continue; // Sunday closed

    const inCurrentWeek = date >= weekStart && date < weekEnd;
    const slots = inCurrentWeek
      ? denseSlots
      : dow === 6
        ? saturdaySlots
        : lightSlots;

    for (let si = 0; si < slots.length; si++) {
      const emp = employees[(day + si) % employees.length]!;
      const svcPick = services[(day + si * 2) % services.length]!;
      const serviceId = emp.serviceIds.includes(svcPick.id)
        ? svcPick.id
        : emp.serviceIds[0] ?? svcPick.id;
      const service =
        services.find((s) => s.id === serviceId) ?? svcPick;
      const client = clients[(day + si * 3) % clients.length]!;

      out.push({
        id: `a-seed-${++n}`,
        employeeId: emp.id,
        clientId: client.id,
        serviceId: service.id,
        date: toYmd(date),
        startMin: slots[si]!,
        durationMin: service.durationMin,
      });
    }
  }

  return out;
}

function buildCurrentMonthWaitlist(
  clients: Client[],
  services: Service[],
): WaitlistEntry[] {
  const t = todayISO();
  const c4 = clients[3] ?? clients[0];
  const c5 = clients[4] ?? clients[1] ?? clients[0];
  const c3 = clients[2] ?? clients[0];
  const s1 = services[0];
  const s2 = services[1] ?? services[0];
  if (!c4 || !c5 || !c3 || !s1 || !s2) return [];

  return [
    {
      id: "w1",
      clientId: c4.id,
      serviceId: s1.id,
      preferredDate1: t,
      status: "waiting",
      createdAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
    {
      id: "w2",
      clientId: c5.id,
      serviceId: s2.id,
      preferredDate1: addDaysISO(t, 1),
      status: "waiting",
      createdAt: new Date(Date.now() - 43_200_000).toISOString(),
    },
    {
      id: "w3",
      clientId: c3.id,
      serviceId: s1.id,
      preferredDate1: addDaysISO(t, 2),
      status: "offered",
      createdAt: new Date(Date.now() - 21_600_000).toISOString(),
    },
  ];
}

function ensureCurrentMonthCalendar(demo: DemoState): DemoState {
  const month = currentMonthKey();
  if (demo.seedCalendarMonth === month) return demo;
  return {
    ...demo,
    appointments: buildCurrentMonthAppointments(
      demo.employees,
      demo.clients,
      demo.services,
    ),
    waitlistEntries: buildCurrentMonthWaitlist(demo.clients, demo.services),
    seedCalendarMonth: month,
  };
}

function defaultLocationHours(): LocationHour[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    closed: dayOfWeek === 0,
  }));
}

function defaultEmployeeAvailability(): EmployeeAvailability[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    startTime: "09:00",
    endTime: "17:00",
    unavailable: dayOfWeek === 0,
  }));
}

function defaultEmailTemplates(businessName = "Sample Studio"): EmailTemplate[] {
  return [
    {
      id: "et-confirmation",
      templateType: "confirmation",
      subject: `Appointment confirmed — ${businessName}`,
      htmlContent: `<p>Hi {{client_name}},</p>
<p>Your {{service_name}} with {{employee_name}} is confirmed for {{start_time}}.</p>
<p>{{payment_link_block}}</p>
<p>— {{business_name}}</p>`,
      active: true,
    },
    {
      id: "et-reminder",
      templateType: "reminder",
      subject: `Reminder: {{service_name}} at {{start_time}}`,
      htmlContent: `<p>Hi {{client_name}},</p>
<p>This is a reminder for your {{service_name}} with {{employee_name}} on {{start_time}}.</p>
<p>— {{business_name}}</p>`,
      active: true,
    },
    {
      id: "et-cancellation",
      templateType: "cancellation",
      subject: `Appointment cancelled — ${businessName}`,
      htmlContent: `<p>Hi {{client_name}},</p>
<p>Your {{service_name}} on {{start_time}} has been cancelled.</p>
<p>— {{business_name}}</p>`,
      active: true,
    },
    {
      id: "et-waitlist",
      templateType: "waitlist",
      subject: `An opening may be available — ${businessName}`,
      htmlContent: `<p>Hi {{client_name}},</p>
<p>{{business_name}} wanted you to know a slot may be open{{service_name_block}}.</p>
<p>{{notes_block}}</p>
<p>— {{business_name}}</p>`,
      active: true,
    },
  ];
}

function deriveFromOptions(options: ServiceOption[]): {
  durationMin: number;
  price: number;
} {
  const first = options[0];
  return {
    durationMin: first?.durationMinutes ?? 60,
    price: first?.price ?? 0,
  };
}

function withDerivedService(
  service: Omit<Service, "durationMin" | "price"> &
    Partial<Pick<Service, "durationMin" | "price">>,
): Service {
  const derived = deriveFromOptions(service.options);
  return {
    ...service,
    durationMin: derived.durationMin,
    price: derived.price,
  };
}

export function createSeedState(): DemoState {
  const mainStudio: Location = {
    id: "loc-main",
    name: "Main Studio",
    address1: "120 Harbor Ave",
    city: "Portland",
    state: "OR",
    postalCode: "97201",
    phone: "(503) 555-0142",
    timezone: "America/New_York",
    active: true,
    hours: defaultLocationHours(),
  };

  const services = [
    withDerivedService({
      id: "s1",
      name: "Service 1",
      description:
        "A standard wellness session — length and price are editable.",
      bufferMinutes: 15,
      colorId: "2",
      active: true,
      options: [
        { durationMinutes: 60, price: 90, label: null },
        { durationMinutes: 90, price: 125, label: "Extended" },
      ],
      locationIds: [mainStudio.id],
    }),
    withDerivedService({
      id: "s2",
      name: "Service 2",
      description: "A longer session option for deeper work.",
      bufferMinutes: 15,
      colorId: "7",
      active: true,
      options: [{ durationMinutes: 90, price: 130, label: null }],
      locationIds: [mainStudio.id],
    }),
    withDerivedService({
      id: "s3",
      name: "Service 3",
      description: "A shorter focused visit.",
      bufferMinutes: 10,
      colorId: "5",
      active: true,
      options: [{ durationMinutes: 45, price: 70, label: null }],
      locationIds: [mainStudio.id],
    }),
    withDerivedService({
      id: "s4",
      name: "Service 4",
      description: "A premium or specialty offering.",
      bufferMinutes: 20,
      colorId: "9",
      active: true,
      options: [{ durationMinutes: 75, price: 150, label: null }],
      locationIds: [mainStudio.id],
    }),
  ];
  const allServiceIds = services.map((s) => s.id);
  const weekHours = defaultEmployeeAvailability();

  const employees: Employee[] = [
    {
      id: "e1",
      name: "Alex Rivera",
      color: "#9aaf9d",
      role: "practitioner",
      serviceIds: [...allServiceIds],
      availability: weekHours.map((row) => ({ ...row })),
    },
    {
      id: "e2",
      name: "Jordan Lee",
      color: "#688086",
      role: "practitioner",
      serviceIds: [...allServiceIds],
      availability: weekHours.map((row) => ({ ...row })),
    },
    {
      id: "e3",
      name: "Sam Patel",
      color: "#b08d7a",
      role: "practitioner",
      serviceIds: ["s1", "s2", "s3"],
      availability: weekHours.map((row) => ({ ...row })),
    },
    {
      id: "e4",
      name: "Riley Quinn",
      color: "#7a8fb0",
      role: "practitioner",
      serviceIds: ["s2", "s3", "s4"],
      availability: weekHours.map((row) => ({ ...row })),
    },
  ];

  const clients: Client[] = [
    {
      id: "c1",
      firstName: "Maya",
      lastName: "Chen",
      email: "maya@example.com",
      phone: "(555) 010-1001",
    },
    {
      id: "c2",
      firstName: "Sam",
      lastName: "Okoye",
      email: "sam@example.com",
      phone: "(555) 010-1002",
    },
    {
      id: "c3",
      firstName: "Riley",
      lastName: "Nguyen",
      email: "riley@example.com",
      phone: "(555) 010-1003",
    },
    {
      id: "c4",
      firstName: "Casey",
      lastName: "Brooks",
      email: "casey@example.com",
      phone: "(555) 010-1004",
    },
    {
      id: "c5",
      firstName: "Avery",
      lastName: "Kim",
      email: "avery@example.com",
      phone: "(555) 010-1005",
    },
    {
      id: "c6",
      firstName: "Jordan",
      lastName: "Ellis",
      email: "jordan@example.com",
      phone: "(555) 010-1006",
    },
    {
      id: "c7",
      firstName: "Taylor",
      lastName: "Brooks",
      email: "taylor@example.com",
      phone: "(555) 010-1007",
    },
    {
      id: "c8",
      firstName: "Morgan",
      lastName: "Diaz",
      email: "morgan@example.com",
      phone: "(555) 010-1008",
    },
  ];

  const seedCalendarMonth = currentMonthKey();

  return {
    employees,
    clients,
    locations: [mainStudio],
    services,
    emailTemplates: defaultEmailTemplates("Sample Studio"),
    appointments: buildCurrentMonthAppointments(employees, clients, services),
    waitlistEntries: buildCurrentMonthWaitlist(clients, services),
    quickActionsOrder: null,
    seedCalendarMonth,
    forms: [
      {
        id: "f-intake",
        name: "Client Intake",
        templateKey: "intake",
        audience: "client",
        showInCalendarDescription: true,
        active: true,
        sections: sectionsForTemplate("intake"),
        fields: fieldsForTemplate("intake"),
      },
      {
        id: "f-booking",
        name: "Booking form",
        templateKey: "booking",
        audience: "client",
        showInCalendarDescription: false,
        active: true,
        sections: sectionsForTemplate("booking"),
        fields: fieldsForTemplate("booking"),
      },
      {
        id: "f-waitlist",
        name: "Waitlist request",
        templateKey: "waitlist",
        audience: "client",
        showInCalendarDescription: false,
        active: true,
        sections: sectionsForTemplate("waitlist"),
        fields: fieldsForTemplate("waitlist"),
      },
      {
        id: "f-soap",
        name: "Session Notes",
        templateKey: "soap",
        audience: "staff",
        showInCalendarDescription: true,
        active: true,
        sections: sectionsForTemplate("soap"),
        fields: fieldsForTemplate("soap"),
      },
      {
        id: "f-general",
        name: "Wellness questionnaire",
        templateKey: "blank",
        audience: "client",
        showInCalendarDescription: false,
        active: true,
        sections: sectionsForTemplate("blank"),
        fields: fieldsForTemplate("blank"),
      },
    ],
    flowSteps: defaultFlowSteps(),
    /** After booking confirmation (index 2) — before Client Intake in the seeded flow. */
    appointmentCreatedAfterStepOrder: 2,
  };
}

type Listener = () => void;

let state: DemoState = load();
const listeners = new Set<Listener>();

function normalizeFormSection(raw: Partial<FormSection>, fallbackKey: string): FormSection {
  return {
    id: raw.id ?? uid("sec"),
    key: raw.key ?? fallbackKey,
    label: raw.label ?? raw.key ?? "Section",
    enabled: raw.enabled !== false,
    locked: raw.locked,
    description: raw.description,
    uiOnly: raw.uiOnly,
    dateOptionCount:
      typeof raw.dateOptionCount === "number" ? raw.dateOptionCount : undefined,
  };
}

function normalizeFormField(raw: Partial<FormField>): FormField | null {
  if (!raw || typeof raw.sectionKey !== "string") return null;
  return {
    id: raw.id ?? uid("fld"),
    sectionKey: raw.sectionKey,
    label: raw.label ?? "Field",
    enabled: raw.enabled !== false,
    locked: raw.locked,
  };
}

function normalizeForm(raw: Partial<DemoForm>, seedFallback?: DemoForm): DemoForm {
  const templateKey = raw.templateKey ?? seedFallback?.templateKey ?? "blank";
  const sections = Array.isArray(raw.sections)
    ? raw.sections.map((s, i) =>
        normalizeFormSection(s, seedFallback?.sections[i]?.key ?? `section_${i}`),
      )
    : seedFallback?.sections ?? sectionsForTemplate(templateKey);
  const fields = Array.isArray(raw.fields)
    ? raw.fields
        .map(normalizeFormField)
        .filter((f): f is FormField => f != null)
    : seedFallback?.fields ?? fieldsForTemplate(templateKey);
  return {
    id: raw.id ?? uid("form"),
    name: raw.name ?? "Untitled form",
    templateKey,
    audience: raw.audience === "staff" ? "staff" : "client",
    showInCalendarDescription: Boolean(raw.showInCalendarDescription),
    active: raw.active !== false,
    isDraft: Boolean(raw.isDraft),
    sections,
    fields,
  };
}

function normalizeFlowStep(raw: Record<string, unknown>): FlowStep | null {
  if (typeof raw.stepType === "string") {
    return {
      id: String(raw.id ?? uid("fs")),
      stepType: raw.stepType as FlowStepType,
      formId: (raw.formId as string | null) ?? null,
      formName: (raw.formName as string | null) ?? null,
      confirmationHtml: (raw.confirmationHtml as string | null) ?? null,
    };
  }
  return null;
}

function normalizeServiceOption(raw: unknown): ServiceOption | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const durationMinutes = Number(o.durationMinutes);
  const price = Number(o.price);
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return null;
  return {
    durationMinutes,
    price: Number.isFinite(price) ? price : 0,
    label: typeof o.label === "string" && o.label.trim() ? o.label.trim() : null,
  };
}

function normalizeService(
  raw: Partial<Service> & { durationMin?: number; price?: number },
  seedFallback?: Service,
  defaultLocationIds: string[] = [],
): Service {
  let options = Array.isArray(raw.options)
    ? raw.options.map(normalizeServiceOption).filter((o): o is ServiceOption => o != null)
    : [];

  if (options.length === 0) {
    const duration =
      typeof raw.durationMin === "number"
        ? raw.durationMin
        : seedFallback?.durationMin ?? 60;
    const price =
      typeof raw.price === "number" ? raw.price : seedFallback?.price ?? 0;
    options = [{ durationMinutes: duration, price, label: null }];
  }

  const locationIds = Array.isArray(raw.locationIds)
    ? raw.locationIds.filter((id): id is string => typeof id === "string")
    : seedFallback?.locationIds?.length
      ? seedFallback.locationIds
      : defaultLocationIds;

  return withDerivedService({
    id: raw.id ?? seedFallback?.id ?? uid("svc"),
    name: raw.name ?? seedFallback?.name ?? "Service",
    description:
      typeof raw.description === "string"
        ? raw.description
        : (seedFallback?.description ?? ""),
    bufferMinutes:
      typeof raw.bufferMinutes === "number"
        ? raw.bufferMinutes
        : (seedFallback?.bufferMinutes ?? 15),
    colorId:
      typeof raw.colorId === "string"
        ? raw.colorId
        : (seedFallback?.colorId ?? "2"),
    active: raw.active !== false,
    options,
    locationIds,
  });
}

function normalizeLocationHour(raw: unknown, dayOfWeek: number): LocationHour {
  if (!raw || typeof raw !== "object") {
    return {
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      closed: dayOfWeek === 0,
    };
  }
  const h = raw as Record<string, unknown>;
  return {
    dayOfWeek:
      typeof h.dayOfWeek === "number" ? h.dayOfWeek : dayOfWeek,
    startTime: typeof h.startTime === "string" ? h.startTime : "09:00",
    endTime: typeof h.endTime === "string" ? h.endTime : "17:00",
    closed: Boolean(h.closed),
  };
}

function normalizeLocation(
  raw: Partial<Location>,
  seedFallback?: Location,
): Location {
  const hoursRaw = Array.isArray(raw.hours) ? raw.hours : seedFallback?.hours;
  const hours = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = hoursRaw?.find((h) => h.dayOfWeek === dayOfWeek);
    return normalizeLocationHour(row, dayOfWeek);
  });

  return {
    id: raw.id ?? seedFallback?.id ?? uid("loc"),
    name: raw.name ?? seedFallback?.name ?? "Location",
    address1:
      typeof raw.address1 === "string"
        ? raw.address1
        : (seedFallback?.address1 ?? ""),
    city: typeof raw.city === "string" ? raw.city : (seedFallback?.city ?? ""),
    state:
      typeof raw.state === "string" ? raw.state : (seedFallback?.state ?? ""),
    postalCode:
      typeof raw.postalCode === "string"
        ? raw.postalCode
        : (seedFallback?.postalCode ?? ""),
    phone:
      typeof raw.phone === "string" ? raw.phone : (seedFallback?.phone ?? ""),
    timezone:
      typeof raw.timezone === "string"
        ? raw.timezone
        : (seedFallback?.timezone ?? "America/New_York"),
    active: raw.active !== false,
    hours,
  };
}

function normalizeEmailTemplate(
  raw: Partial<EmailTemplate>,
  seedFallback?: EmailTemplate,
): EmailTemplate {
  return {
    id: raw.id ?? seedFallback?.id ?? uid("et"),
    templateType:
      raw.templateType ?? seedFallback?.templateType ?? "custom",
    subject: raw.subject ?? seedFallback?.subject ?? "",
    htmlContent: raw.htmlContent ?? seedFallback?.htmlContent ?? "",
    active: raw.active !== false,
  };
}

function splitLegacyName(name: string): { firstName: string; lastName: string } {
  const trimmed = name.trim();
  if (!trimmed) return { firstName: "Client", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizeClient(
  raw: Partial<Client> & { name?: string },
  seedFallback?: Client,
): Client {
  const fromLegacy =
    typeof raw.name === "string" && !raw.firstName && !raw.lastName
      ? splitLegacyName(raw.name)
      : null;
  return {
    id: raw.id ?? seedFallback?.id ?? uid("cli"),
    firstName:
      typeof raw.firstName === "string"
        ? raw.firstName
        : (fromLegacy?.firstName ?? seedFallback?.firstName ?? "Client"),
    lastName:
      typeof raw.lastName === "string"
        ? raw.lastName
        : (fromLegacy?.lastName ?? seedFallback?.lastName ?? ""),
    email:
      typeof raw.email === "string"
        ? raw.email
        : (seedFallback?.email ?? ""),
    phone:
      typeof raw.phone === "string"
        ? raw.phone
        : (seedFallback?.phone ?? ""),
    dateOfBirth:
      raw.dateOfBirth === undefined
        ? (seedFallback?.dateOfBirth ?? null)
        : raw.dateOfBirth,
    notes:
      raw.notes === undefined ? (seedFallback?.notes ?? null) : raw.notes,
  };
}

function normalizeAvailabilityRow(
  raw: unknown,
  dayOfWeek: number,
): EmployeeAvailability {
  if (!raw || typeof raw !== "object") {
    return {
      dayOfWeek,
      startTime: "09:00",
      endTime: "17:00",
      unavailable: dayOfWeek === 0,
    };
  }
  const row = raw as Record<string, unknown>;
  return {
    dayOfWeek:
      typeof row.dayOfWeek === "number" ? row.dayOfWeek : dayOfWeek,
    startTime: typeof row.startTime === "string" ? row.startTime : "09:00",
    endTime: typeof row.endTime === "string" ? row.endTime : "17:00",
    unavailable: Boolean(row.unavailable),
  };
}

function normalizeEmployee(
  raw: Partial<Employee>,
  seedFallback?: Employee,
  defaultServiceIds: string[] = [],
): Employee {
  const availabilityRaw = Array.isArray(raw.availability)
    ? raw.availability
    : seedFallback?.availability;
  const availability = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = availabilityRaw?.find((a) => a.dayOfWeek === dayOfWeek);
    return normalizeAvailabilityRow(row, dayOfWeek);
  });
  const serviceIds = Array.isArray(raw.serviceIds)
    ? raw.serviceIds.filter((id): id is string => typeof id === "string")
    : seedFallback?.serviceIds?.length
      ? seedFallback.serviceIds
      : defaultServiceIds;

  return {
    id: raw.id ?? seedFallback?.id ?? uid("emp"),
    name: raw.name ?? seedFallback?.name ?? "Staff",
    color: raw.color ?? seedFallback?.color ?? "#9aaf9d",
    role: "practitioner",
    serviceIds,
    availability,
  };
}

function normalizeState(raw: Partial<DemoState> | null | undefined): DemoState {
  const seed = createSeedState();
  if (!raw || typeof raw !== "object") return seed;

  const locations = Array.isArray(raw.locations)
    ? raw.locations.map((l, i) => normalizeLocation(l, seed.locations[i]))
    : seed.locations;
  const defaultLocationIds = locations.map((l) => l.id);

  const services = Array.isArray(raw.services)
    ? raw.services.map((s, i) =>
        normalizeService(s, seed.services[i], defaultLocationIds),
      )
    : seed.services;

  const emailTemplates = Array.isArray(raw.emailTemplates)
    ? raw.emailTemplates.map((t, i) =>
        normalizeEmailTemplate(t, seed.emailTemplates[i]),
      )
    : seed.emailTemplates;

  const forms = Array.isArray(raw.forms)
    ? raw.forms.map((f, i) => normalizeForm(f, seed.forms[i]))
    : seed.forms;

  let flowSteps = seed.flowSteps;
  if (Array.isArray(raw.flowSteps) && raw.flowSteps.length > 0) {
    const mapped = raw.flowSteps
      .map((s) => normalizeFlowStep(s as Record<string, unknown>))
      .filter((s): s is FlowStep => s != null);
    if (mapped.length > 0) flowSteps = mapped;
  }

  const appointmentCreatedAfterStepOrder =
    typeof raw.appointmentCreatedAfterStepOrder === "number"
      ? raw.appointmentCreatedAfterStepOrder
      : seed.appointmentCreatedAfterStepOrder;

  const defaultServiceIds = services.map((s) => s.id);
  const employees = Array.isArray(raw.employees)
    ? raw.employees.map((e, i) =>
        normalizeEmployee(e, seed.employees[i], defaultServiceIds),
      )
    : seed.employees;
  const clients = Array.isArray(raw.clients)
    ? raw.clients.map((c, i) =>
        normalizeClient(c as Partial<Client> & { name?: string }, seed.clients[i]),
      )
    : seed.clients;

  return {
    ...seed,
    ...raw,
    employees,
    clients,
    services,
    locations,
    emailTemplates,
    appointments: Array.isArray(raw.appointments)
      ? raw.appointments
      : seed.appointments,
    waitlistEntries: Array.isArray(raw.waitlistEntries)
      ? raw.waitlistEntries
      : seed.waitlistEntries,
    quickActionsOrder: Array.isArray(raw.quickActionsOrder)
      ? raw.quickActionsOrder
      : null,
    forms,
    flowSteps,
    appointmentCreatedAfterStepOrder,
    seedCalendarMonth:
      typeof raw.seedCalendarMonth === "string"
        ? raw.seedCalendarMonth
        : seed.seedCalendarMonth,
  };
}

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Fresh seed on major demo bumps so templates/flow match the latest twin.
      for (const key of PREV_STORAGE_KEYS) {
        localStorage.removeItem(key);
      }
      const seed = createSeedState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const normalized = normalizeState(JSON.parse(raw) as Partial<DemoState>);
    const refreshed = ensureCurrentMonthCalendar(normalized);
    if (refreshed.seedCalendarMonth !== normalized.seedCalendarMonth) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(refreshed));
    }
    return refreshed;
  } catch {
    return createSeedState();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function getDemoState() {
  return state;
}

export function subscribeDemo(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetDemoState() {
  state = createSeedState();
  persist();
}

export function upsertAppointment(appt: Appointment) {
  const i = state.appointments.findIndex((a) => a.id === appt.id);
  if (i >= 0) {
    state = {
      ...state,
      appointments: state.appointments.map((a) => (a.id === appt.id ? appt : a)),
    };
  } else {
    state = { ...state, appointments: [...state.appointments, appt] };
  }
  persist();
}

export function deleteAppointment(id: string) {
  state = {
    ...state,
    appointments: state.appointments.filter((a) => a.id !== id),
  };
  persist();
}

export function updateClient(
  id: string,
  patch: Partial<Omit<Client, "id">>,
) {
  state = {
    ...state,
    clients: state.clients.map((c) =>
      c.id === id ? normalizeClient({ ...c, ...patch, id }) : c,
    ),
  };
  persist();
}

export function upsertClient(
  input: Partial<Client> & Pick<Client, "firstName" | "lastName">,
) {
  const existing = input.id
    ? state.clients.find((c) => c.id === input.id)
    : undefined;
  const client = normalizeClient(
    {
      ...existing,
      ...input,
      id: input.id ?? existing?.id ?? uid("cli"),
    },
    existing,
  );
  const i = state.clients.findIndex((c) => c.id === client.id);
  if (i >= 0) {
    state = {
      ...state,
      clients: state.clients.map((c) => (c.id === client.id ? client : c)),
    };
  } else {
    state = { ...state, clients: [...state.clients, client] };
  }
  persist();
  return client;
}

export function setEmployeeServices(employeeId: string, serviceIds: string[]) {
  state = {
    ...state,
    employees: state.employees.map((e) =>
      e.id === employeeId ? { ...e, serviceIds: [...serviceIds] } : e,
    ),
  };
  persist();
}

export function setEmployeeAvailability(
  employeeId: string,
  availability: EmployeeAvailability[],
) {
  const normalized = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = availability.find((a) => a.dayOfWeek === dayOfWeek);
    return normalizeAvailabilityRow(row, dayOfWeek);
  });
  state = {
    ...state,
    employees: state.employees.map((e) =>
      e.id === employeeId ? { ...e, availability: normalized } : e,
    ),
  };
  persist();
}

export function upsertService(
  input: Omit<Service, "id" | "durationMin" | "price"> &
    Partial<Pick<Service, "id" | "durationMin" | "price">>,
) {
  const service = withDerivedService({
    ...input,
    id: input.id ?? uid("svc"),
  });
  const i = state.services.findIndex((s) => s.id === service.id);
  if (i >= 0) {
    state = {
      ...state,
      services: state.services.map((s) => (s.id === service.id ? service : s)),
    };
  } else {
    state = { ...state, services: [...state.services, service] };
  }
  persist();
  return service;
}

export function setServiceActive(id: string, active: boolean) {
  state = {
    ...state,
    services: state.services.map((s) =>
      s.id === id ? { ...s, active } : s,
    ),
  };
  persist();
}

export function upsertLocation(
  input: Partial<Location> & Pick<Location, "name">,
) {
  const existing = input.id
    ? state.locations.find((l) => l.id === input.id)
    : undefined;
  const location = normalizeLocation(
    {
      ...existing,
      ...input,
      id: input.id ?? existing?.id ?? uid("loc"),
    },
    existing,
  );
  const i = state.locations.findIndex((l) => l.id === location.id);
  if (i >= 0) {
    state = {
      ...state,
      locations: state.locations.map((l) =>
        l.id === location.id ? location : l,
      ),
    };
  } else {
    state = { ...state, locations: [...state.locations, location] };
  }
  persist();
  return location;
}

export function updateLocationHours(
  locationId: string,
  hours: LocationHour[],
) {
  const normalized = Array.from({ length: 7 }, (_, dayOfWeek) => {
    const row = hours.find((h) => h.dayOfWeek === dayOfWeek);
    return normalizeLocationHour(row, dayOfWeek);
  });
  state = {
    ...state,
    locations: state.locations.map((l) =>
      l.id === locationId ? { ...l, hours: normalized } : l,
    ),
  };
  persist();
}

export function upsertEmailTemplate(
  input: Partial<EmailTemplate> & Pick<EmailTemplate, "templateType">,
) {
  const existing = input.id
    ? state.emailTemplates.find((t) => t.id === input.id)
    : state.emailTemplates.find((t) => t.templateType === input.templateType);

  const template = normalizeEmailTemplate(
    {
      ...existing,
      ...input,
      id: input.id ?? existing?.id ?? uid("et"),
    },
    existing,
  );

  const i = state.emailTemplates.findIndex(
    (t) => t.id === template.id || t.templateType === template.templateType,
  );
  if (i >= 0) {
    state = {
      ...state,
      emailTemplates: state.emailTemplates.map((t, idx) =>
        idx === i ? template : t,
      ),
    };
  } else {
    state = {
      ...state,
      emailTemplates: [...state.emailTemplates, template],
    };
  }
  persist();
  return template;
}

export function setFormSections(formId: string, sections: FormSection[]) {
  state = {
    ...state,
    forms: state.forms.map((f) => (f.id === formId ? { ...f, sections } : f)),
  };
  persist();
}

export function setFormFields(formId: string, fields: FormField[]) {
  state = {
    ...state,
    forms: state.forms.map((f) => (f.id === formId ? { ...f, fields } : f)),
  };
  persist();
}

export function updateFormMeta(
  formId: string,
  patch: Partial<
    Pick<
      DemoForm,
      | "name"
      | "audience"
      | "showInCalendarDescription"
      | "active"
      | "isDraft"
      | "sections"
      | "fields"
    >
  >,
) {
  state = {
    ...state,
    forms: state.forms.map((f) => (f.id === formId ? { ...f, ...patch } : f)),
  };
  persist();
}

export function createFormFromTemplate(templateKey: string): DemoForm {
  const starter = FORM_TEMPLATE_STARTERS.find((t) => t.key === templateKey);
  const form: DemoForm = {
    id: uid("form"),
    name: starter?.name ?? "Untitled form",
    templateKey,
    audience: starter?.audience ?? "client",
    showInCalendarDescription:
      templateKey === "soap" || templateKey === "intake",
    active: true,
    isDraft: true,
    sections: sectionsForTemplate(templateKey),
    fields: fieldsForTemplate(templateKey),
  };
  state = { ...state, forms: [form, ...state.forms] };
  persist();
  return form;
}

export function deleteForm(formId: string) {
  state = {
    ...state,
    forms: state.forms.filter((f) => f.id !== formId),
    flowSteps: state.flowSteps.filter(
      (s) => s.formId !== formId && !(s.stepType === "confirmation" && s.formId === formId),
    ),
  };
  persist();
}

export function setFlowSteps(flowSteps: FlowStep[]) {
  state = { ...state, flowSteps };
  persist();
}

export function setAppointmentCreatedAfter(order: number) {
  state = { ...state, appointmentCreatedAfterStepOrder: order };
  persist();
}

export function setBookingFlow(flowSteps: FlowStep[], appointmentAfter: number) {
  state = {
    ...state,
    flowSteps,
    appointmentCreatedAfterStepOrder: appointmentAfter,
  };
  persist();
}

export function resetBookingFlowToDefault() {
  state = {
    ...state,
    flowSteps: defaultFlowSteps(),
    appointmentCreatedAfterStepOrder: 1,
  };
  persist();
}

export function setQuickActionsOrder(order: string[]) {
  state = { ...state, quickActionsOrder: order };
  persist();
}

export function formatClock(min: number) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const h12 = ((h24 + 11) % 12) + 1;
  const ampm = h24 >= 12 ? "PM" : "AM";
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatServiceOptionLabel(option: {
  durationMinutes: number;
  price: number | string | null;
  label: string | null;
}) {
  const pricePart =
    option.price != null && option.price !== ""
      ? ` · $${option.price}`
      : "";
  const labelPart = option.label?.trim() ? `${option.label.trim()} · ` : "";
  return `${labelPart}${option.durationMinutes} min${pricePart}`;
}

export { todayISO, addDaysISO, uid };

