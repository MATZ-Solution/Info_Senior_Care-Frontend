// The 8 facility_type_category values the backend DB enforces via a CHECK
// constraint (see alembic/versions/c7f2a9d4e8b1_curate_facilities_8_types_and_columns.py
// and app/core/recommendation_weights.py::CareCategory). Any other value is
// rejected at the database level, so this list is authoritative -- not an
// arbitrary frontend invention -- and drives both the assessment quiz results
// and the "browse by care type" grid/filter.
export const CARE_TYPES: { category: string; label: string; icon: string; blurb: string }[] = [
  {
    category: "Nursing Home / Skilled Nursing Facility",
    label: "Nursing Home / Skilled Nursing",
    icon: "🧠",
    blurb: "24-hour medical care and supervision for complex health or cognitive needs.",
  },
  {
    category: "Residential Care / Assisted Living",
    label: "Residential Care / Assisted Living",
    icon: "🤝",
    blurb: "Daily support with meals, medications, and personal care while maintaining independence.",
  },
  {
    category: "Rehabilitation - Inpatient",
    label: "Inpatient Rehabilitation",
    icon: "🏋️",
    blurb: "Intensive, live-in therapy after surgery, injury, or illness.",
  },
  {
    category: "Rehabilitation - Outpatient",
    label: "Outpatient Rehabilitation",
    icon: "🚶",
    blurb: "Physical, occupational, or speech therapy without an overnight stay.",
  },
  {
    category: "Adult Day Care",
    label: "Adult Day Care",
    icon: "🌞",
    blurb: "Daytime supervision, activities, and support while living at home.",
  },
  {
    category: "Mental/Behavioral Health Facility",
    label: "Mental/Behavioral Health",
    icon: "🧩",
    blurb: "Specialized care for serious mental or behavioral health needs.",
  },
  {
    category: "Intermediate Care Facility (ICF/IID)",
    label: "Intermediate Care (ICF/IID)",
    icon: "🏥",
    blurb: "24-hour care for individuals with intellectual or developmental disabilities.",
  },
  {
    category: "Hospice",
    label: "Hospice",
    icon: "💐",
    blurb: "Comfort-focused care for end-of-life needs.",
  },
];
