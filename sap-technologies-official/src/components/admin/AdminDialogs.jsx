import { getApplicantInitials } from "./utils/dashboardFormatters";
import { getJobApplicationStatusMeta } from "./utils/dashboardFormatters";
import { formatAdminDate } from "./utils/dashboardFormatters";
import { getImageUrl } from "../../utils/imageUrl";
import { LoadingButton } from "../../utils/alerts.jsx";
import ServiceForm from "../ServiceForm";
import ProjectForm from "../ProjectForm";
import PartnerForm from "../PartnerForm";
import ProductForm from "../ProductForm";
import GalleryForm from "../GalleryForm";
import JobForm from "../JobForm";
export default function AdminDialogs({
  selectedJobApplication,
  setSelectedJobApplication,
  openApplicantEmailComposer,
  emailingJobApplication,
  closeApplicantEmailComposer,
  handleSendApplicantEmail,
  sendingApplicantEmail,
  applicantEmailForm,
  setApplicantEmailForm,
  showServiceForm,
  editingService,
  setShowServiceForm,
  setEditingService,
  handleServiceSubmit,
  showProjectForm,
  editingProject,
  setShowProjectForm,
  setEditingProject,
  handleProjectSubmit,
  showPartnerForm,
  editingPartner,
  setShowPartnerForm,
  setEditingPartner,
  handlePartnerSave,
  showProductForm,
  editingProduct,
  setShowProductForm,
  setEditingProduct,
  setProducts,
  fetchProducts,
  productsPagination,
  fetchDashboardStats,
  showGalleryForm,
  editingGallery,
  setShowGalleryForm,
  setEditingGallery,
  handleGallerySave,
  showJobForm,
  editingJob,
  setShowJobForm,
  setEditingJob,
  handleJobSave
}) {
  return <>{selectedJobApplication && <div className="applicant-modal-overlay" onClick={() => setSelectedJobApplication(null)}>
          <div className="applicant-modal" onClick={event => event.stopPropagation()}>
            <div className="applicant-modal-header">
              <div className="applicant-modal-title">
                <span className="applicant-avatar large">{getApplicantInitials(selectedJobApplication.fullName)}</span>
                <div>
                  <span className="section-eyebrow">Applicant profile</span>
                  <h3>{selectedJobApplication.fullName}</h3>
                  <p>{selectedJobApplication.job?.title || "Job application"} • {getJobApplicationStatusMeta(selectedJobApplication.status).label}</p>
                </div>
              </div>
              <button className="close-modal-btn" onClick={() => setSelectedJobApplication(null)} aria-label="Close applicant details">
                &times;
              </button>
            </div>

            <div className="applicant-modal-grid">
              <section className="applicant-detail-card">
                <h4>Contact</h4>
                <p><strong>Email:</strong> <a href={`mailto:${selectedJobApplication.email}`}>{selectedJobApplication.email}</a></p>
                <p><strong>Phone:</strong> {selectedJobApplication.phone || "Not provided"}</p>
                <p><strong>Submitted:</strong> {formatAdminDate(selectedJobApplication.createdAt)}</p>
                <p><strong>Last emailed:</strong> {formatAdminDate(selectedJobApplication.lastContactedAt)}</p>
              </section>

              <section className="applicant-detail-card">
                <h4>Role</h4>
                <p><strong>Position:</strong> {selectedJobApplication.job?.title || "Job removed"}</p>
                <p><strong>Department:</strong> {selectedJobApplication.job?.department || "General"}</p>
                <p><strong>Location:</strong> {selectedJobApplication.job?.location || "Not specified"}</p>
                <p><strong>Type:</strong> {selectedJobApplication.job?.employmentType || "Not specified"}</p>
              </section>
            </div>

            <section className="applicant-detail-card full">
              <h4>Cover letter</h4>
              <p className="applicant-cover-letter">
                {selectedJobApplication.coverLetter || "No cover letter was provided."}
              </p>
            </section>

            <section className="applicant-detail-card full">
              <h4>Documents</h4>
              <div className="applicant-document-list">
                {selectedJobApplication.resumeUrl && <a href={selectedJobApplication.resumeUrl} target="_blank" rel="noopener noreferrer">Open resume URL</a>}
                {selectedJobApplication.resumeFile?.url && <a href={getImageUrl(selectedJobApplication.resumeFile.url)} target="_blank" rel="noopener noreferrer">
                    Open CV file{selectedJobApplication.resumeFile.originalName ? ` (${selectedJobApplication.resumeFile.originalName})` : ""}
                  </a>}
                {selectedJobApplication.coverLetterFile?.url && <a href={getImageUrl(selectedJobApplication.coverLetterFile.url)} target="_blank" rel="noopener noreferrer">
                    Open cover letter file{selectedJobApplication.coverLetterFile.originalName ? ` (${selectedJobApplication.coverLetterFile.originalName})` : ""}
                  </a>}
                {!selectedJobApplication.resumeUrl && !selectedJobApplication.resumeFile?.url && !selectedJobApplication.coverLetterFile?.url && <span className="table-muted">No documents uploaded.</span>}
              </div>
            </section>

            <div className="applicant-modal-actions">
              <button className="btn-secondary" onClick={() => setSelectedJobApplication(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => openApplicantEmailComposer(selectedJobApplication)}>
                <i className="fas fa-paper-plane"></i> Text email applicant
              </button>
            </div>
          </div>
        </div>}
{emailingJobApplication && <div className="applicant-modal-overlay" onClick={closeApplicantEmailComposer}>
          <form className="applicant-modal email-composer-modal" onSubmit={handleSendApplicantEmail} onClick={event => event.stopPropagation()}>
            <div className="applicant-modal-header">
              <div>
                <span className="section-eyebrow">Applicant communication</span>
                <h3>Send an email to {emailingJobApplication.fullName}</h3>
                <p>Compose a clear, professional message. It will be delivered from SAPTech Uganda using your active email provider.</p>
              </div>
              <button type="button" className="close-modal-btn" onClick={closeApplicantEmailComposer} disabled={sendingApplicantEmail} aria-label="Close email composer">
                &times;
              </button>
            </div>

            <div className="email-recipient-card">
              <span className="applicant-avatar">{getApplicantInitials(emailingJobApplication.fullName)}</span>
              <div>
                <strong>{emailingJobApplication.fullName}</strong>
                <small>{emailingJobApplication.email} • {emailingJobApplication.job?.title || "Job application"}</small>
              </div>
            </div>

            <label className="composer-field">
              <span>Subject <small>Required</small></span>
              <input type="text" value={applicantEmailForm.subject} maxLength={160} onChange={event => setApplicantEmailForm(prev => ({
            ...prev,
            subject: event.target.value
          }))} placeholder="Email subject" required />
            </label>

            <label className="composer-field">
              <span>Message <small>Required</small></span>
              <textarea value={applicantEmailForm.message} maxLength={4000} rows={10} onChange={event => setApplicantEmailForm(prev => ({
            ...prev,
            message: event.target.value
          }))} placeholder="Write a clear, warm text email for the applicant..." required />
              <small>{applicantEmailForm.message.length}/4000 characters</small>
            </label>

            <div className="applicant-modal-actions">
              <button type="button" className="btn-secondary" onClick={closeApplicantEmailComposer} disabled={sendingApplicantEmail}>
                Cancel
              </button>
              <LoadingButton type="submit" className="btn btn-primary" loading={sendingApplicantEmail}>
                {sendingApplicantEmail ? "Sending..." : "Send text email"}
              </LoadingButton>
            </div>
          </form>
        </div>}
{showServiceForm && <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 10001
    }}>
          <ServiceForm service={editingService} onClose={() => {
        setShowServiceForm(false);
        setEditingService(null);
      }} onSave={handleServiceSubmit} />
        </div>}
{showProjectForm && <ProjectForm project={editingProject} onClose={() => {
      setShowProjectForm(false);
      setEditingProject(null);
    }} onSave={handleProjectSubmit} />}
{showPartnerForm && <PartnerForm isOpen={showPartnerForm} partner={editingPartner} onClose={() => {
      setShowPartnerForm(false);
      setEditingPartner(null);
    }} onSave={handlePartnerSave} />}
{showProductForm && <ProductForm isOpen={showProductForm} product={editingProduct} onClose={() => {
      setShowProductForm(false);
      setEditingProduct(null);
    }} onSuccess={savedProduct => {
      if (savedProduct?._id) {
        setProducts(prev => {
          const withoutCurrent = prev.filter(product => product._id !== savedProduct._id);
          return [savedProduct, ...withoutCurrent].sort((first, second) => {
            const firstOrder = Number(first.displayOrder || 0);
            const secondOrder = Number(second.displayOrder || 0);
            if (firstOrder !== secondOrder) return firstOrder - secondOrder;
            return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
          });
        });
      }
      fetchProducts(productsPagination.currentPage);
      fetchDashboardStats();
    }} />}
{showGalleryForm && <GalleryForm isOpen={showGalleryForm} galleryItem={editingGallery} onClose={() => {
      setShowGalleryForm(false);
      setEditingGallery(null);
    }} onSave={handleGallerySave} />}
{showJobForm && <JobForm isOpen={showJobForm} job={editingJob} onClose={() => {
      setShowJobForm(false);
      setEditingJob(null);
    }} onSave={handleJobSave} />}</>;
}
