/**
 * Newsletter Component
 * 
 * Newsletter subscription form for capturing user emails.
 * Features:
 * - Email input with validation
 * - Loading states during submission
 * - Success/error feedback messages
 * - Benefits display (tech updates, insights)
 * - Trust indicators (secure, spam-free)
 * - Auto-dismissing messages
 * 
 * @component
 */
import React, { useState } from "react";
import apiService from "../services/api";
import "../styles/Newsletter.css";

const Newsletter = () => {
  /**
   * Form State Management
   */
  // Email address entered by user
  const [email, setEmail] = useState("");
  // Loading indicator during API submission
  const [loading, setLoading] = useState(false);
  // Feedback message for user
  const [message, setMessage] = useState("");
  // Message type: "success" or "error"
  const [messageType, setMessageType] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setMessage("Please enter your email address");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await apiService.subscribeNewsletter(email);
      setMessage(response.message || "Successfully subscribed to newsletter!");
      setMessageType("success");
      setEmail(""); // Clear form
    } catch (error) {
      setMessage(error.message || "Failed to subscribe. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  return (
    <div className="newsletter">
      {/* Newsletter Header with Icon */}
      <div className="newsletter-header">
        <div className="newsletter-icon">
          📧
        </div>
        <h4>Join Our Newsletter</h4>
        <p>Get exclusive insights, updates, and premium content delivered straight to your inbox</p>
      </div>
      
      {/* Newsletter Benefits */}
      <div className="newsletter-benefits">
        <div className="benefit-item">
          <span className="benefit-icon">🚀</span>
          <span>Latest Tech Updates</span>
        </div>
        <div className="benefit-item">
          <span className="benefit-icon">💡</span>
          <span>Exclusive Insights</span>
        </div>
        
      </div>
      
      <form onSubmit={handleSubmit} className="newsletter-form">
        <div className="newsletter-input-group">
          <div className="input-wrapper">
            <span className="input-icon">✉️</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="saphaniox@example.com"
              className="newsletter-input"
              disabled={loading}
              required
            />
          </div>
          <button 
            type="submit" 
            className="newsletter-button"
            disabled={loading}
          >
            <span className="button-icon">
              {loading ? "⏳" : "🚀"}
            </span>
            <span className="button-text">
              {loading ? "Subscribing..." : "Subscribe Now"}
            </span>
          </button>
        </div>
      </form>
      
      {/* Trust Indicators */}
      <div className="newsletter-trust">
        <div className="trust-item">
          <span className="trust-icon">🔒</span>
          <span>100% Secure</span>
        </div>
        
      </div>

      {message && (
        <div className={`newsletter-message ${messageType}`}>
          <span className="message-icon">
            {messageType === "success" ? "✅" : "⚠️"}
          </span>
          <span className="message-text">{message}</span>
        </div>
      )}
    </div>
  );
};

export default Newsletter;