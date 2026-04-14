import { useEffect, useState } from "react";


function Cart({ onOrderPlaced }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const API_URL = "https://nature-mart-project.onrender.com"

  const loadCart = () => {
    fetch(`${API_URL}/api/cart`)
      .then(res => res.json())
      .then(data => {
        setCart(data);
        setLoading(false);
      })
      .catch(err => console.error("Error:", err));
  };

  useEffect(() => { loadCart(); }, []);

  const increase = (id) => {
    fetch(`${API_URL}/api/cart/increase/${id}`, { method: "PUT" })
      .then(() => loadCart());
  };

  const decrease = (id) => {
    fetch(`${API_URL}/api/cart/decrease/${id}`, { method: "PUT" })
      .then(() => loadCart());
  };

  const removeItem = (id) => {
    fetch(`${API_URL}/api/cart/remove/${id}`, { method: "DELETE" })
      .then(() => loadCart());
  };

  const checkout = () => {
    setPlacing(true);
    fetch(`${API_URL}/api/cart/checkout`, { method: "POST" })
      .then(res => res.json())
      .then(data => {
        setPlacing(false);
        setOrderSuccess(true);
        loadCart();
        if (onOrderPlaced) onOrderPlaced();
        setTimeout(() => setOrderSuccess(false), 3500);
      });
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading your cart…</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1 className="page-title">Your Cart</h1>
        <span className="item-count">{cart.items.length} item{cart.items.length !== 1 ? "s" : ""}</span>
      </div>

      {orderSuccess && (
        <div className="success-banner">
          🎉 Order placed successfully!
        </div>
      )}

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>Add some natural goodness to your cart!</p>
          <a href="/" className="btn-primary">Browse Products</a>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items">
            {cart.items.map(item => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-img">
                  <img
                    src={item.image}
                    alt={item.name}
                  />
                </div>
                <div className="cart-item-info">
                  <h3 className="cart-item-name">{item.name}</h3>
                  <p className="cart-item-price">₹{item.price} each</p>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => decrease(item.id)}>−</button>
                    <span className="qty-value">{item.quantity}</span>
                    <button className="qty-btn" onClick={() => increase(item.id)}>+</button>
                  </div>
                </div>
                <div className="cart-item-right">
                  <p className="cart-item-subtotal">₹{item.subtotal}</p>
                  <button className="btn-remove" onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cart.total}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className="free-tag">Free</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <span>₹{cart.total}</span>
            </div>
            <button
              className={`btn-checkout ${placing ? "btn-loading" : ""}`}
              onClick={checkout}
              disabled={placing}
            >
              {placing ? "Placing Order…" : "Place Order →"}
            </button>
            <p className="secure-note">🔒 Safe & secure checkout</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;