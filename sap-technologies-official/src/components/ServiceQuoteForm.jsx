import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/ServiceQuoteForm.css";

const ServiceQuoteForm = ({ service, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    serviceId: service?.id || service?._id || "",
    serviceName: service?.title || "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    companyName: "",
    preferredContact: "email",
    projectDetails: "",
    budget: "",
    timeline: ""
  });

  // Update form data when service prop changes
  useEffect(() => {
    if (service && (service.id || service._id)) {
      console.log(" ServiceQuoteForm - Updating form with service:", {
        serviceId: service.id || service._id,
        serviceName: service.title
      });
      setFormData(prev => ({
        ...prev,
        serviceId: service.id || service._id,
        serviceName: service.title || ""
      }));
    }
  }, [service]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const budgetOptions = [
    { value: "", label: "Select Budget Range" },
    { value: "< $5,000", label: "Less than $5,000" },
    { value: "$5,000 - $10,000", label: "$5,000 - $10,000" },
    { value: "$10,000 - $25,000", label: "$10,000 - $25,000" },
    { value: "$25,000 - $50,000", label: "$25,000 - $50,000" },
    { value: "> $50,000", label: "More than $50,000" },
    { value: "Not sure", label: "Not Sure Yet" }
  ];

  const timelineOptions = [
    { value: "", label: "Select Timeline" },
    { value: "ASAP", label: "ASAP (Urgent)" },
    { value: "1-2 weeks", label: "1-2 Weeks" },
    { value: "1 month", label: "1 Month" },
    { value: "2-3 months", label: "2-3 Months" },
    { value: "3+ months", label: "3+ Months" },
    { value: "Flexible", label: "Flexible" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Name is required";
    }

    if (!formData.customerEmail.trim()) {
      newErrors.customerEmail = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.customerEmail)) {
      newErrors.customerEmail = "Email is invalid";
    }

    if (formData.preferredContact === "phone" && !formData.customerPhone.trim()) {
      newErrors.customerPhone = "Phone is required when phone contact is preferred";
    }

    if (formData.projectDetails.length > 2000) {
      newErrors.projectDetails = "Project details must be less than 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Validate serviceId exists
    if (!formData.serviceId) {
      setErrors(prev => ({ ...prev, general: "Service information is missing. Please try again." }));
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("ServiceQuoteForm - Form data before submission:", {
        serviceId: formData.serviceId,
        serviceName: formData.serviceName,
        customerEmail: formData.customerEmail
      });

      const quoteData = {
        serviceId: formData.serviceId,
        serviceName: formData.serviceName,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone || undefined,
        companyName: formData.companyName || undefined,
        preferredContact: formData.preferredContact,
        projectDetails: formData.projectDetails || undefined,
        budget: formData.budget || undefined,
        timeline: formData.timeline || undefined
      };

      const response = await onSubmit(quoteData);
      console.log(" Quote request submitted successfully:", response);

      // Show success alert notification
      showAlert.success("Quote request sent! ", "Thanks for reaching out! We'll put together a detailed quote and get it to you within 24-48 hours.");

      // Show success modal briefly then close
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2500);
    } catch (error) {
      console.error(" Error submitting quote request:", error);
      
      // Show error alert notification
      showAlert.error("Quote didn't go through", error.message || "Something went wrong submitting your request. Please try again.");
      
      setErrors({
        submit: error.message || "Failed to submit quote request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 2000 - formData.projectDetails.length;

  if (showSuccess) {
    return (
      <div className="quote-modal-overlay success-notification bottom-aligned" onClick={onClose}>
        <div className="quote-modal success-modal" onClick={(e) => e.stopPropagation()}>
          <div className="success-icon">OK</div>
          <h2>Quote Request Sent! </h2>
          <p>Thanks so much! We'll look over your request and send you a detailed quote within 24-48 hours.</p>
          <button className="close-success-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quote-modal-overlay bottom-aligned" onClick={onClose}>
      <div className="quote-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose} aria-label="Close">x</button>

        <div className="quote-modal-header">
          <h2>Request a Quote</h2>
          <p className="service-name">{service?.name}</p>
        </div>

        <form className="quote-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerName">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                placeholder="sap-tech"
                className={errors.customerName ? "error" : ""}
              />
              {errors.customerName && <span className="error-message">{errors.customerName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="customerEmail">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="customerEmail"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                placeholder="sap@example.com"
                className={errors.customerEmail ? "error" : ""}
              />
              {errors.customerEmail && <span className="error-message">{errors.customerEmail}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="customerPhone">Phone Number <span className="optional">(optional)</span></label>
              <input
                type="tel"
                id="customerPhone"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                placeholder="+256 700 000 000"
                className={errors.customerPhone ? "error" : ""}
              />
              {errors.customerPhone && <span className="error-message">{errors.customerPhone}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="companyName">Company Name <span className="optional">(optional)</span></label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="Your Company or business"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Preferred Contact Method <span className="optional">(optional)</span></label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="preferredContact"
                  value="email"
                  checked={formData.preferredContact === "email"}
                  onChange={handleChange}
                />
                <span>Email</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="preferredContact"
                  value="phone"
                  checked={formData.preferredContact === "phone"}
                  onChange={handleChange}
                />
                <span>Phone</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="preferredContact"
                  value="both"
                  checked={formData.preferredContact === "both"}
                  onChange={handleChange}
                />
                <span>Both</span>
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="budget">Budget Range <span className="optional">(optional)</span></label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
              >
                {budgetOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="timeline">Project Timeline <span className="optional">(optional)</span></label>
              <select
                id="timeline"
                name="timeline"
                value={formData.timeline}
                onChange={handleChange}
              >
                {timelineOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="projectDetails">
              Project Details <span className="optional">(optional)</span>
              <span className="char-counter">
                {remainingChars} characters remaining
              </span>
            </label>
            <textarea
              id="projectDetails"
              name="projectDetails"
              value={formData.projectDetails}
              onChange={handleChange}
              placeholder="Tell us about your project requirements, goals, and any specific features you need..."
              rows="6"
              maxLength="2000"
              className={errors.projectDetails ? "error" : ""}
            />
            {errors.projectDetails && <span className="error-message">{errors.projectDetails}</span>}
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? "Sending..." : "Request Quote"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ServiceQuoteForm.propTypes = {
  service: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default ServiceQuoteForm;
