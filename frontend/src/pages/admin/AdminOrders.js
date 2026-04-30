// import { useEffect, useState } from "react";
// import { useAuth } from "../../AuthContext";
// import "./Admin.css";

// const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

// export default function AdminOrders() {
//   const { authFetch } = useAuth();
//   const [orders, setOrders] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter]   = useState("all");
// const API_URL = "https://nature-mart-project.onrender.com";
//   const load = () => {
//     authFetch(`${API_URL}/api/admin/orders`)
//       .then(r => r.json())
//       .then(d => { setOrders(d); setLoading(false); });
//   };

//   useEffect(() => { load(); }, []);

//   const updateStatus = async (id, status) => {
//     await authFetch(`${API_URL}/api/admin/orders/${id}/status`, {
//       method: "PUT",
//       body:   JSON.stringify({ status }),
//     });
//     load();
//   };

//   const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

//   if (loading) return <div className="page-loader"><div className="spinner"></div><p>Loading orders…</p></div>;

//   return (
//     <div className="admin-page">
//       <div className="admin-header">
//         <h1>All Orders</h1>
//         <p>{orders.length} total orders</p>
//       </div>

//       <div className="filter-bar">
//         {["all", ...STATUS_OPTIONS].map(s => (
//           <button
//             key={s}
//             className={`filter-btn ${filter === s ? "filter-active" : ""}`}
//             onClick={() => setFilter(s)}
//           >
//             {s.charAt(0).toUpperCase() + s.slice(1)}
//           </button>
//         ))}
//       </div>

//       <div className="admin-card">
//         <div className="table-wrap">
//           <table className="admin-table">
//             <thead>
//               <tr>
//                 <th>ID</th><th>Customer</th><th>Product</th>
//                 <th>Qty</th><th>Total</th><th>Date</th><th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map(o => (
//                 <tr key={o.id}>
//                   <td>#{o.id}</td>
//                   <td className="td-name">{o.user}</td>
//                   <td>{o.product}</td>
//                   <td>{o.quantity}</td>
//                   <td className="td-price">₹{o.total}</td>
//                   <td>{o.created_at?.slice(0, 10)}</td>
//                   <td>
//                     <select
//                       className={`status-select status-${o.status}`}
//                       value={o.status}
//                       onChange={e => updateStatus(o.id, e.target.value)}
//                     >
//                       {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
//                     </select>
//                   </td>
//                 </tr>
//               ))}
//               {filtered.length === 0 && (
//                 <tr><td colSpan="7" style={{textAlign:"center",padding:"40px",color:"#888"}}>No orders found</td></tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState } from "react";
import { useAuth } from "../../AuthContext";
import "./Admin.css";

const STATUS_OPTIONS = ["pending", "processing", "shipped", "delivered", "cancelled"];

export default function AdminOrders() {
  const { authFetch } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(null); // ← track expanded row
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
      body: JSON.stringify({ status }),
    });
    load();
  };

  // Parse delivery_address — it may be a JSON string or object
  const parseAddress = (raw) => {
    if (!raw) return null;
    if (typeof raw === "object") return raw;
    try { return JSON.parse(raw); } catch { return null; }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div className="page-loader">
      <div className="spinner"></div>
      <p>Loading orders…</p>
    </div>
  );

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
                <th>ID</th>
                <th>Customer</th>
                <th>Contact</th>
                <th>Delivery Address</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const addr = parseAddress(o.delivery_address);
                return (
                  <>
                    <tr key={o.id} onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                        style={{ cursor: "pointer" }}>
                      <td>#{o.id}</td>
                      <td className="td-name">{o.delivery_name || o.user}</td>
                      <td>
                        {o.delivery_phone
                          ? <a href={`tel:${o.delivery_phone}`}>📞 {o.delivery_phone}</a>
                          : <span style={{color:"#aaa"}}>—</span>}
                      </td>
                      <td style={{fontSize:"12px"}}>{o.delivery_address || <span style={{color:"#aaa"}}>—</span>}</td>
                      <td>{o.product}</td>
                      <td>{o.quantity}</td>
                      <td className="td-price">₹{o.total}</td>
                      <td>
                        <span style={{
                          fontSize:"11px", padding:"2px 8px", borderRadius:"12px",
                          background: o.payment_method === "cod" ? "#fff3cd" : "#d4edda",
                          color: o.payment_method === "cod" ? "#856404" : "#155724",
                        }}>
                          {o.payment_method?.toUpperCase() || "—"}
                        </span>
                      </td>
                      <td>{o.created_at?.slice(0, 10)}</td>
                      <td>
                        <select
                          className={`status-select status-${o.status}`}
                          value={o.status}
                          onChange={e => { e.stopPropagation(); updateStatus(o.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>

                    {expanded === o.id && (
                      <tr key={`${o.id}-exp`} style={{background:"#f8fdf8"}}>
                        <td colSpan="10" style={{padding:"16px 24px"}}>
                          <div style={{display:"flex", gap:"40px", flexWrap:"wrap"}}>
                            <div>
                              <strong>📍 Delivery Details</strong>
                              <div style={{marginTop:"6px", lineHeight:"1.8", fontSize:"13px"}}>
                                <div><b>Name:</b> {o.delivery_name || "—"}</div>
                                <div><b>Phone:</b> {o.delivery_phone || "—"}</div>
                                <div><b>Address:</b> {o.delivery_address || "—"}</div>
                              </div>
                            </div>
                            <div>
                              <strong>💳 Payment</strong>
                              <div style={{marginTop:"6px", fontSize:"13px"}}>
                                {o.payment_method?.toUpperCase() || "—"}
                              </div>
                            </div>
                            <div>
                              <strong>👤 Account Name</strong>
                              <div style={{marginTop:"6px", fontSize:"13px"}}>{o.user}</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="10" style={{textAlign:"center", padding:"40px", color:"#888"}}>
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}