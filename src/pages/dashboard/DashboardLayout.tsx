import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.full_name || profile?.email || "?").slice(0, 2).toUpperCase();

  function navClass({ isActive }: { isActive: boolean }) {
    return `dash-nav-item${isActive ? " active" : ""}`;
  }

  return (
    <div className="dash-shell">
      <div className="dash-sidebar">
        <div className="dash-profile">
          <div className="dash-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.full_name || "Your account"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{profile?.email}</div>
          </div>
        </div>
        <nav className="dash-nav">
          <NavLink to="/dashboard" end className={navClass}>
            📊 Overview
          </NavLink>
          <NavLink to="/dashboard/saved" className={navClass}>
            🏡 Saved facilities
          </NavLink>
          <NavLink to="/dashboard/inquiries" className={navClass}>
            📤 Inquiries
          </NavLink>
          <NavLink to="/dashboard/profile" className={navClass}>
            ⚙ Profile settings
          </NavLink>
          <div
            onClick={() => {
              signOut();
              navigate("/");
            }}
            className="dash-signout"
          >
            Sign out
          </div>
        </nav>
      </div>
      <div className="dash-content">
        <Outlet />
      </div>
    </div>
  );
}
