import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, facilitiesApi } from "../lib/api";
import type { FacilityCard } from "../lib/types";
import { CARE_TYPES } from "../lib/careTypes";
import FacilityCardView from "../components/FacilityCardView";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { Spinner } from "../components/Feedback";

// Per-card icon tints, mirroring the mobile app's quick-action / resource rows
// (theme/colors.js tint + fg pairs) rather than one flat accent for every card.
const CARE_TINTS = [
  { bg: "var(--primary-tint)", fg: "var(--primary)" },
  { bg: "var(--secondary-tint)", fg: "var(--secondary-dark)" },
  { bg: "var(--accent-tint)", fg: "var(--accent)" },
  { bg: "var(--success-tint)", fg: "var(--success-dark)" },
];

export default function Home() {
  const navigate = useNavigate();
  const [locationQuery, setLocationQuery] = useState("");
  const [recommended, setRecommended] = useState<FacilityCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    facilitiesApi
      .recommended(6)
      .then((items) => {
        if (!cancelled) setRecommended(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? "Couldn't load recommended facilities." : "Network error.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (locationQuery.trim()) params.set("q", locationQuery.trim());
    navigate(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div>
      {/* HERO */}
      <div style={{ background: "var(--grad-brand)", padding: "84px 0", position: "relative", overflow: "hidden" }}>
        <div className="container" style={{ position: "relative" }}>
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.22)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 16px",
                borderRadius: 999,
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>
                🌿 Powered by Infomary — Your AI Care Companion
              </span>
            </div>
            <h1 style={{ fontSize: 48, color: "#fff", lineHeight: 1.12, marginBottom: 20, letterSpacing: "-0.03em" }}>
              Finding the right senior care starts here
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, marginBottom: 32 }}>
              Infomary is an AI companion who understands your situation, asks the right questions, and helps you find
              senior care options — free for families, always.
            </p>
            <form
              onSubmit={handleSearch}
              style={{
                background: "#fff",
                borderRadius: 18,
                padding: 8,
                display: "flex",
                gap: 8,
                maxWidth: 520,
                boxShadow: "var(--shadow-float)",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 180, display: "flex", gap: 8, alignItems: "center", padding: "8px 14px", background: "var(--g1)", borderRadius: 12 }}>
                <span>📍</span>
                <SearchAutocomplete
                  value={locationQuery}
                  onChange={setLocationQuery}
                  onSubmit={() => handleSearch()}
                  placeholder="City, state, ZIP, or facility name"
                  inputStyle={{ border: "none", background: "transparent", outline: "none", fontSize: 14, color: "var(--navy)", width: "100%" }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ padding: "12px 22px" }}>
                Search
              </button>
            </form>
            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <Link
                to="/chat"
                className="btn"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "10px 18px" }}
              >
                🌿 Ask Infomary instead
              </Link>
              <Link
                to="/assessment"
                className="btn"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", padding: "10px 18px" }}
              >
                Take the 5-question care quiz
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* CARE TYPES */}
      <div className="section" style={{ background: "var(--g1)" }}>
        <div className="container">
          <div className="center" style={{ marginBottom: 48 }}>
            <h2 className="section-title">What type of care is needed?</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>
              Not sure? Talk to Infomary or take the quiz — she'll ask a few questions and recommend a care type.
            </p>
          </div>
          <div className="grid-3" style={{ gap: 20 }}>
            {CARE_TYPES.map((ct, i) => {
              const tint = CARE_TINTS[i % CARE_TINTS.length];
              return (
                <div
                  key={ct.category}
                  onClick={() => navigate(`/search?facility_type_category=${encodeURIComponent(ct.category)}`)}
                  className="care-card"
                >
                  <div className="care-icon" style={{ background: tint.bg }}>
                    <span>{ct.icon}</span>
                  </div>
                  <div className="care-title">{ct.label}</div>
                  <div className="care-blurb">{ct.blurb}</div>
                  <span className="care-link" style={{ color: tint.fg }}>
                    Browse facilities →
                  </span>
                </div>
              );
            })}

            {/* Infomary always gets the signature brand-gradient treatment. */}
            <div onClick={() => navigate("/assessment")} className="care-card care-card-infomary">
              <div className="infomary-orb">🌿</div>
              <div className="care-title" style={{ color: "#fff" }}>
                Not sure? Ask Infomary
              </div>
              <div className="care-blurb" style={{ color: "rgba(255,255,255,0.78)" }}>
                Answer a few questions and get a recommended care type.
              </div>
              <span className="infomary-cta">
                Start the assessment
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="section">
        <div className="container">
          <div className="center" style={{ marginBottom: 56 }}>
            <h2 className="section-title">How Infomary works</h2>
            <p className="section-sub" style={{ margin: "0 auto" }}>
              She's not a search engine. She's a companion who guides you through one of the hardest decisions your
              family will make.
            </p>
          </div>
          <div className="grid-3">
            {[
              { step: "1", icon: "💬", title: "Talk to Infomary", body: "Tell Infomary about your loved one's situation over chat. She listens and asks follow-up questions." },
              { step: "2", icon: "🎯", title: "Get matched", body: "Search or ask Infomary to find CMS-certified facilities that fit what you've described." },
              { step: "3", icon: "🏡", title: "Connect directly", body: "Save facilities you like and send an inquiry directly — no middlemen, no sales calls." },
            ].map((s) => (
              <div key={s.step} className="center">
                <div
                  style={{
                    width: 80,
                    height: 80,
                    background: "var(--grad-brand-soft)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: 32,
                    border: "4px solid #fff",
                    boxShadow: "var(--shadow-primary)",
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Step {s.step}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--navy)", marginBottom: 10, fontFamily: "var(--font-display)" }}>{s.title}</div>
                <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RECOMMENDED FACILITIES */}
      <div className="section" style={{ background: "var(--g1)" }}>
        <div className="container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 className="section-title" style={{ marginBottom: 8 }}>
                Facilities to explore
              </h2>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>
                Sign in and complete onboarding for picks personalized to your location and care needs.
              </p>
            </div>
            <Link to="/search" className="btn btn-ghost">
              Browse all facilities →
            </Link>
          </div>
          {error && <p className="muted">{error}</p>}
          {!recommended && !error && <Spinner />}
          {recommended && recommended.length === 0 && <p className="muted">No facilities available right now.</p>}
          {recommended && recommended.length > 0 && (
            <div className="grid-3">
              {recommended.map((f) => (
                <FacilityCardView key={f.id} facility={f} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: "var(--grad-brand)", padding: "64px 0" }}>
        <div className="container center">
          <h2 style={{ fontSize: 32, color: "#fff", marginBottom: 14 }}>
            Free for families, always
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.6 }}>
            Create an account to save facilities, track inquiries, and pick up your conversation with Infomary where
            you left off.
          </p>
          <Link to="/auth?tab=signup" className="btn btn-primary btn-lg">
            Get started — it's free
          </Link>
        </div>
      </div>
    </div>
  );
}
