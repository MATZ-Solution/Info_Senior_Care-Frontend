import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ApiError, formatApiErrorDetail, resourcesApi } from "../lib/api";
import type { ResourceListItem, ResourceOut } from "../lib/types";
import { ErrorBanner, Spinner } from "../components/Feedback";

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<ResourceOut | null>(null);
  const [related, setRelated] = useState<ResourceListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setResource(null);
    setError(null);
    resourcesApi
      .detail(id)
      .then((r) => {
        if (cancelled) return;
        setResource(r);
        if (r.category) {
          resourcesApi
            .list(r.category, 6)
            .then((items) => {
              if (!cancelled) setRelated(items.filter((i) => i.id !== id));
            })
            .catch(() => {});
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? formatApiErrorDetail(err.detail) : "Network error -- is the backend running?");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="container" style={{ paddingTop: 48 }}>
        <ErrorBanner message={error} />
        <p style={{ marginTop: 16 }}>
          <Link to="/resources" className="btn btn-ghost">
            ← Back to Knowledge Center
          </Link>
        </p>
      </div>
    );
  }

  if (!resource) return <Spinner />;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, alignItems: "flex-start" }} className="article-grid">
        <div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 16 }}>
            <Link to="/resources" style={{ color: "var(--teal)" }}>
              Knowledge Center
            </Link>
            {resource.category && ` / ${resource.category}`}
          </div>
          {resource.category && <span className="pill pill-blue" style={{ marginBottom: 16, display: "inline-block" }}>{resource.category}</span>}
          <h1 style={{ fontSize: 34, marginBottom: 16, lineHeight: 1.25 }}>{resource.title}</h1>
          <div style={{ fontSize: 13, color: "var(--muted)", paddingBottom: 16, borderBottom: "1px solid var(--g2)", marginBottom: 28 }}>
            Published {new Date(resource.created_at).toLocaleDateString()}
          </div>
          {resource.content ? (
            <div style={{ fontSize: 16, color: "var(--text)", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{resource.content}</div>
          ) : (
            <p className="muted">This article doesn't have body content yet.</p>
          )}
        </div>

        {related.length > 0 && (
          <div className="card card-p">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--navy)", marginBottom: 14 }}>Related articles</div>
            {related.map((r) => (
              <Link
                key={r.id}
                to={`/resources/${r.id}`}
                style={{ display: "block", paddingBottom: 12, borderBottom: "1px solid var(--g2)", marginBottom: 12 }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--navy)" }}>{r.title}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
