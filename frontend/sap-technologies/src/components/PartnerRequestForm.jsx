/**
 * Partner Request Form Component
 * 
 * Modal form for companies to submit partnership/sponsorship requests.
 * 
 * Features:
 * - Company information fields (name, email, website, description)
 * - Contact person field
 * - Form validation
 * - Loading states
 * - Success/error messaging
 * - Auto-close on success
 * - Form reset after submission
 * - Modal overlay
 * 
 * Form Fields:
 * - Company Name (required)
 * - Contact Email (required, validated)
 * - Website URL (optional)
 * - Description (required, company/partnership details)
 * - Contact Person (required)
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback to close modal
 * 
 * @component
 */

import { useState } from "react";
import apiService from "../services/api";
import "../styles/PartnerRequestForm.css";

const PartnerRequestForm = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    website: "",
    description: "",
    contactPerson: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiService.baseURL}/api/partnership-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          contactEmail: formData.contactEmail,
          website: formData.website,
          description: formData.description,
          contactPerson: formData.contactPerson
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
          setFormData({
            companyName: "",
            contactEmail: "",
            website: "",
            description: "",
            contactPerson: ""
          });
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit partnership request");
        // Auto-dismiss error after 5 seconds
        setTimeout(() => setError(""), 5000);
      }
    } catch {
      setError("Network error. Please try again.");
      // Auto-dismiss error after 5 seconds
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content partner-request-modal">
        <div className="modal-header">
          <h2>Partnership Request</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {success ? (
          <div className="success-message">
            <div className="success-icon">✓</div>
            <h3>Request Submitted!</h3>
            <p>Thank you for your partnership interest. We"ll review your request and get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="partner-request-form">
            <div className="form-group">
              <label htmlFor="companyName">
                Company Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPerson">
                Contact Person <span className="required">*</span>
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactEmail">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Company Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Partnership Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Tell us about your company and how you'd like to partner with us..."
                rows="4"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PartnerRequestForm;