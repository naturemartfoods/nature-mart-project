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

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchCart();
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await authFetch(`${config.API_URL}/api/cart`);
      const data = await res.json();
      setCartItems(data.items || []);
    } catch {
      setError("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  };

  const updateQty = async (productId, newQty) => {
    if (newQty < 1) return removeItem(productId);

    const currentItem = cartItems.find((i) => i.id === productId);
    if (!currentItem) return;

    const isIncreasing = newQty > currentItem.quantity;
    const endpoint = isIncreasing
      ? `${config.API_URL}/api/cart/increase/${productId}`
      : `${config.API_URL}/api/cart/decrease/${productId}`;
    await authFetch(endpoint, { method: "PUT" });

    await fetchCart();
    if (updateCartCount) updateCartCount();
  };

  const removeItem = async (productId) => {
    await authFetch(`${config.API_URL}/api/cart/remove/${productId}`, {
      method: "DELETE",
    });
    await fetchCart();
    if (updateCartCount) updateCartCount();
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

      {error && <p className="nm-error">{error}</p>}

      {cartItems.length === 0 ? (
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
            {cartItems.map((item) => (
              <div className="nm-cart-card" key={item.id}>
                {/* ✅ FIXED: item.image already contains full URL from backend */}
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
                  <p className="nm-cart-price">₹{item.price.toFixed(2)}</p>
                </div>
                <div className="nm-cart-actions">
                  <div className="nm-qty-control">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <p className="nm-item-total">₹{(item.price * item.quantity).toFixed(2)}</p>
                  <button className="nm-remove-btn" onClick={() => removeItem(item.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>

          <div className="nm-cart-summary">
            <h2>Order Summary</h2>
            <div className="nm-summary-row">
              <span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="nm-summary-row">
              <span>Shipping</span>
              <span>
                {shipping === 0 ? <span className="nm-free">FREE</span> : `₹${shipping}`}
              </span>
            </div>
            {shipping > 0 && (
              <p className="nm-free-ship-note">
                Add ₹{(499 - subtotal).toFixed(2)} more for free shipping
              </p>
            )}
            <div className="nm-summary-divider" />
            <div className="nm-summary-row nm-summary-total">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
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