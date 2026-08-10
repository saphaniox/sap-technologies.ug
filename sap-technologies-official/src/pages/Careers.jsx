import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import JobForm from "../components/JobForm";
import JobApplicationForm from "../components/JobApplicationForm";
import ConfirmDialog from "../components/ConfirmDialog";
import SEO from "../components/SEO";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl } from "../utils/imageUrl";
import { removeById, upsertById } from "../utils/realtimeCollection";
import "../styles/Careers.css";

const SITE_URL = "https://saptechug.com";
const DEFAULT_JOB_POSTER = "/images/logo.png";

const stripText = (value = "") => String(value || "")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const truncateText = (value = "", maxLength = 220) => {
  const text = stripText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
};

const getJobAppUrl = (job) => `${SITE_URL}/careers/${job._id}`;
const getJobShareUrl = (job) => getJobAppUrl(job);
const hasJobPoster = (job) => Boolean(job?.poster);
const getJobPosterUrl = (job) => getImageUrl(job?.poster) || `${SITE_URL}${DEFAULT_JOB_POSTER}`;
const buildJobDescription = (job) => {
  const details = [job?.employmentType, job?.department, job?.location].filter(Boolean).join(" - ");
  const intro = details ? `${details}. ` : "";
  return truncateText(`${intro}${job?.description || "Apply to join SAPTech Uganda."}`);
};

const normalizeEmploymentType = (value = "Full-time") => {
  const normalized = String(value || "Full-time").toLowerCase();
  if (normalized.includes("part")) return "PART_TIME";
  if (normalized.includes("contract") || normalized.includes("freelance")) return "CONTRACTOR";
  if (normalized.includes("intern")) return "INTERN";
  return "FULL_TIME";
};

const buildJobStructuredData = (job) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  title: job.title,
  description: stripText(job.description),
  identifier: {
    "@type": "PropertyValue",
    name: "SAPTech Uganda",
    value: job._id
  },
  datePosted: job.createdAt || undefined,
  validThrough: job.applicationDeadline || undefined,
  employmentType: normalizeEmploymentType(job.employmentType),
  hiringOrganization: {
    "@type": "Organization",
    name: "SAPTech Uganda",
    sameAs: SITE_URL,
    logo: `${SITE_URL}/images/logo.png`
  },
  jobLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: job.location || "Ndejje, Kampala, Uganda",
      addressCountry: "UG"
    }
  },
  image: getJobPosterUrl(job),
  url: getJobShareUrl(job)
});

const Careers = () => {
  const { jobId } = useParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [applicationJobId, setApplicationJobId] = useState(null);

  useEffect(() => {
    fetchJobs({ focusJobId: jobId });
    checkUserAuth();
  }, [jobId]);

  useEffect(() => {
    if (!jobId || loading) return undefined;

    const timer = window.setTimeout(() => {
      const target = document.getElementById(`job-${jobId}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [jobId, loading, jobs.length]);

  const checkUserAuth = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const fetchJobs = async ({ silent = false, focusJobId = jobId } = {}) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getPublicJobs();
      const jobList = data.data || [];
      let activeJobs = jobList.filter((j) => j.isActive);

      if (focusJobId && !activeJobs.some((job) => job._id === focusJobId)) {
        try {
          const singleJobResponse = await apiService.getJob(focusJobId);
          const sharedJob = singleJobResponse?.data;

          if (sharedJob?.isActive !== false) {
            activeJobs = upsertById(activeJobs, sharedJob);
          } else {
            setError("This job is no longer accepting applications.");
          }
        } catch (jobError) {
          console.error("Error loading shared job:", jobError);
          setError("This job link is no longer available.");
        }
      }

      setJobs(activeJobs);

      if (focusJobId && activeJobs.some((job) => job._id === focusJobId)) {
        setExpandedJobId(focusJobId);
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      if (!silent) setError("We're having trouble loading job openings. Please refresh and try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleDelete = (job) => {
    setJobToDelete(job);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    try {
      await apiService.deleteJob(jobToDelete._id);
      setJobs((prev) => removeById(prev, jobToDelete._id));
      setShowDeleteDialog(false);
      setJobToDelete(null);
      await showAlert.success("Deleted", "Job posting has been deleted.");
    } catch (error) {
      console.error("Error deleting job:", error);
      await showAlert.error("Delete failed", error.message || "Could not delete. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setJobToDelete(null);
  };

  const handleSave = (savedJob) => {
    if (savedJob?._id) {
      setJobs((prev) => upsertById(prev, savedJob, {
        include: (job) => job.isActive !== false
      }));
    }

    fetchJobs({ silent: true });
    setShowJobForm(false);
    setEditingJob(null);
  };

  const toggleJobExpand = (jobId) => {
    setExpandedJobId(expandedJobId === jobId ? null : jobId);
  };

  const openApplication = (jobId) => {
    setApplicationJobId(jobId);
  };

  const closeApplication = () => {
    setApplicationJobId(null);
  };

  const applyingJob = jobs.find((j) => j._id === applicationJobId);
  const selectedJob = jobId ? jobs.find((j) => j._id === jobId) : null;

  const handleShareJob = async (job) => {
    const url = getJobShareUrl(job);
    const title = `${job.title} | SAPTech Uganda Careers`;
    const text = buildJobDescription(job);

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }

      await navigator.clipboard.writeText(url);
      await showAlert.success("Job link copied", "The share link is ready to paste.");
    } catch (shareError) {
      if (shareError?.name === "AbortError") return;
      console.error("Error sharing job:", shareError);
      await showAlert.info("Share this job", url, {
        showConfirmButton: true,
        confirmButtonText: "OK",
        timer: null
      });
    }
  };

  if (loading) {
    return (
      <section id="careers" className="careers-section">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading career opportunities...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <section id="careers" className="careers-section">
        <div className="container">
          <div className="error-state">
            <p>⚠️ {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
    {selectedJob && (
      <SEO
        title={`${selectedJob.title} | Careers at SAPTech Uganda`}
        description={buildJobDescription(selectedJob)}
        keywords={[
          selectedJob.title,
          selectedJob.department,
          selectedJob.location,
          selectedJob.employmentType,
          "SAPTech Uganda careers",
          "technology jobs Uganda",
          "software jobs Kampala"
        ].filter(Boolean).join(", ")}
        canonicalUrl={getJobShareUrl(selectedJob)}
        url={getJobShareUrl(selectedJob)}
        ogImage={getJobPosterUrl(selectedJob)}
        ogType="article"
        structuredData={buildJobStructuredData(selectedJob)}
      />
    )}
    <section id="careers" className="careers-section">
      <div className="container">
        <div className="careers-header">
          <h2>Join Our Team</h2>
          <p className="careers-subtitle">
            We are always looking for talented people to help us build amazing technology.
            Explore our open positions and find your next opportunity.
          </p>
          {user && user.role === "admin" && (
            <button
              className="add-job-btn admin-btn"
              onClick={() => {
                setEditingJob(null);
                setShowJobForm(true);
              }}
            >
              + Post New Job
            </button>
          )}
        </div>

        <div className="careers-info-grid" aria-label="Career areas at SAPTech Uganda">
          <article>
            <h3>Engineering & IoT</h3>
            <p>
              Work on connected devices, automation systems, sensors, embedded prototypes,
              smart homes, security systems, and practical engineering projects for real users.
            </p>
          </article>
          <article>
            <h3>Software & Web</h3>
            <p>
              Build business websites, dashboards, mobile-friendly apps, ecommerce platforms,
              school systems, inventory tools, and custom workflow software for local and global clients.
            </p>
          </article>
          <article>
            <h3>Design & Client Delivery</h3>
            <p>
              Support branding, graphics, project planning, documentation, testing, training,
              and client communication so every solution is clear, useful, and maintainable.
            </p>
          </article>
        </div>

        {jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💼</div>
            <h3>No Open Positions</h3>
            <p>
              We don't have any open positions right now, but we are always interested in
              hearing from talented people. Send us your resume to careers@saptechug.com.
            </p>
          </div>
        ) : (
          <div className="jobs-list">
            {jobs.map((job, index) => (
              <div
                id={`job-${job._id}`}
                key={job._id}
                className={`job-card ${hasJobPoster(job) ? "has-poster" : "uses-logo-poster"} ${expandedJobId === job._id ? "expanded" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="job-poster">
                  <img
                    src={getJobPosterUrl(job)}
                    alt={job.posterAlt || `${job.title} job poster`}
                    loading="lazy"
                  />
                </div>
                <div className="job-main" onClick={() => toggleJobExpand(job._id)}>
                  <div className="job-title-section">
                    <h3>{job.title}</h3>
                    <div className="job-meta">
                      <span className="job-badge department">{job.department}</span>
                      <span className="job-badge location">📍 {job.location}</span>
                      <span className="job-badge type">{job.employmentType}</span>
                    </div>
                  </div>
                  <div className="job-actions-main">
                    {job.salaryRange && (
                      <span className="job-salary">{job.salaryRange}</span>
                    )}
                    <button
                      className={`expand-btn ${expandedJobId === job._id ? "active" : ""}`}
                      aria-label={expandedJobId === job._id ? "Collapse" : "Expand"}
                    >
                      ▼
                    </button>
                    <button
                      type="button"
                      className="job-share-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShareJob(job);
                      }}
                      aria-label={`Share ${job.title}`}
                      title="Share job link"
                    >
                      Share
                    </button>
                    {user && user.role === "admin" && (
                      <div className="job-admin-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(job)}
                          title="Edit Job"
                        >
                          ✏️
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(job)}
                          title="Delete Job"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {expandedJobId === job._id && (
                  <div className="job-details">
                    <div className="job-detail-section">
                      <h4>About the Role</h4>
                      <p>{job.description}</p>
                    </div>

                    {job.responsibilities && (
                      <div className="job-detail-section">
                        <h4>Responsibilities</h4>
                        <p>{job.responsibilities}</p>
                      </div>
                    )}

                    {job.requirements && (
                      <div className="job-detail-section">
                        <h4>Requirements</h4>
                        <p>{job.requirements}</p>
                      </div>
                    )}

                    {job.benefits && (
                      <div className="job-detail-section">
                        <h4>Benefits</h4>
                        <p>{job.benefits}</p>
                      </div>
                    )}

                    <div className="job-detail-footer">
                      <div className="job-deadline">
                        {job.applicationDeadline ? (
                          <span>
                            ⏰ Apply by:{" "}
                            {new Date(job.applicationDeadline).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        ) : (
                          <span>✨ Applications accepted on a rolling basis</span>
                        )}
                      </div>
                      <button
                        className="apply-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openApplication(job._id);
                        }}
                      >
                        Apply Now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showJobForm && (
        <JobForm
          isOpen={showJobForm}
          job={editingJob}
          onClose={() => {
            setShowJobForm(false);
            setEditingJob(null);
          }}
          onSave={handleSave}
        />
      )}

      {showDeleteDialog && jobToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Job"
          message={`Are you sure you want to delete "${jobToDelete.title}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}

      {applicationJobId && applyingJob && (
        <JobApplicationForm
          job={applyingJob}
          onClose={closeApplication}
        />
      )}
    </section>
    </>
  );
};

export default Careers;
