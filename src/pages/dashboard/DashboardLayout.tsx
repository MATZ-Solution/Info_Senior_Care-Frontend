import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";

export default function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = (profile?.full_name || profile?.email || "?").slice(0, 2).toUpperCase();

  function itemStyle(isActive: boolean): React.CSSProperties {
    return {
      padding: "9px 12px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 600,
      color: isActive ? "var(--teal)" : "var(--muted)",
      background: isActive ? "var(--tl)" : "transparent",
      cursor: "pointer",
      display: "block",
    };
  }

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 64px)" }} className="dashboard-layout">
      <div style={{ width: 220, borderRight: "1px solid var(--g3)", padding: "24px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--g2)" }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--tl)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "var(--teal)" }}>
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--navy)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {profile?.full_name || "Your account"}
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)" }}>{profile?.email}</div>
          </div>
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <NavLink to="/dashboard" end style={({ isActive }) => itemStyle(isActive)}>
            📊 Overview
          </NavLink>
          <NavLink to="/dashboard/saved" style={({ isActive }) => itemStyle(isActive)}>
            🏡 Saved facilities
          </NavLink>
          <NavLink to="/dashboard/inquiries" style={({ isActive }) => itemStyle(isActive)}>
            📤 Inquiries
          </NavLink>
          <NavLink to="/dashboard/profile" style={({ isActive }) => itemStyle(isActive)}>
            ⚙ Profile settings
          </NavLink>
          <div
            onClick={() => {
              signOut();
              navigate("/");
            }}
            style={{ padding: "9px 12px", fontSize: 14, color: "var(--coral)", cursor: "pointer", marginTop: 16 }}
          >
            Sign out
          </div>
        </nav>
      </div>
      <div style={{ flex: 1, padding: "32px 40px", minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
