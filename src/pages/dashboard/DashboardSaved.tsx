import { useEffect, useState } from "react";
import { savedApi } from "../../lib/api";
import type { FacilityCard } from "../../lib/types";
import FacilityCardView from "../../components/FacilityCardView";
import { EmptyState, Spinner } from "../../components/Feedback";

export default function DashboardSaved() {
  const [items, setItems] = useState<FacilityCard[] | null>(null);

  function load() {
    savedApi.list().then(setItems).catch(() => setItems([]));
  }

  useEffect(load, []);

  async function handleRemove(facility: FacilityCard) {
    setItems((prev) => (prev ? prev.filter((f) => f.id !== facility.id) : prev));
    try {
      await savedApi.remove(facility.id);
    } catch {
      load();
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 26, color: "var(--navy)", marginBottom: 24 }}>Saved facilities</h1>
      {items === null && <Spinner />}
      {items && items.length === 0 && <EmptyState title="No saved facilities yet" hint="Browse search results and tap the heart icon to save one." />}
      {items && items.length > 0 && (
        <div className="grid-3">
          {items.map((f) => (
            <FacilityCardView key={f.id} facility={f} showSave isSaved onToggleSave={handleRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
