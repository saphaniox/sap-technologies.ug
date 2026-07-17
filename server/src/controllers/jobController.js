const Job = require("../models/Job");
const JobApplication = require("../models/JobApplication");
const { validationResult } = require("express-validator");
const cache = require("../services/cacheService");
const logger = require("../utils/logger");
const emailService = require("../services/emailService");
const { useCloudinary } = require("../config/fileUpload");
const { getUploadedFileUrl } = require("../utils/uploadedFileUrl");
const path = require("path");
const fs = require("fs").promises;

const getFileUrl = (file, folder = "jobs") => {
  return getUploadedFileUrl(file, folder);
};

const normalizeText = (value) => {
  if (typeof value !== "string") return value;
  return value.trim();
};

const normalizeBoolean = (value, fallback) => {
  if (value === undefined) return fallback;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
};

const normalizeOrder = (value, fallback) => {
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const escapeRegex = (value = "") => (
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);

const shouldRemovePoster = (value) => {
  if (value === undefined) return false;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

const cleanupUploadedPoster = async (file) => {
  if (!file || useCloudinary || !file.path) return;

  try {
    await fs.unlink(file.path);
  } catch (unlinkError) {
    console.error("Error deleting uploaded job poster:", unlinkError);
  }
};

const cleanupStoredPoster = async (posterUrl) => {
  if (!posterUrl || useCloudinary || !posterUrl.startsWith("/uploads/jobs/")) return;

  try {
    const filePath = path.join(__dirname, "../../uploads/jobs", path.basename(posterUrl));
    await fs.unlink(filePath);
  } catch (unlinkError) {
    console.error("Error deleting old job poster:", unlinkError);
  }
};

const trimTrailingSlash = (value = "") => String(value || "").replace(/\/+$/, "");

const stripHtml = (value = "") => String(value || "")
  .replace(/<style[\s\S]*?<\/style>/gi, " ")
  .replace(/<script[\s\S]*?<\/script>/gi, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const truncateText = (value = "", maxLength = 220) => {
  const text = stripHtml(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
};

const escapeHtml = (value = "") => String(value || "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const isRemoteUrl = (value = "") => /^https?:\/\//i.test(String(value || ""));

const getClientUrl = () => trimTrailingSlash(
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  process.env.PRODUCTION_CLIENT_URL ||
  "https://saptechug.com"
);

const getBackendBaseUrl = (req) => {
  const configuredUrl = process.env.API_PUBLIC_URL || process.env.BACKEND_PUBLIC_URL || process.env.SERVER_URL;
  if (configuredUrl) return trimTrailingSlash(configuredUrl);

  const protocol = String(req.get("x-forwarded-proto") || req.protocol || "https").split(",")[0].trim();
  const host = String(req.get("x-forwarded-host") || req.get("host") || "").split(",")[0].trim();
  const frontendHosts = new Set(["saptechug.com", "www.saptechug.com"]);

  if (host && !frontendHosts.has(host.toLowerCase())) {
    return `${protocol}://${host}`;
  }

  return "https://sap-technologies-ug.onrender.com";
};

const toAbsoluteUrl = (value, baseUrl) => {
  if (!value) return "";
  if (isRemoteUrl(value)) return value;
  const pathValue = String(value).startsWith("/") ? value : `/${value}`;
  return `${trimTrailingSlash(baseUrl)}${pathValue}`;
};

const getJobPosterUrl = (job, req) => {
  if (job.poster) {
    if (isRemoteUrl(job.poster)) return job.poster;
    if (String(job.poster).startsWith("/uploads/")) {
      return toAbsoluteUrl(job.poster, getBackendBaseUrl(req));
    }
    return toAbsoluteUrl(job.poster, getClientUrl());
  }

  return `${getClientUrl()}/images/logo.png`;
};

const buildJobShareDescription = (job) => {
  const parts = [job.employmentType, job.department, job.location].filter(Boolean);
  const prefix = parts.length ? `${parts.join(" - ")}. ` : "";
  return truncateText(`${prefix}${job.description || "Apply to join SAPTech Uganda."}`);
};

const sendShareNotFound = (res) => res.status(404)
  .type("html")
  .send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, follow">
  <title>Job Not Found | SAPTech Uganda</title>
</head>
<body>
  <main style="font-family:Arial,sans-serif;max-width:640px;margin:60px auto;padding:0 20px;line-height:1.6;">
    <h1>Job Not Found</h1>
    <p>This job is no longer available. View current SAPTech Uganda opportunities instead.</p>
    <p><a href="${escapeHtml(`${getClientUrl()}/careers`)}">Open careers page</a></p>
  </main>
</body>
</html>`);

// Public - get active jobs
const getPublicJobs = async (req, res) => {
  try {
    const cached = cache.getCachedJobs();
    if (cached) {
      logger.logDebug("JobController", "Serving cached jobs");
      return res.status(200).json({
        status: "success",
        data: cached,
        cached: true
      });
    }

    const jobs = await Job.find({ isActive: true })
      .sort({ isFeatured: -1, displayOrder: 1, createdAt: -1 })
      .select("-__v");

    cache.cacheJobs(jobs);
    logger.logDebug("JobController", "Jobs cached", { count: jobs.length });

    res.status(200).json({
      status: "success",
      data: jobs
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "getPublicJobs" });
    res.status(500).json({
      status: "error",
      message: "Error fetching jobs",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Public - social share preview page for one job
const getJobSharePage = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).select("-__v");
    if (!job || job.isActive === false) {
      return sendShareNotFound(res);
    }

    const clientUrl = getClientUrl();
    const jobId = String(job._id);
    const shareUrl = `${clientUrl}/jobs/${jobId}`;
    const appUrl = `${clientUrl}/careers/${jobId}`;
    const posterUrl = getJobPosterUrl(job, req);
    const title = `${job.title} | Careers at SAPTech Uganda`;
    const description = buildJobShareDescription(job);
    const keywords = [
      job.title,
      job.department,
      job.location,
      job.employmentType,
      "SAPTech Uganda careers",
      "technology jobs Uganda"
    ].filter(Boolean).join(", ");
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: job.title,
      description: stripHtml(job.description || ""),
      datePosted: job.createdAt ? job.createdAt.toISOString() : undefined,
      validThrough: job.applicationDeadline ? job.applicationDeadline.toISOString() : undefined,
      employmentType: String(job.employmentType || "Full-time").toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      hiringOrganization: {
        "@type": "Organization",
        name: "SAPTech Uganda",
        sameAs: clientUrl,
        logo: `${clientUrl}/images/logo.png`
      },
      jobLocation: {
        "@type": "Place",
        address: {
          "@type": "PostalAddress",
          addressLocality: job.location || "Ndejje, Kampala",
          addressCountry: "UG"
        }
      },
      image: posterUrl,
      url: appUrl
    };

    res.set({
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600"
    });

    return res.status(200).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="keywords" content="${escapeHtml(keywords)}">
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
  <link rel="canonical" href="${escapeHtml(appUrl)}">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="SAPTech Uganda">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${escapeHtml(shareUrl)}">
  <meta property="og:image" content="${escapeHtml(posterUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(posterUrl)}">
  <meta property="og:image:alt" content="${escapeHtml(job.posterAlt || `${job.title} job poster`)}">
  <meta property="og:locale" content="en_UG">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(posterUrl)}">
  <meta http-equiv="refresh" content="0; url=${escapeHtml(appUrl)}">
  <script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>
  <script>window.location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body>
  <main style="font-family:Arial,sans-serif;max-width:680px;margin:48px auto;padding:0 20px;line-height:1.6;color:#0f172a;">
    <img src="${escapeHtml(posterUrl)}" alt="${escapeHtml(job.posterAlt || `${job.title} job poster`)}" style="max-width:100%;border-radius:12px;border:1px solid #e2e8f0;">
    <h1>${escapeHtml(job.title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p><a href="${escapeHtml(appUrl)}">Open this job at SAPTech Uganda</a></p>
  </main>
</body>
</html>`);
  } catch (error) {
    logger.logError("JobController", error, { context: "getJobSharePage", jobId: req.params.id });
    return sendShareNotFound(res);
  }
};

// Admin - get all jobs
const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .select("-__v");

    res.status(200).json({
      status: "success",
      data: jobs
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "getAllJobs" });
    res.status(500).json({
      status: "error",
      message: "Error fetching jobs",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Public/Admin - get single job
const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found"
      });
    }
    res.status(200).json({
      status: "success",
      data: job
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "getJobById" });
    res.status(500).json({
      status: "error",
      message: "Error fetching job",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - create job
const createJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await cleanupUploadedPoster(req.file);
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const {
      title,
      department,
      location,
      employmentType,
      description,
      requirements,
      responsibilities,
      benefits,
      salaryRange,
      applicationDeadline,
      poster,
      posterAlt,
      isActive,
      isFeatured,
      displayOrder
    } = req.body;

    const job = await Job.create({
      title: normalizeText(title),
      department: normalizeText(department) || "General",
      location: normalizeText(location) || "Ndejje, Kampala, Uganda",
      employmentType: normalizeText(employmentType) || "Full-time",
      description: normalizeText(description),
      requirements: normalizeText(requirements),
      responsibilities: normalizeText(responsibilities),
      benefits: normalizeText(benefits),
      salaryRange: normalizeText(salaryRange),
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
      poster: req.file ? getFileUrl(req.file, "jobs") : normalizeText(poster),
      posterAlt: normalizeText(posterAlt),
      posterCloudinaryId: req.file?.public_id || null,
      isActive: normalizeBoolean(isActive, true),
      isFeatured: normalizeBoolean(isFeatured, false),
      displayOrder: normalizeOrder(displayOrder, 0)
    });

    cache.invalidateJobs();
    logger.logInfo("JobController", "Job created, cache invalidated", { jobId: job._id });

    res.status(201).json({
      status: "success",
      message: "Job created successfully",
      data: { job }
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "createJob" });
    await cleanupUploadedPoster(req.file);
    res.status(500).json({
      status: "error",
      message: "Error creating job",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - update job
const updateJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      await cleanupUploadedPoster(req.file);
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      await cleanupUploadedPoster(req.file);
      return res.status(404).json({
        status: "error",
        message: "Job not found"
      });
    }

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = normalizeText(req.body.title);
    if (req.body.department !== undefined) updateData.department = normalizeText(req.body.department);
    if (req.body.location !== undefined) updateData.location = normalizeText(req.body.location);
    if (req.body.employmentType !== undefined) updateData.employmentType = normalizeText(req.body.employmentType);
    if (req.body.description !== undefined) updateData.description = normalizeText(req.body.description);
    if (req.body.requirements !== undefined) updateData.requirements = normalizeText(req.body.requirements);
    if (req.body.responsibilities !== undefined) updateData.responsibilities = normalizeText(req.body.responsibilities);
    if (req.body.benefits !== undefined) updateData.benefits = normalizeText(req.body.benefits);
    if (req.body.salaryRange !== undefined) updateData.salaryRange = normalizeText(req.body.salaryRange);
    if (req.body.applicationDeadline !== undefined) {
      updateData.applicationDeadline = req.body.applicationDeadline ? new Date(req.body.applicationDeadline) : undefined;
    }
    if (req.body.isActive !== undefined) updateData.isActive = normalizeBoolean(req.body.isActive, job.isActive);
    if (req.body.isFeatured !== undefined) updateData.isFeatured = normalizeBoolean(req.body.isFeatured, job.isFeatured);
    if (req.body.displayOrder !== undefined) updateData.displayOrder = normalizeOrder(req.body.displayOrder, job.displayOrder);
    if (req.body.posterAlt !== undefined) updateData.posterAlt = normalizeText(req.body.posterAlt);

    if (req.file) {
      updateData.poster = getFileUrl(req.file, "jobs");
      updateData.posterCloudinaryId = req.file.public_id || null;
      await cleanupStoredPoster(job.poster);
    } else if (shouldRemovePoster(req.body.removePoster)) {
      updateData.poster = "";
      updateData.posterAlt = "";
      updateData.posterCloudinaryId = null;
      await cleanupStoredPoster(job.poster);
    } else if (req.body.poster !== undefined) {
      updateData.poster = normalizeText(req.body.poster);
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    cache.invalidateJobs();
    logger.logInfo("JobController", "Job updated, cache invalidated", { jobId: updatedJob._id });

    res.status(200).json({
      status: "success",
      message: "Job updated successfully",
      data: { job: updatedJob }
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "updateJob", jobId: req.params.id });
    await cleanupUploadedPoster(req.file);
    res.status(500).json({
      status: "error",
      message: "Error updating job",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - delete job
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found"
      });
    }

    await Job.findByIdAndDelete(req.params.id);
    await cleanupStoredPoster(job.poster);

    cache.invalidateJobs();
    logger.logInfo("JobController", "Job deleted, cache invalidated", { jobId: req.params.id });

    res.status(200).json({
      status: "success",
      message: "Job deleted successfully"
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "deleteJob", jobId: req.params.id });
    res.status(500).json({
      status: "error",
      message: "Error deleting job",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Public - apply for a job
const applyForJob = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found"
      });
    }

    if (!job.isActive) {
      return res.status(400).json({
        status: "error",
        message: "This job is no longer accepting applications"
      });
    }

    const { fullName, email, phone, coverLetter, resumeUrl } = req.body;

    // Check if already applied
    const existing = await JobApplication.findOne({
      job: job._id,
      email: email.toLowerCase().trim()
    });
    if (existing) {
      return res.status(400).json({
        status: "error",
        message: "You have already applied for this position"
      });
    }

    const application = await JobApplication.create({
      job: job._id,
      fullName: normalizeText(fullName),
      email: email.toLowerCase().trim(),
      phone: normalizeText(phone),
      coverLetter: normalizeText(coverLetter),
      resumeUrl: normalizeText(resumeUrl),
      status: "pending"
    });

    await application.populate("job", "title department location");

    // Send notification email (non-blocking)
    if (emailService && emailService.queueJobApplicationEmail) {
      emailService.queueJobApplicationEmail({
        jobTitle: job.title,
        applicantName: application.fullName,
        applicantEmail: application.email,
        applicantPhone: application.phone,
        coverLetter: application.coverLetter,
        resumeUrl: application.resumeUrl
      }).catch((emailError) => {
        console.error("⚠️ Error queueing job application email:", emailError);
      });
    }

    logger.logInfo("JobController", "Job application submitted", { applicationId: application._id, jobId: job._id });

    res.status(201).json({
      status: "success",
      message: "Your application has been submitted successfully! We will review it and get back to you.",
      data: { application }
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "applyForJob", jobId: req.params.id });
    res.status(500).json({
      status: "error",
      message: "Error submitting application",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - get applications for a job
const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        status: "error",
        message: "Job not found"
      });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const filter = { job: job._id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const applications = await JobApplication.find(filter)
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await JobApplication.countDocuments(filter);

    res.status(200).json({
      status: "success",
      data: {
        applications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalItems: total
        }
      }
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "getJobApplications", jobId: req.params.id });
    res.status(500).json({
      status: "error",
      message: "Error fetching applications",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - get all job applications across every job
const getAllJobApplications = async (req, res) => {
  try {
    const { status, jobId, search, page = 1, limit = 20 } = req.query;
    const safeLimit = Math.min(parseInt(limit) || 20, 100);
    const currentPage = Math.max(parseInt(page) || 1, 1);
    const filter = {};

    if (status) filter.status = status;
    if (jobId) filter.job = jobId;

    if (search) {
      const pattern = escapeRegex(search.trim());
      filter.$or = [
        { fullName: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
        { phone: { $regex: pattern, $options: "i" } }
      ];
    }

    const skip = (currentPage - 1) * safeLimit;
    const [applications, total] = await Promise.all([
      JobApplication.find(filter)
        .populate("job", "title department location employmentType isActive")
        .populate("reviewedBy", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit),
      JobApplication.countDocuments(filter)
    ]);

    res.status(200).json({
      status: "success",
      data: {
        applications,
        pagination: {
          currentPage,
          totalPages: Math.ceil(total / safeLimit) || 1,
          totalItems: total,
          hasNextPage: currentPage < Math.ceil(total / safeLimit),
          hasPrevPage: currentPage > 1
        }
      }
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "getAllJobApplications" });
    res.status(500).json({
      status: "error",
      message: "Error fetching job applications",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

// Admin - update application status
const updateApplicationStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: errors.array()
      });
    }

    const application = await JobApplication.findById(req.params.applicationId);
    if (!application) {
      return res.status(404).json({
        status: "error",
        message: "Application not found"
      });
    }

    const { status, adminNotes } = req.body;

    const updated = await JobApplication.findByIdAndUpdate(
      req.params.applicationId,
      {
        status,
        adminNotes: normalizeText(adminNotes),
        reviewedBy: req.user ? req.user._id : undefined,
        reviewedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate("job", "title");

    if (status && emailService?.sendJobApplicationStatusUpdate) {
      setImmediate(() => {
        emailService.sendJobApplicationStatusUpdate({
          jobTitle: updated.job?.title || "Job application",
          applicantName: updated.fullName,
          applicantEmail: updated.email,
          status: updated.status,
          adminNotes: updated.adminNotes
        }).catch((emailError) => {
          console.error("Job application status email failed:", emailError);
        });
      });
    }

    logger.logInfo("JobController", "Application status updated", { applicationId: updated._id, newStatus: status });

    res.status(200).json({
      status: "success",
      message: "Application status updated",
      data: { application: updated }
    });
  } catch (error) {
    logger.logError("JobController", error, { context: "updateApplicationStatus", applicationId: req.params.applicationId });
    res.status(500).json({
      status: "error",
      message: "Error updating application",
      error: process.env.NODE_ENV === "development" ? error.message : "Internal server error"
    });
  }
};

module.exports = {
  getPublicJobs,
  getJobSharePage,
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  applyForJob,
  getAllJobApplications,
  getJobApplications,
  updateApplicationStatus
};
