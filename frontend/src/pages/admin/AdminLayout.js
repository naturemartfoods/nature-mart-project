import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  const links = [
    { to: "/admin",          label: "Dashboard", icon: "◈", end: true },
    { to: "/admin/products", label: "Products",  icon: "🌿" },
    { to: "/admin/orders",   label: "Orders",    icon: "📦" },
    { to: "/admin/users",    label: "Users",     icon: "👤" },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <span>🌿</span> Nature Mart
          <span className="sidebar-badge">Admin</span>
        </div>

        <nav className="sidebar-nav">
          {links.map(l => (
            <NavLink
              key={l.to} to={l.to} end={l.end}
              className={({ isActive }) => `sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
            >
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
            <div>
              <p className="sidebar-user-name">{user?.name}</p>
              <p className="sidebar-user-role">Administrator</p>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>Sign out</button>
        </div>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}