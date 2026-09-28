import { useState } from "react";
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
      setMessage("Please pop in your email address first");
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await apiService.subscribeNewsletter(email);
      setMessage(response.message || "You're subscribed! Welcome to the SAPTech community ");
      setMessageType("success");
      setEmail(""); // Clear form
    } catch (error) {
      setMessage(error.message || "Hmm, something went wrong. Give it another try.");
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
      <div className="newsletter-copy">
        <p className="newsletter-eyebrow">From SAPTech Uganda</p>
        <div className="newsletter-header">
          <h4 id="footer-newsletter-title">Useful technology updates, occasionally.</h4>
          <p>Practical ideas and company news, sent only when we have something worth sharing.</p>
        </div>
        <p className="newsletter-trust">No spam. Unsubscribe whenever you like.</p>
      </div>

      <form onSubmit={handleSubmit} className="newsletter-form" aria-labelledby="footer-newsletter-title">
        <div className="newsletter-input-group">
          <label className="newsletter-sr-only" htmlFor="footer-newsletter-email">Email address</label>
          <input
            id="footer-newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="newsletter-input"
            autoComplete="email"
            disabled={loading}
            required
          />
          <button
            type="submit"
            className="newsletter-button"
            disabled={loading}
          >
            {loading ? "Subscribing..." : "Subscribe"}
          </button>
        </div>
        {message && (
          <p className={`newsletter-message ${messageType}`} role={messageType === "error" ? "alert" : "status"}>
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default Newsletter;
