import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl, getOptimizedVideoUrl } from "../utils/imageUrl";
import { compressImageFiles } from "../utils/mediaCompression";
import "../styles/AdminForms.css";

const IOT_CATEGORY_OPTIONS = [
  "Smart Home",
  "Industrial Monitoring",
  "Agriculture",
  "Security",
  "Energy",
  "Education",
  "Health",
  "Automation",
  "General"
];

const IoTForm = ({ isOpen, onClose, project, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "General",
    status: "completed",
    projectUrl: "",
    githubUrl: "",
    videoUrl: "",
    completionDate: "",
    isPublic: true,
    isFeatured: false,
    order: 0,
    technologies: [""],
    hardware: [""],
    features: [""]
  });
  
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);
  const [existingVideos, setExistingVideos] = useState([]);
  const [newVideoFiles, setNewVideoFiles] = useState([]);
  const [videosToDelete, setVideosToDelete] = useState([]);
  
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        category: project.category || "General",
        status: project.status || "completed",
        projectUrl: project.projectUrl || "",
        githubUrl: project.githubUrl || "",
        videoUrl: project.videoUrl || "",
        completionDate: project.completionDate ? project.completionDate.split("T")[0] : "",
        isPublic: project.isPublic !== undefined ? project.isPublic : true,
        isFeatured: project.isFeatured || false,
        order: project.order || 0,
        technologies: project.technologies?.length > 0 ? project.technologies : [""],
        hardware: project.hardware?.length > 0 ? project.hardware : [""],
        features: project.features?.length > 0 ? project.features : [""]
      });
      
      // Load existing images
      if (project.images && project.images.length > 0) {
        const imageUrls = project.images.map(img => ({
          url: getImageUrl(typeof img === "string" ? img : img.url),
          originalUrl: typeof img === "string" ? img : img.url,
          isExisting: true
        }));
        setImagePreviews(imageUrls);
      }

      // Load existing videos
      if (project.videos && project.videos.length > 0) {
        setExistingVideos(project.videos);
      } else {
        setExistingVideos([]);
      }
    } else {
      // Reset for new project
      setFormData({
        title: "",
        description: "",
        category: "General",
        status: "completed",
        projectUrl: "",
        githubUrl: "",
        videoUrl: "",
        completionDate: "",
        isPublic: true,
        isFeatured: false,
        order: 0,
        technologies: [""],
        hardware: [""],
        features: [""]
      });
      setImagePreviews([]);
      setNewImageFiles([]);
      setImagesToDelete([]);
      setExistingVideos([]);
      setNewVideoFiles([]);
      setVideosToDelete([]);
    }
  }, [project]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };
  
  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 10;
    
    if (imagePreviews.length + files.length > maxImages) {
      showAlert.error(
        "Too many images",
        `You can upload up to ${maxImages} images. You currently have ${imagePreviews.length} — please remove some before adding more.`
      );
      e.target.value = "";
      return;
    }
    
    // Validate files
    for (const file of files) {
      if (file.size > 30 * 1024 * 1024) {
        showAlert.error("Image too large", `"${file.name}" is over the 30MB browser optimization limit. Please use a smaller image.`);
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
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.82
      });
    } catch (error) {
      showAlert.error("Couldn't prepare image", error.message || "Please try another image.");
      e.target.value = "";
      return;
    }

    for (const file of optimizedFiles) {
      if (file.size > 20 * 1024 * 1024) {
        showAlert.error("Image too large", `"${file.name}" is still over the 20MB upload limit after optimization.`);
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
      // Track the original URL for server-side deletion
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

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files);
    const maxVideos = 3;

    if (newVideoFiles.length + files.length > maxVideos) {
      showAlert.error("Too many videos", `You can upload up to ${maxVideos} videos. Please remove some first.`);
      e.target.value = "";
      return;
    }

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        showAlert.error("Video too large", `"${file.name}" exceeds the 50MB limit. Please use a smaller video.`);
        e.target.value = "";
        return;
      }
      if (!file.type.startsWith("video/")) {
        showAlert.error("Wrong file type", `"${file.name}" is not a video file. Please only upload videos.`);
        e.target.value = "";
        return;
      }
    }

    setNewVideoFiles(prev => [...prev, ...files]);
    e.target.value = "";
  };

  const handleRemoveNewVideo = (index) => {
    setNewVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingVideo = (videoUrl) => {
    setVideosToDelete(prev => [...prev, videoUrl]);
    setExistingVideos(prev => prev.filter(v => v.url !== videoUrl));
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
    
    const projectTitle = formData.title.trim();

    if (!projectTitle) {
      showAlert.error("Project title needed", "Add a short title first. Everything else can be completed now or later.");
      return;
    }
    
    try {
      setLoading(true);
      
      const submitData = new FormData();
      
      const normalizedFormData = {
        ...formData,
        title: projectTitle,
        description: formData.description.trim() || "A connected technology project from SAPTech Uganda.",
        category: formData.category.trim() || "General",
        status: formData.status || "completed",
        order: formData.order || 0
      };

      // Add text fields. Most fields are optional, so blank values are skipped.
      Object.keys(normalizedFormData).forEach(key => {
        const value = normalizedFormData[key];

        if (Array.isArray(value)) {
          submitData.append(key, JSON.stringify(value.filter(item => item.trim() !== "")));
        } else if (value !== "" && value !== null && value !== undefined) {
          submitData.append(key, value);
        } else {
          submitData.delete(key);
        }
      });
      
      // Add new image files
      newImageFiles.forEach(file => {
        submitData.append("images", file);
      });

      // Add new video files
      newVideoFiles.forEach(file => {
        submitData.append("videos", file);
      });

      // Tell the server which existing images/videos to remove
      if (imagesToDelete.length > 0) {
        submitData.append("removeImages", JSON.stringify(imagesToDelete));
      }
      if (videosToDelete.length > 0) {
        submitData.append("removeVideos", JSON.stringify(videosToDelete));
      }
      
      const url = project ? `/api/iot/${project._id}` : "/api/iot";
      const method = project ? "PUT" : "POST";
      
      const response = await apiService.request(url, {
        method: method,
        body: submitData
      });
      
      if (response.status === "success") {
        const savedProject = response.data?.iotProject || null;
        onSuccess(savedProject);
        onClose();
        showAlert.success(
          "Project saved",
          project ? "Your IoT project has been updated." : "Your IoT project has been added successfully!"
        );
      }
    } catch (error) {
      console.error("Error saving IoT project:", error);
      showAlert.error("Couldn't save", error.message || "Something went wrong saving your IoT project. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content iot-form-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? "Edit IoT Project" : "Add IoT Project"}</h2>
          <button onClick={onClose} className="btn-close">
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        {/* Instructions for adding IoT projects */}
        <div className="software-form-instructions">
          <div className="instruction-icon">Info</div>
          <div className="instruction-content">
            <strong>Start simple. Improve the details later.</strong>
            <p>Add the project title first. Photos, links, hardware, features, and dates are optional, so you can save a clean draft without forcing every field.</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="software-form">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Project basics</h3>
            
            <div className="form-group">
              <label htmlFor="iot-title">Project title <span className="form-required">Required</span></label>
              <input
                type="text"
                id="iot-title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="e.g., Smart irrigation monitor"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="iot-description">Description <span className="form-optional">(optional)</span></label>
              <textarea
                id="iot-description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                placeholder="Write a short, human explanation: what problem it solves, where it is used, and what makes it useful."
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="iot-category">Category <span className="form-optional">(optional)</span></label>
                <input
                  type="text"
                  id="iot-category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  list="iot-category-options"
                  placeholder="Choose or type a category"
                />
                <datalist id="iot-category-options">
                  {IOT_CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>
              
              <div className="form-group">
                <label htmlFor="iot-status">Progress <span className="form-optional">(optional)</span></label>
                <select id="iot-status" name="status" value={formData.status} onChange={handleInputChange}>
                  <option value="completed">Completed</option>
                  <option value="in-progress">In Progress</option>
                  <option value="prototype">Prototype</option>
                  <option value="planning">Planning</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="iot-completion-date">Completion date <span className="form-optional">(optional)</span></label>
                <input
                  type="date"
                  id="iot-completion-date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="iot-display-order">Display order <span className="form-optional">(optional)</span></label>
                <input
                  type="number"
                  id="iot-display-order"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                />
                <small>Use this only when you want a project to appear earlier.</small>
              </div>
            </div>
          </div>
          
          {/* Technologies & Hardware */}
          <div className="form-section">
            <h3>Technical details <span className="form-optional">(optional)</span></h3>
            
            <div className="form-group">
              <label>Technologies used <span className="form-optional">(optional)</span></label>
              {formData.technologies.map((tech, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={tech}
                    onChange={(e) => handleArrayFieldChange("technologies", index, e.target.value)}
                    placeholder="e.g., ESP32, MQTT, React dashboard"
                  />
                  {formData.technologies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField("technologies", index)}
                      className="btn-remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("technologies")}
                className="btn-add-array"
              >
                Add technology
              </button>
            </div>
            
            <div className="form-group">
              <label>Hardware components <span className="form-optional">(optional)</span></label>
              {formData.hardware.map((hw, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={hw}
                    onChange={(e) => handleArrayFieldChange("hardware", index, e.target.value)}
                    placeholder="e.g., ESP32, soil sensor, relay module"
                  />
                  {formData.hardware.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField("hardware", index)}
                      className="btn-remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("hardware")}
                className="btn-add-array"
              >
                Add hardware
              </button>
            </div>
            
            <div className="form-group">
              <label>Key features <span className="form-optional">(optional)</span></label>
              {formData.features.map((feature, index) => (
                <div key={index} className="array-input">
                  <input
                    type="text"
                    value={feature}
                    onChange={(e) => handleArrayFieldChange("features", index, e.target.value)}
                    placeholder="e.g., Sends alerts when moisture is low"
                  />
                  {formData.features.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayField("features", index)}
                      className="btn-remove"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayField("features")}
                className="btn-add-array"
              >
                Add feature
              </button>
            </div>
          </div>
          
          {/* Links */}
          <div className="form-section">
            <h3>Useful links <span className="form-optional">(optional)</span></h3>
            
            <div className="form-group">
              <label htmlFor="iot-project-url">Project URL <span className="form-optional">(optional)</span></label>
              <input
                type="url"
                id="iot-project-url"
                name="projectUrl"
                value={formData.projectUrl}
                onChange={handleInputChange}
                placeholder="https://project-demo.com"
              />
              <small className="form-hint">Add a demo, documentation page, or case study link.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="iot-github-url">GitHub URL <span className="form-optional">(optional)</span></label>
              <input
                type="url"
                id="iot-github-url"
                name="githubUrl"
                value={formData.githubUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/username/repo"
              />
              <small className="form-hint">Use this only when the code should be public.</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="iot-video-url">Demo video URL <span className="form-optional">(optional)</span></label>
              <input
                type="url"
                id="iot-video-url"
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder="https://youtube.com/watch?v=..."
              />
              <small className="form-hint">Paste a YouTube, Vimeo, or public demo video link.</small>
            </div>
          </div>
          
          {/* Images */}
          <div className="form-section">
            <h3>Project images <span className="form-optional">(optional)</span></h3>
            
            <div className="form-group">
              <label htmlFor="iot-images">Upload images <span className="form-optional">(optional)</span></label>
              <input
                type="file"
                id="iot-images"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="file-input"
              />
              <small className="form-hint">Add up to 10 images. They will be compressed for faster loading.</small>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="image-preview-grid">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={preview.url} alt={`Preview ${index + 1}`} />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="btn-remove-image"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Videos */}
          <div className="form-section">
            <h3>Project videos <span className="form-optional">(optional)</span></h3>

            <div className="form-group">
              <label htmlFor="iot-videos">Upload videos <span className="form-optional">(optional)</span></label>
              <input
                type="file"
                id="iot-videos"
                accept="video/*"
                multiple
                onChange={handleVideoChange}
                className="file-input"
                disabled={newVideoFiles.length >= 3}
              />
              <small className="form-hint">Add up to 3 videos, 50MB each. MP4, WebM, MOV, and AVI are supported.</small>
            </div>

            {/* Existing uploaded videos */}
            {existingVideos.length > 0 && (
              <div className="video-list">
                <p><strong>Existing videos:</strong></p>
                {existingVideos.map((video, index) => (
                  <div key={index} className="video-item">
                    <video src={getOptimizedVideoUrl(video.url)} controls playsInline className="video-preview" preload="none" />
                    <div className="video-info">
                      {video.mimeType && <span>{video.mimeType.split('/')[1]?.toUpperCase()}</span>}
                      {video.size > 0 && <span>{(video.size / (1024 * 1024)).toFixed(1)} MB</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingVideo(video.url)}
                      className="btn-remove-image"
                      title="Remove video"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New videos queued for upload */}
            {newVideoFiles.length > 0 && (
              <div className="video-list">
                <p><strong>New videos to upload ({newVideoFiles.length}/3):</strong></p>
                {newVideoFiles.map((file, index) => (
                  <div key={index} className="video-item">
                    <i className="fas fa-film fa-2x" style={{color: '#666', minWidth: '32px'}}></i>
                    <div className="video-info">
                      <span className="video-name">{file.name}</span>
                      <span className="video-size">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewVideo(index)}
                      className="btn-remove-image"
                      title="Remove video"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="form-section">
            <h3>Visibility <span className="form-optional">(optional)</span></h3>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                <span>Show this project to visitors <span className="form-optional">(optional)</span></span>
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                <span>Feature this project <span className="form-optional">(optional)</span></span>
              </label>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? "Saving..." : project ? "Save Changes" : "Save Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IoTForm;
