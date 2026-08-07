import type { InfomaryLead } from "./types";

/**
 * Data source for the /admin-dashboard leads table.
 *
 * The backend endpoint for `infomary_leads` does not exist yet, so `listLeads`
 * currently resolves sample rows. When the API lands, replace the body of
 * `listLeads` (and `updateLeadStatus`) with the real call -- the page only
 * knows about these two functions, so nothing else has to change:
 *
 *   export const listLeads = () => request<InfomaryLead[]>("/api/v1/admin/leads");
 */

/** Statuses the UI knows how to colour. Unknown values still render, just plain. */
export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Converted", "Closed"] as const;

export type KnownLeadStatus = (typeof LEAD_STATUSES)[number];

/** Maps a status onto one of the existing `.pill-*` modifiers from global.css. */
export function statusPillClass(status: string): string {
  switch (status.trim().toLowerCase()) {
    case "new":
      return "pill pill-blue";
    case "contacted":
      return "pill pill-gold";
    case "qualified":
      return "pill pill-teal";
    case "converted":
      return "pill pill-green";
    case "closed":
      return "pill pill-muted";
    default:
      return "pill pill-muted";
  }
}

/** Every text column defaults to '' in Postgres -- show an em dash instead of a gap. */
export function leadValue(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "" ? "—" : trimmed;
}

export function formatLeadDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/** Collects the distinct non-empty values of one column, for the filter dropdowns. */
export function distinctValues(leads: InfomaryLead[], key: keyof InfomaryLead): string[] {
  const seen = new Set<string>();
  for (const lead of leads) {
    const value = String(lead[key] ?? "").trim();
    if (value) seen.add(value);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

const SAMPLE_LEADS: InfomaryLead[] = [
  {
    id: "1",
    created_at: "2026-08-06T14:20:00Z",
    name: "Margaret Ellison",
    email: "m.ellison@example.com",
    phone: "(415) 555-0142",
    care_need: "Memory care for early-stage dementia",
    care_type: "Memory Care",
    location: "San Francisco, CA",
    age: "82",
    gender: "Female",
    living_arrangement: "Lives alone",
    conditions: "Alzheimer's (early stage), hypertension",
    insurance: "Medicare + supplemental",
    budget: "$6,000 - $8,000 / month",
    notes: "Daughter is the primary decision maker. Prefers a facility within 20 minutes of Noe Valley.",
    status: "New",
    email_sent: false,
  },
  {
    id: "2",
    created_at: "2026-08-06T09:05:00Z",
    name: "Robert Nakamura",
    email: "rnakamura@example.com",
    phone: "(206) 555-0188",
    care_need: "Help with daily activities after a fall",
    care_type: "Assisted Living",
    location: "Seattle, WA",
    age: "78",
    gender: "Male",
    living_arrangement: "Lives with spouse",
    conditions: "Recovering hip fracture, type 2 diabetes",
    insurance: "Medicare Advantage",
    budget: "$4,500 - $5,500 / month",
    notes: "Wants a community that allows his spouse to move in later.",
    status: "Contacted",
    email_sent: true,
  },
  {
    id: "3",
    created_at: "2026-08-05T17:42:00Z",
    name: "Alicia Grant",
    email: "alicia.grant@example.com",
    phone: "(512) 555-0119",
    care_need: "Respite care for two weeks",
    care_type: "Respite Care",
    location: "Austin, TX",
    age: "71",
    gender: "Female",
    living_arrangement: "Lives with adult child",
    conditions: "COPD",
    insurance: "Private pay",
    budget: "$3,000 / month",
    notes: "",
    status: "Qualified",
    email_sent: true,
  },
  {
    id: "4",
    created_at: "2026-08-05T11:15:00Z",
    name: "Daniel Ortiz",
    email: "d.ortiz@example.com",
    phone: "",
    care_need: "Skilled nursing after hospital discharge",
    care_type: "Skilled Nursing",
    location: "Phoenix, AZ",
    age: "85",
    gender: "Male",
    living_arrangement: "Currently hospitalized",
    conditions: "Congestive heart failure, mobility limited",
    insurance: "Medicare + Medicaid",
    budget: "",
    notes: "Discharge planner reached out on behalf of the family. Timeline is urgent.",
    status: "Converted",
    email_sent: true,
  },
  {
    id: "5",
    created_at: "2026-08-04T08:30:00Z",
    name: "Priya Raman",
    email: "praman@example.com",
    phone: "(617) 555-0164",
    care_need: "In-home caregiver a few days a week",
    care_type: "In-Home Care",
    location: "Boston, MA",
    age: "76",
    gender: "Female",
    living_arrangement: "Lives alone",
    conditions: "Arthritis, low vision",
    insurance: "Private pay",
    budget: "$2,000 - $3,000 / month",
    notes: "Prefers a caregiver who speaks Tamil.",
    status: "New",
    email_sent: false,
  },
  {
    id: "6",
    created_at: "2026-08-03T15:58:00Z",
    name: "Walter Boyd",
    email: "",
    phone: "(303) 555-0173",
    care_need: "Independent living community with meals",
    care_type: "Independent Living",
    location: "Denver, CO",
    age: "69",
    gender: "Male",
    living_arrangement: "Lives alone",
    conditions: "",
    insurance: "Private pay",
    budget: "$3,500 - $4,500 / month",
    notes: "Wants an active community with a fitness centre.",
    status: "Closed",
    email_sent: false,
  },
  {
    id: "7",
    created_at: "2026-08-02T13:11:00Z",
    name: "Eleanor Whitfield",
    email: "e.whitfield@example.com",
    phone: "(919) 555-0135",
    care_need: "Long-term memory care placement",
    care_type: "Memory Care",
    location: "Raleigh, NC",
    age: "88",
    gender: "Female",
    living_arrangement: "Lives with adult child",
    conditions: "Advanced dementia, wandering risk",
    insurance: "Long-term care insurance",
    budget: "$7,000+ / month",
    notes: "Needs a secured unit. Family is touring next week.",
    status: "Contacted",
    email_sent: true,
  },
  {
    id: "8",
    created_at: "2026-08-01T10:47:00Z",
    name: "James Okafor",
    email: "j.okafor@example.com",
    phone: "(312) 555-0157",
    care_need: "Assisted living near family",
    care_type: "Assisted Living",
    location: "Chicago, IL",
    age: "80",
    gender: "Male",
    living_arrangement: "Lives alone",
    conditions: "Parkinson's",
    insurance: "Medicare",
    budget: "$5,000 / month",
    notes: "",
    status: "Qualified",
    email_sent: false,
  },
];

/** Replace with the real endpoint once the backend exposes `infomary_leads`. */
export function listLeads(): Promise<InfomaryLead[]> {
  return new Promise((resolve) => setTimeout(() => resolve(SAMPLE_LEADS), 450));
}

/** No-op stand-in so the status control is wired end to end in the UI. */
export function updateLeadStatus(_leadId: string, _status: string): Promise<void> {
  return Promise.resolve();
}
