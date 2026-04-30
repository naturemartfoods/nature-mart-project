
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import config from "./config";

const STATUS_META = {
  placed:    { label: "Order Placed",      color: "#92400e", bg: "#fef3c7", dot: "#f59e0b", border: "#fde68a", step: 0 },
  confirmed: { label: "Confirmed",         color: "#065f46", bg: "#d1fae5", dot: "#10b981", border: "#a7f3d0", step: 1 },
  shipped:   { label: "Out for Delivery",  color: "#1e3a8a", bg: "#dbeafe", dot: "#3b82f6", border: "#bfdbfe", step: 2 },
  delivered: { label: "Delivered",         color: "#14532d", bg: "#dcfce7", dot: "#22c55e", border: "#bbf7d0", step: 3 },
  cancelled: { label: "Cancelled",         color: "#7f1d1d", bg: "#fee2e2", dot: "#ef4444", border: "#fecaca", step: -1 },
};

const PAYMENT_ICON  = { cod: "💵", upi: "📲", card: "💳" };
const PAYMENT_LABEL = { cod: "Cash on Delivery", upi: "UPI", card: "Card" };

const STEPS = [
  { key: "placed",    label: "Placed"    },
  { key: "confirmed", label: "Processing" },
  { key: "shipped",   label: "Shipped"   },
  { key: "delivered", label: "Delivered" },
];

function formatOrderDate(raw) {
  if (!raw) return "";
  try {
    const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
    const withTZ = normalized.endsWith("Z") || normalized.includes("+") ? normalized : normalized + "Z";
    const date = new Date(withTZ);
    if (isNaN(date.getTime())) return raw.slice(0, 16);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: true,
    });
  } catch {
    return raw.slice(0, 16);
  }
}

function TrackingBar({ status }) {
  if (status === "cancelled") return null;
  const currentStep = STATUS_META[status]?.step ?? 0;
  return (
    <div style={{
      padding: "20px 28px 16px",
      borderTop: "1px solid var(--brown-100)",
      background: "var(--cream)",
    }}>
      <p style={{
        fontSize: 11, fontWeight: 600, textTransform: "uppercase",
        letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: 14,
      }}>
        Order Progress
      </p>
      <div style={{ display: "flex", alignItems: "flex-start", position: "relative" }}>
        {/* Background track */}
        <div style={{
          position: "absolute", top: 13, left: "12.5%",
          width: "75%", height: 3,
          background: "var(--brown-100)",
          borderRadius: 4, zIndex: 0,
        }} />
        {/* Filled track */}
        <div style={{
          position: "absolute", top: 13, left: "12.5%",
          width: `${(currentStep / 3) * 75}%`,
          height: 3, background: "var(--green-400)",
          borderRadius: 4, zIndex: 1,
          transition: "width 0.5s ease",
        }} />
        {STEPS.map((step, i) => {
          const done   = i <= currentStep;
          const active = i === currentStep;
          return (
            <div key={step.key} style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", gap: 8, position: "relative", zIndex: 2,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done ? "var(--green-500)" : "var(--white)",
                border: done ? "2.5px solid var(--green-500)" : "2.5px solid var(--brown-100)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: active ? "0 0 0 5px rgba(45,138,78,0.15)" : "none",
                transition: "all 0.3s",
              }}>
                {done
                  ? <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.8 2.8L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  : <div style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--brown-100)" }} />
                }
              </div>
              <span style={{
                fontSize: 11, fontWeight: active ? 700 : 400,
                textAlign: "center",
                color: done ? "var(--green-600)" : "var(--text-soft)",
                whiteSpace: "nowrap",
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Orders() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState({});
  const [filter,   setFilter]   = useState("all");

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    setError("");
    try {
      const res = await authFetch(`${config.API_URL}/api/orders`);
      if (res.status === 401) { navigate("/login"); return; }
      if (!res.ok) { setError("Could not load orders. Please try again."); setLoading(false); return; }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const FILTERS = [
    { key: "all",       label: "All Orders" },
    { key: "placed",    label: "Placed"     },
    { key: "confirmed", label: "Processing" },
    { key: "shipped",   label: "Shipped"    },
    { key: "delivered", label: "Delivered"  },
    { key: "cancelled", label: "Cancelled"  },
  ];

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  if (loading) return (
    <div className="page-loader">
      <div className="spinner" />
      <p>Loading your orders…</p>
    </div>
  );

  if (error) return (
    <div style={{ padding: "80px 20px", textAlign: "center" }}>
      <p style={{ color: "var(--text-soft)", marginBottom: 16 }}>⚠️ {error}</p>
      <button onClick={fetchOrders} style={{
        background: "var(--green-500)", color: "#fff", border: "none",
        padding: "10px 24px", borderRadius: 100, fontFamily: "var(--font-body)",
        fontSize: 14, fontWeight: 600, cursor: "pointer",
      }}>Retry</button>
    </div>
  );

  if (orders.length === 0) return (
    <div className="orders-page">
      <div className="empty-cart">
        <div className="empty-cart-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your order history will appear here once you place an order.</p>
        <Link to="/" className="btn-primary">Start Shopping</Link>
      </div>
    </div>
  );

  return (
    <div style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div style={{ maxWidth: 840, margin: "0 auto", padding: "44px 24px 72px" }}>

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "baseline",
          justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 8,
        }}>
          <div>
            <h1 style={{
              fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 700,
              color: "var(--text-dark)", marginBottom: 4,
            }}>
              My Orders
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-soft)" }}>
              {orders.length} order{orders.length !== 1 ? "s" : ""} placed
            </p>
          </div>
        </div>

        {/* ── Filter Tabs ───────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 6, marginBottom: 28,
          overflowX: "auto", paddingBottom: 2,
          scrollbarWidth: "none",
        }}>
          {FILTERS.map(f => {
            const count = f.key === "all"
              ? orders.length
              : orders.filter(o => o.status === f.key).length;
            if (f.key !== "all" && count === 0) return null;
            const active = filter === f.key;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding: "8px 18px", borderRadius: 100,
                fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500,
                cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                background: active ? "var(--green-500)" : "var(--white)",
                color: active ? "#fff" : "var(--text-mid)",
                border: active ? "none" : "1px solid var(--brown-100)",
                boxShadow: active ? "0 2px 8px rgba(45,138,78,0.25)" : "0 1px 4px rgba(0,0,0,0.05)",
                transition: "all 0.18s",
              }}>
                {f.label}
                {count > 0 && (
                  <span style={{
                    marginLeft: 6, fontSize: 11, fontWeight: 700,
                    background: active ? "rgba(255,255,255,0.25)" : "var(--cream-dark)",
                    color: active ? "#fff" : "var(--text-soft)",
                    padding: "1px 7px", borderRadius: 100,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Empty filtered state ──────────────────────────────────────── */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-soft)", fontSize: 15 }}>
            No {filter} orders yet.
          </div>
        )}

        {/* ── Order Cards ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filtered.map((order, index) => {
            const isOpen    = !!expanded[order.order_id];
            const meta      = STATUS_META[order.status] || STATUS_META.placed;
            const itemCount = order.items?.length || 0;
            const preview   = order.items?.[0]?.product_name || "Order";

            return (
              <div
                key={order.order_id || index}
                style={{
                  background: "var(--white)",
                  borderRadius: 20,
                  overflow: "hidden",
                  border: "1px solid var(--brown-100)",
                  boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
                  transition: "box-shadow 0.22s, transform 0.22s",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.09)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 2px 16px rgba(0,0,0,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* ── Coloured top accent ─────────────────────────────── */}
                <div style={{ height: 5, background: meta.dot, opacity: 0.85 }} />

                {/* ── Main header row ─────────────────────────────────── */}
                <div style={{ padding: "20px 28px 18px", display: "flex", gap: 20, justifyContent: "space-between", flexWrap: "wrap" }}>

                  {/* LEFT — order info */}
                  <div style={{ flex: 1, minWidth: 220 }}>

                    {/* Order ID + timestamp */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "monospace", fontSize: 11, letterSpacing: "0.05em",
                        background: "var(--cream-dark)", color: "var(--text-soft)",
                        padding: "2px 9px", borderRadius: 6, fontWeight: 600,
                      }}>
                        {order.order_id}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--text-soft)" }}>
                        🕐 {formatOrderDate(order.created_at)}
                      </span>
                    </div>

                    {/* Product name preview */}
                    <p style={{
                      fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 700,
                      color: "var(--text-dark)", marginBottom: 10, lineHeight: 1.3,
                    }}>
                      {preview}
                      {itemCount > 1 && (
                        <span style={{
                          fontFamily: "var(--font-body)", fontWeight: 400,
                          color: "var(--text-soft)", fontSize: 13, marginLeft: 6,
                        }}>
                          + {itemCount - 1} more
                        </span>
                      )}
                    </p>

                    {/* Badges row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Status */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 700, padding: "4px 12px",
                        borderRadius: 100, letterSpacing: "0.02em",
                        background: meta.bg, color: meta.color,
                        border: `1px solid ${meta.border}`,
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: meta.dot, display: "inline-block", flexShrink: 0,
                        }} />
                        {meta.label}
                      </span>

                      {/* Payment */}
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        fontSize: 11, fontWeight: 500, padding: "4px 12px",
                        borderRadius: 100,
                        background: "var(--cream-dark)", color: "var(--text-mid)",
                        border: "1px solid var(--brown-100)",
                      }}>
                        {PAYMENT_ICON[order.payment_method]}
                        {PAYMENT_LABEL[order.payment_method] || order.payment_method}
                      </span>

                      {/* Item count */}
                      <span style={{
                        fontSize: 11, fontWeight: 500, padding: "4px 12px",
                        borderRadius: 100,
                        background: "var(--green-50)", color: "var(--green-600)",
                        border: "1px solid var(--green-100)",
                      }}>
                        {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  {/* RIGHT — total + button */}
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: "flex-end", justifyContent: "space-between",
                    gap: 12, flexShrink: 0,
                  }}>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: 11, color: "var(--text-soft)", marginBottom: 3, fontWeight: 500 }}>Order Total</p>
                      <p style={{
                        fontFamily: "var(--font-display)", fontSize: 26,
                        fontWeight: 700, color: "var(--green-600)", lineHeight: 1,
                      }}>
                        ₹{Number(order.grand_total || 0).toFixed(2)}
                      </p>
                    </div>

                    <button
                      onClick={() => toggleExpand(order.order_id)}
                      style={{
                        background: isOpen ? "var(--green-500)" : "var(--white)",
                        color: isOpen ? "#fff" : "var(--green-600)",
                        border: "1.5px solid var(--green-400)",
                        borderRadius: 100, padding: "8px 20px",
                        fontSize: 13, fontWeight: 600,
                        fontFamily: "var(--font-body)", cursor: "pointer",
                        transition: "all 0.18s", whiteSpace: "nowrap",
                      }}
                    >
                      {isOpen ? "▲ Hide" : "▼ View Details"}
                    </button>
                  </div>
                </div>

                {/* ── Tracking progress bar ───────────────────────────── */}
                <TrackingBar status={order.status} />

                {/* ── Expanded section ────────────────────────────────── */}
                {isOpen && (
                  <div>
                    {/* Items */}
                    <div style={{ padding: "22px 28px", borderTop: "1px solid var(--brown-100)" }}>
                      <p style={{
                        fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                        letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: 14,
                      }}>
                        Items Ordered
                      </p>
                      {(order.items || []).map((item, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "13px 0",
                          borderBottom: i < order.items.length - 1 ? "1px dashed var(--brown-100)" : "none",
                          gap: 12,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                            {/* Icon */}
                            <div style={{
                              width: 44, height: 44, borderRadius: 12,
                              background: "var(--green-50)", border: "1px solid var(--green-100)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 20, flexShrink: 0,
                            }}>
                              🌿
                            </div>
                            <div>
                              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-dark)", marginBottom: 4 }}>
                                {item.product_name}
                              </p>
                              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                {item.weight && (
                                  <span className="nm-weight-badge">{item.weight}</span>
                                )}
                                <span style={{ fontSize: 12, color: "var(--text-soft)", fontWeight: 500 }}>
                                  Qty: {item.quantity}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span style={{
                            fontFamily: "var(--font-display)", fontSize: 17,
                            fontWeight: 700, color: "var(--green-600)", flexShrink: 0,
                          }}>
                            ₹{Number(item.item_total).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer: address + order summary */}
                    <div style={{
                      background: "var(--cream)", borderTop: "1px solid var(--brown-100)",
                      padding: "20px 28px",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 24, alignItems: "start",
                    }}>
                      {/* Delivery address */}
                      <div>
                        <p style={{
                          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: 8,
                        }}>
                          Delivery Address
                        </p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-dark)", marginBottom: 2 }}>
                          {order.name}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-mid)", marginBottom: 1 }}>
                          📞 {order.phone}
                        </p>
                        <p style={{ fontSize: 13, color: "var(--text-soft)", lineHeight: 1.6 }}>
                          📍 {order.address}
                        </p>
                      </div>

                      {/* Price summary box */}
                      <div style={{
                        background: "var(--white)", borderRadius: 14,
                        border: "1px solid var(--brown-100)",
                        padding: "16px 22px", minWidth: 200,
                      }}>
                        <p style={{
                          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.08em", color: "var(--text-soft)", marginBottom: 12,
                        }}>
                          Price Details
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13, color: "var(--text-mid)" }}>
                          <span>Subtotal</span>
                          <span>₹{Number(order.subtotal || order.grand_total || 0).toFixed(2)}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: 13 }}>
                          <span style={{ color: "var(--text-mid)" }}>Delivery</span>
                          <span style={{ color: "var(--green-500)", fontWeight: 700 }}>FREE</span>
                        </div>
                        <div style={{ height: 1, background: "var(--brown-100)", marginBottom: 12 }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-dark)" }}>Total Paid</span>
                          <span style={{
                            fontFamily: "var(--font-display)", fontSize: 20,
                            fontWeight: 700, color: "var(--green-600)",
                          }}>
                            ₹{Number(order.grand_total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}