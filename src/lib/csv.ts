export type CsvTable = {
  headers: string[];
  rows: string[][];
};

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current.trim());
  return out;
}

export function parseCsv(text: string): CsvTable {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0] ?? "").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    while (cells.length < headers.length) cells.push("");
    return cells.slice(0, headers.length);
  });
  return { headers, rows };
}

export type ClientImportField =
  | "firstName"
  | "lastName"
  | "fullName"
  | "email"
  | "phone"
  | "notes"
  | "skip";

export const CLIENT_IMPORT_FIELDS: { id: ClientImportField; label: string }[] = [
  { id: "skip", label: "Ignore" },
  { id: "firstName", label: "First name" },
  { id: "lastName", label: "Last name" },
  { id: "fullName", label: "Full name" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "notes", label: "Notes" },
];

export type ClientImportRow = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
};

function splitFullName(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0] ?? "", lastName: "" };
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

export function mapCsvRows(
  table: CsvTable,
  mapping: Record<string, ClientImportField>,
): ClientImportRow[] {
  return table.rows
    .map((cells) => {
      const raw: Record<ClientImportField, string> = {
        firstName: "",
        lastName: "",
        fullName: "",
        email: "",
        phone: "",
        notes: "",
        skip: "",
      };
      table.headers.forEach((header, index) => {
        const field = mapping[header] ?? "skip";
        if (field === "skip") return;
        const value = (cells[index] ?? "").trim();
        if (!value) return;
        raw[field] = raw[field] ? `${raw[field]} ${value}` : value;
      });
      const fromFull = splitFullName(raw.fullName);
      return {
        firstName: raw.firstName || fromFull.firstName,
        lastName: raw.lastName || fromFull.lastName,
        email: raw.email,
        phone: raw.phone,
        notes: raw.notes,
      };
    })
    .filter((row) => row.firstName || row.lastName || row.email || row.phone);
}

/** Example export with one header Karsaro will not guess (`Client`). */
export const SAMPLE_CLIENT_CSV = `First Name,Email Address,Mobile,Client
Ava,ava@example.com,555-0101,Ava Chen
Jordan,jordan@example.com,555-0144,Jordan Lee
Sam,sam@example.com,555-0199,Sam Ortiz
`;

export function guessField(header: string): ClientImportField {
  const h = header.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!h) return "skip";
  if (/\bfull name\b|\binvitee name\b|\bclient name\b|\bname\b/.test(h) && !/first|last|email/.test(h)) {
    return "fullName";
  }
  if (/first/.test(h)) return "firstName";
  if (/last|surname/.test(h)) return "lastName";
  if (/email|e mail/.test(h)) return "email";
  if (/phone|mobile|cell/.test(h)) return "phone";
  if (/note|comment/.test(h)) return "notes";
  return "skip";
}

export const IMPORT_PRESETS: {
  id: string;
  label: string;
  hints: string;
  steps: string[];
}[] = [
  {
    id: "generic",
    label: "Generic CSV",
    hints: "First / last name, email, phone",
    steps: [
      "In your old booking software, open Clients, Customers, or Patients.",
      "Look for Export, Download, or a client list report, and save it as CSV.",
      "Include name, email, and phone columns if you can.",
      "Choose that file below. Karsaro will guess the columns so you can check them before importing.",
    ],
  },
  {
    id: "jane",
    label: "Jane",
    hints: "Typical Jane client export headers",
    steps: [
      "In Jane, open Reports.",
      "Run a patient or client list report.",
      "Export or download the report as CSV.",
      "Choose that Jane export below.",
    ],
  },
  {
    id: "mindbody",
    label: "Mindbody",
    hints: "FirstName LastName Email MobilePhone",
    steps: [
      "In Mindbody, open Reports.",
      "Find a client or customer list report.",
      "Run it and export to CSV (or Excel, then save as CSV).",
      "Choose that file below.",
    ],
  },
  {
    id: "acuity",
    label: "Acuity / Squarespace",
    hints: "First Name, Last Name, Email, Phone",
    steps: [
      "In Acuity or Squarespace Scheduling, open Clients.",
      "Use Export clients or Download CSV.",
      "Choose that export below.",
    ],
  },
  {
    id: "square",
    label: "Square Appointments",
    hints: "First Name, Email Address, Phone Number",
    steps: [
      "In Square, open Customers (Appointments customers).",
      "Export customers to CSV.",
      "Choose that file below.",
    ],
  },
  {
    id: "calendly",
    label: "Calendly",
    hints: "Invitee Name + Invitee Email",
    steps: [
      "In Calendly, open the event type people book with you.",
      "Export invitees or meetings as CSV (Invitee Name and Invitee Email).",
      "This is people who booked with you, not a full client list. Choose that file below.",
    ],
  },
  {
    id: "vagaro",
    label: "Vagaro",
    hints: "First Name, Last Name, Email, Phone",
    steps: [
      "In Vagaro, open Customers.",
      "Export the customer list to CSV.",
      "Choose that file below.",
    ],
  },
  {
    id: "boulevard",
    label: "Boulevard",
    hints: "Client name, email, phone",
    steps: [
      "In Boulevard, open Clients or a client report.",
      "Export to CSV.",
      "Choose that file below.",
    ],
  },
];
