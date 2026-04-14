import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

export default function AdminDashboard() {
  const { authFetch } = useAuth();
  const [stats, setStats] = useState(null);
  const API_URL = "https://your-backend.onrender.com";

  useEffect(() => {
    authFetch(`${API_URL}/api/admin/dashboard`)
      .then(r => r.json())
      .then(setStats);
  }, []);

  if (!stats) return <div className="page-loader"><div className="spinner"></div><p>Loading dashboard…</p></div>;

  const statCards = [
    { label: "Total Users",    value: stats.total_users,    icon: "👤", color: "blue"   },
    { label: "Products",       value: stats.total_products, icon: "🌿", color: "green"  },
    { label: "Total Orders",   value: stats.total_orders,   icon: "📦", color: "amber"  },
    { label: "Total Revenue",  value: `₹${stats.total_revenue.toFixed(0)}`, icon: "💰", color: "teal" },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Overview of your Nature Mart store</p>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        {statCards.map(card => (
          <div className={`stat-card stat-${card.color}`} key={card.label}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <p className="stat-value">{card.value}</p>
              <p className="stat-label">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-two-col">
        {/* Top products */}
        <div className="admin-card">
          <h2>Top Products</h2>
          {stats.top_products.length === 0
            ? <p className="empty-note">No sales yet</p>
            : stats.top_products.map((p, i) => (
              <div className="rank-row" key={i}>
                <span className="rank-num">#{i + 1}</span>
                <span className="rank-name">{p.name}</span>
                <span className="rank-val">{p.sold} sold</span>
              </div>
            ))
          }
        </div>

        {/* Top users */}
        <div className="admin-card">
          <h2>Top Customers</h2>
          {stats.top_users.length === 0
            ? <p className="empty-note">No orders yet</p>
            : stats.top_users.map((u, i) => (
              <div className="rank-row" key={i}>
                <span className="rank-num">#{i + 1}</span>
                <span className="rank-name">{u.name}</span>
                <span className="rank-val">₹{u.spent}</span>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}