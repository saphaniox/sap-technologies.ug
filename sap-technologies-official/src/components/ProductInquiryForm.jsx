import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import apiService from "../services/api";
import "../styles/ProductInquiryForm.css";

const ProductInquiryForm = ({ product, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    quantity: "1",
    preferredContact: "email",
    message: ""
  });
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Pre-fill from authenticated user
  useEffect(() => {
    apiService.getCurrentUser()
      .then((user) => {
        if (user) {
          setLoggedInUser(user);
          setFormData((prev) => ({
            ...prev,
            customerName: user.name || prev.customerName,
            customerEmail: user.email || prev.customerEmail,
            customerPhone: user.phone || prev.customerPhone,
          }));
        }
      })
      .catch(() => {/* not logged in */});
  }, []);

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
    if (!formData.customerName.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!formData.customerEmail) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.customerEmail)) {
      setError("That email address doesn't look right. Please double-check it");
      setLoading(false);
      return;
    }

    if (formData.preferredContact === "phone" && !formData.customerPhone) {
      setError("Please provide a phone number if you'd like us to call you");
      setLoading(false);
      return;
    }

    try {
      const result = await onSubmit({
        productId: product._id,
        ...formData
      });
      
      console.log("Order form - onSubmit result:", result);
      
      setSuccess(true);
      
      // Auto close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      console.error("Order form - submission error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Couldn't send your order. Please try again.";
      console.error("Order form error message:", errorMessage);
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
            <div className="success-icon">OK</div>
            <h2>Order Sent</h2>
            <p>Your order request has been received. We&apos;ll get back to you within 24-48 hours.</p>
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
        <button className="modal-close" onClick={onClose} aria-label="Close">x</button>

        <div className="modal-header">
          <h2>Send Order</h2>
          <p className="product-name">Product: <strong>{product.name}</strong></p>
          {product.price && product.price.type !== "contact-for-price" && product.price.amount && (
            <p className="product-modal-price">
              {product.price.currency} {parseFloat(product.price.amount).toLocaleString("en-US")}
              {product.price.type === "negotiable" && <span className="negotiable-tag"> &middot; Negotiable</span>}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="inquiry-form">
          {loggedInUser && (
            <div className="autofill-badge">
              <span>OK</span>
              <span>Signed in as <strong>{loggedInUser.name}</strong> - details pre-filled</span>
            </div>
          )}

          {error && (
            <div className="error-alert">
              <span className="error-icon">!</span>
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="customerName">
              Your Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g. John Kizito"
              required
              autoFocus={!loggedInUser}
              readOnly={!!loggedInUser?.name}
              className={loggedInUser?.name ? "prefilled" : ""}
            />
          </div>

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
              readOnly={!!loggedInUser?.email}
              className={loggedInUser?.email ? "prefilled" : ""}
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
            <label htmlFor="quantity">
              Quantity / Units Needed <span className="optional">(Optional)</span>
            </label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              placeholder="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="preferredContact">
              Preferred Contact Method <span className="optional">(Optional)</span>
            </label>
            <select
              id="preferredContact"
              name="preferredContact"
              value={formData.preferredContact}
              onChange={handleChange}
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="both">Both</option>
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
                  Sending...
                </>
              ) : (
                <>Send Order</>
              )}
            </button>
          </div>

          <div className="form-footer">
            <p className="privacy-note">Your information is secure and will only be used to respond to your order.</p>
          </div>
        </form>
      </div>
    </div>
  );
};

ProductInquiryForm.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.shape({
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      type: PropTypes.string
    })
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ProductInquiryForm;
