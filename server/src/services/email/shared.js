const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const {
  AsyncLocalStorage
} = require("async_hooks");
const DEFAULT_MAILJET_API_URL = "https://api.mailjet.com/v3.1/send";
const EMAIL_PROVIDER_SETTING_KEY = "email.providerMode";
const EMAIL_PUBLIC_CONFIG_SETTING_KEY = "email.publicConfig";
const EMAIL_PROVIDER_MODES = ["auto", "mailjet", "gmail"];
const CURRENT_EMAIL_BRAND_TAGLINE = "Engineering and technology solutions for people and businesses.";
const LEGACY_EMAIL_BRAND_TAGLINE_WORDS = ["technology", "that", "moves", "people", "and", "businesses", "forward"];
const LEGACY_EMAIL_BRAND_TAGLINE = LEGACY_EMAIL_BRAND_TAGLINE_WORDS.join(" ");
const LEGACY_EMAIL_BRAND_TAGLINES = new Set([LEGACY_EMAIL_BRAND_TAGLINE, `${LEGACY_EMAIL_BRAND_TAGLINE}.`]);
const PROVIDER_DISPLAY_NAMES = {
  mailjet: "Mailjet",
  "gmail-smtp": "Gmail SMTP"
};
const STATUS_LABELS = {
  new: "New",
  pending: "Pending review",
  read: "Read by our team",
  replied: "Reply sent",
  reviewed: "Reviewed",
  contacted: "Contacted",
  resolved: "Resolved",
  closed: "Closed",
  archived: "Archived",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted",
  interviewed: "Interview stage",
  winner: "Winner",
  finalist: "Finalist",
  approved: "Approved"
};
const TONES = {
  default: {
    accent: "#2563eb",
    soft: "#eff6ff",
    strong: "#1e3a8a",
    border: "#bfdbfe",
    headerFrom: "#0f172a",
    headerTo: "#1d4ed8",
    headerAccent: "#93c5fd",
    headerMuted: "#dbeafe",
    pageBg: "#f4f7fb"
  },
  admin: {
    accent: "#4f46e5",
    soft: "#eef2ff",
    strong: "#312e81",
    border: "#c7d2fe",
    headerFrom: "#111827",
    headerTo: "#4338ca",
    headerAccent: "#c7d2fe",
    headerMuted: "#e0e7ff",
    pageBg: "#f5f7ff"
  },
  account: {
    accent: "#0f5fd7",
    soft: "#eff6ff",
    strong: "#174ea6",
    border: "#bfdbfe",
    headerFrom: "#0b1220",
    headerTo: "#1d4ed8",
    headerAccent: "#bfdbfe",
    headerMuted: "#dbeafe",
    pageBg: "#f5f8ff"
  },
  security: {
    accent: "#0f766e",
    soft: "#ecfdf5",
    strong: "#134e4a",
    border: "#99f6e4",
    headerFrom: "#042f2e",
    headerTo: "#0f766e",
    headerAccent: "#99f6e4",
    headerMuted: "#ccfbf1",
    pageBg: "#f0fdfa"
  },
  contact: {
    accent: "#0284c7",
    soft: "#f0f9ff",
    strong: "#075985",
    border: "#bae6fd",
    headerFrom: "#082f49",
    headerTo: "#0369a1",
    headerAccent: "#7dd3fc",
    headerMuted: "#e0f2fe",
    pageBg: "#f0f9ff"
  },
  partnership: {
    accent: "#0d9488",
    soft: "#f0fdfa",
    strong: "#115e59",
    border: "#99f6e4",
    headerFrom: "#042f2e",
    headerTo: "#0f766e",
    headerAccent: "#5eead4",
    headerMuted: "#ccfbf1",
    pageBg: "#f0fdfa"
  },
  newsletter: {
    accent: "#16a34a",
    soft: "#f0fdf4",
    strong: "#166534",
    border: "#bbf7d0",
    headerFrom: "#052e16",
    headerTo: "#15803d",
    headerAccent: "#86efac",
    headerMuted: "#dcfce7",
    pageBg: "#f7fee7"
  },
  product: {
    accent: "#0891b2",
    soft: "#ecfeff",
    strong: "#155e75",
    border: "#a5f3fc",
    headerFrom: "#083344",
    headerTo: "#0e7490",
    headerAccent: "#67e8f9",
    headerMuted: "#cffafe",
    pageBg: "#ecfeff"
  },
  service: {
    accent: "#7c3aed",
    soft: "#f5f3ff",
    strong: "#4c1d95",
    border: "#ddd6fe",
    headerFrom: "#2e1065",
    headerTo: "#6d28d9",
    headerAccent: "#c4b5fd",
    headerMuted: "#ede9fe",
    pageBg: "#faf5ff"
  },
  careers: {
    accent: "#059669",
    soft: "#ecfdf5",
    strong: "#065f46",
    border: "#a7f3d0",
    headerFrom: "#064e3b",
    headerTo: "#047857",
    headerAccent: "#6ee7b7",
    headerMuted: "#d1fae5",
    pageBg: "#f0fdf4"
  },
  awards: {
    accent: "#7c3aed",
    soft: "#f5f3ff",
    strong: "#4c1d95",
    border: "#ddd6fe",
    headerFrom: "#2e1065",
    headerTo: "#7c2d12",
    headerAccent: "#fbbf24",
    headerMuted: "#fef3c7",
    pageBg: "#fffbeb"
  },
  certificate: {
    accent: "#b45309",
    soft: "#fffbeb",
    strong: "#78350f",
    border: "#fde68a",
    headerFrom: "#451a03",
    headerTo: "#b45309",
    headerAccent: "#fbbf24",
    headerMuted: "#fef3c7",
    pageBg: "#fffbeb"
  },
  success: {
    accent: "#047857",
    soft: "#ecfdf5",
    strong: "#064e3b",
    border: "#a7f3d0",
    headerFrom: "#064e3b",
    headerTo: "#047857",
    headerAccent: "#6ee7b7",
    headerMuted: "#d1fae5",
    pageBg: "#f0fdf4"
  },
  warning: {
    accent: "#b45309",
    soft: "#fffbeb",
    strong: "#78350f",
    border: "#fde68a",
    headerFrom: "#451a03",
    headerTo: "#92400e",
    headerAccent: "#fbbf24",
    headerMuted: "#fef3c7",
    pageBg: "#fffbeb"
  },
  danger: {
    accent: "#b91c1c",
    soft: "#fef2f2",
    strong: "#7f1d1d",
    border: "#fecaca",
    headerFrom: "#450a0a",
    headerTo: "#991b1b",
    headerAccent: "#fca5a5",
    headerMuted: "#fee2e2",
    pageBg: "#fff1f2"
  }
};
const TEMPLATE_TONES = {
  contact_admin: "admin",
  contact_confirmation: "contact",
  contact_status: "contact",
  partnership_admin: "admin",
  partnership_confirmation: "partnership",
  partnership_status: "partnership",
  newsletter: "newsletter",
  newsletter_unsubscribe: "warning",
  account_welcome: "account",
  account_login: "security",
  account_profile_updated: "account",
  account_profile_photo_updated: "account",
  account_email_changed: "security",
  account_email_changed_old: "warning",
  account_deleted: "danger",
  account_role_updated: "admin",
  account_admin: "admin",
  admin_alert: "admin",
  product_inquiry_admin: "admin",
  product_inquiry_confirmation: "product",
  product_inquiry_status: "product",
  cart_inquiry_admin: "admin",
  cart_inquiry_confirmation: "product",
  service_quote_admin: "admin",
  service_quote_confirmation: "service",
  service_quote_status: "service",
  awards_nomination_confirmation: "awards",
  awards_nomination_admin: "admin",
  awards_status: "awards",
  awards_deleted: "warning",
  job_application_admin: "admin",
  job_application_confirmation: "careers",
  job_application_status: "careers",
  job_application_manual: "careers",
  certificate: "certificate",
  password_reset: "danger",
  password_changed: "security"
};
const TEMPLATE_TONE_PREFIXES = [["contact_", "contact"], ["partnership_", "partnership"], ["newsletter", "newsletter"], ["account_", "account"], ["product_", "product"], ["cart_", "product"], ["service_", "service"], ["awards_", "awards"], ["job_application_", "careers"], ["password_", "security"]];
const emailTemplateContext = new AsyncLocalStorage();
const resolveTemplateTone = (tone = "default", category = "") => {
  const explicitTone = cleanString(tone, "default").toLowerCase();
  if (explicitTone && explicitTone !== "default") {
    return TONES[explicitTone] ? explicitTone : "default";
  }
  const normalizedCategory = cleanString(category).toLowerCase();
  const mappedTone = TEMPLATE_TONES[normalizedCategory] || TEMPLATE_TONE_PREFIXES.find(([prefix]) => normalizedCategory.startsWith(prefix))?.[1] || "default";
  return TONES[mappedTone] ? mappedTone : "default";
};
const escapeHtml = (value = "") => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const normalizeText = (value, fallback = "Not provided") => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
};
const normalizeStatus = status => STATUS_LABELS[status] || normalizeText(status, "Updated");
const JOB_APPLICATION_STATUS_CONTENT = {
  pending: {
    tone: "default",
    title: "Application Received",
    subject: "Your application is in our hiring queue",
    preheader: "Your application is waiting for review by our recruitment team.",
    intro: "Your application is safely in our hiring queue. Our recruitment team will review it and contact you if we need anything else.",
    nextSteps: ["We will review your submitted details and documents.", "If your profile matches the role requirements, we will contact you with the next step.", "You can reply to this email if you need to update your contact details or documents."]
  },
  reviewed: {
    tone: "default",
    title: "Application Reviewed",
    subject: "Your application has been reviewed",
    preheader: "Our team has reviewed your application.",
    intro: "Our recruitment team has reviewed your application. Thank you for the time and care you put into applying to SAPTech Uganda.",
    nextSteps: ["We are comparing your application with the role requirements and current hiring priorities.", "If we need a follow-up conversation, we will contact you using the details you provided.", "Please keep an eye on your email and phone for any updates from our team."]
  },
  interviewed: {
    tone: "success",
    title: "Interview Stage",
    subject: "Your application has moved to the interview stage",
    preheader: "You have progressed to the interview stage.",
    intro: "Good news — your application has progressed to the interview stage. Our team will coordinate the next conversation with you.",
    nextSteps: ["We will share interview details or scheduling instructions with you.", "Please prepare to discuss your experience, projects, strengths, and interest in the role.", "If your availability changes, reply to this email so we can plan accordingly."]
  },
  accepted: {
    tone: "success",
    title: "Application Accepted",
    subject: "Congratulations — your application has been accepted",
    preheader: "Your application has been accepted by SAPTech Uganda.",
    intro: "Congratulations. We are pleased to let you know that your application has been accepted. We appreciate your interest in joining SAPTech Uganda.",
    nextSteps: ["Our team will contact you with the next onboarding or offer steps.", "Please keep your email and phone available for follow-up communication.", "If any of your personal details have changed, reply to this email so we can update our records."]
  },
  rejected: {
    tone: "warning",
    title: "Application Decision",
    subject: "Update on your SAPTech Uganda application",
    preheader: "We have an update on your job application.",
    intro: "Thank you for your interest in SAPTech Uganda and for taking the time to apply. After reviewing your application, we will not be moving forward with it for this role.",
    nextSteps: ["We genuinely appreciate the time you invested in your application.", "You are welcome to apply for future roles that match your skills and interests.", "We wish you the very best in your career journey."]
  }
};
const getJobApplicationStatusContent = status => JOB_APPLICATION_STATUS_CONTENT[status] || {
  tone: "default",
  title: "Application Status Update",
  subject: `Application update: ${normalizeStatus(status)}`,
  preheader: "Your job application status has changed.",
  intro: "There is an update on your job application with SAPTech Uganda.",
  nextSteps: ["Please review the update below.", "Our team will contact you if any further action is needed.", "You can reply to this email if you have a question about your application."]
};
const formatFileReference = (name, url) => {
  if (!name && !url) return "";
  if (name && url) return `${name} - ${url}`;
  return name || url;
};
const collectRecipients = (...values) => values.flatMap(value => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
});
const normalizeProviderMode = mode => {
  const normalized = String(mode || "auto").trim().toLowerCase();
  return EMAIL_PROVIDER_MODES.includes(normalized) ? normalized : "auto";
};
const cleanString = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  const cleaned = String(value).trim();
  return cleaned || fallback;
};
const normalizeComparableText = (value = "") => String(value).trim().replace(/\s+/g, " ").toLowerCase();
const cleanBrandTagline = (value, fallback = CURRENT_EMAIL_BRAND_TAGLINE) => {
  const cleaned = cleanString(value, fallback);
  return LEGACY_EMAIL_BRAND_TAGLINES.has(normalizeComparableText(cleaned)) ? CURRENT_EMAIL_BRAND_TAGLINE : cleaned;
};
const summarizeUserAgent = value => {
  const text = cleanString(value, "Not available");
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
};
const cleanNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};
const cleanBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};
const firstEnv = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
};
const mergeDefined = (base = {}, override = {}) => {
  const merged = {
    ...base
  };
  Object.entries(override || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    merged[key] = value;
  });
  return merged;
};
const pickPublicEmailConfig = (config = {}) => ({
  providerMode: config.providerMode,
  brand: config.brand ? {
    ...config.brand,
    tagline: cleanBrandTagline(config.brand.tagline)
  } : undefined,
  sender: config.sender,
  mailjet: config.mailjet ? {
    apiUrl: config.mailjet.apiUrl,
    fromEmail: config.mailjet.fromEmail,
    timeoutMs: config.mailjet.timeoutMs,
    sandboxMode: config.mailjet.sandboxMode
  } : undefined,
  gmail: config.gmail ? {
    host: config.gmail.host,
    port: config.gmail.port,
    secure: config.gmail.secure,
    fromEmail: config.gmail.fromEmail
  } : undefined
});
module.exports = {
  fs,
  path,
  crypto,
  nodemailer,
  AsyncLocalStorage,
  DEFAULT_MAILJET_API_URL,
  EMAIL_PROVIDER_SETTING_KEY,
  EMAIL_PUBLIC_CONFIG_SETTING_KEY,
  EMAIL_PROVIDER_MODES,
  CURRENT_EMAIL_BRAND_TAGLINE,
  LEGACY_EMAIL_BRAND_TAGLINE_WORDS,
  LEGACY_EMAIL_BRAND_TAGLINE,
  LEGACY_EMAIL_BRAND_TAGLINES,
  PROVIDER_DISPLAY_NAMES,
  STATUS_LABELS,
  TONES,
  TEMPLATE_TONES,
  TEMPLATE_TONE_PREFIXES,
  emailTemplateContext,
  resolveTemplateTone,
  escapeHtml,
  normalizeText,
  normalizeStatus,
  JOB_APPLICATION_STATUS_CONTENT,
  getJobApplicationStatusContent,
  formatFileReference,
  collectRecipients,
  normalizeProviderMode,
  cleanString,
  normalizeComparableText,
  cleanBrandTagline,
  summarizeUserAgent,
  cleanNumber,
  cleanBoolean,
  firstEnv,
  mergeDefined,
  pickPublicEmailConfig
};
