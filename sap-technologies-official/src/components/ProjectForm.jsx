import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { LoadingButton, showAlert } from "../utils/alerts.jsx";
import { getImageUrl } from "../utils/imageUrl";
import "../styles/AdminForms.css";

const ProjectForm = ({ project, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    longDescription: "",
    category: "Web Application",
    technologies: [""],
    features: [""],
    client: {
      name: "",
      company: "",
      industry: ""
    },
    status: "completed",
    featured: false,
    startDate: "",
    completionDate: "",
    projectUrl: "",
    repositoryUrl: "",
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [alert, setAlert] = useState({ type: "", message: "" });

  useEffect(() => {
    if (project) {
      // Handle technologies - convert from objects to strings for form
      const processedTechnologies = project.technologies 
        ? project.technologies.map(tech => 
            typeof tech === "string" ? tech : tech.name || ""
          )
        : [""];
      
      // Handle features - convert from objects to strings for form
      const processedFeatures = project.features 
        ? project.features.map(feature => 
            typeof feature === "string" ? feature : feature.title || feature
          )
        : [""];

      setFormData({
        title: project.title || "",
        description: project.description || "",
        longDescription: project.longDescription || "",
        category: project.category || "Web Application",
        technologies: processedTechnologies.length > 0 ? processedTechnologies : [""],
        features: processedFeatures.length > 0 ? processedFeatures : [""],
        client: project.client || { name: "", company: "", industry: "" },
        status: project.status || "completed",
        featured: project.featured || false,
        startDate: project.startDate ? new Date(project.startDate).toISOString().split("T")[0] : "",
        completionDate: project.completionDate ? new Date(project.completionDate).toISOString().split("T")[0] : "",
        projectUrl: project.projectUrl || "",
        repositoryUrl: project.repositoryUrl || "",
        images: []
      });
      if (project.images && project.images.length > 0) {
        // Store original image paths
        // Convert relative paths to full URLs for existing images
        const imageUrls = project.images.map(img => ({
          url: getImageUrl(img),
          path: img,
          isExisting: true
        }));
        setImagePreviews(imageUrls);
      } else {
        setImagePreviews([]);
      }
      setImagesToDelete([]);
      setNewImageFiles([]);
    }
  }, [project]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
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

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    const maxImageSize = 20 * 1024 * 1024;

    if (imagePreviews.length + files.length > maxImages) {
      showAlert.error(
        "Too many images",
        `You can upload up to ${maxImages} images. Remove some before adding more.`
      );
      e.target.value = '';
      return;
    }

    for (const file of files) {
      if (!file.type?.startsWith("image/")) {
        showAlert.error("Wrong file type", `"${file.name}" is not an image file.`);
        e.target.value = '';
        return;
      }

      if (file.size > maxImageSize) {
        showAlert.error("Image too large", `"${file.name}" is over the 20MB upload limit.`);
        e.target.value = '';
        return;
      }
    }

    if (files.length > 0) {
      // Add new files to existing array
      setNewImageFiles(prev => [...prev, ...files]);
      
      // Generate previews for new images
      files.forEach((file) => {
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
    }
    // Reset file input
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    const imageToRemove = imagePreviews[index];
    
    if (imageToRemove.isExisting) {
      // Mark existing image for deletion
      setImagesToDelete(prev => [...prev, imageToRemove.path]);
    } else {
      // Remove from new files array
      const fileIndex = newImageFiles.findIndex(f => f === imageToRemove.file);
      if (fileIndex !== -1) {
        setNewImageFiles(prev => prev.filter((_, i) => i !== fileIndex));
      }
    }
    
    // Remove from previews
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ type: "", message: "" });

    try {
      const submitData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === "images") {
          // Add new image files
          newImageFiles.forEach(file => {
            submitData.append("images", file);
          });
        } else if (key === "technologies" || key === "features") {
          // Filter out empty strings and ensure all items are strings
          const cleanArray = formData[key]
            .filter(item => item && typeof item === "string" && item.trim())
            .map(item => item.trim());
          submitData.append(key, JSON.stringify(cleanArray));
        } else if (key === "client") {
          submitData.append(key, JSON.stringify(formData[key]));
        } else if (key !== "images") {
          submitData.append(key, formData[key]);
        }
      });

      // Add images to delete
      if (imagesToDelete.length > 0) {
        submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      let response;
      if (project?._id) {
        response = await apiService.updateProject(project._id, submitData);
      } else {
        response = await apiService.createProject(submitData);
      }

      const successMessage = project ? "Project updated successfully." : "Project created successfully.";
      setAlert({ 
        type: "success", 
        message: successMessage
      });
      if (onSave) onSave(response?.data?.project || null);
      onClose();
      showAlert.success(project ? "Project updated" : "Project created", successMessage);
      setAlert({ type: "", message: "" });
      
    } catch (error) {
      console.error("Project form error:", error);
      const message = error.response?.data?.message || error.message || "Failed to save project";
      setAlert({ 
        type: "error", 
        message
      });
      await showAlert.error("Couldn't save project", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-modal">
      <div className="form-content">
        <div className="form-header">
          <h2>{project ? "Edit Project" : "Add New Project"}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Project Title * (2-100 characters)</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., E-commerce Platform"
                maxLength="100"
              />
              <small>{formData.title.length}/100 characters</small>
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
                <option value="E-commerce Platform">E-commerce Platform</option>
                <option value="Learning Management System">Learning Management System</option>
                <option value="Mobile Application">Mobile Application</option>
                <option value="IoT Solution">IoT Solution</option>
                <option value="Web Application">Web Application</option>
                <option value="Portfolio Website">Portfolio Website</option>
                <option value="Business Platform">Business Platform</option>
                <option value="Graphics Design">Graphics Design</option>
                <option value="Electrical Project">Electrical Project</option>
                <option value="Other">Other</option>
              </select>
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
              placeholder="Brief description of the project..."
            />
            <small>{formData.description.length}/500 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="longDescription">Detailed Description (optional, 50-5000 characters)</label>
            <textarea
              id="longDescription"
              name="longDescription"
              value={formData.longDescription}
              onChange={handleInputChange}
              rows="5"
              maxLength="5000"
              placeholder="Detailed description of the project, challenges solved, approach taken, etc..."
            />
            <small>{formData.longDescription.length > 0 ? `${formData.longDescription.length}/5000 characters` : "Optional field"}</small>
          </div>

          <div className="form-group">
            <label>Technologies (optional)</label>
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
                  disabled={formData.technologies.length === 1}
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

          <div className="form-group">
            <label>Key Features (optional)</label>
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
                  disabled={formData.features.length === 1}
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

          <fieldset className="client-fieldset">
            <legend>Client Information</legend>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="client.name">Client Name (optional, 2-50 characters)</label>
                <input
                  type="text"
                  id="client.name"
                  name="client.name"
                  value={formData.client?.name || ""}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  maxLength="50"
                />
                <small>{(formData.client?.name || "").length > 0 ? `${(formData.client?.name || "").length}/50 characters` : "Optional field"}</small>
              </div>

              <div className="form-group">
                <label htmlFor="client.company">Company (optional, 2-100 characters)</label>
                <input
                  type="text"
                  id="client.company"
                  name="client.company"
                  value={formData.client?.company || ""}
                  onChange={handleInputChange}
                  placeholder="ABC Corp"
                  maxLength="100"
                />
                <small>{(formData.client?.company || "").length > 0 ? `${(formData.client?.company || "").length}/100 characters` : "Optional field"}</small>
              </div>

              <div className="form-group">
                <label htmlFor="client.industry">Industry (optional, 2-50 characters)</label>
                <input
                  type="text"
                  id="client.industry"
                  name="client.industry"
                  value={formData.client?.industry || ""}
                  onChange={handleInputChange}
                  placeholder="Technology"
                  maxLength="50"
                />
                <small>{(formData.client?.industry || "").length > 0 ? `${(formData.client?.industry || "").length}/50 characters` : "Optional field"}</small>
              </div>
            </div>
          </fieldset>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date (optional)</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="completionDate">Completion Date (optional)</label>
              <input
                type="date"
                id="completionDate"
                name="completionDate"
                value={formData.completionDate}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="projectUrl">Live Project URL (optional, 5-200 characters)</label>
              <input
                type="url"
                id="projectUrl"
                name="projectUrl"
                value={formData.projectUrl}
                onChange={handleInputChange}
                placeholder="https://example.com"
                maxLength="200"
              />
              <small>{formData.projectUrl.length > 0 ? `${formData.projectUrl.length}/200 characters` : "Optional field"}</small>
            </div>

            <div className="form-group">
              <label htmlFor="repositoryUrl">Repository URL (optional, 5-200 characters)</label>
              <input
                type="url"
                id="repositoryUrl"
                name="repositoryUrl"
                value={formData.repositoryUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/username/repo"
                maxLength="200"
              />
              <small>{formData.repositoryUrl.length > 0 ? `${formData.repositoryUrl.length}/200 characters` : "Optional field"}</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="status">Status <span className="form-optional">(optional)</span></label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
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
                Featured Project
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="images">Project Images (Max 5) <span className="form-optional">(optional)</span></label>
            <div className="image-upload-controls">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImagesChange}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('images').click()}
                className="btn-add-image"
                title="Add images"
                disabled={imagePreviews.length >= 5}
              >
                <i className="fas fa-plus"></i> Add Images
              </button>
              {imagePreviews.length >= 5 && (
                <small style={{ marginLeft: '10px', color: '#999' }}>Maximum 5 images reached</small>
              )}
            </div>
            {imagePreviews.length > 0 && (
              <div className="images-preview">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview">
                    <img src={preview.url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="btn-remove-image"
                      title="Remove image"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                    {preview.isExisting && (
                      <span className="image-badge">Existing</span>
                    )}
                  </div>
                ))}
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
              {project ? "Update Project" : "Create Project"}
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

export default ProjectForm;
