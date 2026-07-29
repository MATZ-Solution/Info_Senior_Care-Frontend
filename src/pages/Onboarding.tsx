import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../lib/auth";
import { ErrorBanner } from "../components/Feedback";

export default function Onboarding() {
  const { tokenType, continueAsGuest, completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const [relationship, setRelationship] = useState("");
  const [age, setAge] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!tokenType) await continueAsGuest();
      await completeOnboarding({
        loved_one: {
          ...(relationship ? { relationship } : {}),
          ...(age ? { age: Number(age) } : {}),
        },
        location: {
          ...(state ? { state } : {}),
          ...(city ? { city } : {}),
          ...(zipCode ? { zip_code: zipCode } : {}),
        },
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Couldn't save your details. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 64, maxWidth: 560 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 30, color: "var(--navy)", marginBottom: 8 }}>
        Tell us a little more
      </h1>
      <p style={{ fontSize: 15, color: "var(--muted)", marginBottom: 28 }}>
        This helps Infomary personalize recommendations. Everything here is optional and you can update it later.
      </p>
      <form onSubmit={handleSubmit}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 12 }}>About your loved one</h3>
        <div className="field">
          <label>Relationship to you</label>
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. mother, father, spouse" />
        </div>
        <div className="field">
          <label>Age</label>
          <input type="number" min={0} max={130} value={age} onChange={(e) => setAge(e.target.value)} />
        </div>

        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", margin: "20px 0 12px" }}>Location</h3>
        <div className="field">
          <label>State</label>
          <input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="e.g. TX" maxLength={2} />
        </div>
        <div className="field">
          <label>City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label>ZIP code</label>
          <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} maxLength={10} />
        </div>

        {error && <ErrorBanner message={error} />}

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? "Saving…" : "Save and continue"}
          </button>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate("/dashboard")}>
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
