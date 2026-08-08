// Mirrors app/schemas/*.py in the backend exactly. Only fields the backend
// actually returns are modeled here -- nothing invented for design purposes.

// ---- Facilities (app/schemas/facility.py) ----

export interface FacilityCard {
  id: string;
  name: string;
  facility_type?: string | null;
  facility_type_category?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  overall_rating?: number | null;
  bed_count?: number | null;
  ownership_type?: string | null;
}

export interface FacilitySuggestItem {
  id: string;
  name: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

export interface PaginatedFacilities {
  items: FacilityCard[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export interface NursingHomeDetailOut {
  nh_special_focus_facility?: string | null;
  nh_health_inspection_star_rating?: number | null;
  nh_total_nursing_hours_per_resident_day?: number | null;
  nh_total_nursing_staff_turnover_pct?: number | null;
}

export interface HomeHealthDetailOut {
  hh_home_discharge_success?: number | null;
  hh_functional_ability_discharge_score?: number | null;
  hh_falls_major_injury_pct?: number | null;
  hh_developed_bedsores_pct?: number | null;
  hh_hospital_readmission_rate?: number | null;
  hh_started_care_on_time_pct?: number | null;
}

export interface FacilityServicesOut {
  offers_alzheimer_dementia_care?: string | null;
  offers_hospice_care?: string | null;
  offers_ventilator_care?: string | null;
  offers_psychiatric_care?: string | null;
  offers_rehab_services?: string | null;
  offers_adult_day_care?: string | null;
  offers_respite_care?: string | null;
  offers_home_care_services?: string | null;
  offers_traumatic_brain_injury_care?: string | null;
}

export interface FacilityDetail extends FacilityCard {
  address?: string | null;
  county?: string | null;
  phone?: string | null;
  email?: string | null;
  facility_subtype?: string | null;
  npi_type?: string | null;
  secure_memory_care_beds?: number | null;
  load_timestamp?: string | null;
  nursing_home_detail?: NursingHomeDetailOut | null;
  home_health_detail?: HomeHealthDetailOut | null;
  services?: FacilityServicesOut | null;
}

export interface FacilitySearchParams {
  state?: string;
  zip_code?: string;
  city?: string;
  name?: string;
  facility_type?: string;
  facility_type_category?: string;
  q?: string;
  page?: number;
  page_size?: number;
}

// ---- Profile / onboarding / auth (app/schemas/profile.py) ----

export interface ProfileOut {
  id: string;
  email?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  auth_provider: string;
  is_guest: boolean;
  onboarding_data?: Record<string, unknown> | null;
  onboarding_completed: boolean;
}

export interface ProfileUpdate {
  full_name?: string;
  avatar_url?: string;
}

export interface OnboardingPayload {
  loved_one?: Record<string, unknown>;
  location?: Record<string, unknown>;
}

export interface SyncProfileResponse {
  profile: ProfileOut;
  created: boolean;
}

export interface GuestSessionOut {
  access_token: string;
  token_type: string;
}

export interface SupabaseAuthResponse {
  access_token?: string | null;
  token_type?: string | null;
  expires_in?: number | null;
  refresh_token?: string | null;
  user?: Record<string, unknown> | null;
  raw?: Record<string, unknown> | null;
}

// ---- Assessment (app/schemas/assessment.py) ----
// Scored by app/core/recommendation_weights.py -- a fixed 5-question quiz
// (q1-q5, lettered options) weighted across the 8 supported care categories.
// Bump ASSESSMENT_VERSION in careTypes.ts if the backend's questionnaire
// shape ever changes.

export interface CategoryScore {
  type: string;
  score: number; // normalized 0-100, top category = 100
}

export interface AssessmentOut {
  id: string;
  answers: Record<string, unknown>;
  recommended_care_type?: string | null;
  recommended_types: CategoryScore[];
  confidence_score?: number | null;
  explanation: string[];
  assessment_version: string;
  created_at: string;
}

export interface AssessmentResult {
  assessment: AssessmentOut;
  matched_facility_count: number;
}

// ---- Inquiries (app/schemas/inquiry.py) ----

export interface InquiryCreate {
  facility_id: string;
  message?: string;
  contact_phone?: string;
  contact_time_preference?: string;
}

export interface InquiryOut {
  id: string;
  facility_id: string;
  message?: string | null;
  contact_phone?: string | null;
  contact_time_preference?: string | null;
  status: string;
  created_at: string;
}

// ---- Resources (app/schemas/resource.py) ----

export interface ResourceListItem {
  id: string;
  title: string;
  category?: string | null;
  created_at: string;
}

export interface ResourceOut extends ResourceListItem {
  content?: string | null;
}

// ---- Health (app/schemas/common.py) ----

export interface HealthResponse {
  status: string;
}

export interface ReadinessResponse {
  status: string;
  database: boolean;
  cache: boolean;
  search: boolean;
}

export interface MessageResponse {
  message: string;
}

// ---- Chat agent (root-level, unversioned -- Part 11-15 of API_CONTRACT.md) ----

export type ChatRole = "user" | "assistant";

export interface ChatFacilityCard {
  source: "cms_certified" | "not_certified";
  // cms_certified
  id?: string; // facilities.source_uuid -- safe to use directly as a /facilities/:id link
  name?: string;
  facility_type_label?: string;
  city?: string;
  state?: string;
  phone?: string;
  highlight?: string;
  note?: string | null; // e.g. staffing-agency disclaimer
  // not_certified
  title?: string;
  snippet?: string;
  url?: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  facility_cards?: ChatFacilityCard[] | null;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
}

export interface ChatSessionSummary {
  session_id: string;
  title: string;
  description: string;
  created_at: string;
}

export interface ChatSessionsResponse {
  sessions: ChatSessionSummary[];
}

export interface ChatReplyEvent {
  response: string;
  facility_cards?: ChatFacilityCard[] | null;
}

export interface GenerateTitleResponse {
  title: string;
  description: string;
}

// ---- Infomary leads (admin dashboard) ----

/**
 * One row of the `infomary_leads` table (GET /dashboard/leads, root-level,
 * unversioned -- see database.py::get_all_leads). Every text column is
 * `default ''` in Postgres, so these arrive as empty strings rather than
 * null -- render them through `leadValue()` so blanks show as an em dash
 * instead of nothing.
 */
export interface InfomaryLead {
  id: number; // SERIAL primary key -- internal only, not stable across re-imports
  lead_id: string; // the actual business identifier -- use this for status updates and as the row key
  session_id: string;
  created_at?: string;
  updated_at?: string;
  name: string;
  email: string;
  phone: string;
  care_need: string;
  care_type: string;
  location: string;
  age: string;
  gender: string;
  living_arrangement: string;
  conditions: string;
  insurance: string;
  budget: string;
  notes: string;
  /** Free text in the DB (defaults to 'New'); the UI styles the known ones. */
  status: string;
  email_sent: boolean;
}

// ---- Dashboard stats (GET /dashboard/stats, root-level, unversioned) ----

export interface DashboardTrendPoint {
  day: string;
  count: number;
}

export interface DashboardStats {
  total_sessions: number;
  total_leads: number;
  qualified_leads: number;
  emails_sent: number;
  today_sessions: number;
  today_leads: number;
  trend: DashboardTrendPoint[];
}

// ---- Generic API error shape (Part 9) ----

export interface ApiErrorBody {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
  errors?: { loc: (string | number)[]; msg: string; type: string }[];
}
