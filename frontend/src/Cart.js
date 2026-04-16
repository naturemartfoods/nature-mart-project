import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import config from "./config";
import "./App.css";

export default function Cart({ onOrderPlaced, updateCartCount }) {
  const { user, authFetch } = useAuth();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ✅ Helper to safely get product id from item
  const getProductId = (item) => item.product_id ?? item.id;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    setError("");
    try {
      const res = await authFetch(`${config.API_URL}/api/cart`);

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      if (!res.ok) {
        let errMsg = `Error ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {}
        setError(`Failed to load cart: ${errMsg}`);
        setLoading(false);
        return;
      }

      const data = await res.json();
      console.log("✅ Cart data received:", data);

      const items = data.items || data || [];
      setCartItems(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Cart fetch exception:", err);
      setError("Failed to load cart. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (productId, newQty) => {
    // ✅ Guard against undefined
    if (!productId) {
      console.error("❌ productId is undefined!");
      return;
    }

    if (newQty < 1) return removeItem(productId);

    const currentItem = cartItems.find(
      (i) => getProductId(i) === productId
    );
    if (!currentItem) return;

    const isIncreasing = newQty > currentItem.quantity;
    const endpoint = isIncreasing
      ? `${config.API_URL}/api/cart/increase/${productId}`
      : `${config.API_URL}/api/cart/decrease/${productId}`;

    try {
      const res = await authFetch(endpoint, { method: "PUT" });

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      if (!res.ok) {
        console.error("Update qty failed:", res.status);
        return;
      }
      await fetchCart();
      if (updateCartCount) updateCartCount();
    } catch (err) {
      console.error("Update qty error:", err);
    }
  };

  const removeItem = async (productId) => {
    // ✅ Guard against undefined
    if (!productId) {
      console.error("❌ productId is undefined!");
      return;
    }

    try {
      const res = await authFetch(
        `${config.API_URL}/api/cart/remove/${productId}`,
        { method: "DELETE" }
      );

      if (res.status === 401) {
        navigate("/login");
        return;
      }

      if (!res.ok) {
        console.error("Remove item failed:", res.status);
        return;
      }
      await fetchCart();
      if (updateCartCount) updateCartCount();
    } catch (err) {
      console.error("Remove item error:", err);
    }
  };

  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 499 ? 0 : 49;
  const total = subtotal + shipping;

  const handlePlaceOrder = () => {
    if (onOrderPlaced) onOrderPlaced();
    navigate("/checkout", { state: { cartItems, subtotal, shipping, total } });
  };

  if (loading) return <div className="nm-loading">Loading cart...</div>;

  return (
    <div className="nm-cart-page">
      <div className="nm-cart-header">
        <h1>🛒 Your Cart</h1>
        <span className="nm-cart-count">
          {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="nm-error" style={{ padding: "12px", marginBottom: "16px" }}>
          ⚠️ {error}
          <button onClick={fetchCart} style={{ marginLeft: "12px", cursor: "pointer" }}>
            Retry
          </button>
        </div>
      )}

      {cartItems.length === 0 && !error ? (
        <div className="nm-empty-cart">
          <div className="nm-empty-icon">🌿</div>
          <h2>Your cart is empty</h2>
          <p>Explore our natural products and add something you love!</p>
          <button className="nm-btn-primary" onClick={() => navigate("/")}>
            Shop Now
          </button>
        </div>
      ) : (
        <div className="nm-cart-layout">
          <div className="nm-cart-items">
            {cartItems.map((item) => {
              const pid = getProductId(item); // ✅ safe product id
              return (
                <div className="nm-cart-card" key={pid}>
                  <img
                    src={
                      item.image
                        ? item.image.startsWith("http")
                          ? item.image
                          : `${config.API_URL}${item.image}`
                        : "/placeholder.png"
                    }
                    alt={item.name}
                    className="nm-cart-img"
                    onError={(e) => (e.target.src = "/placeholder.png")}
                  />
                  <div className="nm-cart-info">
                    <h3>{item.name}</h3>
                    <p className="nm-cart-price">₹{Number(item.price).toFixed(2)}</p>
                  </div>
                  <div className="nm-cart-actions">
                    <div className="nm-qty-control">
                      {/* ✅ Use pid — never undefined */}
                      <button onClick={() => updateQty(pid, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQty(pid, item.quantity + 1)}>+</button>
                    </div>
                    <p className="nm-item-total">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      className="nm-remove-btn"
                      onClick={() => removeItem(pid)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="nm-cart-summary">
            <h2>Order Summary</h2>
            <div className="nm-summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="nm-summary-row">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? (
                  <span className="nm-free">FREE</span>
                ) : (
                  `₹${shipping}`
                )}
              </span>
            </div>
            {shipping > 0 && (
              <p className="nm-free-ship-note">
                Add ₹{(499 - subtotal).toFixed(2)} more for free shipping
              </p>
            )}
            <div className="nm-summary-divider" />
            <div className="nm-summary-row nm-summary-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button className="nm-place-order-btn" onClick={handlePlaceOrder}>
              Place Order →
            </button>
            <p className="nm-secure-note">🔒 Secure Checkout</p>
          </div>
        </div>
      )}
    </div>
  );
}