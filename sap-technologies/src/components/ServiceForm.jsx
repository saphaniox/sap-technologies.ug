/**
 * Service Form Component (Admin)
 * 
 * Comprehensive form for creating and editing services in the catalog.
 * 
 * Features:
 * - Create new services or edit existing ones
 * - Service information (title, descriptions, icon, category)
 * - Dynamic features array (add/remove)
 * - Dynamic technologies array (add/remove)
 * - Price configuration (starting price, currency, type)
 * - Delivery time estimate
 * - Status management (active, inactive)
 * - Featured service flag
 * - Image upload with preview
 * - Form validation
 * - Loading states
 * - Success/error alerts
 * 
 * Categories:
 * - Web Development | Mobile Development | IoT Solutions
 * - Graphics Design | Electrical Engineering | Other
 * 
 * Price Types:
 * - fixed | hourly | project-based | custom
 * 
 * Currencies:
 * - USD | EUR | GBP | KES | NGN | UGX
 * 
 * Props:
 * - service: Service object for edit mode (null for create)
 * - onClose: Callback to close form
 * - onSave: Callback after successful save
 * 
 * @component
 */

import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { LoadingButton } from "../utils/alerts.jsx";
import "../styles/AdminForms.css";

const ServiceForm = ({ service, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    icon: "",
    category: "Web Development",
    features: [""],
    technologies: [""],
    price: {
      startingPrice: "",
      currency: "USD",
      priceType: "project-based"
    },
    deliveryTime: "",
    status: "active",
    featured: false,
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    console.log("📋 ServiceForm mounted/updated with service:", service);
    if (service) {
      console.log("✏️ Editing existing service:", service.title);
      console.log("Service data structure:", {
        hasTechnologies: !!service.technologies,
        hasFeatures: !!service.features,
        technologiesType: typeof service.technologies,
        featuresType: typeof service.features
      });
      
      // Handle technologies - convert from objects to strings for form
      let processedTechnologies = [""];
      if (service.technologies && Array.isArray(service.technologies) && service.technologies.length > 0) {
        processedTechnologies = service.technologies.map(tech => 
          typeof tech === "string" ? tech : (tech?.name || "")
        );
      }
      
      // Handle features - ensure they're strings
      let processedFeatures = [""];
      if (service.features && Array.isArray(service.features) && service.features.length > 0) {
        processedFeatures = service.features.map(feature => 
          typeof feature === "string" ? feature : (feature?.title || feature || "")
        );
      }

      setFormData({
        title: service.title || "",
        description: service.description || "",
        longDescription: service.longDescription || "",
        icon: service.icon || "",
        category: service.category || "Web Development",
        deliveryTime: service.deliveryTime || "",
        status: service.status || "active",
        featured: typeof service.featured === 'boolean' ? service.featured : false,
        features: processedFeatures,
        technologies: processedTechnologies,
        price: service.price && typeof service.price === 'object' ? {
          startingPrice: service.price.startingPrice || "",
          currency: service.price.currency || "USD",
          priceType: service.price.priceType || "project-based"
        } : {
          startingPrice: "",
          currency: "USD",
          priceType: "project-based"
        },
        image: null
      });
      
      if (service.image) {
        // Convert relative path to full URL for existing image
        const imageUrl = service.image.startsWith("http") ? service.image : `${apiService.baseURL}${service.image}`;
        setImagePreview(imageUrl);
      }
      console.log("✅ Form data populated", { 
        features: processedFeatures, 
        technologies: processedTechnologies 
      });
    } else {
      console.log("➕ Creating new service");
    }
  }, [service]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent] && typeof prev[parent] === 'object' ? prev[parent] : {}),
          [child]: type === "checkbox" ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value
      }));
    }
  };

  const handleArrayChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => i === index ? value : item)
    }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };

  const removeArrayItem = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });
    try {
      const submitData = new FormData();
      
      console.log("📋 Form data to submit:", formData);
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === "image" && formData[key] instanceof File) {
          submitData.append("image", formData[key]);
          console.log("  ✅ Added image file");
        } else if (key === "features" || key === "technologies") {
          // Filter out empty strings and ensure all items are strings
          const cleanArray = formData[key]
            .filter(item => item && typeof item === "string" && item.trim())
            .map(item => item.trim());
          submitData.append(key, JSON.stringify(cleanArray));
          console.log(`  ✅ Added ${key}:`, cleanArray);
        } else if (key === "price") {
          // Ensure price object is properly structured
          const priceData = formData[key] && typeof formData[key] === 'object' ? {
            startingPrice: formData[key].startingPrice || "",
            currency: formData[key].currency || "USD",
            priceType: formData[key].priceType || "project-based"
          } : {
            startingPrice: "",
            currency: "USD",
            priceType: "project-based"
          };
          submitData.append(key, JSON.stringify(priceData));
          console.log("  ✅ Added price:", priceData);
        } else if (key !== "image") {
          const value = formData[key];
          if (value !== null && value !== undefined) {
            submitData.append(key, value);
            console.log(`  ✅ Added ${key}:`, value);
          }
        }
      });
      
      console.log("📤 Submitting service data...");
      if (service?._id) {
        await apiService.updateService(service._id, submitData);
      } else {
        await apiService.createService(submitData);
      }
      setAlert({ type: "success", message: service ? "Service updated successfully!" : "Service created successfully!" });
      setTimeout(() => setAlert({ type: "", message: "" }), 3000);
      onSave();
    } catch (error) {
      console.error("Service form error:", error);
      
      // Handle authentication errors
      if (error.message === "Authentication required") {
        setAlert({ 
          type: "error", 
          message: "Your session has expired. Please log in again." 
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        setAlert({ 
          type: "error", 
          message: error.response?.data?.message || "Failed to save service" 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal" onClick={(e) => {
      // Close modal if clicking on backdrop
      if (e.target.className === "form-modal") {
        onClose();
      }
    }}>
      <div className="form-content">
        <div className="form-header">
          <h2>{service ? "Edit Service" : "Add New Service"}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {alert.message && (
          <div className={`alert alert-${alert.type}`} style={{
            padding: "1rem",
            margin: "1rem",
            borderRadius: "8px",
            backgroundColor: alert.type === "error" ? "#fee" : "#efe",
            color: alert.type === "error" ? "#c00" : "#060",
            border: `1px solid ${alert.type === "error" ? "#fcc" : "#cfc"}`
          }}>
            {alert.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Service Title * (2-100 characters)</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength="100"
                placeholder="e.g., Web Development"
              />
              <small className="char-count">{formData.title?.length || 0}/100 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="IoT Solutions">IoT Solutions</option>
                <option value="Graphics Design">Graphics Design</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Architecture">Architecture</option>
                <option value="Software Engineering">Software Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="icon">Icon (Emoji) * (1-2 characters)</label>
              <input
                type="text"
                id="icon"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                required
                placeholder="🌐"
                maxLength="2"
              />
              <small>{formData.icon?.length || 0}/2 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="deliveryTime">Delivery Time (optional, 3-50 characters)</label>
              <input
                type="text"
                id="deliveryTime"
                name="deliveryTime"
                value={formData.deliveryTime}
                onChange={handleInputChange}
                placeholder="e.g., 2-4 weeks"
                maxLength="50"
              />
              <small>{formData.deliveryTime?.length > 0 ? `${formData.deliveryTime.length}/50 characters` : "Optional field"}</small>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Short Description * (10-500 characters)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              rows="3"
              maxLength="500"
              placeholder="Brief description of the service..."
            />
            <small>{formData.description?.length || 0}/500 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="longDescription">Detailed Description (optional, 50-2000 characters)</label>
            <textarea
              id="longDescription"
              name="longDescription"
              value={formData.longDescription}
              onChange={handleInputChange}
              rows="5"
              maxLength="2000"
              placeholder="Detailed description of the service, what's included, process, etc..."
            />
            <small>{formData.longDescription?.length > 0 ? `${formData.longDescription.length}/2000 characters` : "Optional field"}</small>
          </div>

          <div className="form-group">
            <label>Features</label>
            {formData.features.map((feature, index) => (
              <div key={index} className="array-input">
                <input
                  type="text"
                  value={feature || ""}
                  onChange={(e) => handleArrayChange("features", index, e.target.value)}
                  placeholder={`Feature ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("features", index)}
                  className="btn-remove"
                  disabled={formData.features?.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem("features")}
              className="btn-add"
            >
              + Add Feature
            </button>
          </div>

          <div className="form-group">
            <label>Technologies</label>
            {formData.technologies.map((tech, index) => (
              <div key={index} className="array-input">
                <input
                  type="text"
                  value={tech || ""}
                  onChange={(e) => handleArrayChange("technologies", index, e.target.value)}
                  placeholder={`Technology ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem("technologies", index)}
                  className="btn-remove"
                  disabled={formData.technologies?.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem("technologies")}
              className="btn-add"
            >
              + Add Technology
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price.startingPrice">Starting Price</label>
              <input
                type="number"
                id="price.startingPrice"
                name="price.startingPrice"
                value={formData.price?.startingPrice || ""}
                onChange={handleInputChange}
                min="0"
                placeholder="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="price.currency">Currency</label>
              <select
                id="price.currency"
                name="price.currency"
                value={formData.price?.currency || "USD"}
                onChange={handleInputChange}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="NGN">NGN</option>
                <option value="UGX">UGX</option>
                 <option value="KES">UGX</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price.priceType">Price Type</label>
              <select
                id="price.priceType"
                name="price.priceType"
                value={formData.price?.priceType || "project-based"}
                onChange={handleInputChange}
              >
                <option value="fixed">Fixed</option>
                <option value="hourly">Hourly</option>
                <option value="project-based">Project-based</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleInputChange}
                />
                Featured Service
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="image">Service Image</label>
            <input
              type="file"
              id="image"
              accept="image/*"
              onChange={handleImageChange}
            />
            {imagePreview && (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <LoadingButton
              type="submit"
              loading={loading}
              className="btn-primary"
            >
              {service ? "Update Service" : "Create Service"}
            </LoadingButton>
          </div>
          {alert.message && (
            <div className={`inline-alert ${alert.type}`}>{alert.message}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ServiceForm;
