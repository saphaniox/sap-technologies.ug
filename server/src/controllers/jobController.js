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
      location: normalizeText(location) || "Kampala, Uganda",
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
