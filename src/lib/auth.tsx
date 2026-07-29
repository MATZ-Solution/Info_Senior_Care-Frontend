import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { ApiError, authApi, formatApiErrorDetail, onboardingApi, profileApi } from "./api";
import { supabase } from "./supabaseClient";
import { clearToken, getToken, getTokenType, setToken, type TokenType } from "./tokenStore";
import type { OnboardingPayload, ProfileOut } from "./types";

type SignInUpOutcome =
  | { status: "signed_in" }
  | { status: "confirm_email" }
  | { status: "error"; message: string };

interface AuthContextValue {
  loading: boolean;
  tokenType: TokenType | null;
  isGuest: boolean;
  /** A real signed-in account (not a guest, not anonymous). */
  isSignedIn: boolean;
  profile: ProfileOut | null;
  signIn: (email: string, password: string) => Promise<SignInUpOutcome>;
  signUp: (email: string, password: string) => Promise<SignInUpOutcome>;
  /** Redirects the browser to Google -- never returns (the page navigates away). */
  signInWithGoogle: (redirectPath?: string) => Promise<void>;
  /** Call on the /auth/callback page once Google redirects back. */
  completeOAuthSignIn: () => Promise<SignInUpOutcome>;
  continueAsGuest: () => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (payload: OnboardingPayload) => Promise<ProfileOut>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [tokenType, setTokenType] = useState<TokenType | null>(() => getTokenType());
  const [profile, setProfile] = useState<ProfileOut | null>(null);

  const refreshProfile = useCallback(async () => {
    const currentType = getTokenType();
    const currentToken = getToken();
    if (!currentToken || !currentType) {
      setProfile(null);
      return;
    }
    try {
      if (currentType === "guest") {
        // Guests only get a profile row once /onboarding/complete has run;
        // a 404 here just means "hasn't onboarded yet", not an error.
        const p = await onboardingApi.me();
        setProfile(p);
      } else {
        const p = await profileApi.me();
        setProfile(p);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setProfile(null);
      } else if (err instanceof ApiError && err.status === 401) {
        clearToken();
        setTokenType(null);
        setProfile(null);
      }
      // Other errors (network, 500): leave stale profile in place rather
      // than bouncing the user to a signed-out state.
    }
  }, []);

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInUpOutcome> => {
    try {
      const res = await authApi.signin(email, password);
      if (!res.access_token) {
        return { status: "error", message: "Sign in failed -- no access token returned." };
      }
      setToken(res.access_token, "user");
      setTokenType("user");
      const synced = await authApi.syncProfile();
      setProfile(synced.profile);
      return { status: "signed_in" };
    } catch (err) {
      return { status: "error", message: err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Sign in failed." };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string): Promise<SignInUpOutcome> => {
    try {
      const res = await authApi.signup(email, password);
      if (!res.access_token) {
        // "Confirm email" is on by default in Supabase -- access_token is
        // null until the confirmation link is clicked.
        return { status: "confirm_email" };
      }
      setToken(res.access_token, "user");
      setTokenType("user");
      const synced = await authApi.syncProfile();
      setProfile(synced.profile);
      return { status: "signed_in" };
    } catch (err) {
      return { status: "error", message: err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Sign up failed." };
    }
  }, []);

  const signInWithGoogle = useCallback(async (redirectPath?: string) => {
    if (redirectPath) sessionStorage.setItem("isc_post_auth_redirect", redirectPath);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
    // On success the browser navigates to Google -- this function never
    // resolves into further app code.
  }, []);

  const completeOAuthSignIn = useCallback(async (): Promise<SignInUpOutcome> => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        return { status: "error", message: "Google sign-in failed -- no session returned." };
      }
      setToken(data.session.access_token, "user");
      setTokenType("user");
      const synced = await authApi.syncProfile();
      setProfile(synced.profile);
      return { status: "signed_in" };
    } catch (err) {
      return { status: "error", message: err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Google sign-in failed." };
    }
  }, []);

  const continueAsGuest = useCallback(async () => {
    const res = await authApi.guest();
    setToken(res.access_token, "guest");
    setTokenType("guest");
    setProfile(null);
  }, []);

  const signOut = useCallback(() => {
    clearToken();
    setTokenType(null);
    setProfile(null);
  }, []);

  const completeOnboarding = useCallback(async (payload: OnboardingPayload) => {
    const updated = await onboardingApi.complete(payload);
    setProfile(updated);
    return updated;
  }, []);

  const value: AuthContextValue = {
    loading,
    tokenType,
    isGuest: tokenType === "guest",
    isSignedIn: tokenType === "user",
    profile,
    signIn,
    signUp,
    signInWithGoogle,
    completeOAuthSignIn,
    continueAsGuest,
    signOut,
    refreshProfile,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
