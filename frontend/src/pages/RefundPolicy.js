import React from "react";
import { Link } from "react-router-dom";
import "./Policy.css";

export default function RefundPolicy() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <Link to="/" className="policy-back">← Back to Home</Link>
          <h1>↩️ Refund & Return Policy</h1>
          <p className="policy-date">Last updated: March 2026</p>
        </div>

        <div className="policy-content">
          <div className="policy-highlight">
            <strong>🌿 Our Promise:</strong> If you are not satisfied with your order, we will make it right. Your satisfaction is our priority.
          </div>

          <section>
            <h2>1. Eligibility for Refund</h2>
            <p>You may request a refund if:</p>
            <ul>
              <li>The product received is damaged or broken</li>
              <li>The product is expired at the time of delivery</li>
              <li>Wrong product was delivered</li>
              <li>Product quality does not match the description</li>
            </ul>
          </section>

          <section>
            <h2>2. Non-Refundable Cases</h2>
            <ul>
              <li>Products that have been opened or used</li>
              <li>Refund requests made after 48 hours of delivery</li>
              <li>Change of mind after delivery</li>
              <li>Products damaged due to improper storage by customer</li>
            </ul>
          </section>

          <section>
            <h2>3. How to Request a Refund</h2>
            <ol>
              <li>Contact us within <strong>48 hours</strong> of receiving your order</li>
              <li>Email us at <strong>support@naturemart.in</strong> with your Order ID</li>
              <li>Attach a photo of the damaged/wrong product</li>
              <li>Our team will review and respond within <strong>2 business days</strong></li>
            </ol>
          </section>

          <section>
            <h2>4. Refund Process</h2>
            <ul>
              <li><strong>COD Orders:</strong> Refund will be transferred via UPI/bank transfer within 5–7 business days</li>
              <li><strong>Online Payment Orders:</strong> Refund will be credited back to the original payment method within 5–7 business days</li>
            </ul>
          </section>

          <section>
            <h2>5. Order Cancellation</h2>
            <ul>
              <li>Orders can be cancelled only before they are dispatched</li>
              <li>To cancel, contact us immediately at <strong>support@naturemart.in</strong></li>
              <li>Once dispatched, cancellation is not possible</li>
            </ul>
          </section>

          <section>
            <h2>6. Contact for Refunds</h2>
            <div className="policy-contact-box">
              <p>📧 <strong>support@naturemart.in</strong></p>
              <p>📍 Plot No. 45, Nandanvan Society, Katargam, Surat - 395004</p>
              <p>🕐 Response Time: Within 2 business days</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}