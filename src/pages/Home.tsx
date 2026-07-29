import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, facilitiesApi } from "../lib/api";
import type { FacilityCard } from "../lib/types";
import { CARE_TYPES } from "../lib/careTypes";
import FacilityCardView from "../components/FacilityCardView";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { Spinner } from "../components/Feedback";

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
      <div style={{ background: "linear-gradient(135deg,#0A5C4E 0%,#0D7D6B 60%,#0F9580 100%)", padding: "72px 0" }}>
        <div className="container">
          <div style={{ maxWidth: 640 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.15)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 20,
                marginBottom: 22,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                🌿 Powered by Infomary — Your AI Care Companion
              </span>
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", fontSize: 46, color: "#fff", lineHeight: 1.15, marginBottom: 20 }}>
              Finding the right senior care starts here
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, marginBottom: 32 }}>
              Infomary is an AI companion who understands your situation, asks the right questions, and helps you find
              senior care options — free for families, always.
            </p>
            <form
              onSubmit={handleSearch}
              style={{
                background: "#fff",
                borderRadius: 14,
                padding: 8,
                display: "flex",
                gap: 8,
                maxWidth: 520,
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              <div style={{ flex: 1, display: "flex", gap: 8, alignItems: "center", padding: "8px 14px", background: "var(--g1)", borderRadius: 10 }}>
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
            <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
              <Link to="/chat" className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "10px 18px" }}>
                🌿 Ask Infomary instead
              </Link>
              <Link to="/assessment" className="btn" style={{ background: "rgba(255,255,255,0.15)", color: "#fff", padding: "10px 18px" }}>
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
            {CARE_TYPES.map((ct) => (
              <div
                key={ct.category}
                onClick={() => navigate(`/search?facility_type_category=${encodeURIComponent(ct.category)}`)}
                style={{ background: "#fff", border: "1px solid var(--g3)", borderRadius: 16, padding: 24, cursor: "pointer", borderTop: "4px solid var(--teal)" }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{ct.icon}</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>{ct.label}</div>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 14 }}>{ct.blurb}</div>
                <span style={{ fontSize: 13, color: "var(--teal)", fontWeight: 600 }}>Browse facilities →</span>
              </div>
            ))}
            <div
              onClick={() => navigate("/assessment")}
              style={{
                background: "var(--tl)",
                border: "2px solid var(--teal)",
                borderRadius: 16,
                padding: 24,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🌿</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: "var(--teal)", marginBottom: 8 }}>Not sure? Ask Infomary</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                Answer a few questions and get a recommended care type.
              </div>
              <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                Start the assessment
              </button>
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
                    background: "var(--tl)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                    fontSize: 32,
                    border: "4px solid #fff",
                    boxShadow: "0 0 0 2px var(--teal)",
                  }}
                >
                  {s.icon}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--teal)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                  Step {s.step}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--navy)", marginBottom: 10 }}>{s.title}</div>
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
      <div style={{ background: "var(--navy)", padding: "64px 0" }}>
        <div className="container center">
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 32, color: "#fff", marginBottom: 14 }}>
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
