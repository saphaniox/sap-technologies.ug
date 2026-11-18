export const getPartnerDisplayName = partner => partner?.name?.trim() || "Logo-only partner";
export const getPartnerInitial = partner => getPartnerDisplayName(partner).charAt(0).toUpperCase();
export const NOT_REPORTED = "Not reported yet";
export const CURRENT_EMAIL_BRAND_TAGLINE = "Professional in Engineering And Technology solutions";
export const LEGACY_EMAIL_BRAND_TAGLINE_WORDS = ["technology", "that", "moves", "people", "and", "businesses", "forward"];
export const LEGACY_EMAIL_BRAND_TAGLINE = LEGACY_EMAIL_BRAND_TAGLINE_WORDS.join(" ");
export const LEGACY_EMAIL_BRAND_TAGLINES = new Set([LEGACY_EMAIL_BRAND_TAGLINE, `${LEGACY_EMAIL_BRAND_TAGLINE}.`]);
export const normalizeEmailBrandTagline = (value, fallback = CURRENT_EMAIL_BRAND_TAGLINE) => {
  const cleaned = String(value || fallback || "").trim();
  const comparable = cleaned.replace(/\s+/g, " ").toLowerCase();
  return LEGACY_EMAIL_BRAND_TAGLINES.has(comparable) ? CURRENT_EMAIL_BRAND_TAGLINE : cleaned;
};
export const getHealthValue = (source, paths, fallback = NOT_REPORTED) => {
  if (!source) return fallback;
  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return fallback;
};
export const formatDashboardNumber = value => typeof value === "number" ? value.toLocaleString() : value || "0";
export const extractList = (response, keys = []) => {
  const sources = [response?.data, response].filter(Boolean);
  for (const source of sources) {
    if (Array.isArray(source)) return source;
    for (const key of keys) {
      const value = source?.[key];
      if (Array.isArray(value)) return value;
      if (Array.isArray(value?.items)) return value.items;
    }
  }
  return [];
};
export const getGalleryMedia = item => {
  if (Array.isArray(item?.media) && item.media.length > 0) {
    return item.media.filter(media => media?.url).map(media => ({
      ...media,
      type: media.type === "video" || media.mimeType?.startsWith("video/") ? "video" : "image"
    }));
  }
  return item?.image ? [{
    url: item.image,
    type: "image",
    originalName: item.title || "Gallery image"
  }] : [];
};
export const normalizePagination = (pagination = {}, fallbackPage = 1) => {
  const currentPage = Number(pagination.currentPage ?? pagination.page ?? fallbackPage) || 1;
  const totalPages = Number(pagination.totalPages ?? pagination.pages ?? 1) || 1;
  return {
    ...pagination,
    currentPage,
    totalPages,
    hasPrevPage: pagination.hasPrevPage ?? currentPage > 1,
    hasNextPage: pagination.hasNextPage ?? currentPage < totalPages
  };
};
export const formatMetricValue = (value, fallback = NOT_REPORTED) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};
export const formatPercent = value => {
  if (value === undefined || value === null || value === "") return NOT_REPORTED;
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `${number > 1 ? number.toFixed(1) : (number * 100).toFixed(1)}%`;
};
export const formatBytes = value => {
  const number = Number(value);
  if (!Number.isFinite(number)) return NOT_REPORTED;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = number;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};
export const formatMemoryValue = value => {
  const number = Number(value);
  if (!Number.isFinite(number)) return NOT_REPORTED;
  if (number > 1024 * 1024) return formatBytes(number);
  return `${number.toLocaleString()} MB`;
};
export const JOB_APPLICATION_STATUS_OPTIONS = [{
  value: "pending",
  label: "Pending review",
  tone: "pending",
  description: "Application is waiting for review"
}, {
  value: "reviewed",
  label: "Reviewed",
  tone: "reviewed",
  description: "Application has been reviewed"
}, {
  value: "interviewed",
  label: "Interview stage",
  tone: "interviewed",
  description: "Candidate has moved to interviews"
}, {
  value: "accepted",
  label: "Accepted",
  tone: "accepted",
  description: "Candidate has been accepted"
}, {
  value: "rejected",
  label: "Not selected",
  tone: "rejected",
  description: "Candidate will not move forward"
}];
export const getJobApplicationStatusMeta = (status = "pending") => JOB_APPLICATION_STATUS_OPTIONS.find(item => item.value === status) || JOB_APPLICATION_STATUS_OPTIONS[0];
export const formatAdminDate = (value, options = {}) => {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: options.dateOnly ? undefined : "2-digit",
    minute: options.dateOnly ? undefined : "2-digit"
  });
};
export const getApplicantInitials = (name = "") => {
  const parts = String(name || "Applicant").trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map(part => part.charAt(0)).join("") || "A").toUpperCase();
};
export const buildApplicantEmailDraft = (application = {}) => {
  const firstName = String(application.fullName || "there").trim().split(/\s+/)[0] || "there";
  const jobTitle = application.job?.title || "your application";
  return {
    subject: `Update regarding your ${jobTitle} application`,
    message: `Hello ${firstName},

Thank you for your interest in SAPTech Uganda and for the time you invested in your application.

I wanted to personally follow up regarding your application for ${jobTitle}.

Warm regards,
SAPTech Uganda Recruitment Team`
  };
};
export const formatDateTime = value => {
  if (!value) return NOT_REPORTED;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_REPORTED;
  return date.toLocaleString();
};
export const getStatusClass = value => {
  const normalized = String(value || "").toLowerCase();
  if (["online", "connected", "healthy", "running", "active", "ok", "available", "ready", "up"].some(status => normalized.includes(status))) {
    return "online";
  }
  if (["warning", "degraded", "slow", "pending", "syncing", "limited"].some(status => normalized.includes(status))) {
    return "warning";
  }
  if (["offline", "down", "failed", "error", "critical", "disconnected", "unhealthy"].some(status => normalized.includes(status))) {
    return "offline";
  }
  return "unknown";
};
export const DEFAULT_EMAIL_CONFIG_FORM = {
  providerMode: "auto",
  brand: {
    name: "SAPTech Uganda",
    legalName: "SAPTECH UGANDA",
    awardsName: "SAPTECH Awards 2026",
    websiteUrl: "https://saptechug.com",
    logoUrl: "https://saptechug.com/images/logo.png",
    tagline: CURRENT_EMAIL_BRAND_TAGLINE,
    phone: "+256 706 564 628",
    address: "Ndejje, Kampala, Uganda",
    contactEmail: "info@saptechug.com",
    careersEmail: "careers@saptechug.com"
  },
  sender: {
    fromName: "SAPTech Uganda",
    fromEmail: "info@saptechug.com",
    replyTo: "info@saptechug.com",
    notifyEmail: "info@saptechug.com"
  },
  mailjet: {
    fromEmail: "info@saptechug.com",
    timeoutMs: 15000,
    sandboxMode: false
  },
  gmail: {
    fromEmail: ""
  }
};
export const mergeEmailConfigForm = (config = {}, emailDelivery = {}) => {
  const brand = {
    ...DEFAULT_EMAIL_CONFIG_FORM.brand,
    ...(emailDelivery.brand || {}),
    ...(config.brand || {})
  };
  return {
    providerMode: config.providerMode || emailDelivery.mode || DEFAULT_EMAIL_CONFIG_FORM.providerMode,
    brand: {
      ...brand,
      tagline: normalizeEmailBrandTagline(brand.tagline)
    },
    sender: {
      ...DEFAULT_EMAIL_CONFIG_FORM.sender,
      ...(config.sender || {}),
      fromName: config.sender?.fromName || emailDelivery.sender?.fromName || DEFAULT_EMAIL_CONFIG_FORM.sender.fromName,
      fromEmail: config.sender?.fromEmail || emailDelivery.sender?.fromEmail || DEFAULT_EMAIL_CONFIG_FORM.sender.fromEmail,
      replyTo: config.sender?.replyTo || emailDelivery.sender?.replyTo || DEFAULT_EMAIL_CONFIG_FORM.sender.replyTo,
      notifyEmail: config.sender?.notifyEmail || emailDelivery.sender?.notifyEmail || DEFAULT_EMAIL_CONFIG_FORM.sender.notifyEmail
    },
    mailjet: {
      ...DEFAULT_EMAIL_CONFIG_FORM.mailjet,
      ...(config.mailjet || {}),
      fromEmail: config.mailjet?.fromEmail || emailDelivery.sender?.mailjetFromEmail || DEFAULT_EMAIL_CONFIG_FORM.mailjet.fromEmail
    },
    gmail: {
      ...DEFAULT_EMAIL_CONFIG_FORM.gmail,
      ...(config.gmail || {}),
      fromEmail: config.gmail?.fromEmail || emailDelivery.sender?.smtpFromEmail || DEFAULT_EMAIL_CONFIG_FORM.gmail.fromEmail
    }
  };
};
