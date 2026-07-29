import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const { isSignedIn, isGuest, profile, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <span className="dot">🌿</span>InfoSenior.care
        </Link>
        <div className="nav-links">
          <NavLink to="/search" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Find Care
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Ask Infomary
          </NavLink>
          <NavLink to="/resources" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Knowledge
          </NavLink>
          <NavLink to="/assessment" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
            Care Quiz
          </NavLink>
        </div>
        <div className="nav-ctas">
          {isSignedIn ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm">
                {profile?.full_name || profile?.email || "Dashboard"}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              {isGuest && <span className="pill pill-teal">Guest</span>}
              <Link to="/auth" className="btn btn-ghost btn-sm">
                Sign in
              </Link>
              <Link to="/auth?tab=signup" className="btn btn-primary btn-sm">
                Get started — it's free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
