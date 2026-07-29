import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ApiError, assessmentApi, inquiriesApi, savedApi } from "../../lib/api";
import type { AssessmentOut, FacilityCard, InquiryOut } from "../../lib/types";
import { useAuth } from "../../lib/auth";

export default function DashboardOverview() {
  const { profile } = useAuth();
  const [saved, setSaved] = useState<FacilityCard[] | null>(null);
  const [inquiries, setInquiries] = useState<InquiryOut[] | null>(null);
  const [assessment, setAssessment] = useState<AssessmentOut | null>(null);
  const [assessmentChecked, setAssessmentChecked] = useState(false);

  useEffect(() => {
    savedApi.list().then(setSaved).catch(() => setSaved([]));
    inquiriesApi.mine().then(setInquiries).catch(() => setInquiries([]));
    assessmentApi
      .latest()
      .then(setAssessment)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 404)) {
          // swallow -- overview should still render without the assessment card
        }
      })
      .finally(() => setAssessmentChecked(true));
  }, []);

  const lovedOne = profile?.onboarding_data?.loved_one as Record<string, unknown> | undefined;
  const location = profile?.onboarding_data?.location as Record<string, unknown> | undefined;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "var(--navy)" }}>
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
        </h1>
        <Link to="/chat" className="btn btn-primary">
          Talk to Infomary
        </Link>
      </div>

      <div className="grid-4" style={{ gap: 16, marginBottom: 32 }}>
        <StatCard label="Saved facilities" value={saved ? saved.length : "…"} />
        <StatCard label="Inquiries sent" value={inquiries ? inquiries.length : "…"} />
        <StatCard
          label="Onboarding"
          value={profile?.onboarding_completed ? "Complete" : "Incomplete"}
          accent={!profile?.onboarding_completed}
          link={!profile?.onboarding_completed ? { to: "/onboarding", label: "Finish onboarding →" } : undefined}
        />
        <StatCard
          label="Care assessment"
          value={assessment ? assessment.recommended_care_type || "Done" : assessmentChecked ? "Not taken" : "…"}
          accent={!assessment}
          link={!assessment ? { to: "/assessment", label: "Take the quiz →" } : undefined}
        />
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div className="card card-p">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)" }}>Your profile</div>
            <Link to="/dashboard/profile" style={{ fontSize: 13, color: "var(--teal)", fontWeight: 600 }}>
              Edit
            </Link>
          </div>
          {lovedOne || location ? (
            <>
              {lovedOne && (
                <>
                  {typeof lovedOne.relationship === "string" && <Row label="Relationship" value={lovedOne.relationship} />}
                  {typeof lovedOne.age !== "undefined" && <Row label="Age" value={String(lovedOne.age)} />}
                </>
              )}
              {location && (
                <>
                  {typeof location.city === "string" && <Row label="City" value={location.city} />}
                  {typeof location.state === "string" && <Row label="State" value={location.state} />}
                  {typeof location.zip_code === "string" && <Row label="ZIP" value={location.zip_code} />}
                </>
              )}
            </>
          ) : (
            <p className="muted" style={{ fontSize: 13 }}>
              You haven't completed onboarding yet.{" "}
              <Link to="/onboarding" style={{ color: "var(--teal)", fontWeight: 600 }}>
                Add your details →
              </Link>
            </p>
          )}
        </div>

        <div className="card card-p">
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 16 }}>Recent inquiries</div>
          {inquiries === null && <p className="muted">Loading…</p>}
          {inquiries && inquiries.length === 0 && (
            <p className="muted" style={{ fontSize: 13 }}>
              No inquiries yet.{" "}
              <Link to="/search" style={{ color: "var(--teal)", fontWeight: 600 }}>
                Browse facilities →
              </Link>
            </p>
          )}
          {inquiries &&
            inquiries.slice(0, 3).map((i) => (
              <div key={i.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--g2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Link to={`/facilities/${i.facility_id}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>
                    View facility
                  </Link>
                  <span className="pill pill-teal">{i.status}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{new Date(i.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          {inquiries && inquiries.length > 3 && (
            <Link to="/dashboard/inquiries" style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600, marginTop: 8, display: "inline-block" }}>
              View all {inquiries.length} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, link }: { label: string; value: string | number; accent?: boolean; link?: { to: string; label: string } }) {
  return (
    <div className="card card-p" style={accent ? { background: "var(--tl)", border: "1px solid var(--tm)" } : undefined}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: "var(--navy)" }}>{value}</div>
      {link && (
        <Link to={link.to} style={{ fontSize: 12, color: "var(--teal)", fontWeight: 600, marginTop: 4, display: "inline-block" }}>
          {link.label}
        </Link>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--g2)", fontSize: 13 }}>
      <span style={{ color: "var(--muted)" }}>{label}</span>
      <span style={{ fontWeight: 700, color: "var(--navy)" }}>{value}</span>
    </div>
  );
}
