import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import config from "./config";

// ── Status helpers ─────────────────────────────────────────────────────────
const STATUS_LABEL = {
  placed:    "⏳ Order Placed",
  confirmed: "✅ Confirmed",
  shipped:   "🚚 Shipped",
  delivered: "✓ Delivered",
  cancelled: "❌ Cancelled",
};

const STATUS_CLASS = {
  placed:    "status-placed",
  confirmed: "status-confirmed",
  shipped:   "status-shipped",
  delivered: "status-delivered",
  cancelled: "status-cancelled",
};

const PAYMENT_LABEL = {
  cod:  "💵 Cash on Delivery",
  upi:  "📲 UPI",
  card: "💳 Card",
};

export default function Orders() {
  const { authFetch, user } = useAuth();
  const navigate            = useNavigate();

  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  // Track which order cards are expanded
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setError("");
    try {
      const res = await authFetch(`${config.API_URL}/api/orders`);

      if (res.status === 401) { navigate("/login"); return; }

      if (!res.ok) {
        setError("Could not load orders. Please try again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (orderId) =>
    setExpanded((prev) => ({ ...prev, [orderId]: !prev[orderId] }));

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner" />
        <p>Loading your orders…</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="orders-page">
        <div className="nm-error" style={{ padding: "20px", textAlign: "center" }}>
          <p>⚠️ {error}</p>
          <button className="nm-btn-primary" onClick={fetchOrders} style={{ marginTop: "12px" }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Empty ────────────────────────────────────────────────────────────────
  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="empty-cart">
          <div className="empty-cart-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here once you place an order.</p>
          <Link to="/" className="btn-primary">Start Shopping</Link>
        </div>
      </div>
    );
  }

  // ── Orders list ──────────────────────────────────────────────────────────
  return (
    <div className="orders-page">
      <div className="page-header">
        <h1 className="page-title">📦 Order History</h1>
        <span className="item-count">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="orders-list">
        {orders.map((order, index) => {
          const isOpen   = !!expanded[order.order_id];
          const itemCount = order.items?.length || 0;
          // First item's name as preview
          const preview  = order.items?.[0]?.product_name || "Order";

          return (
            <div className="order-card" key={order.order_id || index}>
              {/* ── Card Header ────────────────────────────────────────── */}
              <div
                className="order-card-header"
                onClick={() => toggleExpand(order.order_id)}
                style={{ cursor: "pointer" }}
              >
                <div className="order-card-left">
                  <div className="order-index">#{orders.length - index}</div>
                  <div className="order-info">
                    {/* Show order ID */}
                    <p className="order-id-label" style={{ fontSize: "12px", color: "#888", marginBottom: "2px" }}>
                      {order.order_id}
                    </p>
                    <h3 className="order-name">
                      {preview}
                      {itemCount > 1 && (
                        <span style={{ fontWeight: 400, color: "#666", fontSize: "13px" }}>
                          {" "}+ {itemCount - 1} more item{itemCount - 1 > 1 ? "s" : ""}
                        </span>
                      )}
                    </h3>
                    {order.address && (
                      <p className="order-address">📍 {order.address}</p>
                    )}
                    {order.created_at && (
                      <p style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                        🕐 {order.created_at.slice(0, 16)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="order-card-right">
                  <span className={`order-status ${STATUS_CLASS[order.status] || "status-placed"}`}>
                    {STATUS_LABEL[order.status] || "⏳ Order Placed"}
                  </span>
                  <p className="order-payment">
                    {PAYMENT_LABEL[order.payment_method] || order.payment_method}
                  </p>
                  <p className="order-total">
                    ₹{Number(order.grand_total || 0).toFixed(2)}
                  </p>
                  <span style={{ fontSize: "12px", color: "#aaa" }}>
                    {isOpen ? "▲ Hide" : "▼ Details"}
                  </span>
                </div>
              </div>

              {/* ── Expanded Items ──────────────────────────────────────── */}
              {isOpen && (
                <div className="order-items-expanded" style={{
                  borderTop: "1px solid #eee",
                  padding: "12px 16px",
                  background: "#fafafa"
                }}>
                  <h4 style={{ marginBottom: "8px", fontSize: "14px", color: "#555" }}>
                    🛍 Items in this order
                  </h4>
                  {(order.items || []).map((item, i) => (
                    <div key={i} style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderBottom: i < order.items.length - 1 ? "1px solid #eee" : "none",
                      fontSize: "14px"
                    }}>
                      <span>
                        <strong>{item.product_name}</strong>
                        <span style={{ color: "#888" }}> × {item.quantity}</span>
                      </span>
                      <span>₹{Number(item.item_total).toFixed(2)}</span>
                    </div>
                  ))}

                  {/* Delivery info */}
                  <div style={{ marginTop: "12px", fontSize: "13px", color: "#666", lineHeight: "1.7" }}>
                    <p>👤 <strong>{order.name}</strong> &nbsp;|&nbsp; 📞 {order.phone}</p>
                    <p>📍 {order.address}</p>
                  </div>

                  {/* Grand total */}
                  <div style={{
                    display: "flex", justifyContent: "flex-end",
                    fontWeight: "bold", marginTop: "10px", fontSize: "15px"
                  }}>
                    <span>Total: ₹{Number(order.grand_total || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}