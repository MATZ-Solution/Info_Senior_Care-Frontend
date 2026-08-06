import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, resourcesApi } from "../lib/api";
import type { ResourceListItem } from "../lib/types";
import { EmptyState, ErrorBanner, Spinner } from "../components/Feedback";

export default function Knowledge() {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") || "";

  const [resources, setResources] = useState<ResourceListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    resourcesApi
      .list(undefined, 100)
      .then((items) => {
        if (!cancelled) setResources(items);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? "Couldn't load articles." : "Network error -- is the backend running?");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    if (!resources) return [];
    return Array.from(new Set(resources.map((r) => r.category).filter((c): c is string => Boolean(c))));
  }, [resources]);

  const filtered = useMemo(() => {
    if (!resources) return [];
    if (!activeCategory) return resources;
    return resources.filter((r) => r.category === activeCategory);
  }, [resources, activeCategory]);

  return (
    <div>
      <div style={{ background: "var(--grad-brand)", padding: "52px 0" }}>
        <div className="container center">
          <h1 style={{ fontSize: 36, color: "#fff", marginBottom: 12 }}>Knowledge Center</h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)" }}>Guides on senior care topics, written for families.</p>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
        {categories.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            <span
              onClick={() => setParams({})}
              className="pill"
              style={{ padding: "7px 16px", cursor: "pointer", background: !activeCategory ? "var(--teal)" : "#fff", color: !activeCategory ? "#fff" : "var(--muted)", border: !activeCategory ? "none" : "1px solid var(--g3)" }}
            >
              All topics
            </span>
            {categories.map((c) => (
              <span
                key={c}
                onClick={() => setParams({ category: c })}
                className="pill"
                style={{ padding: "7px 16px", cursor: "pointer", background: activeCategory === c ? "var(--teal)" : "#fff", color: activeCategory === c ? "#fff" : "var(--muted)", border: activeCategory === c ? "none" : "1px solid var(--g3)" }}
              >
                {c}
              </span>
            ))}
          </div>
        )}

        {error && <ErrorBanner message={error} />}
        {!resources && !error && <Spinner />}
        {resources && filtered.length === 0 && <EmptyState title="No articles found" hint="Try a different topic." />}

        {filtered.length > 0 && (
          <div className="grid-3" style={{ gap: 24 }}>
            {filtered.map((r) => (
              <Link key={r.id} to={`/resources/${r.id}`} className="art-card card">
                <div style={{ padding: 20 }}>
                  {r.category && <span className="pill pill-teal" style={{ marginBottom: 10, display: "inline-block" }}>{r.category}</span>}
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--navy)", marginBottom: 8, lineHeight: 1.4 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{new Date(r.created_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
