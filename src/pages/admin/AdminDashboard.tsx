import { useEffect, useMemo, useState } from "react";
import {
  LEAD_STATUSES,
  canUpdateStatus,
  distinctValues,
  formatLeadDate,
  leadValue,
  listLeads,
  sourceLabel,
  statusPillClass,
  updateLeadStatus,
} from "../../lib/adminLeads";
import { ApiError } from "../../lib/api";
import type { UnifiedLead } from "../../lib/types";
import { EmptyState, ErrorBanner, Spinner } from "../../components/Feedback";
import LeadDetailDrawer from "./LeadDetailDrawer";

type SortKey = "created_at" | "name" | "facility_type" | "location" | "source" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

export default function AdminDashboard() {
  const [leads, setLeads] = useState<UnifiedLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [facilityTypeFilter, setFacilityTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState<UnifiedLead | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLeads(null);
    setError(null);
    listLeads()
      .then((rows) => {
        if (!cancelled) setLeads(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          // /api/v1/admin/leads requires a real signed-in user -- a guest or
          // signed-out visitor gets a 401, which reads very differently from
          // a genuine fetch failure.
          setError(
            err instanceof ApiError && err.status === 401
              ? "Sign in with a staff account to view leads."
              : "Could not load leads. Please try again."
          );
          setLeads([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const facilityTypes = useMemo(() => (leads ? distinctValues(leads, "facility_type") : []), [leads]);
  const sources = useMemo(() => (leads ? distinctValues(leads, "source") : []), [leads]);
  const statuses = useMemo(() => {
    const fromData = leads ? distinctValues(leads, "status") : [];
    return Array.from(new Set<string>([...LEAD_STATUSES, ...fromData]));
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (facilityTypeFilter && lead.facility_type !== facilityTypeFilter) return false;
      if (sourceFilter && lead.source !== sourceFilter) return false;
      if (!term) return true;
      // Free-text search spans the columns an admin would actually look someone
      // up by.
      return [lead.name, lead.email, lead.phone, lead.location, lead.interest, lead.facility_name, lead.facility_type, lead.source]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [leads, search, statusFilter, facilityTypeFilter, sourceFilter]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    rows.sort((a, b) => {
      const av = String(a[sortKey] ?? "");
      const bv = String(b[sortKey] ?? "");
      // Blanks sink to the bottom regardless of direction -- an empty column is
      // never the thing you sorted to see.
      if (!av && bv) return 1;
      if (av && !bv) return -1;
      const cmp = sortKey === "created_at" ? av.localeCompare(bv) : av.localeCompare(bv, undefined, { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Any filter change can shrink the result set below the current page.
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, facilityTypeFilter, sourceFilter, pageSize]);

  const stats = useMemo(() => {
    const rows = leads ?? [];
    const byStatus = (name: string) => rows.filter((l) => l.status.trim().toLowerCase() === name).length;
    return {
      total: rows.length,
      newLeads: byStatus("new"),
      contacted: byStatus("contacted"),
      converted: byStatus("converted"),
      form: rows.filter((l) => l.source === "form").length,
      chat: rows.filter((l) => l.source === "chat").length,
    };
  }, [leads]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "created_at" ? "desc" : "asc");
    }
  }

  async function handleStatusChange(lead: UnifiedLead, status: string) {
    if (!canUpdateStatus(lead)) return; // the status control is disabled for these -- see LeadDetailDrawer
    setLeads((prev) => (prev ? prev.map((l) => (l === lead ? { ...l, status } : l)) : prev));
    setSelected((prev) => (prev === lead ? { ...prev, status } : prev));
    try {
      await updateLeadStatus(lead, status);
    } catch {
      setReloadKey((k) => k + 1); // revert to server truth on failure
    }
  }

  const filtersActive = Boolean(search || statusFilter || facilityTypeFilter || sourceFilter);

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <div className="admin-eyebrow">Internal · Infomary</div>
          <h1 className="admin-title">Leads</h1>
        </div>
        <div className="admin-topbar-actions">
          <span className="admin-count">
            {leads ? `${sorted.length} of ${leads.length}` : "…"} leads
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => exportCsv(sorted)} disabled={!sorted.length}>
            ⬇ Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setReloadKey((k) => k + 1)}>
            ↻ Refresh
          </button>
        </div>
      </header>

      <div className="admin-body">
        {error && <ErrorBanner message={error} />}

        <div className="grid-4 admin-stats">
          <Stat label="Total leads" value={leads ? stats.total : "…"} />
          <Stat label="New" value={leads ? stats.newLeads : "…"} accent={Boolean(leads && stats.newLeads)} />
          <Stat label="Contacted" value={leads ? stats.contacted : "…"} />
          <Stat label="Converted" value={leads ? stats.converted : "…"} />
          <Stat label="From inquiry form" value={leads ? stats.form : "…"} />
          <Stat label="From Infomary chat" value={leads ? stats.chat : "…"} />
        </div>

        <div className="admin-toolbar">
          <input
            className="admin-input admin-search"
            placeholder="Search name, email, phone, location, interest, facility…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search leads"
          />
          <select className="admin-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select className="admin-input" value={facilityTypeFilter} onChange={(e) => setFacilityTypeFilter(e.target.value)} aria-label="Filter by facility type">
            <option value="">All facility types</option>
            {facilityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className="admin-input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Filter by source">
            <option value="">All sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {sourceLabel(s)}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setFacilityTypeFilter("");
                setSourceFilter("");
              }}
            >
              Clear
            </button>
          )}
        </div>

        {leads === null && (
          <div style={{ padding: "60px 0", display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        )}

        {leads !== null && sorted.length === 0 && (
          <EmptyState
            title={filtersActive ? "No leads match these filters" : "No leads yet"}
            hint={filtersActive ? "Try clearing the search or filters." : "New inquiries and Infomary conversations will appear here."}
          />
        )}

        {leads !== null && sorted.length > 0 && (
          <>
            <div className="data-table-wrap card">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortableTh label="Received" k="created_at" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Lead" k="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="col-lead" />
                    <th className="col-care-need">Interest</th>
                    <SortableTh label="Facility / type" k="facility_type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Location" k="location" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Budget</th>
                    <SortableTh label="Source" k="source" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((lead) => (
                    <tr key={lead.id} onClick={() => setSelected(lead)} className="data-row">
                      <td className="nowrap muted-cell">{formatLeadDate(lead.created_at)}</td>
                      <td>
                        <div className="cell-strong">{leadValue(lead.name)}</div>
                        <div className="cell-sub">{leadValue(lead.email)}</div>
                        <div className="cell-sub">{leadValue(lead.phone)}</div>
                      </td>
                      <td className="col-care-need">
                        <div className="cell-clamp" title={lead.interest ?? undefined}>
                          {leadValue(lead.interest)}
                        </div>
                      </td>
                      <td className="nowrap">
                        {lead.facility_name ? `${lead.facility_name} — ` : ""}
                        {leadValue(lead.facility_type)}
                      </td>
                      <td className="nowrap">{leadValue(lead.location)}</td>
                      <td className="nowrap">{leadValue(lead.budget)}</td>
                      <td className="nowrap">
                        <span className={`pill ${lead.source === "chat" ? "pill-teal" : "pill-blue"}`}>{sourceLabel(lead.source)}</span>
                      </td>
                      <td>
                        <span className={statusPillClass(lead.status)}>{leadValue(lead.status)}</span>
                      </td>
                      <td className="nowrap">
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(lead);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="admin-pager">
              <div className="admin-pager-info">
                Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} of {sorted.length}
              </div>
              <div className="admin-pager-controls">
                <select
                  className="admin-input"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
                <button className="btn btn-ghost btn-sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                  ← Prev
                </button>
                <span className="admin-pager-page">
                  {currentPage} / {totalPages}
                </span>
                <button className="btn btn-ghost btn-sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <LeadDetailDrawer
          lead={selected}
          statuses={statuses}
          onStatusChange={(status) => void handleStatusChange(selected, status)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`stat-card${accent ? " accent" : ""}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function SortableTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const active = sortKey === k;
  return (
    <th className={className} aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className={`th-sort${active ? " active" : ""}`} onClick={() => onSort(k)}>
        {label}
        <span className="th-sort-arrow">{active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    </th>
  );
}

const CSV_COLUMNS: (keyof UnifiedLead)[] = [
  "created_at",
  "source",
  "name",
  "email",
  "phone",
  "interest",
  "facility_name",
  "facility_type",
  "location",
  "budget",
  "contact_time_preference",
  "status",
];

function exportCsv(rows: UnifiedLead[]) {
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = [
    CSV_COLUMNS.join(","),
    ...rows.map((row) => CSV_COLUMNS.map((col) => escape(row[col])).join(",")),
  ].join("\r\n");

  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `infomary-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
