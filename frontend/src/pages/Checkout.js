import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import config from "../config";
import "./Checkout.css";

const STEPS = ["Delivery", "Payment", "Confirm"];

export default function Checkout() {
  const { user, authFetch } = useAuth();       // ✅ authFetch instead of user.token
  const navigate = useNavigate();
  const location = useLocation();
  const { cartItems = [], subtotal = 0, shipping = 0, total = 0 } = location.state || {};

  const [step, setStep] = useState(0);
  const [address, setAddress] = useState({
    full_name: "", phone: "", address_line: "", city: "", state: "", pincode: "",
  });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("");
  const [upiId, setUpiId] = useState("");
  const [card, setCard] = useState({ number: "", name: "", expiry: "", cvv: "" });
  const [processing, setProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [gatewayStep, setGatewayStep] = useState("form");

  useEffect(() => {
    if (!user) navigate("/login");
    if (!cartItems.length) navigate("/cart");
  }, []);

  // ─── Validation ────────────────────────────────────────────────────────────
  const validateAddress = () => {
    const e = {};
    if (!address.full_name.trim()) e.full_name = "Full name is required";
    if (!/^[6-9]\d{9}$/.test(address.phone)) e.phone = "Enter valid 10-digit mobile number";
    if (!address.address_line.trim()) e.address_line = "Address is required";
    if (!address.city.trim()) e.city = "City is required";
    if (!address.state.trim()) e.state = "State is required";
    if (!/^\d{6}$/.test(address.pincode)) e.pincode = "Enter valid 6-digit PIN code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePayment = () => {
    if (!paymentMethod) { setErrors({ payment: "Please select a payment method" }); return false; }
    if (paymentMethod === "upi") {
      if (!/^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        setErrors({ upi: "Enter a valid UPI ID (e.g. name@upi)" }); return false;
      }
    }
    if (paymentMethod === "card") {
      const e = {};
      if (!/^\d{16}$/.test(card.number.replace(/\s/g, ""))) e.cardNumber = "Enter valid 16-digit card number";
      if (!card.name.trim()) e.cardName = "Cardholder name required";
      if (!/^\d{2}\/\d{2}$/.test(card.expiry)) e.cardExpiry = "Enter expiry as MM/YY";
      if (!/^\d{3,4}$/.test(card.cvv)) e.cardCvv = "Enter valid CVV";
      setErrors(e);
      return Object.keys(e).length === 0;
    }
    setErrors({});
    return true;
  };

  // ─── Place Order API ────────────────────────────────────────────────────────
  const placeOrder = async () => {
    setProcessing(true);
    try {
      const res = await authFetch(`${config.API_URL}/api/orders/place`, {  // ✅ fixed: authFetch + correct URL
        method: "POST",
        body: JSON.stringify({
          delivery_address: address,
          payment_method: paymentMethod,
          items: cartItems,
          subtotal,
          shipping,
          total,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setOrderId(data.order_id);
        setOrderPlaced(true);
        setGatewayStep("success");
      } else {
        setGatewayStep("failed");
      }
    } catch {
      setGatewayStep("failed");
    } finally {
      setProcessing(false);
    }
  };

  // ─── Gateway Simulation ─────────────────────────────────────────────────────
  const handleGatewayPayment = () => {
    if (!validatePayment()) return;
    setGatewayStep("processing");
    setTimeout(() => { placeOrder(); }, 2500);
  };

  const handleCOD = async () => {
    setProcessing(true);
    await placeOrder();
  };

  // ─── Formatters ────────────────────────────────────────────────────────────
  const formatCard = (val) => val.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19);
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, "").slice(0, 4);
    return v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
  };

  // ─── Step Navigation ───────────────────────────────────────────────────────
  const handleNextStep = () => {
    if (step === 0 && validateAddress()) setStep(1);
    else if (step === 1 && validatePayment()) setStep(2);
  };

  // ─── Order Success Screen ──────────────────────────────────────────────────
  if (orderPlaced) {
    return (
      <div className="co-success-page">
        <div className="co-success-card">
          <div className="co-success-icon">✅</div>
          <h1>Order Placed!</h1>
          <p>Thank you, <strong>{address.full_name}</strong>!</p>
          <p>Your order <strong>#{orderId}</strong> has been confirmed.</p>
          <div className="co-success-detail">
            <span>📦 Estimated delivery: 3–5 business days</span>
            <span>📍 {address.address_line}, {address.city} - {address.pincode}</span>
            <span>💳 Payment: {paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "upi" ? "UPI" : "Card"}</span>
          </div>
          <div className="co-success-actions">
            <button className="co-btn-primary" onClick={() => navigate("/orders")}>View Orders</button>
            <button className="co-btn-outline" onClick={() => navigate("/")}>Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Gateway Processing Screen ─────────────────────────────────────────────
  if (gatewayStep === "processing") {
    return (
      <div className="co-gateway-page">
        <div className="co-gateway-card">
          <div className="co-spinner" />
          <h2>Processing Payment...</h2>
          <p>Please don't close this window</p>
          <div className="co-gateway-logo">
            {paymentMethod === "upi" ? "📲 Connecting to UPI Gateway" : "🔐 Verifying Card Details"}
          </div>
        </div>
      </div>
    );
  }

  if (gatewayStep === "failed") {
    return (
      <div className="co-gateway-page">
        <div className="co-gateway-card co-failed">
          <div className="co-fail-icon">❌</div>
          <h2>Payment Failed</h2>
          <p>Something went wrong. Please try again.</p>
          <button className="co-btn-primary" onClick={() => { setGatewayStep("form"); setStep(1); }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="co-page">
      {/* Stepper */}
      <div className="co-stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={`co-step ${i <= step ? "co-step-active" : ""} ${i < step ? "co-step-done" : ""}`}>
              <div className="co-step-circle">{i < step ? "✓" : i + 1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`co-step-line ${i < step ? "co-step-line-done" : ""}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="co-layout">
        {/* ── Left Panel ── */}
        <div className="co-main">

          {/* STEP 0: Delivery Address */}
          {step === 0 && (
            <div className="co-section">
              <h2 className="co-section-title">📍 Delivery Address</h2>
              <div className="co-form-grid">
                <div className="co-field co-full">
                  <label>Full Name *</label>
                  <input value={address.full_name} onChange={e => setAddress({ ...address, full_name: e.target.value })} placeholder="Enter your full name" />
                  {errors.full_name && <span className="co-err">{errors.full_name}</span>}
                </div>
                <div className="co-field co-full">
                  <label>Mobile Number *</label>
                  <input value={address.phone} maxLength={10} onChange={e => setAddress({ ...address, phone: e.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile number" />
                  {errors.phone && <span className="co-err">{errors.phone}</span>}
                </div>
                <div className="co-field co-full">
                  <label>Address *</label>
                  <textarea value={address.address_line} onChange={e => setAddress({ ...address, address_line: e.target.value })} placeholder="House No., Street, Area, Landmark" rows={3} />
                  {errors.address_line && <span className="co-err">{errors.address_line}</span>}
                </div>
                <div className="co-field">
                  <label>City *</label>
                  <input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} placeholder="City" />
                  {errors.city && <span className="co-err">{errors.city}</span>}
                </div>
                <div className="co-field">
                  <label>State *</label>
                  <select value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })}>
                    <option value="">Select State</option>
                    {["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir","Ladakh"].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  {errors.state && <span className="co-err">{errors.state}</span>}
                </div>
                <div className="co-field">
                  <label>PIN Code *</label>
                  <input value={address.pincode} maxLength={6} onChange={e => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })} placeholder="6-digit PIN code" />
                  {errors.pincode && <span className="co-err">{errors.pincode}</span>}
                </div>
              </div>
              <button className="co-btn-primary co-next-btn" onClick={handleNextStep}>
                Continue to Payment →
              </button>
            </div>
          )}

          {/* STEP 1: Payment */}
          {step === 1 && (
            <div className="co-section">
              <h2 className="co-section-title">💳 Payment Method</h2>
              {errors.payment && <p className="co-err">{errors.payment}</p>}

              <div className="co-payment-options">
                <div
                  className={`co-pay-card ${paymentMethod === "upi" ? "co-pay-selected" : ""}`}
                  onClick={() => { setPaymentMethod("upi"); setUpiId(""); }}
                >
                  <div className="co-pay-icon co-phonepee">
                    <svg viewBox="0 0 40 40" width="36" height="36"><circle cx="20" cy="20" r="20" fill="#5f259f"/><text x="50%" y="55%" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" dy=".3em">Pe</text></svg>
                  </div>
                  <div className="co-pay-label">
                    <strong>PhonePe / UPI</strong>
                    <span>Pay using any UPI app</span>
                  </div>
                  <div className="co-pay-radio">{paymentMethod === "upi" ? "🔘" : "⚪"}</div>
                </div>

                <div
                  className={`co-pay-card ${paymentMethod === "card" ? "co-pay-selected" : ""}`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <div className="co-pay-icon co-card-icon">💳</div>
                  <div className="co-pay-label">
                    <strong>Credit / Debit Card</strong>
                    <span>Visa, Mastercard, RuPay</span>
                  </div>
                  <div className="co-pay-radio">{paymentMethod === "card" ? "🔘" : "⚪"}</div>
                </div>

                <div
                  className={`co-pay-card ${paymentMethod === "cod" ? "co-pay-selected" : ""}`}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <div className="co-pay-icon co-cod-icon">💵</div>
                  <div className="co-pay-label">
                    <strong>Cash on Delivery</strong>
                    <span>Pay when you receive</span>
                  </div>
                  <div className="co-pay-radio">{paymentMethod === "cod" ? "🔘" : "⚪"}</div>
                </div>
              </div>

              {paymentMethod === "upi" && (
                <div className="co-payment-detail">
                  <h3>Enter UPI ID</h3>
                  <input
                    className="co-upi-input"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="yourname@upi / @okaxis / @ybl"
                  />
                  {errors.upi && <span className="co-err">{errors.upi}</span>}
                  <p className="co-pay-hint">📲 After clicking Pay, confirm payment in your UPI app</p>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="co-payment-detail co-card-form">
                  <h3>Card Details</h3>
                  <div className="co-field co-full">
                    <label>Card Number</label>
                    <input maxLength={19} value={card.number} onChange={e => setCard({ ...card, number: formatCard(e.target.value) })} placeholder="1234 5678 9012 3456" />
                    {errors.cardNumber && <span className="co-err">{errors.cardNumber}</span>}
                  </div>
                  <div className="co-field co-full">
                    <label>Cardholder Name</label>
                    <input value={card.name} onChange={e => setCard({ ...card, name: e.target.value })} placeholder="Name on card" />
                    {errors.cardName && <span className="co-err">{errors.cardName}</span>}
                  </div>
                  <div className="co-field">
                    <label>Expiry (MM/YY)</label>
                    <input maxLength={5} value={card.expiry} onChange={e => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="MM/YY" />
                    {errors.cardExpiry && <span className="co-err">{errors.cardExpiry}</span>}
                  </div>
                  <div className="co-field">
                    <label>CVV</label>
                    <input type="password" maxLength={4} value={card.cvv} onChange={e => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "") })} placeholder="•••" />
                    {errors.cardCvv && <span className="co-err">{errors.cardCvv}</span>}
                  </div>
                  <p className="co-secure-badge">🔒 Your card details are encrypted and secure</p>
                </div>
              )}

              {paymentMethod === "cod" && (
                <div className="co-payment-detail co-cod-note">
                  <p>📦 You'll pay <strong>₹{total.toFixed(2)}</strong> in cash when your order arrives.</p>
                  <p>Please keep exact change ready.</p>
                </div>
              )}

              <div className="co-nav-btns">
                <button className="co-btn-outline" onClick={() => setStep(0)}>← Back</button>
                <button className="co-btn-primary" onClick={handleNextStep}>Review Order →</button>
              </div>
            </div>
          )}

          {/* STEP 2: Confirm */}
          {step === 2 && (
            <div className="co-section">
              <h2 className="co-section-title">✅ Review & Confirm</h2>

              <div className="co-review-block">
                <h3>📍 Delivery Address</h3>
                <p><strong>{address.full_name}</strong> | 📞 {address.phone}</p>
                <p>{address.address_line}</p>
                <p>{address.city}, {address.state} - {address.pincode}</p>
                <button className="co-edit-link" onClick={() => setStep(0)}>Edit</button>
              </div>

              <div className="co-review-block">
                <h3>💳 Payment</h3>
                <p>
                  {paymentMethod === "cod" && "💵 Cash on Delivery"}
                  {paymentMethod === "upi" && `📲 UPI — ${upiId}`}
                  {paymentMethod === "card" && `💳 Card ending in ****${card.number.slice(-4)}`}
                </p>
                <button className="co-edit-link" onClick={() => setStep(1)}>Edit</button>
              </div>

              <div className="co-review-block">
                <h3>🛍 Items ({cartItems.length})</h3>
                {cartItems.map(item => (
                  <div className="co-review-item" key={item.product_id}>
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="co-nav-btns">
                <button className="co-btn-outline" onClick={() => setStep(1)}>← Back</button>
                {paymentMethod === "cod" ? (
                  <button className="co-btn-primary co-confirm-btn" onClick={handleCOD} disabled={processing}>
                    {processing ? "Placing Order..." : "✅ Confirm Order"}
                  </button>
                ) : (
                  <button className="co-btn-pay co-confirm-btn" onClick={handleGatewayPayment} disabled={processing}>
                    {processing ? "Processing..." : `💳 Pay ₹${total.toFixed(2)}`}
                  </button>
                )}
              </div>
              <p className="co-secure-note">🔒 Safe & Secure Payment</p>
            </div>
          )}
        </div>

        {/* ── Right Panel: Price Summary ── */}
        <div className="co-sidebar">
          <h3>Price Summary</h3>
          {cartItems.map(item => (
            <div className="co-sidebar-item" key={item.product_id}>
              <span>{item.name} × {item.quantity}</span>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="co-sidebar-divider" />
          <div className="co-sidebar-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="co-sidebar-row"><span>Shipping</span><span>{shipping === 0 ? <span className="nm-free">FREE</span> : `₹${shipping}`}</span></div>
          <div className="co-sidebar-divider" />
          <div className="co-sidebar-row co-sidebar-total"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
          <p className="co-gst-note">Inclusive of all taxes</p>
        </div>
      </div>
    </div>
  );
}