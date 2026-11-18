import { PLACEHOLDERS } from "../../../utils/imageUrl";
import { getImageUrl } from "../../../utils/imageUrl";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function JobsTab({
  fetchJobs,
  filteredJobs,
  handleJobDelete,
  handleJobEdit,
  jobsSearch,
  setEditingJob,
  setJobsSearch,
  setShowJobForm
}) {
  return <div className="tab-panel">
              <div className="section-header">
                <h2>Careers Management</h2>
                <p>Create and manage job openings shown on the Careers page</p>
              </div>

              <div className="controls-section">
                <div className="left-controls">
                  <button className="btn btn-primary" onClick={() => {
          setEditingJob(null);
          setShowJobForm(true);
        }}>
                    <i className="fas fa-plus"></i> Post Job
                  </button>
                </div>

                <div className="right-controls">
                  <input type="text" placeholder="Search jobs..." value={jobsSearch} onChange={e => setJobsSearch(e.target.value)} className="search-input" />
                  <button className="btn-refresh" onClick={fetchJobs}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Poster</th>
                        <th>Role</th>
                        <th>Department</th>
                        <th>Location</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredJobs.length === 0 ? <tr>
                          <td colSpan="8" style={{
                textAlign: "center",
                padding: "2rem"
              }}>
                            <div>
                              <p>No job postings found</p>
                              <small>
                                {jobsSearch ? "Try another search term" : "Click 'Post Job' to create the first careers listing"}
                              </small>
                            </div>
                          </td>
                        </tr> : filteredJobs.map(job => <tr key={job._id}>
                            <td>
                              {job.poster ? <img src={getImageUrl(job.poster)} alt={job.posterAlt || `${job.title} poster`} className="table-job-poster" onError={e => {
                  if (!e.target.dataset.errorHandled) {
                    e.target.dataset.errorHandled = "true";
                    e.target.src = PLACEHOLDERS.error;
                  }
                }} /> : <span className="table-muted">No poster</span>}
                            </td>
                            <td>
                              <strong>{job.title}</strong>
                              {job.salaryRange && <small className="table-subtext">{job.salaryRange}</small>}
                            </td>
                            <td>{job.department || "General"}</td>
                            <td>{job.location || "-"}</td>
                            <td>{job.employmentType || "-"}</td>
                            <td>
                              <span className={`status-badge ${job.isActive ? "active" : "inactive"}`}>
                                {job.isActive ? "Active" : "Inactive"}
                              </span>
                              {job.isFeatured && <span className="featured-badge featured">Featured</span>}
                            </td>
                            <td>
                              {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : "Rolling"}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-small btn-edit" onClick={() => handleJobEdit(job)} title="Edit Job">
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button className="btn-small btn-delete" onClick={() => handleJobDelete(job._id, job.title)} title="Delete Job">
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>)}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>;
}
