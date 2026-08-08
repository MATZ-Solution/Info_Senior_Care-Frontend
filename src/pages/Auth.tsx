import { useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ErrorBanner } from "../components/Feedback";

type Tab = "signin" | "signup";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Auth() {
  const [params] = useSearchParams();
  const initialTab: Tab = params.get("tab") === "signup" ? "signup" : "signin";
  const [tab, setTab] = useState<Tab>(initialTab);

  const { signIn, signUp, signInWithGoogle, continueAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmEmailNotice, setConfirmEmailNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmEmailNotice(false);

    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const outcome = tab === "signin" ? await signIn(email.trim(), password) : await signUp(email.trim(), password);
    setSubmitting(false);
    if (outcome.status === "signed_in") {
      navigate(from, { replace: true });
    } else if (outcome.status === "confirm_email") {
      setConfirmEmailNotice(true);
    } else {
      setError(outcome.message);
    }
  }

  async function handleGoogle() {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle(from);
    } catch {
      setError("Couldn't start Google sign-in. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleGuest() {
    setSubmitting(true);
    setError(null);
    try {
      await continueAsGuest();
      navigate("/onboarding", { replace: true });
    } catch {
      setError("Couldn't start a guest session. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", display: "grid", gridTemplateColumns: "1fr 1fr" }} className="auth-grid">
      <div style={{ background: "var(--grad-brand)", padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", gap: 10, marginBottom: 40, letterSpacing: "-0.02em" }}>
          <span style={{ width: 36, height: 36, background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>🌿</span>
          InfoSenior.care
        </div>
        <h1 style={{ fontSize: 32, color: "#fff", lineHeight: 1.25, marginBottom: 16 }}>
          Your AI companion for senior care
        </h1>
        <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", lineHeight: 1.7 }}>
          Infomary helps families find the right care for their loved ones — with empathy, intelligence, and zero
          sales pressure.
        </p>
      </div>

      <div style={{ padding: "60px 64px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", borderBottom: "2px solid var(--g2)", marginBottom: 28 }}>
          <div
            onClick={() => setTab("signin")}
            style={{ padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", color: tab === "signin" ? "var(--teal)" : "var(--muted)", borderBottom: tab === "signin" ? "2px solid var(--teal)" : "none", marginBottom: -2 }}
          >
            Sign in
          </div>
          <div
            onClick={() => setTab("signup")}
            style={{ padding: "12px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer", color: tab === "signup" ? "var(--teal)" : "var(--muted)", borderBottom: tab === "signup" ? "2px solid var(--teal)" : "none", marginBottom: -2 }}
          >
            Create account
          </div>
        </div>

        <h2 style={{ fontSize: 24, marginBottom: 6 }}>
          {tab === "signin" ? "Welcome back" : "Create your account"}
        </h2>
        <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
          {tab === "signin" ? "Sign in to your InfoSenior.care account" : "Free for families, always"}
        </p>

        {confirmEmailNotice && (
          <div className="state-banner info" style={{ marginBottom: 16 }}>
            <span>Check your email to confirm your account, then sign in.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Email address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 8,
                  fontSize: 16,
                  lineHeight: 1,
                  color: "var(--muted)",
                }}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && <ErrorBanner message={error} />}

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting} style={{ marginTop: 8, marginBottom: 16 }}>
            {submitting ? "Please wait…" : tab === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "8px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "var(--g3)" }} />
          <span style={{ fontSize: 13, color: "var(--muted)" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--g3)" }} />
        </div>

        <button
          type="button"
          className="btn btn-block"
          style={{ background: "#fff", border: "1.5px solid var(--g3)", color: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 10 }}
          onClick={handleGoogle}
          disabled={submitting}
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <button type="button" className="btn btn-ghost btn-block" onClick={handleGuest} disabled={submitting}>
          Continue as guest
        </button>
        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 10 }}>
          Guests can browse, chat with Infomary, and submit inquiries, but can't save facilities or view inquiry
          history across devices.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.85.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .98 4.97L3.95 7.3C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}
