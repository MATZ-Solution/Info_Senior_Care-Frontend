import { adminApi } from "./api";
import type { UnifiedLead } from "./types";

/**
 * Data source for the /admin-dashboard leads table -- backed by
 * GET /api/v1/admin/leads (app/api/v1/endpoints/admin.py), which merges the
 * inquiry form ("form") and the Infomary chat agent ("chat") into one
 * normalized list.
 */

/**
 * Statuses the UI knows how to colour. Must match the backend's own valid
 * list exactly (app/main.py::update_status) -- posting anything else 400s.
 */
export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Converted", "Not Interested"] as const;

export type KnownLeadStatus = (typeof LEAD_STATUSES)[number];

export function sourceLabel(source: string): string {
  switch (source) {
    case "form":
      return "Inquiry form";
    case "chat":
      return "Infomary chat";
    default:
      return source;
  }
}

/** Only "chat"-sourced leads have a backend endpoint to update their status today. */
export function canUpdateStatus(lead: UnifiedLead): boolean {
  return lead.source === "chat";
}

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
export function distinctValues(leads: UnifiedLead[], key: keyof UnifiedLead): string[] {
  const seen = new Set<string>();
  for (const lead of leads) {
    const value = String(lead[key] ?? "").trim();
    if (value) seen.add(value);
  }
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
}

// The table/filters/sort/pagination all run client-side over one fetched
// batch (see AdminDashboard.tsx) rather than a server-paginated view. 200 is
// the backend's own max page size (le=200 on /api/v1/admin/leads), so this
// is the most we can pull in one shot.
const FETCH_LIMIT = 200;

export async function listLeads(): Promise<UnifiedLead[]> {
  const res = await adminApi.leads({ limit: FETCH_LIMIT });
  return res.items;
}

export async function updateLeadStatus(lead: UnifiedLead, status: string): Promise<void> {
  if (!canUpdateStatus(lead)) {
    throw new Error("Status updates aren't supported for inquiry-form leads yet.");
  }
  // lead.id is prefixed ("chat:<lead_id>") to keep the two source id spaces
  // from colliding -- the update endpoint wants the bare lead_id.
  const rawLeadId = lead.id.startsWith("chat:") ? lead.id.slice("chat:".length) : lead.id;
  await adminApi.updateLeadStatus(rawLeadId, status);
}
