import { useEffect, useState } from "react";
import { ApiError, formatApiErrorDetail, onboardingApi, profileApi } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { ErrorBanner } from "../../components/Feedback";

export default function DashboardProfile() {
  const { profile, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [accountStatus, setAccountStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [accountError, setAccountError] = useState<string | null>(null);

  const lovedOne = (profile?.onboarding_data?.loved_one as Record<string, unknown>) || {};
  const location = (profile?.onboarding_data?.location as Record<string, unknown>) || {};

  const [relationship, setRelationship] = useState(typeof lovedOne.relationship === "string" ? lovedOne.relationship : "");
  const [age, setAge] = useState(typeof lovedOne.age !== "undefined" ? String(lovedOne.age) : "");
  const [lovedOneStatus, setLovedOneStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [lovedOneError, setLovedOneError] = useState<string | null>(null);

  const [state, setState] = useState(typeof location.state === "string" ? location.state : "");
  const [city, setCity] = useState(typeof location.city === "string" ? location.city : "");
  const [zipCode, setZipCode] = useState(typeof location.zip_code === "string" ? location.zip_code : "");
  const [locationStatus, setLocationStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(profile?.full_name || "");
    setAvatarUrl(profile?.avatar_url || "");
    const lo = (profile?.onboarding_data?.loved_one as Record<string, unknown>) || {};
    setRelationship(typeof lo.relationship === "string" ? lo.relationship : "");
    setAge(typeof lo.age !== "undefined" ? String(lo.age) : "");
    const loc = (profile?.onboarding_data?.location as Record<string, unknown>) || {};
    setState(typeof loc.state === "string" ? loc.state : "");
    setCity(typeof loc.city === "string" ? loc.city : "");
    setZipCode(typeof loc.zip_code === "string" ? loc.zip_code : "");
  }, [profile]);

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountStatus("saving");
    setAccountError(null);
    try {
      await profileApi.update({ full_name: fullName || undefined, avatar_url: avatarUrl || undefined });
      await refreshProfile();
      setAccountStatus("saved");
    } catch (err) {
      setAccountStatus("error");
      setAccountError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Couldn't save.");
    }
  }

  async function saveLovedOne(e: React.FormEvent) {
    e.preventDefault();
    setLovedOneStatus("saving");
    setLovedOneError(null);
    try {
      await profileApi.updateLovedOne({
        ...(relationship ? { relationship } : {}),
        ...(age ? { age: Number(age) } : {}),
      });
      await refreshProfile();
      setLovedOneStatus("saved");
    } catch (err) {
      setLovedOneStatus("error");
      setLovedOneError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Couldn't save.");
    }
  }

  async function saveLocation(e: React.FormEvent) {
    e.preventDefault();
    setLocationStatus("saving");
    setLocationError(null);
    try {
      // /onboarding/complete replaces the whole onboarding_data blob, so
      // loved_one must be resent here or it would be silently wiped.
      await onboardingApi.complete({
        loved_one: lovedOne,
        location: {
          ...(state ? { state } : {}),
          ...(city ? { city } : {}),
          ...(zipCode ? { zip_code: zipCode } : {}),
        },
      });
      await refreshProfile();
      setLocationStatus("saved");
    } catch (err) {
      setLocationStatus("error");
      setLocationError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Couldn't save.");
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "var(--navy)", marginBottom: 24 }}>Profile settings</h1>

      <form onSubmit={saveAccount} className="card card-p" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 14 }}>Account</h3>
        <div className="field">
          <label>Full name</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="field">
          <label>Avatar URL</label>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://…" />
        </div>
        {accountError && <ErrorBanner message={accountError} />}
        <button type="submit" className="btn btn-primary" disabled={accountStatus === "saving"}>
          {accountStatus === "saving" ? "Saving…" : accountStatus === "saved" ? "Saved ✓" : "Save account"}
        </button>
      </form>

      <form onSubmit={saveLovedOne} className="card card-p" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 14 }}>Loved one</h3>
        <div className="field">
          <label>Relationship</label>
          <input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. mother" />
        </div>
        <div className="field">
          <label>Age</label>
          <input type="number" min={0} max={130} value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        {lovedOneError && <ErrorBanner message={lovedOneError} />}
        <button type="submit" className="btn btn-primary" disabled={lovedOneStatus === "saving"}>
          {lovedOneStatus === "saving" ? "Saving…" : lovedOneStatus === "saved" ? "Saved ✓" : "Save"}
        </button>
      </form>

      <form onSubmit={saveLocation} className="card card-p">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--navy)", marginBottom: 14 }}>Location</h3>
        <div className="field">
          <label>State</label>
          <input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} maxLength={2} />
        </div>
        <div className="field">
          <label>City</label>
          <input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div className="field">
          <label>ZIP code</label>
          <input value={zipCode} onChange={(e) => setZipCode(e.target.value)} maxLength={10} />
        </div>
        {locationError && <ErrorBanner message={locationError} />}
        <button type="submit" className="btn btn-primary" disabled={locationStatus === "saving"}>
          {locationStatus === "saving" ? "Saving…" : locationStatus === "saved" ? "Saved ✓" : "Save"}
        </button>
      </form>
    </div>
  );
}
