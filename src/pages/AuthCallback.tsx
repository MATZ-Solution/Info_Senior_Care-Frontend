import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { ErrorBanner, Spinner } from "../components/Feedback";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { completeOAuthSignIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    completeOAuthSignIn().then((outcome) => {
      if (outcome.status === "signed_in") {
        const dest = sessionStorage.getItem("isc_post_auth_redirect") || "/dashboard";
        sessionStorage.removeItem("isc_post_auth_redirect");
        navigate(dest, { replace: true });
      } else {
        setError(outcome.status === "error" ? outcome.message : "Google sign-in failed. Please try again.");
      }
    });
  }, [completeOAuthSignIn, navigate]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 64, maxWidth: 480 }}>
        <ErrorBanner message={error} />
        <p style={{ marginTop: 16 }}>
          <Link to="/auth" className="btn btn-ghost">
            ← Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 96 }}>
      <Spinner />
    </div>
  );
}
