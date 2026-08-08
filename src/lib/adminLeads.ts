import { adminApi } from "./api";
import type { InfomaryLead } from "./types";

/**
 * Data source for the /admin-dashboard leads table -- backed by the root-level,
 * unversioned dashboard routes in app/main.py (GET /dashboard/leads,
 * POST /dashboard/leads/status). Kept as two small functions so the page
 * doesn't need to know about the request/response shape directly.
 */

/**
 * Statuses the UI knows how to colour. Must match the backend's own valid
 * list exactly (app/main.py::update_status) -- posting anything else 400s.
 */
export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Converted", "Not Interested"] as const;

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
    case "not interested":
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

// The table/filters/sort/pagination all run client-side over one fetched
// batch (see AdminDashboard.tsx) rather than a server-paginated view, so this
// asks for a generously high ceiling in one shot instead of wiring up real
// pagination the UI doesn't have.
const FETCH_LIMIT = 1000;

export async function listLeads(): Promise<InfomaryLead[]> {
  const res = await adminApi.leads({ limit: FETCH_LIMIT });
  return res.leads;
}

export async function updateLeadStatus(leadId: string, status: string): Promise<void> {
  await adminApi.updateLeadStatus(leadId, status);
}
