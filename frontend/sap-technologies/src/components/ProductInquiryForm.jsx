/**
 * Product Inquiry Form Component
 * 
 * Modal form for customers to inquire about specific products.
 * 
 * Features:
 * - Customer email and phone fields
 * - Preferred contact method selection (email, phone, both)
 * - Message/inquiry details textarea
 * - Email validation
 * - Phone validation (when phone is preferred contact)
 * - Loading states
 * - Success/error messaging
 * - Auto-close on success
 * - Form reset after submission
 * - Product reference display
 * 
 * Form Fields:
 * - Customer Email (required, validated)
 * - Customer Phone (required if phone is preferred contact)
 * - Preferred Contact (email, phone, both)
 * - Message (optional, additional inquiry details)
 * 
 * Props:
 * - product: Product object with details
 * - onClose: Callback to close modal
 * - onSubmit: Callback with form data on submission
 * 
 * @component
 */

import { useState } from "react";
import PropTypes from "prop-types";
import "../styles/ProductInquiryForm.css";

const ProductInquiryForm = ({ product, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerEmail: "",
    customerPhone: "",
    preferredContact: "email",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!formData.customerEmail) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.customerEmail)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    if (formData.preferredContact === "phone" && !formData.customerPhone) {
      setError("Phone number is required when selecting phone as preferred contact");
      setLoading(false);
      return;
    }

    try {
      const result = await onSubmit({
        productId: product._id,
        ...formData
      });
      
      console.log("📬 Inquiry form - onSubmit result:", result);
      
      setSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error("📬 Inquiry form - submission error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit inquiry. Please try again.";
      console.error("📬 Error message:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="inquiry-modal-overlay success-notification" onClick={onClose}>
        <div className="inquiry-modal success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-content">
            <div className="success-icon">✅</div>
            <h2>Thank You!</h2>
            <p>Your inquiry has been submitted successfully.</p>
            <p className="success-subtext">We'll get back to you within 24-48 hours.</p>
            <button className="close-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="inquiry-modal-overlay bottom-aligned" onClick={onClose}>
      <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-header">
          <h2>Product Inquiry</h2>
          <p className="product-name">Interested in: <strong>{product.name}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="inquiry-form">
          {error && (
            <div className="error-alert">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customerEmail">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              id="customerEmail"
              name="customerEmail"
              value={formData.customerEmail}
              onChange={handleChange}
              placeholder="saphaniox@example.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerPhone">
              Phone Number <span className="optional">(Optional)</span>
            </label>
            <input
              type="tel"
              id="customerPhone"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleChange}
              placeholder="+256 700 000 000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferredContact">
              Preferred Contact Method
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
            >
              <option value="email">📧 Email</option>
              <option value="phone">📞 Phone</option>
              <option value="both">📱 Both</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">
              Additional Message <span className="optional">(Optional)</span>
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us more about your requirements..."
              rows="4"
              maxLength="1000"
            />
            <div className="char-count">{formData.message.length}/1000 characters</div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                <>
                  📨 Submit Inquiry
                </>
              )}
            </button>
          </div>

          <div className="form-footer">
            <p className="privacy-note">
              🔒 Your information is secure and will only be used to respond to your inquiry.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

ProductInquiryForm.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ProductInquiryForm;
