import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, facilitiesApi, formatApiErrorDetail, inquiriesApi, savedApi } from "../lib/api";
import type { FacilityDetail as FacilityDetailType } from "../lib/types";
import { Spinner, ErrorBanner } from "../components/Feedback";
import { useAuth } from "../lib/auth";

const NH_LABELS: Record<string, string> = {
  nh_total_certified_beds: "Total certified beds",
  nh_average_daily_residents: "Average daily residents",
  nh_chain_affiliation: "Chain affiliation",
  nh_ccrc: "Continuing care retirement community",
  nh_health_inspection_star_rating: "Health inspection star rating",
  nh_staffing_star_rating: "Staffing star rating",
  nh_quality_measure_star_rating: "Quality measure star rating",
  nh_total_nursing_hours_per_resident_day: "Nursing hours / resident / day",
  nh_staff_stability: "Staff stability",
  nh_health_deficiencies_latest: "Health deficiencies (latest survey)",
  nh_number_of_fines: "Number of fines",
  nh_total_fines_usd: "Total fines (USD)",
  nh_penalty_summary: "Penalty summary",
};

const HH_LABELS: Record<string, string> = {
  hh_provides_nursing_care: "Nursing care",
  hh_provides_physical_therapy: "Physical therapy",
  hh_provides_occupational_therapy: "Occupational therapy",
  hh_provides_speech_therapy: "Speech therapy",
  hh_provides_home_health_aides: "Home health aides",
  hh_hospital_readmission_rate: "Hospital readmission rate",
  hh_home_discharge_success: "Home discharge success rate",
  hh_medicare_cost_vs_national_avg: "Medicare cost vs. national average",
};

const SERVICE_LABELS: Record<string, string> = {
  offers_alzheimer_dementia_care: "Alzheimer's / dementia care",
  offers_hospice_care: "Hospice care",
  offers_ventilator_care: "Ventilator care",
  offers_psychiatric_care: "Psychiatric care",
  offers_substance_abuse_treatment: "Substance abuse treatment",
  offers_hiv_care: "HIV care",
  offers_rehab_services: "Rehabilitation services",
  offers_adult_day_care: "Adult day care",
  offers_respite_care: "Respite care",
  offers_home_care_services: "Home care services",
  offers_traumatic_brain_injury_care: "Traumatic brain injury care",
  offers_iv_therapy: "IV therapy",
  offers_pain_management: "Pain management",
  offers_medical_equipment_supply: "Medical equipment supply",
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="info-row">
      <span className="k">{label}</span>
      <span className="v">{String(value)}</span>
    </div>
  );
}

export default function FacilityDetail() {
  const { id } = useParams<{ id: string }>();
  const { isSignedIn } = useAuth();
  const [facility, setFacility] = useState<FacilityDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);

  const [showInquiry, setShowInquiry] = useState(false);
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [timePref, setTimePref] = useState("");
  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    facilitiesApi
      .detail(id)
      .then((f) => {
        if (!cancelled) setFacility(f);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError) setError(formatApiErrorDetail(err.detail));
        else setError("Network error -- is the backend running?");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !isSignedIn) return;
    let cancelled = false;
    savedApi
      .list()
      .then((items) => {
        if (!cancelled) setIsSaved(items.some((i) => i.id === id));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [id, isSignedIn]);

  async function toggleSave() {
    if (!id || !isSignedIn) return;
    setSaveBusy(true);
    try {
      if (isSaved) await savedApi.remove(id);
      else await savedApi.save(id);
      setIsSaved(!isSaved);
    } finally {
      setSaveBusy(false);
    }
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setInquiryStatus("sending");
    setInquiryError(null);
    try {
      await inquiriesApi.create({
        facility_id: id,
        message: message || undefined,
        contact_phone: phone || undefined,
        contact_time_preference: timePref || undefined,
      });
      setInquiryStatus("sent");
    } catch (err) {
      setInquiryStatus("error");
      setInquiryError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Failed to send inquiry.");
    }
  }

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 48 }}>
        <ErrorBanner message={error} />
        <p style={{ marginTop: 16 }}>
          <Link to="/search" className="btn btn-ghost">
            ← Back to search
          </Link>
        </p>
      </div>
    );
  }

  if (!facility) return <Spinner />;

  const nhDetail = facility.nursing_home_detail;
  const hhDetail = facility.home_health_detail;
  const services = facility.services;
  const activeServices = services
    ? Object.entries(services).filter(([, v]) => typeof v === "string" && v.trim().toLowerCase() === "yes")
    : [];

  return (
    <div>
      <div
        style={{
          height: 220,
          background: "var(--grad-brand-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 72,
        }}
      >
        🏡
      </div>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        <div className="facility-detail-grid">
          <div style={{ minWidth: 0 }}>
            <Link to="/search" style={{ fontSize: 13, color: "var(--teal)", fontWeight: 700 }}>
              ← Back to results
            </Link>
            <h1 style={{ fontSize: 30, margin: "8px 0" }}>{facility.name}</h1>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 24 }}>
              {facility.overall_rating != null && (
                <div style={{ fontSize: 15, color: "var(--gold)" }}>
                  {"★".repeat(Math.min(5, Math.max(0, Math.round(facility.overall_rating))))}
                  {"☆".repeat(Math.min(5, Math.max(0, 5 - Math.round(facility.overall_rating))))}{" "}
                  <span style={{ color: "var(--navy)", fontWeight: 700 }}>{facility.overall_rating.toFixed(1)}</span>
                </div>
              )}
              {(facility.facility_type_category || facility.facility_type) && (
                <span className="pill pill-teal">{facility.facility_type_category || facility.facility_type}</span>
              )}
              {facility.operating_status && (
                <span style={{ fontSize: 14, fontWeight: 600, color: facility.operating_status.toLowerCase() === "active" ? "var(--green)" : "var(--muted)" }}>
                  {facility.operating_status}
                </span>
              )}
            </div>

            {facility.specialty_notes && (
              <div style={{ background: "var(--tl)", borderRadius: 14, padding: 20, marginBottom: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--teal)", marginBottom: 4 }}>Specialty notes</div>
                <div style={{ fontSize: 14, color: "var(--navy)", lineHeight: 1.6 }}>{facility.specialty_notes}</div>
              </div>
            )}

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Facility details</h3>
            <div style={{ marginBottom: 28 }}>
              <DetailRow label="Legal business name" value={facility.legal_business_name} />
              <DetailRow label="Bed count" value={facility.bed_count} />
              <DetailRow label="Secure memory care beds" value={facility.secure_memory_care_beds} />
              <DetailRow label="Ownership type" value={facility.ownership_type} />
              <DetailRow label="Data source" value={facility.data_source} />
              <DetailRow label="Certification date" value={facility.certification_date} />
            </div>

            {nhDetail && (
              <>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Nursing home quality data</h3>
                <div style={{ marginBottom: 28 }}>
                  {Object.entries(NH_LABELS).map(([key, label]) => (
                    <DetailRow key={key} label={label} value={(nhDetail as Record<string, unknown>)[key] as React.ReactNode} />
                  ))}
                </div>
              </>
            )}

            {hhDetail && (
              <>
                <h3 style={{ fontSize: 18, marginBottom: 16 }}>Home health data</h3>
                <div style={{ marginBottom: 28 }}>
                  {Object.entries(HH_LABELS).map(([key, label]) => (
                    <DetailRow key={key} label={label} value={(hhDetail as Record<string, unknown>)[key] as React.ReactNode} />
                  ))}
                </div>
              </>
            )}

            {activeServices.length > 0 && (
              <>
                <h3 style={{ fontSize: 18, marginBottom: 14 }}>Services offered</h3>
                <div className="grid-2" style={{ gap: 10, marginBottom: 28 }}>
                  {activeServices.map(([key]) => (
                    <div key={key} style={{ display: "flex", gap: 10, padding: 12, background: "var(--g1)", borderRadius: 10 }}>
                      <span>✓</span>
                      <span style={{ fontSize: 13, color: "var(--navy)" }}>{SERVICE_LABELS[key] || key}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Location</h3>
            <div>
              <DetailRow label="Address" value={facility.address} />
              <DetailRow label="City" value={facility.city} />
              <DetailRow label="County" value={facility.county} />
              <DetailRow label="State" value={facility.state} />
              <DetailRow label="ZIP code" value={facility.zip_code} />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="facility-detail-aside">
            <div className="card card-p">
              <button className="btn btn-ghost btn-block" style={{ marginBottom: 10 }} onClick={toggleSave} disabled={!isSignedIn || saveBusy}>
                {isSaved ? "♥ Saved" : "♡ Save facility"}
              </button>
              {!isSignedIn && <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>
                <Link to="/auth" style={{ color: "var(--teal)", fontWeight: 600 }}>Sign in</Link> to save facilities or contact them.
              </p>}

              {isSignedIn && !showInquiry && inquiryStatus !== "sent" && (
                <button className="btn btn-primary btn-block" onClick={() => setShowInquiry(true)}>
                  Request info
                </button>
              )}

              {inquiryStatus === "sent" && (
                <div className="state-banner info">
                  <span>✓</span>
                  <span>Inquiry sent — the facility has your details.</span>
                </div>
              )}

              {isSignedIn && showInquiry && inquiryStatus !== "sent" && (
                <form onSubmit={submitInquiry}>
                  <div className="field">
                    <label>Message</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={2000} placeholder="What are you looking for?" />
                  </div>
                  <div className="field">
                    <label>Contact phone</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} />
                  </div>
                  <div className="field">
                    <label>Best time to reach you</label>
                    <input value={timePref} onChange={(e) => setTimePref(e.target.value)} maxLength={100} placeholder="e.g. Weekday afternoons" />
                  </div>
                  {inquiryError && <ErrorBanner message={inquiryError} />}
                  <button type="submit" className="btn btn-primary btn-block" disabled={inquiryStatus === "sending"} style={{ marginTop: 8 }}>
                    {inquiryStatus === "sending" ? "Sending…" : "Send inquiry"}
                  </button>
                </form>
              )}

              <div style={{ borderTop: "1px solid var(--g2)", marginTop: 16, paddingTop: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Contact</div>
                {facility.phone && <div style={{ fontSize: 14, color: "var(--navy)", marginBottom: 4 }}>📞 {facility.phone}</div>}
                {facility.email && <div style={{ fontSize: 14, color: "var(--teal)" }}>📧 {facility.email}</div>}
                {!facility.phone && !facility.email && <div style={{ fontSize: 13, color: "var(--muted)" }}>No contact info on file.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
