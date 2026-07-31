export function Spinner() {
  return <div className="spinner" role="status" aria-label="Loading" />;
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="state-banner error">
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

export function InfoBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="state-banner info">
      <span>🌿</span>
      <span>{children}</span>
    </div>
  );
}

export function SearchSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid-3" role="status" aria-label="Loading search results">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel-card">
          <div className="skel-card-img skeleton" />
          <div className="skel-card-body">
            <div className="skeleton skel-line" />
            <div className="skeleton skel-line-sm" />
            <div className="skeleton skel-line-xs" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--navy)", marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 13 }}>{hint}</div>}
    </div>
  );
}
