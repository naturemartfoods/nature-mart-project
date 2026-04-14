import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("all");
const API_URL = "https://nature-mart-project.onrender.com";
  const load = () => {
    authFetch(`${API_URL}/api/admin/orders`)
      .then(r => r.json())
      .then(d => { setOrders(d); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await authFetch(`${API_URL}/api/admin/orders/${id}/status`, {
      method: "PUT",
      body:   JSON.stringify({ status }),
    });
    load();
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading orders…</p></div>;

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>All Orders</h1>
        <p>{orders.length} total orders</p>
      </div>

      <div className="filter-bar">
        {["all", ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            className={`filter-btn ${filter === s ? "filter-active" : ""}`}
            onClick={() => setFilter(s)}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="admin-card">
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th><th>Customer</th><th>Product</th>
                <th>Qty</th><th>Total</th><th>Date</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td className="td-name">{o.user}</td>
                  <td>{o.product}</td>
                  <td>{o.quantity}</td>
                  <td className="td-price">₹{o.total}</td>
                  <td>{o.created_at?.slice(0, 10)}</td>
                  <td>
                    <select
                      className={`status-select status-${o.status}`}
                      value={o.status}
                      onChange={e => updateStatus(o.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" style={{textAlign:"center",padding:"40px",color:"#888"}}>No orders found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}