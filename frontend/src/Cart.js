import { useEffect, useState, useCallback } from "react";
import Checkout from "./pages/Checkout";

function Cart({ onOrderPlaced }) {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [wakingUp, setWakingUp] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  const API_URL = "https://nature-mart-project.onrender.com";

  const authHeaders = () => ({
    "Content-Type": "application/json",
    "Authorization": `Bearer ${localStorage.getItem("nm_token")}`,
  });

  // ✅ Retries up to `retries` times with a delay — handles Render cold start
  const fetchWithRetry = useCallback(async (url, options = {}, retries = 5, delay = 3000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);

        // If server returned a non-OK response (e.g. 503 while waking), wait and retry
        if (!res.ok) {
          if (i === 0) setWakingUp(true);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        const data = await res.json();

        // If response is missing expected fields, retry
        if (data.items === undefined) {
          if (i === 0) setWakingUp(true);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }

        setWakingUp(false);
        return data;

      } catch (err) {
        // Network error (server still asleep), wait and retry
        if (i === 0) setWakingUp(true);
        console.warn(`Attempt ${i + 1} failed:`, err.message);
        await new Promise(r => setTimeout(r, delay));
      }
    }
    throw new Error("Server unavailable after multiple retries.");
  }, []);

  const loadCart = useCallback(async () => {
    try {
      const data = await fetchWithRetry(
        `${API_URL}/api/cart`,
        { headers: authHeaders() }
      );
      setCart({ items: data.items || [], total: data.total || 0 });
    } catch (err) {
      console.error("Could not load cart:", err.message);
      setCart({ items: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }, [fetchWithRetry]);

  useEffect(() => { loadCart(); }, [loadCart]);

  const increase = (id) => {
    fetch(`${API_URL}/api/cart/increase/${id}`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(() => loadCart());
  };

  const decrease = (id) => {
    fetch(`${API_URL}/api/cart/decrease/${id}`, {
      method: "PUT",
      headers: authHeaders(),
    }).then(() => loadCart());
  };

  const removeItem = (id) => {
    fetch(`${API_URL}/api/cart/remove/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    }).then(() => loadCart());
  };

  const checkout = () => {
    setPlacing(true);
    fetch(`${API_URL}/api/cart/checkout`, {
      method: "POST",
      headers: authHeaders(),
    })
      .then((res) => res.json())
      .then(() => {
        setPlacing(false);
        setOrderSuccess(true);
        loadCart();
        if (onOrderPlaced) onOrderPlaced();
        setTimeout(() => setOrderSuccess(false), 3500);
      })
      .catch((err) => {
        console.error("Checkout error:", err);
        setPlacing(false);
      });
  };

  // ✅ Render cold-start loading screen
  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        {wakingUp ? (
          <>
            <p>☕ Server is waking up on Render free tier…</p>
            <p style={{ fontSize: "0.85rem", opacity: 0.6 }}>This takes ~15–30 seconds. Please wait.</p>
          </>
        ) : (
          <p>Loading your cart…</p>
        )}
      </div>
    );
  }

  if (showCheckout) {
    return (
      <Checkout
        cart={cart}
        onOrderPlaced={() => {
          loadCart();
          if (onOrderPlaced) onOrderPlaced();
        }}
      />
    );
  }

  return (
    <div className="cart-page">
      <div className="page-header">
        <h1 className="page-title">Your Cart</h1>
        <span className="item-count">
          {cart.items.length} item{cart.items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {orderSuccess && (
        <div className="success-banner">🎉 Order placed successfully!</div>
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
            {cart.items.map((item) => (
              <div className="cart-item" key={item.id}>
                <div className="cart-item-img">
                  <img src={`${API_URL}${item.image}`} alt={item.name}/>
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
