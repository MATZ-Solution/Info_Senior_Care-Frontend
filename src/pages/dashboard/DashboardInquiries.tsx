import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { inquiriesApi } from "../../lib/api";
import type { InquiryOut } from "../../lib/types";
import { EmptyState, Spinner } from "../../components/Feedback";

export default function DashboardInquiries() {
  const [inquiries, setInquiries] = useState<InquiryOut[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    inquiriesApi
      .mine()
      .then((items) => {
        if (!cancelled) setInquiries(items);
      })
      .catch(() => setInquiries([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 24 }}>Inquiries</h1>
      {inquiries === null && <Spinner />}
      {inquiries && inquiries.length === 0 && <EmptyState title="No inquiries sent yet" hint="Request info from a facility page to see it here." />}
      {inquiries &&
        inquiries.map((inq) => (
          <div key={inq.id} className="card card-p" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <Link to={`/facilities/${inq.facility_id}`} style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>
                {inq.facility_name || "View facility"}
              </Link>
              <span className="pill pill-teal">{inq.status}</span>
            </div>
            {(inq.facility_type_category || inq.city || inq.state) && (
              <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
                {[inq.facility_type_category, [inq.city, inq.state].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}
              </div>
            )}
            {inq.message && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{inq.message}</p>}
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Sent {new Date(inq.created_at).toLocaleString()}
              {inq.budget && ` · Budget: ${inq.budget}`}
              {inq.contact_phone && ` · ${inq.contact_phone}`}
              {inq.contact_time_preference && ` · ${inq.contact_time_preference}`}
            </div>
          </div>
        ))}
    </div>
  );
}
