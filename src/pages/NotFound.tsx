import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container center" style={{ paddingTop: 80, paddingBottom: 80 }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Page not found</h1>
      <p className="muted" style={{ marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn btn-primary">
        Back home
      </Link>
    </div>
  );
}
