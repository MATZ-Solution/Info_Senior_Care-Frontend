// The only facility_type_category values the backend actually maps to
// anything (see app/api/v1/endpoints/assessment.py _CARE_TYPE_BY_ANSER_PATTERN).
// Used to drive both the assessment quiz and the "browse by care type" grid --
// deliberately not a bigger invented list, since facility_type_category is
// otherwise free text with no fixed enum on the backend.
export const CARE_TYPES: { primaryNeed: string; label: string; category: string; icon: string; blurb: string }[] = [
  {
    primaryNeed: "memory_care",
    label: "Memory Care / Skilled Nursing",
    category: "Nursing Home / Skilled Nursing Facility",
    icon: "🧠",
    blurb: "24-hour medical care and supervision for complex health or cognitive needs.",
  },
  {
    primaryNeed: "independent",
    label: "Residential Care / Assisted Living",
    category: "Residential Care / Assisted Living",
    icon: "🤝",
    blurb: "Daily support with meals, medications, and personal care while maintaining independence.",
  },
  {
    primaryNeed: "medical_support",
    label: "Home Health",
    category: "Home Health Agency",
    icon: "🏠",
    blurb: "Professional medical care and therapy delivered at home.",
  },
  {
    primaryNeed: "end_of_life",
    label: "Hospice",
    category: "Hospice",
    icon: "💐",
    blurb: "Comfort-focused care for end-of-life needs.",
  },
];
