import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, facilitiesApi, formatApiErrorDetail, inquiriesApi, savedApi } from "../lib/api";
import type { FacilityDetail as FacilityDetailType } from "../lib/types";
import { Spinner, ErrorBanner } from "../components/Feedback";
import { useAuth } from "../lib/auth";

// Matches the mobile app's data/resources.js verbatim -- same fixed choices,
// same backend fields (budget is its own column; timeline is move-in
// urgency, sent as contact_time_preference -- NOT a literal call-time).
const INQUIRY_BUDGETS = ["Under $3k / mo", "$3k–5k / mo", "$5k–7k / mo", "$7k+ / mo", "Not sure yet"];
const INQUIRY_TIMELINES = ["Immediately", "Within a month", "1–3 months", "Just researching"];

const NH_LABELS: Record<string, string> = {
  nh_special_focus_facility: "Special focus facility",
  nh_health_inspection_star_rating: "Health inspection star rating",
  nh_total_nursing_hours_per_resident_day: "Nursing hours / resident / day",
  nh_total_nursing_staff_turnover_pct: "Nursing staff turnover (%)",
};

const HH_LABELS: Record<string, string> = {
  hh_home_discharge_success: "Home discharge success rate",
  hh_functional_ability_discharge_score: "Functional ability at discharge",
  hh_hospital_readmission_rate: "Hospital readmission rate",
  hh_falls_major_injury_pct: "Falls with major injury (%)",
  hh_developed_bedsores_pct: "Developed bedsores (%)",
  hh_started_care_on_time_pct: "Started care on time (%)",
};

const SERVICE_LABELS: Record<string, string> = {
  offers_alzheimer_dementia_care: "Alzheimer's / dementia care",
  offers_hospice_care: "Hospice care",
  offers_ventilator_care: "Ventilator care",
  offers_psychiatric_care: "Psychiatric care",
  offers_rehab_services: "Rehabilitation services",
  offers_adult_day_care: "Adult day care",
  offers_respite_care: "Respite care",
  offers_home_care_services: "Home care services",
  offers_traumatic_brain_injury_care: "Traumatic brain injury care",
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
  const [budget, setBudget] = useState("");
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
    // Compare against facility.id (the resolved canonical facilities.id),
    // not the raw URL param -- the URL id can be a source_uuid (e.g. when
    // reached from a chat facility card), which GET /facilities/{id}
    // transparently resolves but /saved's list never contains.
    const canonicalId = facility?.id;
    if (!canonicalId || !isSignedIn) return;
    let cancelled = false;
    savedApi
      .list()
      .then((items) => {
        if (!cancelled) setIsSaved(items.some((i) => i.id === canonicalId));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [facility?.id, isSignedIn]);

  async function toggleSave() {
    // Must use facility.id, not the URL param `id` -- POST/DELETE
    // /saved/{facility_id} only matches the real facilities.id and has no
    // source_uuid fallback (unlike GET /facilities/{id}), so passing the raw
    // URL param 404s whenever the page was reached via a source_uuid link.
    const canonicalId = facility?.id;
    if (!canonicalId || !isSignedIn) return;
    setSaveBusy(true);
    try {
      if (isSaved) await savedApi.remove(canonicalId);
      else await savedApi.save(canonicalId);
      setIsSaved(!isSaved);
    } finally {
      setSaveBusy(false);
    }
  }

  async function submitInquiry(e: React.FormEvent) {
    e.preventDefault();
    const canonicalId = facility?.id;
    if (!canonicalId) return;

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length > 0 && phoneDigits.length !== 10) {
      setInquiryError("Please enter a valid 10-digit US phone number.");
      return;
    }

    setInquiryStatus("sending");
    setInquiryError(null);
    try {
      await inquiriesApi.create({
        facility_id: canonicalId,
        message: message.trim() || undefined,
        budget: budget || undefined,
        contact_phone: phone || undefined,
        contact_time_preference: timePref || undefined,
      });
      setInquiryStatus("sent");
      setMessage("");
      setPhone("");
      setBudget("");
      setTimePref("");
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
            </div>

            <h3 style={{ fontSize: 18, marginBottom: 16 }}>Facility details</h3>
            <div style={{ marginBottom: 28 }}>
              <DetailRow label="Bed count" value={facility.bed_count} />
              <DetailRow label="Secure memory care beds" value={facility.secure_memory_care_beds} />
              <DetailRow label="Ownership type" value={facility.ownership_type} />
              <DetailRow label="Facility subtype" value={facility.facility_subtype} />
              <DetailRow label="NPI type" value={facility.npi_type} />
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
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} placeholder="(305) 555-0100" />
                  </div>
                  <div className="field">
                    <label>Monthly budget</label>
                    <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                      <option value="">Select a range</option>
                      {INQUIRY_BUDGETS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label>Timeline</label>
                    <select value={timePref} onChange={(e) => setTimePref(e.target.value)}>
                      <option value="">Select a timeline</option>
                      {INQUIRY_TIMELINES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
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
