import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { Spinner } from "./Feedback";

/**
 * Guards routes that require a real signed-in account (not a guest, not
 * anonymous) -- matches the backend's `require_user`-only endpoints:
 * /profile/me, /saved/*, /inquiries/*.
 */
export default function RequireUser({ children }: { children: ReactNode }) {
  const { loading, isSignedIn } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!isSignedIn) {
    // Carry the query string too -- /search?... and /chat?session=... are
    // meaningless without it, and Auth sends the user straight back here.
    return <Navigate to="/auth" state={{ from: location.pathname + location.search }} replace />;
  }
  return <>{children}</>;
}
