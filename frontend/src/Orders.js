import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import config from "./config";

function Orders() {
  const { authFetch } = useAuth();              // ✅ use authFetch instead of manual token
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch(`${config.API_URL}/api/orders`)   // ✅ token auto-added
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading your orders…</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <span className="item-count">
          {orders.length} order{orders.length !== 1 ? "s" : ""}
        </span>
      </div>

      {orders.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here.</p>
          <Link to="/" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, index) => (
            <div className="order-card" key={index}>
              <div className="order-card-left">
                <div className="order-index">#{orders.length - index}</div>
                <div className="order-info">
                  <h3 className="order-name">{order.product_name}</h3>
                  <p className="order-qty">Qty: {order.quantity}</p>
                  {order.address && (
                    <p className="order-address">📍 {order.address}</p>
                  )}
                </div>
              </div>
              <div className="order-card-right">
                <span className={`order-status status-${order.status}`}>
                  {order.status === "delivered"
                    ? "✓ Delivered"
                    : order.status === "shipped"
                    ? "🚚 Shipped"
                    : "⏳ Order placed"}
                </span>
                <p className="order-payment">
                  {order.payment_method === "online" ? "💳 Online" : "💵 COD"}
                </p>
                <p className="order-total">₹{order.total}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;