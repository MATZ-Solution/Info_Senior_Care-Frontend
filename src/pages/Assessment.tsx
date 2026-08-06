import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, assessmentApi, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { AssessmentResult } from "../lib/types";
import { ErrorBanner } from "../components/Feedback";

const PRIMARY_NEED_OPTIONS = [
  { value: "memory_care", label: "24-hour medical care or supervision for a complex/cognitive condition" },
  { value: "independent", label: "Daily support with meals, medication, or personal care" },
  { value: "medical_support", label: "Skilled medical care or therapy at home" },
  { value: "end_of_life", label: "Comfort-focused, end-of-life care" },
];

const TIMELINE_OPTIONS = [
  { value: "immediately", label: "Immediately" },
  { value: "1_3_months", label: "1–3 months" },
  { value: "3_6_months", label: "3–6 months" },
  { value: "just_researching", label: "Just researching for now" },
];

const SITUATION_OPTIONS = [
  { value: "living_alone", label: "Living alone" },
  { value: "with_family", label: "Living with family" },
  { value: "hospital_rehab", label: "Currently in hospital or rehab" },
  { value: "current_facility", label: "Already in a care facility" },
];

export default function Assessment() {
  const { tokenType, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const [primaryNeed, setPrimaryNeed] = useState("");
  const [timeline, setTimeline] = useState("");
  const [situation, setSituation] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!primaryNeed) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!tokenType) await continueAsGuest();
      const res = await assessmentApi.submit({
        primary_need: primaryNeed,
        timeline: timeline || undefined,
        current_situation: situation || undefined,
        notes: notes || undefined,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Couldn't submit the assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="container" style={{ paddingTop: 56, paddingBottom: 64, maxWidth: 640 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
        <h1 style={{ fontSize: 30, marginBottom: 12 }}>
          Infomary recommends: {result.assessment.recommended_care_type}
        </h1>
        <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
          Based on your answers, this is the care type most likely to fit. There
          {" "}
          {result.matched_facility_count === 1 ? "is" : "are"} currently <strong>{result.matched_facility_count}</strong> active
          facilit{result.matched_facility_count === 1 ? "y" : "ies"} in this category.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary btn-lg"
            onClick={() =>
              navigate(`/search?facility_type_category=${encodeURIComponent(result.assessment.recommended_care_type || "")}`)
            }
          >
            View matching facilities →
          </button>
          <Link to="/chat" className="btn btn-ghost btn-lg">
            Talk it through with Infomary
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 640 }}>
      <h1 style={{ fontSize: 32, marginBottom: 8 }}>Care assessment</h1>
      <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 32 }}>
        A few quick questions to help point you toward the right type of care.
      </p>
      <form onSubmit={handleSubmit}>
        <fieldset style={{ border: "none", marginBottom: 28 }}>
          <legend style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>
            What's the biggest need right now? <span style={{ color: "var(--coral)" }}>*</span>
          </legend>
          {PRIMARY_NEED_OPTIONS.map((opt) => (
            <label key={opt.value} className={`option-card${primaryNeed === opt.value ? " selected" : ""}`}>
              <input type="radio" name="primary_need" value={opt.value} checked={primaryNeed === opt.value} onChange={(e) => setPrimaryNeed(e.target.value)} />
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset style={{ border: "none", marginBottom: 28 }}>
          <legend style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>How soon are you looking to move forward?</legend>
          {TIMELINE_OPTIONS.map((opt) => (
            <label key={opt.value} className={`option-card${timeline === opt.value ? " selected" : ""}`}>
              <input type="radio" name="timeline" value={opt.value} checked={timeline === opt.value} onChange={(e) => setTimeline(e.target.value)} />
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <fieldset style={{ border: "none", marginBottom: 28 }}>
          <legend style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>What's the current living situation?</legend>
          {SITUATION_OPTIONS.map((opt) => (
            <label key={opt.value} className={`option-card${situation === opt.value ? " selected" : ""}`}>
              <input type="radio" name="situation" value={opt.value} checked={situation === opt.value} onChange={(e) => setSituation(e.target.value)} />
              <span style={{ fontSize: 14 }}>{opt.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="field">
          <label>Anything else Infomary should know? (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Health conditions, budget concerns, preferences…" />
        </div>

        {error && <ErrorBanner message={error} />}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!primaryNeed || submitting} style={{ marginTop: 12 }}>
          {submitting ? "Submitting…" : "Get my recommendation"}
        </button>
      </form>
    </div>
  );
}
