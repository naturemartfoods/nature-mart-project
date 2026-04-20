import React from "react";
import { Link } from "react-router-dom";
import "./Policy.css";

export default function TermsConditions() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <Link to="/" className="policy-back">← Back to Home</Link>
          <h1>📄 Terms & Conditions</h1>
          <p className="policy-date">Last updated: March 2026</p>
        </div>

        <div className="policy-content">
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing and using the Nature Mart website, you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
            <p>Nature Mart is owned and operated by <strong>Gavli Ashvinkumar Shyamrao</strong>, a registered proprietorship business based in Surat, Gujarat, India.</p>
          </section>

          <section>
            <h2>2. Products & Pricing</h2>
            <ul>
              <li>All products listed are subject to availability</li>
              <li>Prices are inclusive of all applicable taxes (GST)</li>
              <li>We reserve the right to change prices without prior notice</li>
              <li>Product images are for reference purposes only; actual product may vary slightly</li>
              <li>All our food products are sourced and sold in compliance with FSSAI regulations</li>
            </ul>
          </section>

          <section>
            <h2>3. Ordering</h2>
            <ul>
              <li>You must be 18 years or older to place an order</li>
              <li>Orders are confirmed only after successful payment or COD acceptance</li>
              <li>We reserve the right to cancel orders in case of stock unavailability</li>
              <li>Order cancellation after dispatch is not permitted</li>
            </ul>
          </section>

          <section>
            <h2>4. Payment</h2>
            <ul>
              <li><strong>Cash on Delivery (COD):</strong> Pay when your order arrives</li>
              <li><strong>UPI:</strong> Instant payment via any UPI app</li>
              <li><strong>Card:</strong> Credit/Debit cards accepted</li>
              <li>All online payments are processed securely</li>
            </ul>
          </section>

          <section>
            <h2>5. User Account</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your account</li>
              <li>You must provide accurate and complete information during registration</li>
              <li>Nature Mart reserves the right to suspend accounts that violate these terms</li>
            </ul>
          </section>

          <section>
            <h2>6. Intellectual Property</h2>
            <p>All content on this website including text, images, logos, and design is the property of Nature Mart and is protected under applicable Indian laws. Unauthorized use is prohibited.</p>
          </section>

          <section>
            <h2>7. Governing Law</h2>
            <p>These Terms shall be governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in <strong>Surat, Gujarat</strong>.</p>
          </section>

          <section>
            <h2>8. Contact</h2>
            <div className="policy-contact-box">
              <p>📧 <strong>support@naturemart.in</strong></p>
              <p>📍 Plot No. 45, Nandanvan Society, Behind Kanteshwar Temple, Katargam, Surat - 395004, Gujarat</p>
              <p>🏛️ GST: 24ATQPG4926Q1Z0 | FSSAI: 20726031002567</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}