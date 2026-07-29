import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { facilitiesApi, inquiriesApi } from "../../lib/api";
import type { InquiryOut } from "../../lib/types";
import { EmptyState, Spinner } from "../../components/Feedback";

export default function DashboardInquiries() {
  const [inquiries, setInquiries] = useState<InquiryOut[] | null>(null);
  const [facilityNames, setFacilityNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    inquiriesApi
      .mine()
      .then(async (items) => {
        if (cancelled) return;
        setInquiries(items);
        const uniqueIds = Array.from(new Set(items.map((i) => i.facility_id)));
        const results = await Promise.allSettled(uniqueIds.map((id) => facilitiesApi.detail(id)));
        if (cancelled) return;
        const names: Record<string, string> = {};
        results.forEach((res, idx) => {
          if (res.status === "fulfilled") names[uniqueIds[idx]] = res.value.name;
        });
        setFacilityNames(names);
      })
      .catch(() => setInquiries([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "var(--navy)", marginBottom: 24 }}>Inquiries</h1>
      {inquiries === null && <Spinner />}
      {inquiries && inquiries.length === 0 && <EmptyState title="No inquiries sent yet" hint="Request info from a facility page to see it here." />}
      {inquiries &&
        inquiries.map((inq) => (
          <div key={inq.id} className="card card-p" style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
              <Link to={`/facilities/${inq.facility_id}`} style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)" }}>
                {facilityNames[inq.facility_id] || "View facility"}
              </Link>
              <span className="pill pill-teal">{inq.status}</span>
            </div>
            {inq.message && <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>{inq.message}</p>}
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Sent {new Date(inq.created_at).toLocaleString()}
              {inq.contact_phone && ` · ${inq.contact_phone}`}
              {inq.contact_time_preference && ` · ${inq.contact_time_preference}`}
            </div>
          </div>
        ))}
    </div>
  );
}
