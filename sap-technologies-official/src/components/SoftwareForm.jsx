import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl } from "../utils/imageUrl";
import { compressImageFiles } from "../utils/mediaCompression";
import "../styles/AdminForms.css";

const SoftwareForm = ({ isOpen, onClose, software, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    links: { web: "", playstore: "", appstore: "", github: "", other: "" },
    category: "General",
    status: "active",
    isPublic: true,
    order: 0,
    features: [""],
    technologies: [""]
  });
  
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  
  useEffect(() => {
    if (software) {
      setFormData({
        name: software.name || "",
        description: software.description || "",
        links: {
          web:       software.links?.web       || software.url || "",
          playstore: software.links?.playstore  || "",
          appstore:  software.links?.appstore   || "",
          github:    software.links?.github     || "",
          other:     software.links?.other      || ""
        },
        category: software.category || "General",
        status: software.status || "active",
        isPublic: software.isPublic !== undefined ? software.isPublic : true,
        order: software.order || 0,
        features: software.features?.length > 0 ? software.features : [""],
        technologies: software.technologies?.length > 0 ? software.technologies : [""]
      });
      
      // Load existing images
      if (software.images && software.images.length > 0) {
        const imageUrls = software.images.map(img => ({
          url: getImageUrl(typeof img === "string" ? img : img.url),
          originalUrl: typeof img === "string" ? img : img.url,
          isExisting: true
        }));
        setImagePreviews(imageUrls);
      } else if (software.image) {
        setImagePreviews([{
          url: getImageUrl(software.image),
          originalUrl: software.image,
          isExisting: true
        }]);
      }
      setImagesToDelete([]);
    } else {
      // Reset for new software
      setFormData({
        name: "",
        description: "",
        links: { web: "", playstore: "", appstore: "", github: "", other: "" },
        category: "General",
        status: "active",
        isPublic: true,
        order: 0,
        features: [""],
        technologies: [""]
      });
      setImagePreviews([]);
      setNewImageFiles([]);
      setImagesToDelete([]);
    }
  }, [software]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    
    if (imagePreviews.length + files.length > maxImages) {
      showAlert.error(
        "Too many images",
        `You can upload up to ${maxImages} images. You currently have ${imagePreviews.length} — please remove some before adding more.`
      );
      e.target.value = "";
      return;
    }
    
    // Validate files before doing browser-side compression.
    for (const file of files) {
      if (file.size > 25 * 1024 * 1024) {
        showAlert.error("Image too large", `"${file.name}" is over the 25MB browser optimization limit. Please use a smaller image.`);
        e.target.value = "";
        return;
      }
      
      if (!file.type.startsWith("image/")) {
        showAlert.error("Wrong file type", `"${file.name}" isn't an image file. Please only upload images.`);
        e.target.value = "";
        return;
      }
    }

    let optimizedFiles;
    try {
      optimizedFiles = await compressImageFiles(files, {
        maxWidth: 1600,
        maxHeight: 1200,
        quality: 0.8
      });
    } catch (error) {
      showAlert.error("Couldn't prepare image", error.message || "Please try another image.");
      e.target.value = "";
      return;
    }

    for (const file of optimizedFiles) {
      if (file.size > 10 * 1024 * 1024) {
        showAlert.error("Image too large", `"${file.name}" is still over the 10MB upload limit after optimization.`);
        e.target.value = "";
        return;
      }
    }
    
    // Add files
    setNewImageFiles(prev => [...prev, ...optimizedFiles]);
    
    // Generate previews
    optimizedFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, {
          url: e.target.result,
          file: file,
          isExisting: false
        }]);
      };
      reader.readAsDataURL(file);
    });
    
    e.target.value = "";
  };
  
  const handleRemoveImage = (index) => {
    const imageToRemove = imagePreviews[index];
    
    if (imageToRemove.isExisting) {
      if (imageToRemove.originalUrl) {
        setImagesToDelete(prev => [...prev, imageToRemove.originalUrl]);
      }
    } else {
      const fileIndex = newImageFiles.findIndex(f => f === imageToRemove.file);
      if (fileIndex !== -1) {
        setNewImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
    }
    
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleArrayFieldChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };
  
  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], ""]
    }));
  };
  
  const removeArrayField = (field, index) => {
    if (formData[field].length > 1) {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const submitData = new FormData();
      
      // Add basic fields
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      // Send links as JSON; also send url (web link) for backward compat
      submitData.append("links", JSON.stringify(formData.links));
      submitData.append("url", formData.links.web || "");
      submitData.append("category", formData.category);
      submitData.append("status", formData.status);
      submitData.append("isPublic", formData.isPublic);
      submitData.append("order", formData.order);
      
      // Add arrays as JSON
      submitData.append("features", JSON.stringify(
        formData.features.filter(f => f.trim())
      ));
      submitData.append("technologies", JSON.stringify(
        formData.technologies.filter(t => t.trim())
      ));
      
      // For updates, keep existing images and append new ones
      if (software) {
        submitData.append("keepExistingImages", "true");
      }

      if (imagesToDelete.length > 0) {
        submitData.append("imagesToDelete", JSON.stringify(imagesToDelete));
      }
      
      // Add new images
      newImageFiles.forEach(file => {
        submitData.append("images", file);
      });
      
      // Determine endpoint
      const endpoint = software
        ? `/api/software/${software._id}`
        : "/api/software";
      const method = software ? "PUT" : "POST";
      
      const response = await apiService.request(endpoint, {
        method: method,
        body: submitData
      });
      
      if (response.status === "success") {
        const savedSoftware = response.data?.software || null;
        onSuccess(savedSoftware);
        onClose();
        showAlert.success(
          "Saved! ✅",
          software ? "Software updated successfully." : "Software added successfully!"
        );
      }
    } catch (error) {
      console.error("Error saving software:", error);
      showAlert.error("Couldn't save", error.message || "Something went wrong saving the software. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content software-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{software ? "Edit Software" : "Add Software"}</h2>
          <button onClick={onClose} className="btn-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Instructions for adding software */}
        <div className="software-form-instructions">
          <div className="instruction-icon">💡</div>
          <div className="instruction-content">
            <strong>How to Add a Web App:</strong>
            <p>Simply provide the web app's URL and optional logo/screenshot - no need to upload .exe files, SDK, or other software files. Users will launch your app directly through their browsers.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="software-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>
            
            <div className="form-group">
              <label>Software Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="e.g., SAP Invoice Generator"
              />
            </div>
            
            <div className="form-group">
              <label>Description <span className="form-optional">(optional)</span></label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                placeholder="Brief description of what this software does..."
              />
            </div>
            
            <div className="form-group">
              <label>Platform Links <span className="form-optional">(optional)</span></label>
              <div className="platform-links-group">
                {[
                  { key: 'web',       icon: '🌐', label: 'Website',    placeholder: 'https://your-app.com' },
                  { key: 'playstore', icon: '📱', label: 'Play Store',  placeholder: 'https://play.google.com/store/apps/...' },
                  { key: 'appstore',  icon: '🍎', label: 'App Store',   placeholder: 'https://apps.apple.com/...' },
                  { key: 'github',    icon: '🐙', label: 'GitHub',      placeholder: 'https://github.com/...' },
                  { key: 'other',     icon: '🔗', label: 'Other',       placeholder: 'https://...' }
                ].map(({ key, icon, label, placeholder }) => (
                  <div key={key} className="platform-link-row">
                    <span className="platform-icon">{icon}</span>
                    <span className="platform-label">{label}</span>
                    <input
                      type="url"
                      value={formData.links[key]}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        links: { ...prev.links, [key]: e.target.value }
                      }))}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
              <small className="form-hint">Add links for each platform where your app is available. Leave unused ones blank.</small>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Category <span className="form-optional">(optional)</span></label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Productivity, Business, etc."
                />
              </div>
              
              <div className="form-group">
                <label>Status <span className="form-optional">(optional)</span></label>
                <select name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="active">Active</option>
                  <option value="beta">Beta</option>
                  <option value="coming-soon">Coming Soon</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Display Order <span className="form-optional">(optional)</span></label>
                <input
                  type="number"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                />
              </div>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleInputChange}
                  />
                  <span>Public (Visible to all users)</span>
                </label>
              </div>
            </div>
          </div>
          
          {/* Images */}
          <div className="form-section">
            <h3>Images <span className="form-optional">(optional)</span></h3>
            
            <div className="form-group">
              <label>Upload Images (Max 5) <span className="form-optional">(optional)</span></label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                disabled={imagePreviews.length >= 5}
              />
              <small>Supported formats: JPG, PNG, GIF (Max 10MB each)</small>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="image-previews">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview.url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="btn-remove-image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                    {index === 0 && <span className="primary-badge">Primary</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Features */}
          <div className="form-section">
            <h3>Features (Optional)</h3>
            {formData.features.map((feature, index) => (
              <div key={index} className="array-field-group">
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleArrayFieldChange("features", index, e.target.value)}
                  placeholder="Feature description"
                />
                {formData.features.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField("features", index)}
                    className="btn-remove-field"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField("features")}
              className="btn-add-field"
            >
              <i className="fas fa-plus"></i> Add Feature
            </button>
          </div>
          
          {/* Technologies */}
          <div className="form-section">
            <h3>Technologies Used (Optional)</h3>
            {formData.technologies.map((tech, index) => (
              <div key={index} className="array-field-group">
                <input
                  type="text"
                  value={tech}
                  onChange={(e) => handleArrayFieldChange("technologies", index, e.target.value)}
                  placeholder="e.g., React, Node.js, MongoDB"
                />
                {formData.technologies.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayField("technologies", index)}
                    className="btn-remove-field"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayField("technologies")}
              className="btn-add-field"
            >
              <i className="fas fa-plus"></i> Add Technology
            </button>
          </div>
          
          {/* Form Actions */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Saving...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> {software ? "Update" : "Create"} Software
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SoftwareForm;
