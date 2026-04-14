import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "https://nature-mart-project.onrender.com";

function Checkout({ cart, onOrderPlaced }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [details, setDetails] = useState({ name: "", phone: "", address: "" });
  const [payMethod, setPayMethod] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState({});

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("nm_token")}`,
  });

  const validate = () => {
    const e = {};
    if (!details.name.trim())            e.name    = "Name is required";
    if (!/^[6-9]\d{9}$/.test(details.phone)) e.phone = "Enter a valid 10-digit number";
    if (!details.address.trim())         e.address = "Address is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validate()) return;
    setStep((s) => s + 1);
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const res = await fetch(`${API_URL}/api/cart/checkout`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          name:           details.name,
          phone:          details.phone,
          address:        details.address,
          payment_method: payMethod,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (onOrderPlaced) onOrderPlaced();
        navigate("/orders");
      } else {
        alert(data.message || "Something went wrong");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  const stepLabels = ["Delivery", "Payment", "Review"];

  return (
    <div className="checkout-page">

      {/* Stepper */}
      <div className="stepper">
        {stepLabels.map((label, i) => (
          <div className="stepper-item" key={i}>
            <div className={`stepper-circle ${step > i + 1 ? "done" : step === i + 1 ? "active" : ""}`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className="stepper-label">{label}</span>
            {i < stepLabels.length - 1 && (
              <div className={`stepper-line ${step > i + 1 ? "done" : ""}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 — Delivery */}
      {step === 1 && (
        <div className="checkout-card">
          <h2 className="checkout-section-title">Delivery details</h2>

          <div className="field">
            <label>Full name</label>
            <input
              type="text"
              placeholder="Ravi Shah"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="field">
            <label>Phone number</label>
            <input
              type="tel"
              placeholder="9876543210"
              value={details.phone}
              onChange={(e) => setDetails({ ...details, phone: e.target.value })}
            />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </div>

          <div className="field">
            <label>Delivery address</label>
            <textarea
              rows={3}
              placeholder="Flat 12, Green Park, Surat 395001"
              value={details.address}
              onChange={(e) => setDetails({ ...details, address: e.target.value })}
            />
            {errors.address && <span className="field-error">{errors.address}</span>}
          </div>

          <button className="btn-checkout" onClick={handleNext}>
            Continue to payment →
          </button>
        </div>
      )}

      {/* Step 2 — Payment */}
      {step === 2 && (
        <div className="checkout-card">
          <h2 className="checkout-section-title">Payment method</h2>

          <div className="pay-options">
            <button
              className={`pay-btn ${payMethod === "cod" ? "selected" : ""}`}
              onClick={() => setPayMethod("cod")}
            >
              💵 Cash on delivery
            </button>
            <button
              className={`pay-btn ${payMethod === "online" ? "selected" : ""}`}
              onClick={() => setPayMethod("online")}
            >
              💳 Pay online
            </button>
          </div>

          {payMethod === "online" && (
            <div className="gateway-box">
              <p className="gateway-note">
                🔌 Payment gateway coming soon. Use COD for now.
              </p>
              {/* TODO: Drop Razorpay SDK here when ready */}
            </div>
          )}

          {payMethod === "cod" && (
            <div className="cod-note">
              Pay with cash when your order arrives at your door.
            </div>
          )}

          <div className="checkout-actions">
            <button className="btn-back" onClick={() => setStep(1)}>← Back</button>
            <button className="btn-checkout" onClick={handleNext}>
              Review order →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Review */}
      {step === 3 && (
        <div className="checkout-card">
          <h2 className="checkout-section-title">Review your order</h2>

          <div className="review-items">
            {cart.items.map((item) => (
              <div className="review-row" key={item.id}>
                <span>{item.name} ×{item.quantity}</span>
                <span>₹{item.subtotal}</span>
              </div>
            ))}
            <div className="review-row muted">
              <span>Delivery</span>
              <span className="free-tag">Free</span>
            </div>
            <div className="review-row review-total">
              <span>Total</span>
              <span>₹{cart.total}</span>
            </div>
          </div>

          <div className="delivery-summary">
            <div className="ds-row"><span>Name</span><strong>{details.name}</strong></div>
            <div className="ds-row"><span>Phone</span><strong>{details.phone}</strong></div>
            <div className="ds-row"><span>Address</span><strong>{details.address}</strong></div>
            <div className="ds-row"><span>Payment</span>
              <strong>{payMethod === "cod" ? "Cash on delivery" : "Online payment"}</strong>
            </div>
          </div>

          <div className="checkout-actions">
            <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
            <button
              className={`btn-checkout ${placing ? "btn-loading" : ""}`}
              onClick={placeOrder}
              disabled={placing}
            >
              {placing ? "Placing order…" : "Place order →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;