import { useNavigate } from "react-router-dom";
import type { FacilityCard } from "../lib/types";

interface Props {
  facility: FacilityCard;
  showSave?: boolean;
  isSaved?: boolean;
  onToggleSave?: (facility: FacilityCard) => void;
}

function starString(rating?: number | null): string {
  if (rating === null || rating === undefined) return "";
  const rounded = Math.round(rating);
  return "★".repeat(Math.max(0, Math.min(5, rounded))) + "☆".repeat(Math.max(0, 5 - rounded));
}

export default function FacilityCardView({ facility, showSave, isSaved, onToggleSave }: Props) {
  const navigate = useNavigate();

  return (
    <div className="fac-card" onClick={() => navigate(`/facilities/${facility.id}`)}>
      <div className="fac-img">
        🏡
        {showSave && (
          <button
            className="fac-save-btn"
            aria-label={isSaved ? "Remove from saved" : "Save facility"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave?.(facility);
            }}
          >
            {isSaved ? "♥" : "♡"}
          </button>
        )}
      </div>
      <div className="fac-body">
        <div className="fac-name">{facility.name}</div>
        <div className="fac-meta">
          {[facility.facility_type_category || facility.facility_type, [facility.city, facility.state].filter(Boolean).join(", ")]
            .filter(Boolean)
            .join(" · ")}
        </div>
        <div className="fac-footer">
          <div>
            {facility.overall_rating != null ? (
              <>
                <div className="stars">{starString(facility.overall_rating)}</div>
                <div style={{ fontSize: 11, color: "var(--muted)" }}>{facility.overall_rating.toFixed(1)} rating</div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>Rating unavailable</div>
            )}
          </div>
          {facility.bed_count != null && (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{facility.bed_count} beds</div>
          )}
        </div>
      </div>
    </div>
  );
}
