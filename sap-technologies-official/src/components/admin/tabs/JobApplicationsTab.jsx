import { JOB_APPLICATION_STATUS_OPTIONS } from "../utils/dashboardFormatters";
import { formatAdminDate } from "../utils/dashboardFormatters";
import { getApplicantInitials } from "../utils/dashboardFormatters";
import { getImageUrl } from "../../../utils/imageUrl";
import { getJobApplicationStatusMeta } from "../utils/dashboardFormatters";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function JobApplicationsTab({
  fetchJobApplications,
  handleJobApplicationStatusUpdate,
  jobApplicationStatusSummary,
  jobApplications,
  jobApplicationsAwaitingAction,
  jobApplicationsPagination,
  jobApplicationsSearch,
  jobApplicationsStatusFilter,
  openApplicantEmailComposer,
  setJobApplicationsSearch,
  setJobApplicationsStatusFilter,
  setSelectedJobApplication
}) {
  return <div className="tab-panel job-applications-panel">
              <div className="section-header job-applications-header">
                <div>
                  <span className="section-eyebrow">Recruitment inbox</span>
                  <h2>Job Applications</h2>
                  <p>Review applicants, update hiring status, and send branded professional emails from one place.</p>
                </div>
                <div className="job-applications-header-actions">
                  <span className="email-automation-pill">
                    <i className="fas fa-envelope-circle-check"></i>
                    Status changes email applicants
                  </span>
                  <button className="btn-refresh" onClick={() => fetchJobApplications(1)}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="job-applications-insights">
                <article>
                  <span>Total applications</span>
                  <strong>{jobApplicationsPagination.totalItems || jobApplications.length}</strong>
                  <small>Matching the current filters</small>
                </article>
                <article>
                  <span>Needs attention</span>
                  <strong>{jobApplicationsAwaitingAction}</strong>
                  <small>Pending or reviewed</small>
                </article>
                <article>
                  <span>Interview stage</span>
                  <strong>{jobApplicationStatusSummary.find(item => item.value === "interviewed")?.count || 0}</strong>
                  <small>Candidates to follow up</small>
                </article>
                <article>
                  <span>Accepted</span>
                  <strong>{jobApplicationStatusSummary.find(item => item.value === "accepted")?.count || 0}</strong>
                  <small>Successful applicants</small>
                </article>
              </div>

              <div className="job-status-pipeline">
                {jobApplicationStatusSummary.map(item => <button type="button" key={item.value} className={`job-status-card tone-${item.tone} ${jobApplicationsStatusFilter === item.value ? "active" : ""}`} onClick={() => setJobApplicationsStatusFilter(jobApplicationsStatusFilter === item.value ? "" : item.value)}>
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                    <small>{item.description}</small>
                  </button>)}
              </div>

              <div className="controls-section">
                <div className="right-controls">
                  <input type="text" placeholder="Search applicants..." value={jobApplicationsSearch} onChange={e => setJobApplicationsSearch(e.target.value)} className="search-input" />
                  <select value={jobApplicationsStatusFilter} onChange={e => setJobApplicationsStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Status</option>
                    {JOB_APPLICATION_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="data-table professional-applications-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Job</th>
                        <th>Contact</th>
                        <th>Documents</th>
                        <th>Status</th>
                        <th>Submitted</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobApplications.length === 0 ? <tr>
                          <td colSpan="7" style={{
                textAlign: "center",
                padding: "2rem"
              }}>
                            <div>
                              <p>No job applications found</p>
                              <small>
                                {jobApplicationsSearch || jobApplicationsStatusFilter ? "Try adjusting your search or status filter" : "Applications submitted from Careers will appear here"}
                              </small>
                            </div>
                          </td>
                        </tr> : jobApplications.map(application => <tr key={application._id}>
                            <td>
                              <div className="applicant-profile">
                                <span className="applicant-avatar">{getApplicantInitials(application.fullName)}</span>
                                <div>
                                  <strong>{application.fullName}</strong>
                                  <span className={`application-status-badge tone-${getJobApplicationStatusMeta(application.status).tone}`}>
                                    {getJobApplicationStatusMeta(application.status).label}
                                  </span>
                                </div>
                              </div>
                              {application.coverLetter && <small className="table-subtext">
                                  {application.coverLetter.substring(0, 120)}
                                  {application.coverLetter.length > 120 ? "..." : ""}
                                </small>}
                            </td>
                            <td>
                              <strong>{application.job?.title || "Job removed"}</strong>
                              <small className="table-subtext">
                                {[application.job?.department, application.job?.location].filter(Boolean).join(" • ") || "No job details"}
                              </small>
                            </td>
                            <td>
                              <a href={`mailto:${application.email}`}>{application.email}</a>
                              {application.phone && <small className="table-subtext">{application.phone}</small>}
                            </td>
                            <td>
                              <div className="application-file-links">
                                {application.resumeUrl && <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                                    Resume URL
                                  </a>}
                                {application.resumeFile?.url && <a href={getImageUrl(application.resumeFile.url)} target="_blank" rel="noopener noreferrer" title={application.resumeFile.originalName || "CV / resume file"}>
                                    CV file
                                  </a>}
                                {application.coverLetterFile?.url && <a href={getImageUrl(application.coverLetterFile.url)} target="_blank" rel="noopener noreferrer" title={application.coverLetterFile.originalName || "Cover letter file"}>
                                    Cover letter
                                  </a>}
                                {!application.resumeUrl && !application.resumeFile?.url && !application.coverLetterFile?.url && <span className="table-muted">No documents</span>}
                              </div>
                            </td>
                            <td>
                              <select value={application.status || "pending"} onChange={e => handleJobApplicationStatusUpdate(application, e.target.value)} className={`status-select status-${application.status || "pending"}`} aria-label={`Update status for ${application.fullName}`}>
                                {JOB_APPLICATION_STATUS_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                              </select>
                              <small className="status-email-hint">Sends a branded email</small>
                            </td>
                            <td>
                              <strong>{formatAdminDate(application.createdAt, {
                    dateOnly: true
                  })}</strong>
                              <small className="table-subtext">
                                Last emailed: {formatAdminDate(application.lastContactedAt)}
                              </small>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-small btn-view" onClick={() => setSelectedJobApplication(application)} title="View Application">
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button className="btn-small btn-email" onClick={() => openApplicantEmailComposer(application)} title="Send text email about this application">
                                  <i className="fas fa-paper-plane"></i> Text Email
                                </button>
                              </div>
                            </td>
                          </tr>)}
                    </tbody>
                  </table>
                </div>

                {jobApplicationsPagination.totalPages > 1 && <div className="pagination">
                    <button className="btn-page" onClick={() => fetchJobApplications(jobApplicationsPagination.currentPage - 1)} disabled={!jobApplicationsPagination.hasPrevPage}>
                      Previous
                    </button>
                    <span className="page-info">
                      Page {jobApplicationsPagination.currentPage} of {jobApplicationsPagination.totalPages}
                      ({jobApplicationsPagination.totalItems || 0} applications)
                    </span>
                    <button className="btn-page" onClick={() => fetchJobApplications(jobApplicationsPagination.currentPage + 1)} disabled={!jobApplicationsPagination.hasNextPage}>
                      Next
                    </button>
                  </div>}
              </div>
            </div>;
}
