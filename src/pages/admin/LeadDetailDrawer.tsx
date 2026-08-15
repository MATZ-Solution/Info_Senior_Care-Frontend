import { useEffect } from "react";
import { canUpdateStatus, formatLeadDate, leadValue, sourceLabel, statusPillClass } from "../../lib/adminLeads";
import type { UnifiedLead } from "../../lib/types";

// Friendlier labels for the source-specific extras that don't fit the common
// shape (see UnifiedLead.details in app/schemas/admin.py). Unknown keys still
// render, just with their raw key as the label.
const DETAIL_LABELS: Record<string, string> = {
  age: "Age",
  gender: "Gender",
  living_arrangement: "Living arrangement",
  conditions: "Conditions",
  insurance: "Insurance",
  notes: "Notes",
  email_sent: "Email sent",
  session_id: "Chat session",
  facility_id: "Facility ID",
  state: "State",
  city: "City",
  message: "Message",
};

function detailValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function LeadDetailDrawer({
  lead,
  statuses,
  onStatusChange,
  onClose,
}: {
  lead: UnifiedLead;
  statuses: string[];
  onStatusChange: (status: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    // The drawer overlays the full page -- stop the table behind it scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const email = (lead.email ?? "").trim();
  const phone = (lead.phone ?? "").trim();
  const statusEditable = canUpdateStatus(lead);
  const detailEntries = Object.entries(lead.details).filter(([, v]) => detailValue(v) !== "");

  return (
    <div className="admin-drawer-backdrop" onClick={onClose}>
      <aside
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={`Lead details for ${lead.name || "unnamed lead"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="admin-drawer-head">
          <div style={{ minWidth: 0 }}>
            <h2 className="admin-drawer-title">{leadValue(lead.name)}</h2>
            <div className="admin-drawer-sub">
              Received {formatLeadDate(lead.created_at)} · via {sourceLabel(lead.source)}
            </div>
          </div>
          <button className="admin-drawer-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="admin-drawer-body">
          <div className="admin-drawer-status">
            <span className={statusPillClass(lead.status)}>{leadValue(lead.status)}</span>
            <span className={`pill ${lead.source === "chat" ? "pill-teal" : "pill-blue"}`}>{sourceLabel(lead.source)}</span>
          </div>

          <div className="field" style={{ marginBottom: 20 }}>
            <label htmlFor="lead-status">Update status</label>
            {statusEditable ? (
              <select id="lead-status" value={lead.status} onChange={(e) => onStatusChange(e.target.value)}>
                {(statuses.includes(lead.status) ? statuses : [lead.status, ...statuses]).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <p style={{ fontSize: 12.5, color: "var(--sub)", margin: 0 }}>
                Status updates aren't supported for inquiry-form leads yet -- only Infomary chat leads can be updated.
              </p>
            )}
          </div>

          <Section title="Contact">
            <Row label="Email" value={leadValue(lead.email)} href={email ? `mailto:${email}` : undefined} />
            <Row label="Phone" value={leadValue(lead.phone)} href={phone ? `tel:${phone.replace(/[^\d+]/g, "")}` : undefined} />
            <Row label="Location" value={leadValue(lead.location)} />
          </Section>

          <Section title="Interest">
            <Row label="Interest" value={leadValue(lead.interest)} />
            <Row label="Facility" value={leadValue(lead.facility_name)} />
            <Row label="Facility type" value={leadValue(lead.facility_type)} />
            <Row label="Timeline" value={leadValue(lead.contact_time_preference)} />
          </Section>

          <Section title="Budget">
            <Row label="Budget" value={leadValue(lead.budget)} />
          </Section>

          {detailEntries.length > 0 && (
            <Section title="Additional details">
              {detailEntries.map(([key, value]) => (
                <Row key={key} label={DETAIL_LABELS[key] || key} value={detailValue(value)} />
              ))}
            </Section>
          )}
        </div>

        <footer className="admin-drawer-foot">
          {email && (
            <a className="btn btn-primary btn-sm" href={`mailto:${email}`}>
              ✉ Email lead
            </a>
          )}
          {phone && (
            <a className="btn btn-ghost btn-sm" href={`tel:${phone.replace(/[^\d+]/g, "")}`}>
              ☎ Call
            </a>
          )}
          <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </footer>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="admin-drawer-section">
      <div className="sidebar-title">{title}</div>
      {children}
    </section>
  );
}

function Row({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="info-row">
      <span className="k">{label}</span>
      <span className="v">
        {href ? (
          <a href={href} style={{ color: "var(--primary)" }}>
            {value}
          </a>
        ) : (
          value
        )}
      </span>
    </div>
  );
}
