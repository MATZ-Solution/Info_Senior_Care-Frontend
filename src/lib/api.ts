import { getToken } from "./tokenStore";
import type {
  AssessmentOut,
  AssessmentResult,
  ChatHistoryResponse,
  ChatSessionsResponse,
  FacilityCard,
  FacilityDetail,
  FacilitySearchParams,
  FacilitySuggestItem,
  GenerateTitleResponse,
  GuestSessionOut,
  HealthResponse,
  InquiryCreate,
  InquiryOut,
  MessageResponse,
  OnboardingPayload,
  PaginatedFacilities,
  ProfileOut,
  ProfileUpdate,
  ReadinessResponse,
  ResourceListItem,
  ResourceOut,
  SupabaseAuthResponse,
  SyncProfileResponse,
} from "./types";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000";

export const WS_BASE_URL: string = API_BASE_URL.replace(/^http/, "ws");

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : "Request failed");
    this.status = status;
    this.detail = detail;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean; // attach bearer token if present -- default true
}

function buildQuery(query?: RequestOptions["query"]): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, auth = true } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}${buildQuery(query)}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const detail = payload && typeof payload === "object" && "detail" in payload
      ? (payload as { detail: unknown }).detail
      : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, detail);
  }

  return payload as T;
}

/** Turns an ApiError#detail (string, or Pydantic validation error list) into one readable line. */
export function formatApiErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e === "object" && "msg" in e ? String((e as { msg: unknown }).msg) : String(e)))
      .join(", ");
  }
  return "Something went wrong. Please try again.";
}

// ===== Part 8: Health =====

export const healthApi = {
  liveness: () => request<HealthResponse>("/health", { auth: false }),
  readiness: () => request<ReadinessResponse>("/health/ready", { auth: false }),
};

// ===== Part 1: Auth =====

export const authApi = {
  signup: (email: string, password: string) =>
    request<SupabaseAuthResponse>("/api/v1/auth/signup", { method: "POST", body: { email, password }, auth: false }),
  signin: (email: string, password: string) =>
    request<SupabaseAuthResponse>("/api/v1/auth/signin", { method: "POST", body: { email, password }, auth: false }),
  syncProfile: () => request<SyncProfileResponse>("/api/v1/auth/sync-profile", { method: "POST" }),
  guest: () => request<GuestSessionOut>("/api/v1/auth/guest", { method: "POST", auth: false }),
};

// ===== Part 2: Onboarding & Profile =====

export const onboardingApi = {
  complete: (payload: OnboardingPayload) =>
    request<ProfileOut>("/api/v1/onboarding/complete", { method: "POST", body: payload }),
  me: () => request<ProfileOut>("/api/v1/onboarding/me"),
};

export const profileApi = {
  me: () => request<ProfileOut>("/api/v1/profile/me"),
  update: (payload: ProfileUpdate) => request<ProfileOut>("/api/v1/profile/me", { method: "PATCH", body: payload }),
  updateLovedOne: (payload: Record<string, unknown>) =>
    request<ProfileOut>("/api/v1/profile/loved-one", { method: "PATCH", body: payload }),
};

// ===== Part 3: Facilities =====

export const facilitiesApi = {
  search: (params: FacilitySearchParams) =>
    request<PaginatedFacilities>("/api/v1/facilities/search", { query: { ...params }, auth: false }),
  suggest: (q: string, limit = 8) =>
    request<FacilitySuggestItem[]>("/api/v1/facilities/suggest", { query: { q, limit }, auth: false }),
  recommended: (limit = 10) =>
    request<FacilityCard[]>("/api/v1/facilities/recommended", { query: { limit } }),
  detail: (facilityId: string) =>
    request<FacilityDetail>(`/api/v1/facilities/${facilityId}`, { auth: false }),
};

// ===== Part 4: Assessment =====

export const assessmentApi = {
  // `answers` maps question id -> option id, e.g. { q1: "B", q2: "C", ... }
  // (see app/core/recommendation_weights.py). `assessment_version` defaults
  // server-side when omitted.
  submit: (answers: Record<string, string>) =>
    request<AssessmentResult>("/api/v1/assessment/submit", { method: "POST", body: { answers } }),
  latest: () => request<AssessmentOut>("/api/v1/assessment/me/latest"),
};

// ===== Part 5: Inquiries =====

export const inquiriesApi = {
  create: (payload: InquiryCreate) => request<InquiryOut>("/api/v1/inquiries", { method: "POST", body: payload }),
  mine: () => request<InquiryOut[]>("/api/v1/inquiries/me"),
};

// ===== Part 6: Saved facilities =====

export const savedApi = {
  list: () => request<FacilityCard[]>("/api/v1/saved"),
  save: (facilityId: string) =>
    request<MessageResponse>(`/api/v1/saved/${facilityId}`, { method: "POST" }),
  remove: (facilityId: string) =>
    request<MessageResponse>(`/api/v1/saved/${facilityId}`, { method: "DELETE" }),
};

// ===== Part 7: Resources =====

export const resourcesApi = {
  list: (category?: string, limit = 20) =>
    request<ResourceListItem[]>("/api/v1/resources", { query: { category, limit }, auth: false }),
  detail: (resourceId: string) => request<ResourceOut>(`/api/v1/resources/${resourceId}`, { auth: false }),
};

// ===== Part 13: Chat session management (REST, root-level, unversioned) =====

export const chatApi = {
  history: (sessionId: string) =>
    request<ChatHistoryResponse>(`/history/${sessionId}`, { auth: false }),
  sessions: () => request<ChatSessionsResponse>("/sessions", { auth: false }),
  generateTitle: (sessionId: string, userMessage: string, aiResponse: string) =>
    request<GenerateTitleResponse>("/generate-title", {
      method: "POST",
      auth: false,
      body: { session_id: sessionId, user_message: userMessage, ai_response: aiResponse },
    }),
  deleteSession: (sessionId: string) =>
    request<{ status: string }>("/delete-session", { method: "POST", auth: false, body: { session_id: sessionId } }),
};
