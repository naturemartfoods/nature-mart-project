import React from "react";
import { Link } from "react-router-dom";
import "./Policy.css";

export default function PrivacyPolicy() {
  return (
    <div className="policy-page">
      <div className="policy-container">
        <div className="policy-header">
          <Link to="/" className="policy-back">← Back to Home</Link>
          <h1>🔒 Privacy Policy</h1>
          <p className="policy-date">Last updated: March 2026</p>
        </div>

        <div className="policy-content">
          <section>
            <h2>1. Introduction</h2>
            <p>Nature Mart ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your data when you use our website <strong>nature-mart-project.onrender.com</strong>.</p>
            <p>We are a registered food retailer under FSSAI (Registration No. <strong>20726031002567</strong>) and GST (No. <strong>24ATQPG4926Q1Z0</strong>), operating from Surat, Gujarat.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <ul>
              <li><strong>Personal Details:</strong> Name, email address, phone number</li>
              <li><strong>Delivery Address:</strong> House number, street, city, state, PIN code</li>
              <li><strong>Order Information:</strong> Products purchased, quantities, payment method</li>
              <li><strong>Account Data:</strong> Login credentials (passwords are encrypted)</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <ul>
              <li>To process and deliver your orders</li>
              <li>To send order confirmation and delivery updates</li>
              <li>To manage your account and profile</li>
              <li>To improve our products and services</li>
              <li>To comply with legal obligations under GST and FSSAI regulations</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal data. All passwords are encrypted and never stored in plain text. We do not sell or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2>5. Cookies</h2>
            <p>Our website uses authentication tokens stored in your browser's local storage to keep you logged in. We do not use tracking cookies for advertising purposes.</p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <ul>
              <li>Access your personal data through your Profile page</li>
              <li>Update or correct your information at any time</li>
              <li>Request deletion of your account by contacting us</li>
            </ul>
          </section>

          <section>
            <h2>7. Contact Us</h2>
            <p>For any privacy-related concerns, contact us at:</p>
            <div className="policy-contact-box">
              <p>📧 <strong>naturemartfoods@gmail.com</strong></p>
              <p>📍 Plot No. 514, Five Square Point, Opp Anjani Green Party Plot,Jahangirpura, Surat - 395005, Gujarat</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}