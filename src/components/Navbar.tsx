import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function Navbar() {
  const { isSignedIn, isGuest, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on any navigation, including browser back/forward.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function handleSignOut() {
    setMenuOpen(false);
    signOut();
    navigate("/");
  }

  function linkClass({ isActive }: { isActive: boolean }) {
    return `nav-link${isActive ? " active" : ""}`;
  }

  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <Link to="/" className="nav-logo" onClick={() => setMenuOpen(false)}>
          <span className="dot">🌿</span>InfoSenior.care
        </Link>
        <div className="nav-links">
          <NavLink to="/search" className={linkClass}>
            Find Care
          </NavLink>
          <NavLink to="/chat" className={linkClass}>
            Ask Infomary
          </NavLink>
          <NavLink to="/resources" className={linkClass}>
            Knowledge
          </NavLink>
          <NavLink to="/assessment" className={linkClass}>
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
        <button
          className={`nav-burger${menuOpen ? " open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
        </button>
      </div>

      <div className={`nav-mobile-panel${menuOpen ? " open" : ""}`}>
        <NavLink to="/search" className={linkClass} onClick={() => setMenuOpen(false)}>
          Find Care
        </NavLink>
        <NavLink to="/chat" className={linkClass} onClick={() => setMenuOpen(false)}>
          Ask Infomary
        </NavLink>
        <NavLink to="/resources" className={linkClass} onClick={() => setMenuOpen(false)}>
          Knowledge
        </NavLink>
        <NavLink to="/assessment" className={linkClass} onClick={() => setMenuOpen(false)}>
          Care Quiz
        </NavLink>
        <div className="nav-ctas">
          {isSignedIn ? (
            <>
              <Link to="/dashboard" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
                {profile?.full_name || profile?.email || "Dashboard"}
              </Link>
              <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              {isGuest && <span className="pill pill-teal">Guest</span>}
              <Link to="/auth" className="btn btn-ghost btn-sm" onClick={() => setMenuOpen(false)}>
                Sign in
              </Link>
              <Link to="/auth?tab=signup" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>
                Get started — it's free
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
