import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, assessmentApi, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";
import { CARE_TYPES } from "../lib/careTypes";
import type { AssessmentResult } from "../lib/types";
import { ErrorBanner } from "../components/Feedback";

// Mirrors app/core/recommendation_weights.py exactly -- question ids (q1-q5)
// and option ids (A-F) are sent verbatim to POST /api/v1/assessment/submit.
// The label text here is ours (the backend has no user-facing copy), but the
// ids and the set of options per question must match the scoring matrix.
interface Question {
  id: string;
  title: string;
  options: { id: string; label: string }[];
}

const QUESTIONS: Question[] = [
  {
    id: "q1",
    title: "What's the biggest need right now?",
    options: [
      { id: "A", label: "Help with daily living activities" },
      { id: "B", label: "Rehabilitation after surgery, injury, or illness" },
      { id: "C", label: "Ongoing skilled medical or nursing care" },
      { id: "D", label: "Serious mental or behavioral health concerns" },
      { id: "E", label: "Daytime supervision while living at home" },
      { id: "F", label: "Comfort-focused care for a serious or terminal illness" },
    ],
  },
  {
    id: "q2",
    title: "How much medical care is needed?",
    options: [
      { id: "A", label: "No regular medical care" },
      { id: "B", label: "Occasional check-ups" },
      { id: "C", label: "Daily skilled nursing supervision" },
      { id: "D", label: "Continuous 24/7 medical care" },
    ],
  },
  {
    id: "q3",
    title: "How independent is the person day-to-day?",
    options: [
      { id: "A", label: "Completely independent" },
      { id: "B", label: "Needs some assistance" },
      { id: "C", label: "Cannot safely live alone" },
      { id: "D", label: "Mostly bed-bound or wheelchair dependent" },
    ],
  },
  {
    id: "q4",
    title: "Is any rehabilitation therapy needed?",
    options: [
      { id: "A", label: "No rehabilitation needed" },
      { id: "B", label: "Outpatient physical, occupational, or speech therapy" },
      { id: "C", label: "Intensive inpatient rehabilitation" },
      { id: "D", label: "Not sure yet" },
    ],
  },
  {
    id: "q5",
    title: "How long is care expected to be needed?",
    options: [
      { id: "A", label: "Daytime only" },
      { id: "B", label: "Short-term recovery" },
      { id: "C", label: "Long-term ongoing care" },
      { id: "D", label: "End-of-life comfort care" },
    ],
  },
];

function careTypeLabel(category: string): string {
  return CARE_TYPES.find((ct) => ct.category === category)?.label || category;
}

function confidenceLabel(score: number): string {
  if (score >= 60) return "High confidence";
  if (score >= 30) return "Moderate confidence";
  return "Low confidence";
}

export default function Assessment() {
  const { tokenType, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const allAnswered = QUESTIONS.every((q) => answers[q.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAnswered) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!tokenType) await continueAsGuest();
      const res = await assessmentApi.submit(answers);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Couldn't submit the assessment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    const { assessment, matched_facility_count } = result;
    const topType = assessment.recommended_care_type;
    const ranked = assessment.recommended_types.filter((r) => r.score > 0).slice(0, 4);

    if (!topType) {
      return (
        <div className="container" style={{ paddingTop: 56, paddingBottom: 64, maxWidth: 640 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
          <h1 style={{ fontSize: 30, marginBottom: 12 }}>We need a bit more to go on</h1>
          <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
            {assessment.explanation[0] || "Not enough information to make a recommendation."}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={() => setResult(null)}>
              Retake the assessment
            </button>
            <Link to="/chat" className="btn btn-ghost btn-lg">
              Talk it through with Infomary
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="container" style={{ paddingTop: 56, paddingBottom: 64, maxWidth: 640 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🌿</div>
        <h1 style={{ fontSize: 30, marginBottom: 8 }}>Infomary recommends: {careTypeLabel(topType)}</h1>
        {assessment.confidence_score != null && (
          <span className="pill pill-teal" style={{ marginBottom: 16, display: "inline-block" }}>
            {confidenceLabel(assessment.confidence_score)} ({assessment.confidence_score}%)
          </span>
        )}
        <p style={{ fontSize: 15, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24 }}>
          Based on your answers, this is the care type most likely to fit. There
          {" "}
          {matched_facility_count === 1 ? "is" : "are"} currently <strong>{matched_facility_count}</strong> active
          facilit{matched_facility_count === 1 ? "y" : "ies"} in this category.
        </p>

        {ranked.length > 1 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>How your answers ranked</div>
            {ranked.map((r) => (
              <div key={r.type} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: "var(--navy)" }}>{careTypeLabel(r.type)}</span>
                  <span style={{ color: "var(--muted)" }}>{r.score}%</span>
                </div>
                <div style={{ height: 6, background: "var(--g2)", borderRadius: 999 }}>
                  <div style={{ height: 6, width: `${r.score}%`, background: r.type === topType ? "var(--teal)" : "var(--g3)", borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {assessment.explanation.length > 0 && (
          <div style={{ marginBottom: 28, background: "var(--g1)", borderRadius: 14, padding: 18 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 8 }}>Why this recommendation</div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: "var(--muted)", lineHeight: 1.7 }}>
              {assessment.explanation.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate(`/search?facility_type_category=${encodeURIComponent(topType)}`)}>
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
        5 quick questions to help point you toward the right type of care.
      </p>
      <form onSubmit={handleSubmit}>
        {QUESTIONS.map((q, qi) => (
          <fieldset key={q.id} style={{ border: "none", marginBottom: 28 }}>
            <legend style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>
              {qi + 1}. {q.title} <span style={{ color: "var(--coral)" }}>*</span>
            </legend>
            {q.options.map((opt) => (
              <label key={opt.id} className={`option-card${answers[q.id] === opt.id ? " selected" : ""}`}>
                <input
                  type="radio"
                  name={q.id}
                  value={opt.id}
                  checked={answers[q.id] === opt.id}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                />
                <span style={{ fontSize: 14 }}>{opt.label}</span>
              </label>
            ))}
          </fieldset>
        ))}

        {error && <ErrorBanner message={error} />}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!allAnswered || submitting} style={{ marginTop: 12 }}>
          {submitting ? "Submitting…" : "Get my recommendation"}
        </button>
      </form>
    </div>
  );
}
