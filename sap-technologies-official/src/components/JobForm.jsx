import { useState, useEffect } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl } from "../utils/imageUrl";
import "../styles/JobForm.css";

const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
  "Freelance"
];

const JobForm = ({ isOpen, job, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    department: "General",
    location: "Ndejje, Kampala, Uganda",
    employmentType: "Full-time",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    salaryRange: "",
    applicationDeadline: "",
    posterAlt: "",
    isActive: true,
    isFeatured: false,
    displayOrder: 0
  });
  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState("");
  const [removePoster, setRemovePoster] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        department: job.department || "General",
        location: job.location || "Ndejje, Kampala, Uganda",
        employmentType: job.employmentType || "Full-time",
        description: job.description || "",
        requirements: job.requirements || "",
        responsibilities: job.responsibilities || "",
        benefits: job.benefits || "",
        salaryRange: job.salaryRange || "",
        applicationDeadline: job.applicationDeadline
          ? new Date(job.applicationDeadline).toISOString().slice(0, 16)
          : "",
        posterAlt: job.posterAlt || "",
        isActive: job.isActive !== undefined ? job.isActive : true,
        isFeatured: job.isFeatured !== undefined ? job.isFeatured : false,
        displayOrder: job.displayOrder || 0
      });
      setPosterPreview(getImageUrl(job.poster) || "");
    } else {
      setFormData({
        title: "",
        department: "General",
        location: "Ndejje, Kampala, Uganda",
        employmentType: "Full-time",
        description: "",
        requirements: "",
        responsibilities: "",
        benefits: "",
        salaryRange: "",
        applicationDeadline: "",
        posterAlt: "",
        isActive: true,
        isFeatured: false,
        displayOrder: 0
      });
      setPosterPreview("");
    }
    setPosterFile(null);
    setRemovePoster(false);
    setErrors({});
  }, [job, isOpen]);

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title || formData.title.trim().length < 2) {
      newErrors.title = "Job title is required (min 2 characters)";
    }
    if (!formData.description || formData.description.trim().length < 10) {
      newErrors.description = "Job description is required (min 10 characters)";
    }
    if (formData.salaryRange && formData.salaryRange.length > 100) {
      newErrors.salaryRange = "Salary range cannot exceed 100 characters";
    }
    if (formData.displayOrder < 0) {
      newErrors.displayOrder = "Order must be a non-negative number";
    }
    if (formData.posterAlt && formData.posterAlt.length > 160) {
      newErrors.posterAlt = "Poster alt text cannot exceed 160 characters";
    }
    if (posterFile) {
      if (!posterFile.type?.startsWith("image/")) {
        newErrors.poster = "Please choose an image file for the job poster";
      } else if (posterFile.size > 10 * 1024 * 1024) {
        newErrors.poster = "Poster image must be under 10MB";
      }
    }
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      showAlert.error("Please check the form", Object.values(newErrors)[0] || "Fix the highlighted fields and try again.");
    }
    return isValid;
  };

  const handlePosterChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type?.startsWith("image/")) {
      const message = "Please choose an image file for the job poster.";
      setErrors((prev) => ({ ...prev, poster: message }));
      showAlert.error("Wrong file type", message);
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      const message = "Poster image is too large. Please keep it under 10MB.";
      setErrors((prev) => ({ ...prev, poster: message }));
      showAlert.error("Image too large", message);
      e.target.value = "";
      return;
    }

    setPosterFile(file);
    setRemovePoster(false);
    setErrors((prev) => ({ ...prev, poster: "" }));

    const reader = new FileReader();
    reader.onload = (event) => setPosterPreview(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPosterPreview("");
    setRemovePoster(Boolean(job?.poster));
    setErrors((prev) => ({ ...prev, poster: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append("title", formData.title.trim());
      payload.append("department", formData.department.trim());
      payload.append("location", formData.location.trim());
      payload.append("employmentType", formData.employmentType);
      payload.append("description", formData.description.trim());
      payload.append("requirements", formData.requirements.trim());
      payload.append("responsibilities", formData.responsibilities.trim());
      payload.append("benefits", formData.benefits.trim());
      payload.append("salaryRange", formData.salaryRange.trim());
      payload.append("posterAlt", formData.posterAlt.trim());
      payload.append("isActive", String(formData.isActive));
      payload.append("isFeatured", String(formData.isFeatured));
      payload.append("displayOrder", String(formData.displayOrder));
      payload.append("applicationDeadline", formData.applicationDeadline || "");
      if (posterFile) {
        payload.append("poster", posterFile);
      }
      if (removePoster) {
        payload.append("removePoster", "true");
      }

      let response;
      if (job) {
        response = await apiService.updateJob(job._id, payload);
      } else {
        response = await apiService.createJob(payload);
      }

      const savedJob = response?.data?.job || null;
      onSave(savedJob);
      onClose();

      await showAlert.success(
        job ? "Job updated" : "Job created",
        "The job posting has been saved successfully."
      );
    } catch (error) {
      console.error("Error saving job:", error);
      const responseErrors = error.response?.data?.errors;
      const message = responseErrors
        ? responseErrors.map((item) => item.msg || item).join(", ")
        : error.response?.data?.message || error.message || "A network error occurred. Please check your connection and try again.";
      setErrors({ submit: message });
      await showAlert.error("Upload failed", message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content job-form-modal">
        <div className="modal-header">
          <h2>{job ? "Edit Job" : "Post New Job"}</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="job-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Job Title <span className="required">*</span></label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Senior Software Engineer"
                className={errors.title ? "error" : ""}
                maxLength={100}
              />
              {errors.title && <span className="error-message">{errors.title}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g. Engineering"
                className={errors.department ? "error" : ""}
                maxLength={50}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Ndejje, Kampala, Uganda"
                className={errors.location ? "error" : ""}
                maxLength={50}
              />
            </div>

            <div className="form-group">
              <label htmlFor="employmentType">Employment Type</label>
              <select
                id="employmentType"
                name="employmentType"
                value={formData.employmentType}
                onChange={handleInputChange}
              >
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group job-poster-group">
            <label htmlFor="poster">Job Photo or Poster <span className="optional-field">(optional)</span></label>
            <input
              type="file"
              id="poster"
              accept="image/*"
              onChange={handlePosterChange}
              className={errors.poster ? "error" : ""}
            />
            {posterPreview && (
              <div className="job-poster-preview">
                <img src={posterPreview} alt={formData.posterAlt || "Job poster preview"} />
                <button type="button" className="btn-remove-poster" onClick={handleRemovePoster}>
                  Remove poster
                </button>
              </div>
            )}
            {removePoster && !posterPreview && (
              <small className="help-text">The current poster will be removed when you save.</small>
            )}
            <small className="help-text">Supported formats: JPG, PNG, WebP (Max 10MB)</small>
            {errors.poster && <span className="error-message">{errors.poster}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="posterAlt">Poster Alt Text <span className="optional-field">(optional)</span></label>
            <input
              type="text"
              id="posterAlt"
              name="posterAlt"
              value={formData.posterAlt}
              onChange={handleInputChange}
              placeholder="Short description of the poster image"
              className={errors.posterAlt ? "error" : ""}
              maxLength={160}
            />
            {errors.posterAlt && <span className="error-message">{errors.posterAlt}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Job Description <span className="required">*</span></label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the role and what the candidate will be doing..."
              className={errors.description ? "error" : ""}
              maxLength={2000}
              rows={5}
            />
            {errors.description && <span className="error-message">{errors.description}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="requirements">Requirements <span className="optional-field">(optional)</span></label>
            <textarea
              id="requirements"
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              placeholder="Required qualifications, skills, experience..."
              className={errors.requirements ? "error" : ""}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="responsibilities">Responsibilities <span className="optional-field">(optional)</span></label>
            <textarea
              id="responsibilities"
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleInputChange}
              placeholder="Key responsibilities for this role..."
              className={errors.responsibilities ? "error" : ""}
              maxLength={2000}
              rows={4}
            />
          </div>

          <div className="form-group">
            <label htmlFor="benefits">Benefits <span className="optional-field">(optional)</span></label>
            <textarea
              id="benefits"
              name="benefits"
              value={formData.benefits}
              onChange={handleInputChange}
              placeholder="Health insurance, paid leave, training, etc."
              className={errors.benefits ? "error" : ""}
              maxLength={1000}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="salaryRange">Salary Range <span className="optional-field">(optional)</span></label>
              <input
                type="text"
                id="salaryRange"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleInputChange}
                placeholder="e.g. UGX 2,000,000 - 4,000,000"
                className={errors.salaryRange ? "error" : ""}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="applicationDeadline">Application Deadline <span className="optional-field">(optional)</span></label>
              <input
                type="datetime-local"
                id="applicationDeadline"
                name="applicationDeadline"
                value={formData.applicationDeadline}
                onChange={handleInputChange}
                className={errors.applicationDeadline ? "error" : ""}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="displayOrder">Display Order</label>
              <input
                type="number"
                id="displayOrder"
                name="displayOrder"
                value={formData.displayOrder}
                onChange={handleInputChange}
                min="0"
                className={errors.displayOrder ? "error" : ""}
              />
              <small className="help-text">Lower numbers appear first</small>
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
                Active
              </label>
              <small className="help-text">Only active jobs appear on careers page</small>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isFeatured"
                  checked={formData.isFeatured}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Featured
              </label>
              <small className="help-text">Featured jobs appear first</small>
            </div>
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
              {loading ? "Saving..." : (job ? "Update Job" : "Post Job")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobForm;
