import { useEffect, useState } from "react";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = "https://your-backend.onrender.com";

  useEffect(() => {
    fetch(`${API_URL}/api/orders`)
      .then(res => res.json())
      .then(data => {
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
        <span className="item-count">{orders.length} order{orders.length !== 1 ? "s" : ""}</span>
      </div>

      {orders.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">📦</div>
          <h3>No orders yet</h3>
          <p>Your order history will appear here.</p>
          <a href="/" className="btn-primary">Start Shopping</a>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order, index) => (
            <div className="order-card" key={index}>
              <div className="order-card-left">
                <div className="order-index">#{orders.length - index}</div>
                <div className="order-info">
                  <h3 className="order-name">{order.name}</h3>
                  <p className="order-qty">Qty: {order.quantity}</p>
                </div>
              </div>
              <div className="order-card-right">
                <span className="order-status">Delivered</span>
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