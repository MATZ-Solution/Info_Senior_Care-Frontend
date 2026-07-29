import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ApiError, facilitiesApi, savedApi } from "../lib/api";
import type { FacilityCard, PaginatedFacilities } from "../lib/types";
import { CARE_TYPES } from "../lib/careTypes";
import FacilityCardView from "../components/FacilityCardView";
import SearchAutocomplete from "../components/SearchAutocomplete";
import { EmptyState, ErrorBanner, Spinner } from "../components/Feedback";
import { useAuth } from "../lib/auth";

const PAGE_SIZE = 12;

export default function Search() {
  const [params, setParams] = useSearchParams();
  const { isSignedIn } = useAuth();

  const q = params.get("q") || "";
  const state = params.get("state") || "";
  const city = params.get("city") || "";
  const category = params.get("facility_type_category") || "";
  const page = Number(params.get("page") || "1");

  const [qDraft, setQDraft] = useState(q);
  const [stateDraft, setStateDraft] = useState(state);
  const [cityDraft, setCityDraft] = useState(city);

  const [result, setResult] = useState<PaginatedFacilities | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setQDraft(q);
    setStateDraft(state);
    setCityDraft(city);
  }, [q, state, city]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    facilitiesApi
      .search({ q: q || undefined, state: state || undefined, city: city || undefined, facility_type_category: category || undefined, page, page_size: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setResult(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? "Search failed. Try adjusting your filters." : "Network error -- is the backend running?");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, state, city, category, page]);

  useEffect(() => {
    if (!isSignedIn) {
      setSavedIds(new Set());
      return;
    }
    let cancelled = false;
    savedApi
      .list()
      .then((items) => {
        if (!cancelled) setSavedIds(new Set(items.map((i) => i.id)));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const applyFilters = useCallback(
    (overrides: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params);
      const merged = { q: qDraft, state: stateDraft, city: cityDraft, facility_type_category: category, ...overrides };
      for (const [key, value] of Object.entries(merged)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete("page");
      setParams(next);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params, qDraft, stateDraft, cityDraft, category]
  );

  function goToPage(n: number) {
    const next = new URLSearchParams(params);
    next.set("page", String(n));
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleSave(facility: FacilityCard) {
    if (!isSignedIn) return;
    const isSaved = savedIds.has(facility.id);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(facility.id);
      else next.add(facility.id);
      return next;
    });
    try {
      if (isSaved) await savedApi.remove(facility.id);
      else await savedApi.save(facility.id);
    } catch {
      // revert on failure
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isSaved) next.add(facility.id);
        else next.delete(facility.id);
        return next;
      });
    }
  }

  return (
    <div>
      <div style={{ background: "var(--g1)", borderBottom: "1px solid var(--g3)", padding: "16px 0" }}>
        <div className="container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyFilters({});
            }}
            style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}
          >
            <div style={{ flex: 2, minWidth: 220, display: "flex", gap: 10, background: "#fff", border: "1.5px solid var(--g3)", borderRadius: 12, padding: "10px 16px", alignItems: "center" }}>
              <span>🔍</span>
              <SearchAutocomplete
                value={qDraft}
                onChange={setQDraft}
                onSubmit={() => applyFilters({})}
                placeholder="Name, city, state, or ZIP"
                inputStyle={{ border: "none", outline: "none", width: "100%", fontSize: 14, background: "transparent" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140, display: "flex", gap: 10, background: "#fff", border: "1.5px solid var(--g3)", borderRadius: 12, padding: "10px 16px", alignItems: "center" }}>
              <span>📍</span>
              <input
                value={stateDraft}
                onChange={(e) => setStateDraft(e.target.value.toUpperCase())}
                placeholder="State (e.g. TX)"
                maxLength={30}
                style={{ border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent" }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140, display: "flex", gap: 10, background: "#fff", border: "1.5px solid var(--g3)", borderRadius: 12, padding: "10px 16px", alignItems: "center" }}>
              <span>🏙️</span>
              <input
                value={cityDraft}
                onChange={(e) => setCityDraft(e.target.value)}
                placeholder="City"
                style={{ border: "none", outline: "none", flex: 1, fontSize: 14, background: "transparent" }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: "11px 24px" }}>
              Update search
            </button>
          </form>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div className="sidebar-layout">
          <aside className="sidebar" style={{ background: "#fff", border: "1px solid var(--g3)", borderRadius: 14, padding: 20 }}>
            <div className="sidebar-section">
              <div className="sidebar-title">Care type</div>
              <div className="filter-opt" style={{ padding: "6px 0", fontSize: 14, cursor: "pointer", color: !category ? "var(--teal)" : "var(--text)", fontWeight: !category ? 700 : 400 }} onClick={() => applyFilters({ facility_type_category: undefined })}>
                All care types
              </div>
              {CARE_TYPES.map((ct) => (
                <div
                  key={ct.category}
                  style={{ padding: "6px 0", fontSize: 14, cursor: "pointer", color: category === ct.category ? "var(--teal)" : "var(--text)", fontWeight: category === ct.category ? 700 : 400 }}
                  onClick={() => applyFilters({ facility_type_category: ct.category })}
                >
                  {ct.label}
                </div>
              ))}
            </div>
            {(q || state || city || category) && (
              <button className="btn" style={{ width: "100%", background: "var(--g1)", color: "var(--teal)", border: "1px solid var(--tl)", fontSize: 13 }} onClick={() => setParams({})}>
                Clear all filters
              </button>
            )}
          </aside>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "var(--navy)" }}>
                  {result ? `${result.total} facilit${result.total === 1 ? "y" : "ies"} found` : "Searching…"}
                </div>
                {category && <div style={{ fontSize: 13, color: "var(--muted)" }}>{category}</div>}
              </div>
            </div>

            {error && <ErrorBanner message={error} />}
            {loading && <Spinner />}
            {!loading && result && result.items.length === 0 && (
              <EmptyState title="No facilities matched your search" hint="Try a broader location or clearing filters." />
            )}
            {!loading && result && result.items.length > 0 && (
              <>
                <div className="grid-3">
                  {result.items.map((f) => (
                    <FacilityCardView key={f.id} facility={f} showSave={isSignedIn} isSaved={savedIds.has(f.id)} onToggleSave={toggleSave} />
                  ))}
                </div>
                <div className="center" style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12 }}>
                  <button className="btn btn-ghost" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    ← Previous
                  </button>
                  <span className="muted" style={{ alignSelf: "center", fontSize: 13 }}>
                    Page {result.page}
                  </span>
                  <button className="btn btn-ghost" disabled={!result.has_more} onClick={() => goToPage(page + 1)}>
                    Next →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
