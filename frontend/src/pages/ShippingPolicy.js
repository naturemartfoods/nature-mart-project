import React from "react";
import { Link } from "react-router-dom";
import "./Policy.css";

export default function ShippingPolicy() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <Link to="/" className="policy-back">← Back to Home</Link>
          <h1>🚚 Shipping Policy</h1>
          <p className="policy-date">Last updated: March 2026</p>
        </div>

        <div className="policy-content">
          <div className="policy-highlight">
            <strong>🌍 We deliver across India!</strong> Fresh organic products packed carefully and delivered to your doorstep.
          </div>

          <section>
            <h2>1. Delivery Areas</h2>
            <p>We currently deliver to all major cities and towns across India. If your PIN code is not serviceable, you will be notified at checkout.</p>
          </section>

          <section>
            <h2>2. Shipping Charges</h2>
            <div className="policy-table">
              <div className="policy-table-row header">
                <span>Order Value</span>
                <span>Shipping Charge</span>
              </div>
              <div className="policy-table-row">
                <span>Below ₹499</span>
                <span>₹49</span>
              </div>
              <div className="policy-table-row highlight-row">
                <span>₹499 and above</span>
                <span>🎉 FREE</span>
              </div>
            </div>
          </section>

          <section>
            <h2>3. Delivery Timeline</h2>
            <ul>
              <li><strong>Surat & nearby areas:</strong> 1–2 business days</li>
              <li><strong>Gujarat:</strong> 2–3 business days</li>
              <li><strong>Rest of India:</strong> 3–5 business days</li>
              <li>Delivery timelines may vary during festivals and holidays</li>
            </ul>
          </section>

          <section>
            <h2>4. Order Processing</h2>
            <ul>
              <li>Orders are processed within <strong>24 hours</strong> of placement</li>
              <li>Orders placed after 5 PM will be processed the next business day</li>
              <li>You will receive an order confirmation on your registered email</li>
            </ul>
          </section>

          <section>
            <h2>5. Packaging</h2>
            <p>All products are carefully packed to maintain freshness and prevent damage during transit. We use eco-friendly packaging materials wherever possible, in line with our commitment to sustainability.</p>
          </section>

          <section>
            <h2>6. Tracking Your Order</h2>
            <p>You can track your order status from the <Link to="/orders" className="policy-link">My Orders</Link> page. For further assistance, contact us at <strong>support@naturemart.in</strong>.</p>
          </section>

          <section>
            <h2>7. Failed Delivery</h2>
            <ul>
              <li>If delivery fails due to wrong address, we will attempt redelivery once</li>
              <li>Ensure someone is available at the delivery address</li>
              <li>For COD orders, please keep exact change ready</li>
            </ul>
          </section>

          <section>
            <h2>8. Contact</h2>
            <div className="policy-contact-box">
              <p>📧 <strong>naturemartfoods@gmail.com</strong></p>
              <p>📍 Plot No. 514, Five Square Point, Opp Anjani Green Party Plot,Jahangirpura, Surat - 395005, Gujarat</p>
              <p>🕐 Mon–Sat: 9:00 AM – 6:00 PM</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}