/**
 * Partner Form Component (Admin)
 * 
 * Modal form for admins to create and edit business partners/sponsors.
 * 
 * Features:
 * - Create new partners or edit existing ones
 * - Partner information (name, website, description)
 * - Logo upload with preview
 * - Active/inactive status toggle
 * - Display order/priority management
 * - Character count limits
 * - Form validation with error messages
 * - Loading states during submission
 * - Image file validation
 * - Logo preview for existing partners
 * 
 * Field Limits:
 * - Name: 100 characters
 * - Description: 500 characters
 * - Logo: Image file (jpg, png, gif, webp)
 * 
 * Props:
 * - isOpen: Boolean to control modal visibility
 * - onClose: Callback to close modal
 * - partner: Partner object for edit mode (null for create)
 * - onSave: Callback after successful save with updated data
 * 
 * @component
 */

import { useState, useEffect } from "react";
import apiService from "../services/api";
import "../styles/PartnerForm.css";

const PartnerForm = ({ isOpen, onClose, partner, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    description: "",
    isActive: true,
    order: 0
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Character limits
  const CHAR_LIMITS = {
    name: 100,
    description: 500
  };

  useEffect(() => {
    if (partner) {
      setFormData({
        name: partner.name || "",
        website: partner.website || "",
        description: partner.description || "",
        isActive: partner.isActive !== undefined ? partner.isActive : true,
        order: partner.order || 0
      });
      setLogoPreview(partner.logo ? `${apiService.baseURL}${partner.logo}` : "");
    } else {
      setFormData({
        name: "",
        website: "",
        description: "",
        isActive: true,
        order: 0
      });
      setLogoPreview("");
    }
    setLogoFile(null);
    setErrors({});
  }, [partner, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({
          ...prev,
          logo: "Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)"
        }));
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          logo: "Image size must be less than 5MB"
        }));
        return;
      }

      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      
      // Clear error
      setErrors(prev => ({
        ...prev,
        logo: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Partner name is required";
    } else if (formData.name.length > CHAR_LIMITS.name) {
      newErrors.name = `Name must be less than ${CHAR_LIMITS.name} characters`;
    }

    if (!partner && !logoFile) {
      newErrors.logo = "Partner logo is required";
    }

    if (formData.description && formData.description.length > CHAR_LIMITS.description) {
      newErrors.description = `Description must be less than ${CHAR_LIMITS.description} characters`;
    }

    if (formData.order < 0) {
      newErrors.order = "Order must be a non-negative number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name.trim());
      formDataToSend.append("website", formData.website.trim());
      formDataToSend.append("description", formData.description.trim());
      formDataToSend.append("isActive", formData.isActive);
      formDataToSend.append("order", formData.order);
      
      if (logoFile) {
        formDataToSend.append("logo", logoFile);
      }

      const url = partner 
        ? `${apiService.baseURL}/api/partners/${partner._id}`
        : `${apiService.baseURL}/api/partners`;
      
      const method = partner ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        body: formDataToSend,
        credentials: "include"
      });

      if (response.ok) {
        const savedPartner = await response.json();
        onSave(savedPartner);
        onClose();
      } else {
        const errorData = await response.json();
        if (errorData.errors) {
          setErrors({ submit: errorData.errors.join(", ") });
        } else {
          setErrors({ submit: errorData.message || "Failed to save partner" });
        }
      }
    } catch (error) {
      console.error("Error saving partner:", error);
      setErrors({ submit: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const getCharacterCount = (field) => {
    const current = formData[field]?.length || 0;
    const limit = CHAR_LIMITS[field];
    return { current, limit, remaining: limit - current };
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content partner-form-modal">
        <div className="modal-header">
          <h2>{partner ? "Edit Partner" : "Add New Partner"}</h2>
          <button 
            type="button" 
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="partner-form">
          <div className="form-group">
            <label htmlFor="name">
              Partner Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={errors.name ? "error" : ""}
              maxLength={CHAR_LIMITS.name}
              required
            />
            <div className="char-count">
              {getCharacterCount("name").current}/{CHAR_LIMITS.name} characters
            </div>
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="logo">
              Partner Logo {!partner && <span className="required">*</span>}
            </label>
            <input
              type="file"
              id="logo"
              accept="image/*"
              onChange={handleLogoChange}
              className={errors.logo ? "error" : ""}
            />
            {logoPreview && (
              <div className="image-preview">
                <img src={logoPreview} alt="Logo preview" />
              </div>
            )}
            <small className="help-text">
              Supported formats: JPEG, PNG, GIF, WebP, SVG (Max 5MB)
            </small>
            {errors.logo && <span className="error-message">{errors.logo}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="website">Website</label>
            <input
              type="text"
              id="website"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="Company website, social media, or any relevant link"
              className={errors.website ? "error" : ""}
            />
            <small className="help-text">
              Optional field - Any website, social media, or contact information
            </small>
            {errors.website && <span className="error-message">{errors.website}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the partnership or company..."
              className={errors.description ? "error" : ""}
              maxLength={CHAR_LIMITS.description}
              rows="4"
            />
            <div className="char-count">
              {getCharacterCount("description").current}/{CHAR_LIMITS.description} characters
              {formData.description.length === 0 && <span className="optional-field"> (Optional field)</span>}
            </div>
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="order">Display Order</label>
            <input
              type="number"
              id="order"
              name="order"
              value={formData.order}
              onChange={handleInputChange}
              min="0"
              className={errors.order ? "error" : ""}
            />
            <small className="help-text">
              Lower numbers appear first (0 = first position)
            </small>
            {errors.order && <span className="error-message">{errors.order}</span>}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
              />
              <span className="checkmark"></span>
              Active Partner
            </label>
            <small className="help-text">
              Only active partners will be displayed on the website
            </small>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">
              {errors.submit}
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
              {loading ? "Saving..." : (partner ? "Update Partner" : "Add Partner")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PartnerForm;