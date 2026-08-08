import { useEffect, useMemo, useState } from "react";
import {
  LEAD_STATUSES,
  distinctValues,
  formatLeadDate,
  leadValue,
  listLeads,
  statusPillClass,
  updateLeadStatus,
} from "../../lib/adminLeads";
import type { InfomaryLead } from "../../lib/types";
import { EmptyState, ErrorBanner, Spinner } from "../../components/Feedback";
import LeadDetailDrawer from "./LeadDetailDrawer";

type SortKey = "created_at" | "name" | "care_type" | "location" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZES = [10, 25, 50];

export default function AdminDashboard() {
  const [leads, setLeads] = useState<InfomaryLead[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [careTypeFilter, setCareTypeFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState<"" | "sent" | "unsent">("");

  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selected, setSelected] = useState<InfomaryLead | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLeads(null);
    setError(null);
    listLeads()
      .then((rows) => {
        if (!cancelled) setLeads(rows);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Could not load leads. Please try again.");
          setLeads([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const careTypes = useMemo(() => (leads ? distinctValues(leads, "care_type") : []), [leads]);
  const statuses = useMemo(() => {
    const fromData = leads ? distinctValues(leads, "status") : [];
    return Array.from(new Set<string>([...LEAD_STATUSES, ...fromData]));
  }, [leads]);

  const filtered = useMemo(() => {
    if (!leads) return [];
    const term = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter && lead.status !== statusFilter) return false;
      if (careTypeFilter && lead.care_type !== careTypeFilter) return false;
      if (emailFilter === "sent" && !lead.email_sent) return false;
      if (emailFilter === "unsent" && lead.email_sent) return false;
      if (!term) return true;
      // Free-text search spans the columns an admin would actually look someone
      // up by, plus the notes field where context tends to live.
      return [lead.name, lead.email, lead.phone, lead.location, lead.care_need, lead.care_type, lead.notes]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [leads, search, statusFilter, careTypeFilter, emailFilter]);

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
  }, [search, statusFilter, careTypeFilter, emailFilter, pageSize]);

  const stats = useMemo(() => {
    const rows = leads ?? [];
    const byStatus = (name: string) => rows.filter((l) => l.status.trim().toLowerCase() === name).length;
    return {
      total: rows.length,
      newLeads: byStatus("new"),
      contacted: byStatus("contacted"),
      converted: byStatus("converted"),
      emailsSent: rows.filter((l) => l.email_sent).length,
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

  function handleStatusChange(lead: InfomaryLead, status: string) {
    setLeads((prev) => (prev ? prev.map((l) => (l === lead ? { ...l, status } : l)) : prev));
    setSelected((prev) => (prev === lead ? { ...prev, status } : prev));
    if (lead.lead_id) void updateLeadStatus(lead.lead_id, status);
  }

  const filtersActive = Boolean(search || statusFilter || careTypeFilter || emailFilter);

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
          <Stat label="Emails sent" value={leads ? `${stats.emailsSent} / ${stats.total}` : "…"} />
        </div>

        <div className="admin-toolbar">
          <input
            className="admin-input admin-search"
            placeholder="Search name, email, phone, location, notes…"
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
          <select className="admin-input" value={careTypeFilter} onChange={(e) => setCareTypeFilter(e.target.value)} aria-label="Filter by care type">
            <option value="">All care types</option>
            {careTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className="admin-input"
            value={emailFilter}
            onChange={(e) => setEmailFilter(e.target.value as "" | "sent" | "unsent")}
            aria-label="Filter by email status"
          >
            <option value="">Email: any</option>
            <option value="sent">Email sent</option>
            <option value="unsent">Email not sent</option>
          </select>
          {filtersActive && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setCareTypeFilter("");
                setEmailFilter("");
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
            hint={filtersActive ? "Try clearing the search or filters." : "New Infomary submissions will appear here."}
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
                    <th className="col-care-need">Care need</th>
                    <SortableTh label="Care type" k="care_type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <SortableTh label="Location" k="location" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Age / Gender</th>
                    <th>Budget</th>
                    <SortableTh label="Status" k="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    <th>Email</th>
                    <th aria-label="Actions" />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((lead, i) => (
                    <tr key={lead.lead_id ?? `${lead.email}-${i}`} onClick={() => setSelected(lead)} className="data-row">
                      <td className="nowrap muted-cell">{formatLeadDate(lead.created_at)}</td>
                      <td>
                        <div className="cell-strong">{leadValue(lead.name)}</div>
                        <div className="cell-sub">{leadValue(lead.email)}</div>
                        <div className="cell-sub">{leadValue(lead.phone)}</div>
                      </td>
                      <td className="col-care-need">
                        <div className="cell-clamp" title={lead.care_need}>
                          {leadValue(lead.care_need)}
                        </div>
                      </td>
                      <td className="nowrap">{leadValue(lead.care_type)}</td>
                      <td className="nowrap">{leadValue(lead.location)}</td>
                      <td className="nowrap muted-cell">
                        {leadValue(lead.age)} · {leadValue(lead.gender)}
                      </td>
                      <td className="nowrap">{leadValue(lead.budget)}</td>
                      <td>
                        <span className={statusPillClass(lead.status)}>{leadValue(lead.status)}</span>
                      </td>
                      <td>
                        <span className={lead.email_sent ? "email-dot sent" : "email-dot"} title={lead.email_sent ? "Email sent" : "Not sent"}>
                          {lead.email_sent ? "✓ Sent" : "Not sent"}
                        </span>
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
          onStatusChange={(status) => handleStatusChange(selected, status)}
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

const CSV_COLUMNS: (keyof InfomaryLead)[] = [
  "created_at",
  "name",
  "email",
  "phone",
  "care_need",
  "care_type",
  "location",
  "age",
  "gender",
  "living_arrangement",
  "conditions",
  "insurance",
  "budget",
  "notes",
  "status",
  "email_sent",
];

function exportCsv(rows: InfomaryLead[]) {
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
