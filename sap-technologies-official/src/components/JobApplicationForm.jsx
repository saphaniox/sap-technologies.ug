import { useState } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/JobApplicationForm.css";

const MAX_APPLICATION_FILE_SIZE = 8 * 1024 * 1024;
const ACCEPTED_DOCUMENT_TYPES = ".pdf,.doc,.docx,.rtf,.txt,.odt";
const ACCEPTED_DOCUMENT_EXTENSIONS = new Set(["pdf", "doc", "docx", "rtf", "txt", "odt"]);

const formatFileSize = (bytes = 0) => {
  if (!bytes) return "";
  const sizeInMb = bytes / (1024 * 1024);
  return `${sizeInMb >= 1 ? sizeInMb.toFixed(1) : (bytes / 1024).toFixed(0)} ${sizeInMb >= 1 ? "MB" : "KB"}`;
};

const isAcceptedDocument = (file) => {
  const extension = file?.name?.split(".").pop()?.toLowerCase();
  return extension && ACCEPTED_DOCUMENT_EXTENSIONS.has(extension);
};

const JobApplicationForm = ({ job, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    coverLetter: "",
    resumeUrl: "",
    resumeFile: null,
    coverLetterFile: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files?.[0] || null;

    if (!file) {
      setFormData((prev) => ({ ...prev, [name]: null }));
      return;
    }

    if (!isAcceptedDocument(file)) {
      e.target.value = "";
      setErrors((prev) => ({
        ...prev,
        [name]: "Please upload PDF, Word, RTF, TXT, or ODT files only"
      }));
      return;
    }

    if (file.size > MAX_APPLICATION_FILE_SIZE) {
      e.target.value = "";
      setErrors((prev) => ({
        ...prev,
        [name]: "File must be 8MB or smaller"
      }));
      return;
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: file }));
  };

  const clearFile = (fieldName) => {
    setFormData((prev) => ({ ...prev, [fieldName]: null }));
    setErrors((prev) => ({ ...prev, [fieldName]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Valid email is required";
    }
    if (formData.resumeUrl && formData.resumeUrl.length > 500) {
      newErrors.resumeUrl = "Resume URL cannot exceed 500 characters";
    }
    ["resumeFile", "coverLetterFile"].forEach((fieldName) => {
      const file = formData[fieldName];
      if (!file) return;
      if (!isAcceptedDocument(file)) {
        newErrors[fieldName] = "Please upload PDF, Word, RTF, TXT, or ODT files only";
      } else if (file.size > MAX_APPLICATION_FILE_SIZE) {
        newErrors[fieldName] = "File must be 8MB or smaller";
      }
    });
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
      payload.append("fullName", formData.fullName.trim());
      payload.append("email", formData.email.trim());
      payload.append("phone", formData.phone.trim());
      payload.append("coverLetter", formData.coverLetter.trim());
      payload.append("resumeUrl", formData.resumeUrl.trim());
      if (formData.resumeFile) payload.append("resumeFile", formData.resumeFile);
      if (formData.coverLetterFile) payload.append("coverLetterFile", formData.coverLetterFile);

      await apiService.applyForJob(job._id, payload);

      await showAlert.success(
        "Application Submitted!",
        "Thank you for your interest. We will review your application and get back to you soon.",
        { timer: 5000 }
      );

      setFormData({
        fullName: "",
        email: "",
        phone: "",
        coverLetter: "",
        resumeUrl: "",
        resumeFile: null,
        coverLetterFile: null
      });
      onClose();
    } catch (error) {
      console.error("Error submitting application:", error);
      const message = error.message || "Could not submit application. Please try again.";
      setErrors({ submit: message });
      await showAlert.error("Application failed", message);
    } finally {
      setLoading(false);
    }
  };

  if (!onClose || !job) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content application-form-modal">
        <div className="modal-header">
          <h2>Apply for {job.title}</h2>
          <button
            type="button"
            className="close-button"
            onClick={onClose}
            disabled={loading}
          >
            x
          </button>
        </div>

        <div className="job-summary">
          <p><strong>Department:</strong> {job.department}</p>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Type:</strong> {job.employmentType}</p>
        </div>

        <form onSubmit={handleSubmit} className="application-form">
          <div className="form-group">
            <label htmlFor="fullName">Full Name <span className="required">*</span></label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Your full name"
              className={errors.fullName ? "error" : ""}
            />
            {errors.fullName && <span className="error-message">{errors.fullName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address <span className="required">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="you@example.com"
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number <span className="optional-field">(optional)</span></label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+256 700 000 000"
            />
          </div>

          <div className="form-group">
            <label htmlFor="coverLetter">Cover Letter <span className="optional-field">(optional)</span></label>
            <textarea
              id="coverLetter"
              name="coverLetter"
              value={formData.coverLetter}
              onChange={handleInputChange}
              placeholder="Tell us why you are a great fit for this role..."
              maxLength={2000}
              rows={5}
            />
          </div>

          <div className="form-group">
            <label htmlFor="coverLetterFile">Cover Letter File <span className="optional-field">(optional)</span></label>
            <div className={`file-upload-control ${errors.coverLetterFile ? "error" : ""}`}>
              <input
                type="file"
                id="coverLetterFile"
                name="coverLetterFile"
                accept={ACCEPTED_DOCUMENT_TYPES}
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
            <small className="help-text">PDF, Word, RTF, TXT, or ODT. Max 8MB.</small>
            {formData.coverLetterFile && (
              <div className="selected-file">
                <span>{formData.coverLetterFile.name} ({formatFileSize(formData.coverLetterFile.size)})</span>
                <button type="button" onClick={() => clearFile("coverLetterFile")} disabled={loading}>
                  Remove
                </button>
              </div>
            )}
            {errors.coverLetterFile && <span className="error-message">{errors.coverLetterFile}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="resumeUrl">Resume / Portfolio URL <span className="optional-field">(optional)</span></label>
            <input
              type="url"
              id="resumeUrl"
              name="resumeUrl"
              value={formData.resumeUrl}
              onChange={handleInputChange}
              placeholder="https://your-resume-link.com"
              className={errors.resumeUrl ? "error" : ""}
            />
            <small className="help-text">
              Link to your CV, portfolio, or LinkedIn profile
            </small>
            {errors.resumeUrl && <span className="error-message">{errors.resumeUrl}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="resumeFile">CV / Resume File <span className="optional-field">(optional)</span></label>
            <div className={`file-upload-control ${errors.resumeFile ? "error" : ""}`}>
              <input
                type="file"
                id="resumeFile"
                name="resumeFile"
                accept={ACCEPTED_DOCUMENT_TYPES}
                onChange={handleFileChange}
                disabled={loading}
              />
            </div>
            <small className="help-text">Upload a CV/resume as PDF, Word, RTF, TXT, or ODT. Max 8MB.</small>
            {formData.resumeFile && (
              <div className="selected-file">
                <span>{formData.resumeFile.name} ({formatFileSize(formData.resumeFile.size)})</span>
                <button type="button" onClick={() => clearFile("resumeFile")} disabled={loading}>
                  Remove
                </button>
              </div>
            )}
            {errors.resumeFile && <span className="error-message">{errors.resumeFile}</span>}
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
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobApplicationForm;
