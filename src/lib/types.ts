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
  city?: string | null;
  state?: string | null;
}

export interface PaginatedFacilities {
  items: FacilityCard[];
  page: number;
  page_size: number;
  total: number;
  has_more: boolean;
}

export interface NursingHomeDetailOut {
  nh_total_certified_beds?: number | null;
  nh_average_daily_residents?: number | null;
  nh_chain_affiliation?: string | null;
  nh_ccrc?: string | null;
  nh_health_inspection_star_rating?: number | null;
  nh_staffing_star_rating?: number | null;
  nh_quality_measure_star_rating?: number | null;
  nh_total_nursing_hours_per_resident_day?: number | null;
  nh_staff_stability?: string | null;
  nh_health_deficiencies_latest?: number | null;
  nh_number_of_fines?: number | null;
  nh_total_fines_usd?: number | null;
  nh_penalty_summary?: string | null;
}

export interface HomeHealthDetailOut {
  hh_provides_nursing_care?: string | null;
  hh_provides_physical_therapy?: string | null;
  hh_provides_occupational_therapy?: string | null;
  hh_provides_speech_therapy?: string | null;
  hh_provides_home_health_aides?: string | null;
  hh_hospital_readmission_rate?: number | null;
  hh_home_discharge_success?: number | null;
  hh_medicare_cost_vs_national_avg?: string | null;
}

export interface FacilityServicesOut {
  offers_alzheimer_dementia_care?: string | null;
  offers_hospice_care?: string | null;
  offers_ventilator_care?: string | null;
  offers_psychiatric_care?: string | null;
  offers_substance_abuse_treatment?: string | null;
  offers_hiv_care?: string | null;
  offers_rehab_services?: string | null;
  offers_adult_day_care?: string | null;
  offers_respite_care?: string | null;
  offers_home_care_services?: string | null;
  offers_traumatic_brain_injury_care?: string | null;
  offers_iv_therapy?: string | null;
  offers_pain_management?: string | null;
  offers_medical_equipment_supply?: string | null;
}

export interface FacilityDetail extends FacilityCard {
  legal_business_name?: string | null;
  address?: string | null;
  county?: string | null;
  phone?: string | null;
  email?: string | null;
  operating_status?: string | null;
  data_source?: string | null;
  certification_date?: string | null;
  secure_memory_care_beds?: number | null;
  specialty_notes?: string | null;
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

export interface AssessmentOut {
  id: string;
  answers: Record<string, unknown>;
  recommended_care_type?: string | null;
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
  name?: string;
  facility_type_label?: string;
  city?: string;
  state?: string;
  phone?: string;
  highlight?: string;
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

// ---- Generic API error shape (Part 9) ----

export interface ApiErrorBody {
  detail: string | { loc: (string | number)[]; msg: string; type: string }[];
  errors?: { loc: (string | number)[]; msg: string; type: string }[];
}
