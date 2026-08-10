import { useState, useEffect, useRef } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl, getOptimizedVideoUrl } from "../utils/imageUrl";
import { compressImageFile } from "../utils/mediaCompression";
import "../styles/GalleryForm.css";

const MAX_MEDIA_FILES = 12;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;

const CATEGORIES = [
  { value: "services", label: "Services" },
  { value: "projects", label: "Projects" },
  { value: "events", label: "Events" },
  { value: "team", label: "Team" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" }
];

const formatFileSize = (size = 0) => {
  if (!size) return "";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(size / 1024))} KB`;
};

const getMediaType = (media = {}) => (
  media.type === "video" || media.mimeType?.startsWith("video/") || media.mimetype?.startsWith("video/")
    ? "video"
    : "image"
);

const getExistingMedia = (galleryItem) => {
  if (!galleryItem) return [];

  if (Array.isArray(galleryItem.media) && galleryItem.media.length > 0) {
    return galleryItem.media
      .filter((media) => media?.url)
      .map((media) => ({
        ...media,
        type: getMediaType(media)
      }));
  }

  return galleryItem.image
    ? [{
        url: galleryItem.image,
        type: "image",
        mimeType: "",
        originalName: galleryItem.title || "Gallery image"
      }]
    : [];
};

const GalleryForm = ({ isOpen, galleryItem, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "services",
    isActive: true,
    displayOrder: 0
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [existingMedia, setExistingMedia] = useState([]);
  const [mediaToRemove, setMediaToRemove] = useState([]);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [errors, setErrors] = useState({});
  const mediaPreviewsRef = useRef([]);

  const revokePreviews = (previews) => {
    previews.forEach((preview) => {
      if (preview.url?.startsWith("blob:")) {
        URL.revokeObjectURL(preview.url);
      }
    });
  };

  useEffect(() => {
    if (galleryItem) {
      setFormData({
        title: galleryItem.title || "",
        description: galleryItem.description || "",
        category: galleryItem.category || "services",
        isActive: galleryItem.isActive !== undefined ? galleryItem.isActive : true,
        displayOrder: galleryItem.displayOrder || 0
      });
      setExistingMedia(getExistingMedia(galleryItem));
    } else {
      setFormData({
        title: "",
        description: "",
        category: "services",
        isActive: true,
        displayOrder: 0
      });
      setExistingMedia([]);
    }

    setMediaFiles([]);
    setMediaToRemove([]);
    setMediaPreviews((previous) => {
      revokePreviews(previous);
      return [];
    });
    setErrors({});
  }, [galleryItem, isOpen]);

  useEffect(() => {
    mediaPreviewsRef.current = mediaPreviews;
  }, [mediaPreviews]);

  useEffect(() => () => {
    revokePreviews(mediaPreviewsRef.current);
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateSelectedFiles = (files) => {
    const currentTotal = existingMedia.length + mediaFiles.length + files.length;
    if (currentTotal > MAX_MEDIA_FILES) {
      return `You can keep up to ${MAX_MEDIA_FILES} gallery files in one item.`;
    }

    for (const file of files) {
      const isImage = file.type?.startsWith("image/");
      const isVideo = file.type?.startsWith("video/");

      if (!isImage && !isVideo) {
        return `"${file.name}" is not supported. Please select photos or videos only.`;
      }

      if (file.type === "image/svg+xml") {
        return "SVG uploads are not allowed for security reasons.";
      }

      if (isImage && file.size > MAX_IMAGE_SIZE) {
        return `"${file.name}" is too large. Images must be under 10MB before compression.`;
      }

      if (isVideo && file.size > MAX_VIDEO_SIZE) {
        return `"${file.name}" is too large. Videos must be under 50MB.`;
      }
    }

    return "";
  };

  const handleMediaChange = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (files.length === 0) return;

    const validationError = validateSelectedFiles(files);
    if (validationError) {
      setErrors((prev) => ({ ...prev, media: validationError }));
      await showAlert.error("Check selected files", validationError);
      return;
    }

    setOptimizing(true);
    try {
      const optimizedFiles = await Promise.all(files.map((file) => (
        file.type?.startsWith("image/")
          ? compressImageFile(file, {
              maxWidth: 1600,
              maxHeight: 1000,
              quality: 0.8,
              minBytes: 120 * 1024
            })
          : file
      )));

      const previews = optimizedFiles.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type?.startsWith("video/") ? "video" : "image",
        name: file.name,
        size: file.size
      }));

      setMediaFiles((prev) => [...prev, ...optimizedFiles]);
      setMediaPreviews((prev) => [...prev, ...previews]);
      setErrors((prev) => ({ ...prev, media: "" }));
    } catch (error) {
      console.error("Gallery media optimization failed:", error);
      await showAlert.error("Compression failed", "One of the selected images could not be optimized. Please try another file.");
    } finally {
      setOptimizing(false);
    }
  };

  const handleRemoveNewMedia = (index) => {
    setMediaFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
    setMediaPreviews((prev) => {
      const preview = prev[index];
      if (preview?.url?.startsWith("blob:")) {
        URL.revokeObjectURL(preview.url);
      }
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handleRemoveExistingMedia = (media) => {
    setExistingMedia((prev) => prev.filter((item) => item.url !== media.url));
    setMediaToRemove((prev) => prev.includes(media.url) ? prev : [...prev, media.url]);
  };

  const validateForm = () => {
    const newErrors = {};
    if (existingMedia.length + mediaFiles.length === 0) {
      newErrors.media = "At least one gallery photo or video is required";
    }
    if (formData.title && formData.title.length > 100) {
      newErrors.title = "Title cannot exceed 100 characters";
    }
    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }
    if (formData.displayOrder < 0) {
      newErrors.displayOrder = "Order must be a non-negative number";
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      showAlert.error("Please check the form", Object.values(newErrors)[0] || "Fix the highlighted fields and try again.");
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("category", formData.category);
      payload.append("isActive", String(formData.isActive));
      payload.append("displayOrder", String(formData.displayOrder));
      if (formData.title) payload.append("title", formData.title.trim());
      if (formData.description) payload.append("description", formData.description.trim());
      mediaFiles.forEach((file) => payload.append("media", file));
      if (mediaToRemove.length > 0) {
        payload.append("removeMedia", JSON.stringify(mediaToRemove));
      }

      try {
        const savedItem = galleryItem
          ? await apiService.updateGalleryItem(galleryItem._id, payload)
          : await apiService.createGalleryItem(payload);

        const item = savedItem?.data?.item || savedItem?.item || savedItem;
        onSave(item);
        onClose();
        showAlert.success(
          galleryItem ? "Gallery updated" : "Gallery item added",
          mediaFiles.length > 0 ? "The selected media uploaded successfully." : "Saved successfully."
        );
      } catch (error) {
        const responseErrors = error.response?.data?.errors;
        const message = responseErrors
          ? responseErrors.map((item) => item.msg || item).join(", ")
          : error.response?.data?.message || error.message || "Couldn't save. Please try again.";
        setErrors({ submit: message });
        await showAlert.error("Save failed", message);
      }
    } catch (error) {
      console.error("Error saving gallery item:", error);
      const message = "A network error occurred. Please check your connection and try again.";
      setErrors({ submit: message });
      await showAlert.error("Upload failed", message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isBusy = loading || optimizing;
  const totalMediaCount = existingMedia.length + mediaFiles.length;

  return (
    <div className="modal-overlay">
      <div className="modal-content gallery-form-modal">
        <div className="modal-header">
          <h2>{galleryItem ? "Edit Gallery Item" : "Add New Gallery Item"}</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={isBusy}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gallery-form">
          <div className="form-group">
            <label htmlFor="media">
              Gallery photos or videos <span className="required">*</span>
            </label>
            <input
              type="file"
              id="media"
              accept="image/*,video/*"
              multiple
              onChange={handleMediaChange}
              className={errors.media ? "error" : ""}
              disabled={isBusy || totalMediaCount >= MAX_MEDIA_FILES}
            />
            <small className="help-text">
              Select multiple photos or videos. Images are compressed at 80% quality before upload.
              Videos are supported up to 50MB each.
            </small>
            <small className="help-text">
              {totalMediaCount}/{MAX_MEDIA_FILES} media files selected for this gallery item.
            </small>
            {optimizing && <small className="help-text">Optimizing selected images...</small>}
            {errors.media && <span className="error-message">{errors.media}</span>}
          </div>

          {existingMedia.length > 0 && (
            <div className="form-group">
              <label>Existing media</label>
              <div className="media-preview-grid">
                {existingMedia.map((media) => {
                  const mediaUrl = media.type === "video" ? getOptimizedVideoUrl(media.url) : getImageUrl(media.url);
                  return (
                    <div className="media-preview-card" key={media.url}>
                      {media.type === "video" ? (
                        <video src={mediaUrl} controls playsInline preload="none" />
                      ) : (
                        <img src={mediaUrl} alt={media.originalName || "Gallery media"} />
                      )}
                      <div className="media-preview-meta">
                        <span>{media.type === "video" ? "Video" : "Photo"}</span>
                        {media.size > 0 && <small>{formatFileSize(media.size)}</small>}
                      </div>
                      <button
                        type="button"
                        className="btn-remove-media"
                        onClick={() => handleRemoveExistingMedia(media)}
                        disabled={isBusy}
                      >
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mediaPreviews.length > 0 && (
            <div className="form-group">
              <label>New media to upload</label>
              <div className="media-preview-grid">
                {mediaPreviews.map((preview, index) => (
                  <div className="media-preview-card" key={`${preview.name}-${index}`}>
                    {preview.type === "video" ? (
                      <video src={preview.url} controls preload="metadata" />
                    ) : (
                      <img src={preview.url} alt={preview.name || "New gallery media"} />
                    )}
                    <div className="media-preview-meta">
                      <span>{preview.name}</span>
                      <small>{formatFileSize(preview.size)}</small>
                    </div>
                    <button
                      type="button"
                      className="btn-remove-media"
                      onClick={() => handleRemoveNewMedia(index)}
                      disabled={isBusy}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title <span className="optional-field">(optional)</span></label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Optional title for this gallery item"
              className={errors.title ? "error" : ""}
              maxLength={100}
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description <span className="optional-field">(optional)</span></label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of this gallery item"
              className={errors.description ? "error" : ""}
              maxLength={500}
              rows={3}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="displayOrder">Display Order <span className="optional-field">(optional)</span></label>
            <input
              type="number"
              id="displayOrder"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleInputChange}
              min="0"
              className={errors.displayOrder ? "error" : ""}
            />
            <small className="help-text">
              Lower numbers appear first (0 = first position)
            </small>
            {errors.displayOrder && <span className="error-message">{errors.displayOrder}</span>}
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
              Active (visible on website)
            </label>
            <small className="help-text">
              Only active items will be displayed on the public gallery
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
              disabled={isBusy}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isBusy}
            >
              {optimizing ? "Optimizing..." : loading ? "Saving..." : (galleryItem ? "Update Item" : "Add Item")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GalleryForm;
