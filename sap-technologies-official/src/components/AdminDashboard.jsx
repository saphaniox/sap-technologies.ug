import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { LoadingOverlay, LoadingButton, showAlert, Swal } from "../utils/alerts.jsx";
import { getImageUrl, PLACEHOLDERS } from "../utils/imageUrl";
import { removeById, upsertById } from "../utils/realtimeCollection";
import BackToTop from "./BackToTop";
import ServiceForm from "./ServiceForm";
import ProjectForm from "./ProjectForm";
import PartnerForm from "./PartnerForm";
import ProductForm from "./ProductForm";
import GalleryForm from "./GalleryForm";
import JobForm from "./JobForm";
import AdminDebugTools from "./AdminDebugTools";
import AwardsAdmin from "./AwardsAdmin";
import VisitorAnalytics from "./VisitorAnalytics";
import "../styles/AdminDashboard.css";

const getPartnerDisplayName = (partner) => partner?.name?.trim() || "Logo-only partner";
const getPartnerInitial = (partner) => getPartnerDisplayName(partner).charAt(0).toUpperCase();

const NOT_REPORTED = "Not reported yet";

const getHealthValue = (source, paths, fallback = NOT_REPORTED) => {
  if (!source) return fallback;

  for (const path of paths) {
    const value = path.split(".").reduce((current, key) => current?.[key], source);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }

  return fallback;
};

const formatDashboardNumber = (value) => (
  typeof value === "number" ? value.toLocaleString() : value || "0"
);

const extractList = (response, keys = []) => {
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

const getGalleryMedia = (item) => {
  if (Array.isArray(item?.media) && item.media.length > 0) {
    return item.media
      .filter((media) => media?.url)
      .map((media) => ({
        ...media,
        type: media.type === "video" || media.mimeType?.startsWith("video/") ? "video" : "image"
      }));
  }

  return item?.image
    ? [{ url: item.image, type: "image", originalName: item.title || "Gallery image" }]
    : [];
};

const normalizePagination = (pagination = {}, fallbackPage = 1) => {
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

const formatMetricValue = (value, fallback = NOT_REPORTED) => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  return String(value);
};

const formatPercent = (value) => {
  if (value === undefined || value === null || value === "") return NOT_REPORTED;
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return `${number > 1 ? number.toFixed(1) : (number * 100).toFixed(1)}%`;
};

const formatBytes = (value) => {
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

const formatMemoryValue = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return NOT_REPORTED;

  if (number > 1024 * 1024) return formatBytes(number);
  return `${number.toLocaleString()} MB`;
};

const formatDateTime = (value) => {
  if (!value) return NOT_REPORTED;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_REPORTED;
  return date.toLocaleString();
};

const getStatusClass = (value) => {
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

const DEFAULT_EMAIL_CONFIG_FORM = {
  providerMode: "auto",
  brand: {
    name: "SAPTech Uganda",
    legalName: "SAPTech Uganda",
    awardsName: "SAPTech Awards 2026",
    websiteUrl: "https://saptechug.com",
    logoUrl: "https://saptechug.com/images/logo.png",
    tagline: "Technology that moves people and businesses forward",
    phone: "+256 706 564 628",
    address: "Ndejje, Kampala, Uganda",
    contactEmail: "info@saptechug.com"
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

const mergeEmailConfigForm = (config = {}, emailDelivery = {}) => ({
  providerMode: config.providerMode || emailDelivery.mode || DEFAULT_EMAIL_CONFIG_FORM.providerMode,
  brand: {
    ...DEFAULT_EMAIL_CONFIG_FORM.brand,
    ...(config.brand || {})
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
});

const AdminDashboard = ({ user, onClose }) => {
  // Main navigation state - tracks which admin section is currently active
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false); // sidebar collapsed by default on mobile
  
  // Data states - all the information we display in different admin sections
  const [dashboardStats, setDashboardStats] = useState(null); // Overview numbers and charts
  const [systemHealth, setSystemHealth] = useState(null); // Server performance info
  const [systemHealthFetchedAt, setSystemHealthFetchedAt] = useState(null); // Last health refresh time in the admin UI
  const [users, setUsers] = useState([]); // All registered users
  const [contacts, setContacts] = useState([]); // Contact form submissions
  const [newsletters, setNewsletters] = useState([]); // Newsletter subscribers
  const [services, setServices] = useState([]); // Services we offer
  const [projects, setProjects] = useState([]); // Portfolio projects
  const [partners, setPartners] = useState([]); // Business partners
  const [partnershipRequests, setPartnershipRequests] = useState([]); // New partnership requests
  const [products, setProducts] = useState([]); // Company products
  const [productInquiries, setProductInquiries] = useState([]); // Product inquiry submissions
  const [serviceQuotes, setServiceQuotes] = useState([]); // Service quote requests
  const [galleryItems, setGalleryItems] = useState([]); // Gallery images
  const [jobs, setJobs] = useState([]); // Job postings
  const [jobApplications, setJobApplications] = useState([]); // Job applications
  
  // UI state for loading and error handling
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false); // For updates/deletions without blocking UI
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Success/error messages for user actions
  
  // Pagination states - for handling large lists of data
  // We don't want to load 1000 users at once, so we paginate them
  const [usersPagination, setUsersPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [contactsPagination, setContactsPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [newslettersPagination, setNewslettersPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [servicesPagination, setServicesPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [projectsPagination, setProjectsPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [partnersPagination, setPartnersPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [partnershipRequestsPagination, setPartnershipRequestsPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [productsPagination, setProductsPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [productInquiriesPagination, setProductInquiriesPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [serviceQuotesPagination, setServiceQuotesPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [jobApplicationsPagination, setJobApplicationsPagination] = useState({ currentPage: 1, totalPages: 1 });

  // Search and filter states
  const [usersSearch, setUsersSearch] = useState("");
  const [usersRoleFilter, setUsersRoleFilter] = useState("");
  const [contactsSearch, setContactsSearch] = useState("");
  const [contactsStatusFilter, setContactsStatusFilter] = useState("");
  const [newslettersSearch, setNewslettersSearch] = useState("");
  const [servicesSearch, setServicesSearch] = useState("");
  const [servicesCategoryFilter, setServicesCategoryFilter] = useState("");
  const [servicesStatusFilter, setServicesStatusFilter] = useState("");
  const [projectsSearch, setProjectsSearch] = useState("");
  const [projectsCategoryFilter, setProjectsCategoryFilter] = useState("");
  const [projectsStatusFilter, setProjectsStatusFilter] = useState("");
  const [partnersSearch, setPartnersSearch] = useState("");
  const [partnersStatusFilter, setPartnersStatusFilter] = useState("");
  const [partnershipRequestsSearch, setPartnershipRequestsSearch] = useState("");
  const [partnershipRequestsStatusFilter, setPartnershipRequestsStatusFilter] = useState("");
  const [productsSearch, setProductsSearch] = useState("");
  const [productsCategoryFilter, setProductsCategoryFilter] = useState("");
  const [productsStatusFilter, setProductsStatusFilter] = useState("");
  const [productInquiriesSearch, setProductInquiriesSearch] = useState("");
  const [productInquiriesStatusFilter, setProductInquiriesStatusFilter] = useState("");
  const [serviceQuotesSearch, setServiceQuotesSearch] = useState("");
  const [serviceQuotesStatusFilter, setServiceQuotesStatusFilter] = useState("");
  const [gallerySearch, setGallerySearch] = useState("");
  const [jobsSearch, setJobsSearch] = useState("");
  const [jobApplicationsSearch, setJobApplicationsSearch] = useState("");
  const [jobApplicationsStatusFilter, setJobApplicationsStatusFilter] = useState("");
  
  // Settings states
  const [currentSignature, setCurrentSignature] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [emailSettings, setEmailSettings] = useState(null);
  const [emailConfigForm, setEmailConfigForm] = useState(DEFAULT_EMAIL_CONFIG_FORM);
  const [savingEmailProvider, setSavingEmailProvider] = useState(false);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [settingsSubTab, setSettingsSubTab] = useState("email");
  const [allCertificates, setAllCertificates] = useState([]);
  const [certificatesPagination, setCertificatesPagination] = useState({ currentPage: 1, totalPages: 1, totalCertificates: 0 });
  const [certificatesSearch, setCertificatesSearch] = useState("");
  const [certificatesTypeFilter, setCertificatesTypeFilter] = useState("");

  // Form states for creating/editing
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showGalleryForm, setShowGalleryForm] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingGallery, setEditingGallery] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [hasFetchedInitialData, setHasFetchedInitialData] = useState(false);

  // Utility function to set message with auto-dismissal
  const setAutoMessage = (msg, isError = false) => {
    setMessage(msg);
    const timeout = isError ? 6000 : 4000; // Longer timeout for errors
    setTimeout(() => setMessage(""), timeout);
  };

  useEffect(() => {
    // Prevent duplicate calls in React Strict Mode
    if (!hasFetchedInitialData) {
      setHasFetchedInitialData(true);
      fetchDashboardData();
    }
  }, []);

  useEffect(() => {
    // Fetch data when tab changes
    switch (activeTab) {
      case "overview":
      case "operations":
        fetchDashboardStats();
        fetchSystemHealth();
        break;
      case "users":
        fetchUsers();
        break;
      case "contacts":
        fetchContacts();
        break;
      case "newsletters":
        fetchNewsletters();
        break;
      case "services":
        fetchServices();
        break;
      case "projects":
        fetchProjects();
        break;
      case "partners":
        fetchPartners();
        break;
      case "partnership-requests":
        fetchPartnershipRequests();
        break;
      case "gallery":
        fetchGalleryItems();
        break;
      case "jobs":
        fetchJobs();
        break;
      case "job-applications":
        fetchJobApplications();
        break;
      case "products":
        fetchProducts();
        break;
      case "product-inquiries":
        fetchProductInquiries();
        break;
      case "service-quotes":
        fetchServiceQuotes();
        break;
      case "awards":
        // Awards data is loaded by the AwardsAdmin component itself
        break;
      case "settings":
        if (settingsSubTab === "signature") {
          fetchCurrentSignature();
        } else if (settingsSubTab === "certificates") {
          fetchAllCertificates(certificatesPagination.currentPage);
        } else if (settingsSubTab === "email") {
          fetchEmailSettings();
        }
        break;
    }
  }, [activeTab, settingsSubTab, certificatesSearch, certificatesTypeFilter, certificatesPagination.currentPage, usersSearch, usersRoleFilter, contactsSearch, contactsStatusFilter, newslettersSearch, servicesSearch, servicesCategoryFilter, servicesStatusFilter, projectsSearch, projectsCategoryFilter, projectsStatusFilter, partnersSearch, partnersStatusFilter, partnershipRequestsSearch, partnershipRequestsStatusFilter, productsSearch, productsCategoryFilter, productsStatusFilter, productInquiriesSearch, productInquiriesStatusFilter, serviceQuotesSearch, serviceQuotesStatusFilter, jobApplicationsSearch, jobApplicationsStatusFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      switch (activeTab) {
        case "overview":
        case "operations":
          fetchDashboardStats();
          fetchSystemHealth();
          break;
        case "users":
          fetchUsers(usersPagination.currentPage);
          break;
        case "contacts":
          fetchContacts(contactsPagination.currentPage);
          break;
        case "newsletters":
          fetchNewsletters(newslettersPagination.currentPage);
          break;
        case "services":
          fetchServices(servicesPagination.currentPage);
          break;
        case "projects":
          fetchProjects(projectsPagination.currentPage);
          break;
        case "partners":
          fetchPartners(partnersPagination.currentPage);
          break;
        case "partnership-requests":
          fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
          break;
        case "gallery":
          fetchGalleryItems();
          break;
        case "jobs":
          fetchJobs();
          break;
        case "job-applications":
          fetchJobApplications(jobApplicationsPagination.currentPage);
          break;
        case "products":
          fetchProducts(productsPagination.currentPage);
          break;
        case "product-inquiries":
          fetchProductInquiries(productInquiriesPagination.currentPage);
          break;
        case "service-quotes":
          fetchServiceQuotes(serviceQuotesPagination.currentPage);
          break;
        case "settings":
          if (settingsSubTab === "signature") {
            fetchCurrentSignature();
          } else if (settingsSubTab === "certificates") {
            fetchAllCertificates(certificatesPagination.currentPage);
          } else if (settingsSubTab === "email") {
            fetchEmailSettings();
          }
          break;
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeTab, settingsSubTab, certificatesPagination.currentPage, usersPagination.currentPage, contactsPagination.currentPage, newslettersPagination.currentPage, servicesPagination.currentPage, projectsPagination.currentPage, partnersPagination.currentPage, partnershipRequestsPagination.currentPage, productsPagination.currentPage, productInquiriesPagination.currentPage, serviceQuotesPagination.currentPage, jobApplicationsPagination.currentPage, certificatesSearch, certificatesTypeFilter, usersSearch, usersRoleFilter, contactsSearch, contactsStatusFilter, newslettersSearch, servicesSearch, servicesCategoryFilter, servicesStatusFilter, projectsSearch, projectsCategoryFilter, projectsStatusFilter, partnersSearch, partnersStatusFilter, partnershipRequestsSearch, partnershipRequestsStatusFilter, productsSearch, productsCategoryFilter, productsStatusFilter, productInquiriesSearch, productInquiriesStatusFilter, serviceQuotesSearch, serviceQuotesStatusFilter, jobApplicationsSearch, jobApplicationsStatusFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError("");
      // Fetch critical dashboard data
      await fetchDashboardStats();
      // Fetch system health (less critical, don't block on failure)
      await fetchSystemHealth();
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      if (error.message?.includes("Authentication") || error.message?.includes("401")) {
        setError("Your session has expired. Please log in again.");
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(error.message || "Something went wrong loading the dashboard. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await apiService.getAdminDashboardStats();
      setDashboardStats(response.data);
      if (response.data?.emailDelivery) {
        setEmailSettings((current) => ({
          ...(current || {}),
          emailDelivery: response.data.emailDelivery
        }));
      }
    } catch (error) {
      console.error("Stats fetch error:", error);
      if (error.message === "Authentication required" || error.message?.includes("Authentication")) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        // Close admin dashboard and trigger re-login
        setTimeout(() => {
          if (onClose) onClose();
        }, 2000);
      } else {
        setError("Couldn't load the dashboard stats. Please try again.");
      }
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await apiService.getSystemHealth();
      setSystemHealth(response.data.system || response.data);
      const emailDelivery = response.data.system?.email || response.data?.email;
      if (emailDelivery) {
        setEmailSettings((current) => ({
          ...(current || {}),
          emailDelivery
        }));
      }
      setSystemHealthFetchedAt(new Date());
    } catch (error) {
      console.error("System health fetch error:", error);
      if (error.message === "Authentication required" || error.message?.includes("Authentication")) {
        // Already handled by fetchDashboardStats
        return;
      } else {
        console.error("Failed to load system health:", error.message);
      }
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: usersSearch,
        role: usersRoleFilter
      };
      const response = await apiService.getAllUsers(params);
      setUsers(response.data.users);
      setUsersPagination(response.data.pagination);
    } catch (error) {
      console.error("Users fetch error:", error);
    }
  };

  const fetchContacts = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: contactsSearch,
        status: contactsStatusFilter
      };
      const response = await apiService.getAllContacts(params);
      setContacts(response.data.contacts);
      setContactsPagination(response.data.pagination);
    } catch (error) {
      console.error("Contacts fetch error:", error);
    }
  };

  const fetchNewsletters = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: newslettersSearch
      };
      const response = await apiService.getAllNewsletterSubscribers(params);
      setNewsletters(response.data.subscribers);
      setNewslettersPagination(response.data.pagination);
    } catch (error) {
      console.error("Newsletters fetch error:", error);
    }
  };

  const fetchServices = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 50, // Increased from 10 to show more services per page
        search: servicesSearch,
        category: servicesCategoryFilter,
        status: servicesStatusFilter
      };
      const response = await apiService.getAllServices(params);
      setServices(response.data.services);
      setServicesPagination(response.data.pagination);
    } catch (error) {
      console.error(" Services fetch error:", error);
      console.error("Error details:", error.message, error.response);
    }
  };

  const fetchProjects = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: projectsSearch,
        category: projectsCategoryFilter,
        status: projectsStatusFilter
      };
      const response = await apiService.getAllProjects(params);
      setProjects(response.data.projects);
      setProjectsPagination(response.data.pagination);
    } catch (error) {
      console.error("Projects fetch error:", error);
    }
  };

  const fetchProducts = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: productsSearch,
        category: productsCategoryFilter,
        status: productsStatusFilter === "all" ? "" : productsStatusFilter
      };
      
      const response = await apiService.getProductsAdmin(params);
      
      if (response && response.data) {
        setProducts(response.data.products || []);
        setProductsPagination(response.data.pagination || { currentPage: 1, totalPages: 1 });
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(" Products fetch error:", error);
      console.error("Error details:", error.message, error.response);
      setProducts([]);
    }
  };

  const fetchProductInquiries = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: productInquiriesSearch,
        status: productInquiriesStatusFilter === "all" ? "" : productInquiriesStatusFilter
      };
      
      const response = await apiService.getProductInquiries(params);
      
      if (response && response.data) {
        setProductInquiries(response.data.inquiries || []);
        // Backend returns: totalPages, currentPage, total (not wrapped in pagination object)
        setProductInquiriesPagination({
          currentPage: parseInt(response.data.currentPage) || 1,
          totalPages: parseInt(response.data.totalPages) || 1,
          totalInquiries: response.data.total || 0,
          hasPrev: parseInt(response.data.currentPage) > 1,
          hasNext: parseInt(response.data.currentPage) < parseInt(response.data.totalPages)
        });
      } else {
        setProductInquiries([]);
      }
    } catch (error) {
      console.error(" Product inquiries fetch error:", error);
      console.error("Error details:", error.message, error.response);
      setProductInquiries([]);
    }
  };

  const fetchServiceQuotes = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: serviceQuotesSearch,
        status: serviceQuotesStatusFilter === "all" ? "" : serviceQuotesStatusFilter
      };
      
      const response = await apiService.getServiceQuotes(params);
      
      if (response && response.data) {
        setServiceQuotes(response.data.quotes || []);
        // Backend returns: pagination: { page, limit, total, pages }
        const pagination = response.data.pagination || {};
        setServiceQuotesPagination({
          currentPage: parseInt(pagination.page) || 1,
          totalPages: parseInt(pagination.pages) || 1,
          totalQuotes: pagination.total || 0,
          hasPrev: parseInt(pagination.page) > 1,
          hasNext: parseInt(pagination.page) < parseInt(pagination.pages)
        });
      } else {
        console.warn(" No data in response");
        setServiceQuotes([]);
      }
    } catch (error) {
      console.error(" Service quotes fetch error:", error);
      console.error("Error details:", error.message, error.response);
      setServiceQuotes([]);
    }
  };

  const fetchPartners = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: partnersSearch,
        status: partnersStatusFilter
      };

      const response = await apiService.getAdminPartners(params);
      const pagination = response?.data?.pagination || response?.pagination;
      setPartners(extractList(response, ["partners"]));
      setPartnersPagination(normalizePagination(pagination, page));
    } catch (error) {
      console.error("Partners fetch error:", error);
      setPartners([]);
    }
  };

  const fetchPartnershipRequests = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 10,
        search: partnershipRequestsSearch,
        status: partnershipRequestsStatusFilter
      };

      const response = await apiService.getPartnershipRequests(params);
      const pagination = response?.data?.pagination || response?.pagination;
      setPartnershipRequests(extractList(response, ["partnershipRequests"]));
      setPartnershipRequestsPagination(normalizePagination(pagination, page));
    } catch (error) {
      console.error("Partnership requests fetch error:", error);
      setPartnershipRequests([]);
    }
  };

  const fetchGalleryItems = async () => {
    try {
      const response = await apiService.getAdminGallery();
      setGalleryItems(extractList(response, ["items", "gallery", "galleryItems"]));
    } catch (error) {
      console.error("Gallery fetch error:", error);
      setGalleryItems([]);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await apiService.getAdminJobs();
      setJobs(extractList(response, ["jobs"]));
    } catch (error) {
      console.error("Jobs fetch error:", error);
      setJobs([]);
    }
  };

  const fetchJobApplications = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 20,
        search: jobApplicationsSearch,
        status: jobApplicationsStatusFilter
      };
      const response = await apiService.getAllJobApplications(params);
      const pagination = response?.data?.pagination || response?.pagination;
      setJobApplications(extractList(response, ["applications"]));
      setJobApplicationsPagination(normalizePagination(pagination, page));
    } catch (error) {
      console.error("Job applications fetch error:", error);
      setJobApplications([]);
      setJobApplicationsPagination({ currentPage: 1, totalPages: 1 });
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user"s role to ${newRole}?`)) {
      return;
    }

    try {
      await apiService.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((user) => (
        user._id === userId ? { ...user, role: newRole } : user
      )));
      setAutoMessage(`User role updated to ${newRole} successfully`);
      fetchUsers(usersPagination.currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      setAutoMessage("Couldn't update user role: " + error.message);
    }
  };

  const handleUserDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUserAdmin(userId);
      // Instantly remove from UI
      setUsers(prev => prev.filter(user => user._id !== userId));
      setAutoMessage(`User "${userName}" removed successfully`);
      // Refetch to ensure data consistency and update stats
      fetchUsers(usersPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete user: " + error.message);
    }
  };

  const handleContactStatusUpdate = async (contactId, newStatus) => {
    try {
      await apiService.updateContactStatus(contactId, newStatus);
      setContacts((prev) => prev.map((contact) => (
        contact._id === contactId ? { ...contact, status: newStatus } : contact
      )));
      setAutoMessage(`Contact status updated to ${newStatus}`);
      fetchContacts(contactsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update contact status: " + error.message);
    }
  };

  const handleContactDelete = async (contactId, contactName) => {
    if (!window.confirm(`Are you sure you want to delete contact from "${contactName}"?`)) {
      return;
    }

    try {
      await apiService.deleteContactAdmin(contactId);
      // Instantly remove from UI
      setContacts(prev => prev.filter(contact => contact._id !== contactId));
      setAutoMessage("Contact removed successfully");
      // Refetch to ensure data consistency and update stats
      fetchContacts(contactsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete contact: " + error.message);
    }
  };

  const handleNewsletterDelete = async (subscriberId, email) => {
    if (!window.confirm(`Are you sure you want to unsubscribe "${email}" from the newsletter?`)) {
      return;
    }

    try {
      await apiService.deleteNewsletterSubscriber(subscriberId);
      // Instantly remove from UI
      setNewsletters(prev => prev.filter(subscriber => subscriber._id !== subscriberId));
      setAutoMessage("Subscriber removed successfully");
      // Refetch to ensure data consistency and update stats
      fetchNewsletters(newslettersPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't remove subscriber: " + error.message);
    }
  };

  // Service handlers
  const handleServiceSubmit = async (savedService) => {
    if (savedService?._id) {
      setServices((prev) => upsertById(prev, savedService, { orderKey: "order" }));
    }

    setEditingService(null);
    setShowServiceForm(false);
    fetchServices(servicesPagination.currentPage);
    fetchDashboardStats();
  };

  const handleServiceEdit = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleServiceDelete = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete service "${serviceName}"?`)) {
      return;
    }

    try {
      await apiService.deleteService(serviceId);
      setServices((prev) => removeById(prev, serviceId));
      setAutoMessage("Service removed successfully");
      fetchServices(servicesPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete service: " + error.message);
    }
  };

  const handleServiceToggleFeatured = async (serviceId) => {
    try {
      await apiService.toggleServiceFeatured(serviceId);
      setAutoMessage("Service featured status updated");
      fetchServices(servicesPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update service featured status: " + error.message);
    }
  };

  // Project handlers
  const handleProjectSubmit = async (savedProject) => {
    if (savedProject?._id) {
      setProjects((prev) => upsertById(prev, savedProject, { orderKey: "order" }));
    }

    setEditingProject(null);
    setShowProjectForm(false);
    fetchProjects(projectsPagination.currentPage);
    fetchDashboardStats();
  };

  const handleProjectEdit = (project) => {
    setEditingProject(project);
    setShowProjectForm(true);
  };

  const handleProjectDelete = async (projectId, projectName) => {
    if (!window.confirm(`Are you sure you want to delete project "${projectName}"?`)) {
      return;
    }

    try {
      await apiService.deleteProject(projectId);
      setProjects((prev) => removeById(prev, projectId));
      setAutoMessage("Project removed successfully");
      fetchProjects(projectsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete project: " + error.message);
    }
  };

  const handleProjectToggleFeatured = async (projectId) => {
    try {
      await apiService.toggleProjectFeatured(projectId);
      setAutoMessage("Project featured status updated");
      fetchProjects(projectsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update project featured status: " + error.message);
    }
  };

  // Partner management functions
  const handlePartnerSave = async (savedPartner) => {
    try {
      if (savedPartner?._id) {
        setPartners((prev) => upsertById(prev, savedPartner, { orderKey: "order" }));
      }
      setAutoMessage("Partner saved! ");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't save partner: " + error.message);
    }
  };

  const handlePartnerEdit = (partner) => {
    setEditingPartner(partner);
    setShowPartnerForm(true);
  };

  const handlePartnerDelete = async (partnerId, partnerName) => {
    if (!window.confirm(`Are you sure you want to delete partner "${partnerName || "Logo-only partner"}"?`)) {
      return;
    }

    try {
      await apiService.request(`/api/partners/${partnerId}`, {
        method: "DELETE"
      });
      setPartners((prev) => removeById(prev, partnerId));
      setAutoMessage("Partner removed successfully");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't delete partner: " + error.message);
    }
  };

  const handlePartnerToggleActive = async (partnerId) => {
    try {
      const partner = partners.find(p => p._id === partnerId);
      if (!partner) return;

      await apiService.request(`/api/partners/${partnerId}`, {
        method: "PUT",
        body: JSON.stringify({
          isActive: !partner.isActive
        }),
        headers: { "Content-Type": "application/json" }
      });

      setPartners((prev) => prev.map((item) => (
        item._id === partnerId ? { ...item, isActive: !partner.isActive } : item
      )));
      setAutoMessage("Partner status updated");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update partner status: " + error.message);
    }
  };

  // Partnership Request Handlers
  const handlePartnershipRequestStatusUpdate = async (requestId, newStatus) => {
    try {
      await apiService.request(`/api/partnership-requests/${requestId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
        headers: { "Content-Type": "application/json" }
      });

      setPartnershipRequests((prev) => prev.map((request) => (
        request._id === requestId ? { ...request, status: newStatus } : request
      )));
      setAutoMessage("Partnership request status updated");
      fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't update partnership request status: " + error.message, true);
    }
  };

  const handleViewPartnershipRequest = (request) => {
    alert(`Partnership Request Details:

Company: ${request.companyName}
Contact Person: ${request.contactPerson}
Email: ${request.contactEmail}
Website: ${request.website || "Not provided"}
Status: ${request.status}
Submitted: ${new Date(request.createdAt).toLocaleString()}

Description:
${request.description}

${request.adminNotes ? `Admin Notes:\n${request.adminNotes}` : ""}`);
  };

  const handleDeletePartnershipRequest = async (requestId, companyName) => {
    if (!window.confirm(`Are you sure you want to delete the partnership request from ${companyName}?`)) {
      return;
    }

    try {
      await apiService.request(`/api/partnership-requests/${requestId}`, {
        method: "DELETE"
      });

      setPartnershipRequests(prev => prev.filter(request => request._id !== requestId));
      setAutoMessage("Partnership request removed successfully");
      fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Couldn't delete partnership request: " + error.message, true);
    }
  };

  const handleGallerySave = async (savedItem) => {
    if (savedItem?._id) {
      setGalleryItems((prev) => {
        const withoutCurrent = prev.filter((item) => item._id !== savedItem._id);
        return [savedItem, ...withoutCurrent].sort((first, second) => {
          const firstOrder = Number(first.displayOrder || 0);
          const secondOrder = Number(second.displayOrder || 0);
          if (firstOrder !== secondOrder) return firstOrder - secondOrder;
          return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
        });
      });
    }
    setShowGalleryForm(false);
    setEditingGallery(null);
    fetchGalleryItems();
    fetchDashboardStats();
  };

  const handleGalleryEdit = (item) => {
    setEditingGallery(item);
    setShowGalleryForm(true);
  };

  const handleGalleryDelete = async (itemId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title || "this gallery item"}"?`)) {
      return;
    }

    try {
      await apiService.deleteGalleryItem(itemId);
      setGalleryItems((prev) => prev.filter((item) => item._id !== itemId));
      setAutoMessage("Gallery item removed successfully");
      await fetchGalleryItems();
      await fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete gallery item: " + error.message, true);
    }
  };

  const handleJobSave = async (savedJob) => {
    if (savedJob?._id) {
      setJobs((prev) => upsertById(prev, savedJob));
    }

    setShowJobForm(false);
    setEditingJob(null);
    fetchJobs();
    fetchDashboardStats();
  };

  const handleJobEdit = (job) => {
    setEditingJob(job);
    setShowJobForm(true);
  };

  const handleJobDelete = async (jobId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await apiService.deleteJob(jobId);
      setJobs((prev) => removeById(prev, jobId));
      setAutoMessage("Job posting removed successfully");
      fetchJobs();
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't delete job posting: " + error.message, true);
    }
  };

  const handleJobApplicationStatusUpdate = async (applicationId, status) => {
    try {
      await apiService.updateApplicationStatus(applicationId, status);
      setJobApplications((prev) => prev.map((application) => (
        application._id === applicationId ? { ...application, status } : application
      )));
      setAutoMessage("Job application status updated");
      fetchJobApplications(jobApplicationsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Couldn't update job application: " + error.message, true);
    }
  };

  const handleUpdateInquiryStatus = async (inquiryId, newStatus) => {
    try {
      const response = await apiService.updateInquiryStatus(inquiryId, { status: newStatus });
      
      if (response && response.data) {
        setProductInquiries((prev) => prev.map((inquiry) => (
          inquiry._id === inquiryId ? { ...inquiry, status: newStatus } : inquiry
        )));
        setAutoMessage("Product inquiry status updated successfully");
        fetchProductInquiries(productInquiriesPagination.currentPage);
      }
    } catch (error) {
      setAutoMessage("Couldn't update inquiry status: " + error.message, true);
    }
  };

  const handleDeleteInquiry = async (inquiryId, productName) => {
    if (!window.confirm(`Are you sure you want to delete the inquiry for ${productName}?`)) {
      return;
    }

    try {
      const response = await apiService.deleteInquiry(inquiryId);
      
      if (response) {
        // Instantly remove from UI
        setProductInquiries(prev => prev.filter(inquiry => inquiry._id !== inquiryId));
        setAutoMessage("Product inquiry removed successfully");
        // Clear API cache and refetch to ensure data consistency
        try { apiService.clearCache(); } catch { /* ignore */ }
        fetchProductInquiries(productInquiriesPagination.currentPage);
      }
    } catch (error) {
      console.error(" Delete inquiry error:", error);
      setAutoMessage("Couldn't delete inquiry: " + (error.response?.data?.message || error.message), true);
    }
  };

  const handleUpdateQuoteStatus = async (quoteId, newStatus) => {
    try {
      const response = await apiService.updateQuoteStatus(quoteId, { status: newStatus });
      
      if (response && response.data) {
        setServiceQuotes((prev) => prev.map((quote) => (
          quote._id === quoteId ? { ...quote, status: newStatus } : quote
        )));
        setAutoMessage("Service quote status updated successfully");
        fetchServiceQuotes(serviceQuotesPagination.currentPage);
      }
    } catch (error) {
      setAutoMessage("Couldn't update quote status: " + error.message, true);
    }
  };

  const handleDeleteQuote = async (quoteId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete the quote for ${serviceName}?`)) {
      return;
    }

    try {
      const response = await apiService.deleteQuote(quoteId);
      
      if (response) {
        // Instantly remove from UI
        setServiceQuotes(prev => prev.filter(quote => quote._id !== quoteId));
        setAutoMessage("Service quote removed successfully");
        // Refetch to ensure data consistency
        fetchServiceQuotes(serviceQuotesPagination.currentPage);
      }
    } catch (error) {
      setAutoMessage("Couldn't delete quote: " + error.message, true);
    }
  };

  const fetchEmailSettings = async () => {
    try {
      const response = await apiService.getAdminEmailSettings();
      setEmailSettings(response.data);
      setEmailConfigForm(mergeEmailConfigForm(response.data?.publicConfig, response.data?.emailDelivery));
    } catch (error) {
      console.error("Email settings fetch error:", error);
      setAutoMessage("Couldn't load email settings: " + error.message, true);
    }
  };

  const handleEmailProviderChange = async (providerMode) => {
    try {
      setSavingEmailProvider(true);
      const response = await apiService.updateAdminEmailProvider(providerMode);
      setEmailSettings(response.data);
      setEmailConfigForm((current) => ({
        ...current,
        providerMode,
      }));
      setDashboardStats((current) => current
        ? { ...current, emailDelivery: response.data.emailDelivery }
        : current
      );
      setAutoMessage(`Email provider changed to ${providerMode}`);
      fetchDashboardStats();
      fetchSystemHealth();
    } catch (error) {
      console.error("Email provider update error:", error);
      setAutoMessage("Couldn't update email provider: " + error.message, true);
    } finally {
      setSavingEmailProvider(false);
    }
  };

  const updateEmailConfigField = (section, field, value) => {
    setEmailConfigForm((current) => ({
      ...current,
      [section]: {
        ...(current[section] || {}),
        [field]: value
      }
    }));
  };

  const handleEmailSettingsSave = async (event) => {
    event.preventDefault();

    try {
      setSavingEmailSettings(true);
      const response = await apiService.updateAdminEmailSettings(emailConfigForm);
      setEmailSettings(response.data);
      setEmailConfigForm(mergeEmailConfigForm(response.data?.publicConfig, response.data?.emailDelivery));
      setDashboardStats((current) => current
        ? { ...current, emailDelivery: response.data.emailDelivery }
        : current
      );
      setAutoMessage("Email dashboard settings saved");
      fetchDashboardStats();
      fetchSystemHealth();
    } catch (error) {
      console.error("Email settings update error:", error);
      setAutoMessage("Couldn't save email settings: " + error.message, true);
    } finally {
      setSavingEmailSettings(false);
    }
  };

  // Signature management handlers
  const fetchCurrentSignature = async () => {
    try {
      const response = await apiService.request('/api/certificates/signature/current', {
        method: 'GET',
        useCache: false
      });
      
      // Handle both response.signature and response.data patterns
      const signatureData = response.signature || response.data?.signature || response.data;
      
      // Check if signature exists and is not corrupted
      if (signatureData && signatureData.isCorrupted) {
        console.warn(' Signature file is corrupted:', signatureData.actualSize, 'bytes');
        setCurrentSignature(null);
      } else {
        setCurrentSignature(signatureData);
      }
    } catch (error) {
      // No signature configured yet or error loading
      setCurrentSignature(null);
    }
  };

  // Certificates list handler
  const fetchAllCertificates = async (page = 1) => {
    try {
      setUpdating(true);
      const query = new URLSearchParams({
        page: String(page),
        limit: "20",
        search: certificatesSearch,
        type: certificatesTypeFilter
      }).toString();

      const response = await apiService.request(`/api/certificates/all?${query}`, {
        method: 'GET',
        useCache: false
      });
      
      if (response && response.data) {
        setAllCertificates(response.data.certificates);
        setCertificatesPagination(response.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
      setAutoMessage("Couldn't load certificates: " + error.message, true);
    } finally {
      setUpdating(false);
    }
  };

  const handleSignatureUpload = async (e) => {
    e.preventDefault();
    
    if (!signatureFile) {
      const message = "Please select a signature image first.";
      setAutoMessage(message, true);
      showAlert.error("No image selected", message);
      return;
    }

    // Validate file size (minimum 1KB, maximum 5MB)
    const minSize = 1024; // 1KB
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (signatureFile.size < minSize) {
      const message = `Signature file seems too small (${signatureFile.size} bytes, min 1KB). It may be corrupted. Please try a different image.`;
      setAutoMessage(message, true);
      showAlert.error("Image too small", message);
      return;
    }
    
    if (signatureFile.size > maxSize) {
      const message = `That file is too large (${(signatureFile.size / 1024 / 1024).toFixed(2)}MB). Please keep it under 5MB.`;
      setAutoMessage(message, true);
      showAlert.error("Image too large", message);
      return;
    }
    
    if (!signatureFile.type?.startsWith("image/")) {
      const message = `That file type (${signatureFile.type || "unknown"}) is not an image.`;
      setAutoMessage(message, true);
      showAlert.error("Wrong file type", message);
      return;
    }

    setUploadingSignature(true);

    try {
      const formData = new FormData();
      formData.append('signature', signatureFile);

      const response = await apiService.request('/api/certificates/signature/upload', {
        method: 'POST',
        body: formData,
        isFormData: true
      });

      if (response) {
        const sizeKB = (signatureFile.size / 1024).toFixed(2);
        const message = `Signature uploaded! (${sizeKB}KB). Certificates will now include your signature.`;
        setAutoMessage(message);
        await showAlert.success("Signature uploaded", message);
        setSignatureFile(null);
        fetchCurrentSignature();
      }
    } catch (error) {
      const message = "Couldn't upload signature: " + error.message;
      setAutoMessage(message, true);
      await showAlert.error("Upload failed", error.message || "Please try again.");
    } finally {
      setUploadingSignature(false);
    }
  };

  const handleDeleteSignature = async () => {
    if (!window.confirm("Are you sure you want to delete the current signature? Certificates will use default text signature.")) {
      return;
    }

    try {
      await apiService.request('/api/certificates/signature/current', {
        method: 'DELETE'
      });
      setAutoMessage("Signature removed successfully");
      setCurrentSignature(null);
    } catch (error) {
      setAutoMessage("Couldn't delete signature: " + error.message, true);
    }
  };

  const handleDeleteCertificate = async (nominationId, nomineeName) => {
    const result = await Swal.fire({
      title: 'Delete Certificate?',
      html: `
        <p>Are you sure you want to delete the certificate for <strong>${nomineeName}</strong>?</p>
        <p style="color: #dc2626; margin-top: 1rem;">
           This action cannot be undone. The certificate file will be permanently deleted from storage.
        </p>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Delete Certificate',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      setUpdating(true);
      
      const response = await apiService.request(`/api/certificates/delete/${nominationId}`, {
        method: 'DELETE'
      });

      if (response) {
        await Swal.fire({
          icon: 'success',
          title: 'Certificate Deleted!',
          html: `
            <p>The certificate for <strong>${nomineeName}</strong> has been successfully deleted.</p>
            <p style="margin-top: 1rem; color: #059669;">
               Certificate file removed from storage<br>
               Database records cleared<br>
               Cloud storage cleaned (if applicable)
            </p>
          `,
          confirmButtonColor: '#667eea'
        });

        // Refresh the certificate list
        await fetchAllCertificates(certificatesPagination.currentPage);
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
      await Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: error.message || 'Failed to delete certificate. Please try again.',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatUptime = (seconds) => {
    const totalSeconds = Number(seconds);
    if (!Number.isFinite(totalSeconds)) return NOT_REPORTED;

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const getStatusValue = (paths) => {
    const rawValue = getHealthValue(systemHealth, paths, NOT_REPORTED);

    if (rawValue && typeof rawValue === "object") {
      return getHealthValue(rawValue, ["status", "connection", "state", "health"], NOT_REPORTED);
    }

    return rawValue;
  };

  const formatMemoryPair = (memory, usedPaths = ["used", "heapUsed", "rss"], totalPaths = ["total", "heapTotal"]) => {
    if (!memory || typeof memory !== "object") return NOT_REPORTED;

    const used = getHealthValue(memory, usedPaths, null);
    const total = getHealthValue(memory, totalPaths, null);

    if (used !== null && total !== null) {
      return `${formatMemoryValue(used)} / ${formatMemoryValue(total)}`;
    }

    if (used !== null) return formatMemoryValue(used);
    return NOT_REPORTED;
  };

  const formatStoragePair = (storage) => {
    if (!storage || typeof storage !== "object") return NOT_REPORTED;

    const used = getHealthValue(storage, ["used", "usedBytes", "dataSize", "storageSize"], null);
    const total = getHealthValue(storage, ["total", "totalBytes", "allocated", "limit"], null);

    if (used !== null && total !== null) return `${formatBytes(used)} / ${formatBytes(total)}`;
    if (used !== null) return formatBytes(used);
    return NOT_REPORTED;
  };

  const formatCpuLoad = (value) => {
    const formatLoadValue = (item) => {
      const number = Number(item);
      return Number.isFinite(number) ? number.toFixed(2) : String(item);
    };

    if (Array.isArray(value)) {
      return value.map(formatLoadValue).join(" / ");
    }

    if (value && typeof value === "object") {
      const percentage = getHealthValue(value, ["percentage", "percent", "usage"], null);
      const loadAverage = getHealthValue(value, ["loadAverage", "loadavg", "average"], null);

      if (percentage !== null) return formatPercent(percentage);
      if (Array.isArray(loadAverage)) return loadAverage.map(formatLoadValue).join(" / ");
    }

    return formatMetricValue(value);
  };

  const normalizeCollections = (collections) => {
    if (Array.isArray(collections)) return collections;

    if (collections && typeof collections === "object") {
      return Object.entries(collections).map(([name, value]) => (
        value && typeof value === "object"
          ? { name, ...value }
          : { name, count: value }
      ));
    }

    return [];
  };

  const renderOpsMetric = ({ label, value, detail, status, accent = "neutral" }) => (
    <div className={`ops-metric-card accent-${accent}`}>
      <div className="ops-metric-topline">
        <span>{label}</span>
        {status && <span className={`ops-status-dot ${getStatusClass(status)}`} aria-label={`${label} status`} />}
      </div>
      <strong>{formatMetricValue(value)}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );

  const renderDetailRow = (label, value, status) => (
    <div className="ops-detail-row">
      <span>{label}</span>
      <strong className={status ? `ops-text-${getStatusClass(status)}` : ""}>{formatMetricValue(value)}</strong>
    </div>
  );

  const getEmailDelivery = () => (
    emailSettings?.emailDelivery
    || dashboardStats?.emailDelivery
    || getHealthValue(systemHealth, ["email"], null)
    || {}
  );

  const formatStatusLabel = (value) => String(value || "unknown")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  const formatRelativeTime = (value) => {
    if (!value) return NOT_REPORTED;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return NOT_REPORTED;

    const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const renderStatusBreakdown = (title, counts = {}) => {
    const entries = Object.entries(counts).filter(([, count]) => Number(count) > 0);

    return (
      <article className="status-breakdown-card">
        <div className="status-breakdown-title">
          <h4>{title}</h4>
          <span>{formatDashboardNumber(entries.reduce((total, [, count]) => total + Number(count), 0))}</span>
        </div>
        {entries.length ? entries.map(([status, count]) => (
          <div className="status-breakdown-row" key={`${title}-${status}`}>
            <span>{formatStatusLabel(status)}</span>
            <strong>{formatDashboardNumber(count)}</strong>
          </div>
        )) : (
          <div className="status-breakdown-empty">No records yet</div>
        )}
      </article>
    );
  };

  const renderExecutiveOverview = () => {
    const stats = dashboardStats?.stats || {};
    const workQueue = dashboardStats?.workQueue || [];
    const pipeline = dashboardStats?.pipeline || {};
    const recentActivity = dashboardStats?.recentActivity || [];
    const emailDelivery = getEmailDelivery();
    const openWork = stats.totalOpenWork ?? workQueue.reduce((total, item) => total + Number(item.count || 0), 0);
    const newLeads = Number(stats.newContactsLast30Days || 0)
      + Number(stats.newProductInquiriesLast30Days || 0)
      + Number(stats.newServiceQuotesLast30Days || 0);

    return (
      <section className="executive-overview">
        <div className="executive-hero">
          <div>
            <span className="executive-eyebrow">Live business snapshot</span>
            <h3>Admin Command Center</h3>
            <p>Real data from users, leads, content, careers, awards, visitors, and email delivery.</p>
          </div>
          <div className="executive-refresh">
            <span>Data refreshed</span>
            <strong>{formatDateTime(dashboardStats?.generatedAt || systemHealthFetchedAt)}</strong>
          </div>
        </div>

        <div className="executive-kpis">
          <article className="executive-kpi">
            <span>Open work</span>
            <strong>{formatDashboardNumber(openWork)}</strong>
            <small>Items waiting for admin action</small>
          </article>
          <article className="executive-kpi">
            <span>Visitors today</span>
            <strong>{formatDashboardNumber(stats.visitorsToday || dashboardStats?.traffic?.visitorsToday || 0)}</strong>
            <small>{formatDashboardNumber(stats.pageViewsToday || dashboardStats?.traffic?.pageViewsToday || 0)} page views</small>
          </article>
          <article className="executive-kpi">
            <span>New leads</span>
            <strong>{formatDashboardNumber(newLeads)}</strong>
            <small>Contacts, product inquiries and quotes this month</small>
          </article>
          <article className={`executive-kpi email-kpi ${emailDelivery.canSend ? "healthy" : "attention"}`}>
            <span>Email provider</span>
            <strong>{emailDelivery.activeProviderLabel || "Not configured"}</strong>
            <small>{emailDelivery.mode ? `${formatStatusLabel(emailDelivery.mode)} mode` : "Mode not loaded"}</small>
          </article>
        </div>

        <div className="dashboard-intelligence-grid">
          <article className="intelligence-panel work-queue-panel">
            <div className="panel-title-row">
              <div>
                <h4>Work Queue</h4>
                <p>Things that need attention first.</p>
              </div>
              <strong>{formatDashboardNumber(openWork)}</strong>
            </div>
            <div className="queue-list">
              {workQueue.length ? workQueue.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className={`queue-item tone-${item.tone || "info"}`}
                  onClick={() => setActiveTab(item.tab)}
                >
                  <span>{item.label}</span>
                  <strong>{formatDashboardNumber(item.count)}</strong>
                </button>
              )) : (
                <div className="dashboard-empty-state">No work queue data yet.</div>
              )}
            </div>
          </article>

          <article className="intelligence-panel recent-activity-panel">
            <div className="panel-title-row">
              <div>
                <h4>Recent Activity</h4>
                <p>Newest activity across operational records.</p>
              </div>
            </div>
            <div className="activity-feed">
              {recentActivity.length ? recentActivity.map((activity, index) => (
                <button
                  type="button"
                  className="activity-feed-item"
                  key={`${activity.type}-${activity.createdAt}-${index}`}
                  onClick={() => activity.tab && setActiveTab(activity.tab)}
                >
                  <span className={`activity-status ${getStatusClass(activity.status)}`}>{formatStatusLabel(activity.status)}</span>
                  <div>
                    <strong>{activity.title}</strong>
                    <small>{activity.type}{activity.subtitle ? ` - ${activity.subtitle}` : ""}</small>
                  </div>
                  <time>{formatRelativeTime(activity.createdAt)}</time>
                </button>
              )) : (
                <div className="dashboard-empty-state">No recent activity yet.</div>
              )}
            </div>
          </article>
        </div>

        <div className="pipeline-grid">
          {renderStatusBreakdown("Contacts", pipeline.contactStatusCounts)}
          {renderStatusBreakdown("Product Inquiries", pipeline.productInquiryStatusCounts)}
          {renderStatusBreakdown("Service Quotes", pipeline.serviceQuoteStatusCounts)}
          {renderStatusBreakdown("Job Applications", pipeline.jobApplicationStatusCounts)}
        </div>
      </section>
    );
  };

  const renderEmailProviderSettings = () => {
    const emailDelivery = getEmailDelivery();
    const mode = emailDelivery.mode || "auto";
    const form = emailConfigForm;
    const providerOptions = [
      { mode: "auto", label: "Auto", description: "Mailjet first, Gmail SMTP fallback if Mailjet cannot send." },
      { mode: "mailjet", label: "Mailjet", description: "Send only through Mailjet API." },
      { mode: "gmail", label: "Gmail", description: "Send only through Gmail SMTP." }
    ];

    return (
      <div className="settings-section email-settings-section">
        <div className="email-settings-header">
          <div>
            <h3>Email Delivery</h3>
            <p className="section-description">
              Choose how website emails are sent and edit safe branding details. API keys, secret keys, Gmail app passwords, database, JWT and session secrets stay in environment variables.
            </p>
          </div>
          <span className={`email-health-badge ${emailDelivery.canSend ? "online" : "offline"}`}>
            {emailDelivery.canSend ? "Ready to send" : "Needs configuration"}
          </span>
        </div>

        <div className="email-provider-summary">
          <div>
            <span>Current mode</span>
            <strong>{formatStatusLabel(mode)}</strong>
          </div>
          <div>
            <span>Active provider</span>
            <strong>{emailDelivery.activeProviderLabel || "Not configured"}</strong>
          </div>
          <div>
            <span>Delivery chain</span>
            <strong>{emailDelivery.deliveryChainLabel || "No provider configured"}</strong>
          </div>
          <div>
            <span>Last changed</span>
            <strong>{formatDateTime(emailSettings?.setting?.updatedAt)}</strong>
          </div>
        </div>

        <form className="email-settings-form" onSubmit={handleEmailSettingsSave}>
          <div className="email-form-section">
            <div className="email-form-section-header">
              <h4>Safe Dashboard Settings</h4>
              <p>No API keys or passwords are stored here.</p>
            </div>

            <div className="email-settings-grid">
              <label>
                Provider Mode
                <select
                  value={form.providerMode}
                  onChange={(event) => setEmailConfigForm((current) => ({ ...current, providerMode: event.target.value }))}
                >
                  <option value="auto">Auto</option>
                  <option value="mailjet">Mailjet only</option>
                  <option value="gmail">Gmail only</option>
                </select>
              </label>
              <label>
                From Name
                <input
                  type="text"
                  value={form.sender.fromName}
                  onChange={(event) => updateEmailConfigField("sender", "fromName", event.target.value)}
                />
              </label>
              <label>
                From Email
                <input
                  type="email"
                  value={form.sender.fromEmail}
                  onChange={(event) => updateEmailConfigField("sender", "fromEmail", event.target.value)}
                />
              </label>
              <label>
                Reply-To Email
                <input
                  type="email"
                  value={form.sender.replyTo}
                  onChange={(event) => updateEmailConfigField("sender", "replyTo", event.target.value)}
                />
              </label>
              <label>
                Admin Notification Email
                <input
                  type="email"
                  value={form.sender.notifyEmail}
                  onChange={(event) => updateEmailConfigField("sender", "notifyEmail", event.target.value)}
                />
              </label>
              <label>
                Logo URL
                <input
                  type="url"
                  value={form.brand.logoUrl}
                  onChange={(event) => updateEmailConfigField("brand", "logoUrl", event.target.value)}
                />
              </label>
              <label>
                Brand Tagline
                <input
                  type="text"
                  value={form.brand.tagline}
                  onChange={(event) => updateEmailConfigField("brand", "tagline", event.target.value)}
                />
              </label>
              <label>
                Company Phone
                <input
                  type="text"
                  value={form.brand.phone}
                  onChange={(event) => updateEmailConfigField("brand", "phone", event.target.value)}
                />
              </label>
              <label className="email-form-wide">
                Company Address
                <input
                  type="text"
                  value={form.brand.address}
                  onChange={(event) => updateEmailConfigField("brand", "address", event.target.value)}
                />
              </label>
              <label>
                Mailjet Sender Email
                <input
                  type="email"
                  value={form.mailjet.fromEmail}
                  onChange={(event) => updateEmailConfigField("mailjet", "fromEmail", event.target.value)}
                />
              </label>
              <label>
                Mailjet Timeout
                <input
                  type="number"
                  min="3000"
                  step="1000"
                  value={form.mailjet.timeoutMs}
                  onChange={(event) => updateEmailConfigField("mailjet", "timeoutMs", event.target.value)}
                />
              </label>
              <label>
                Gmail Sender Email
                <input
                  type="email"
                  value={form.gmail.fromEmail}
                  onChange={(event) => updateEmailConfigField("gmail", "fromEmail", event.target.value)}
                />
              </label>
              <label className="email-checkbox-row">
                <input
                  type="checkbox"
                  checked={Boolean(form.mailjet.sandboxMode)}
                  onChange={(event) => updateEmailConfigField("mailjet", "sandboxMode", event.target.checked)}
                />
                Mailjet sandbox mode
              </label>
            </div>

            <div className="email-sensitive-note">
              Keep `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `GMAIL_USER`, and `GMAIL_PASS` in Render env. The dashboard only changes safe display and routing settings.
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-primary" disabled={savingEmailSettings}>
                {savingEmailSettings ? "Saving..." : "Save Email Settings"}
              </button>
              <button type="button" className="btn-secondary" onClick={fetchEmailSettings} disabled={savingEmailSettings}>
                Reload
              </button>
            </div>
          </div>
        </form>

        <div className="provider-option-grid">
          {providerOptions.map((option) => {
            const providerInfo = emailDelivery.providers?.[option.mode] || {};
            const isAvailable = providerInfo.available ?? option.mode === "auto";
            const isActive = mode === option.mode;

            return (
              <button
                type="button"
                key={option.mode}
                className={`provider-option-card ${isActive ? "active" : ""} ${!isAvailable ? "disabled" : ""}`}
                disabled={savingEmailProvider || !isAvailable || isActive}
                onClick={() => handleEmailProviderChange(option.mode)}
              >
                <div>
                  <span>{option.label}</span>
                  <strong>{isActive ? "Active" : isAvailable ? "Available" : "Not configured"}</strong>
                </div>
                <p>{providerInfo.description || option.description}</p>
              </button>
            );
          })}
        </div>

        <div className="email-config-grid">
          <div className="email-config-card">
            <span>Mailjet</span>
            <strong>{emailDelivery.configured?.mailjet ? "Env keys configured" : "Env keys missing"}</strong>
            <small>{emailDelivery.sender?.mailjetFromEmail || "MAILJET_API_KEY and MAILJET_SECRET_KEY stay in env"}</small>
          </div>
          <div className="email-config-card">
            <span>Gmail SMTP</span>
            <strong>{emailDelivery.configured?.gmail ? "Env credentials configured" : "Env credentials missing"}</strong>
            <small>{emailDelivery.sender?.smtpFromEmail || "GMAIL_USER and GMAIL_PASS stay in env"}</small>
          </div>
          <div className="email-config-card">
            <span>Reply-to</span>
            <strong>{emailDelivery.sender?.replyTo || NOT_REPORTED}</strong>
            <small>Recipients can reply directly to this address.</small>
          </div>
        </div>

        {savingEmailProvider && <div className="settings-saving-note">Saving email provider...</div>}
      </div>
    );
  };

  const renderOperationsCenter = () => {
    const stats = dashboardStats?.stats || {};
    const emailDelivery = getEmailDelivery();
    const processMemory = getHealthValue(systemHealth, ["process.memory", "runtime.memory", "memory"], null);
    const systemMemory = getHealthValue(systemHealth, ["system.memory", "host.memory", "os.memory", "ram"], null);
    const mongodbStorage = getHealthValue(systemHealth, ["mongodb.storage", "mongo.storage", "database.storage", "atlas.storage", "storage"], null);
    const collectionRows = normalizeCollections(getHealthValue(systemHealth, ["database.collections", "mongodb.collections", "mongo.collections", "collections"], []));
    const reportedServerStatus = getStatusValue(["server.status", "status", "health", "server"]);
    const serverStatus = reportedServerStatus === NOT_REPORTED && systemHealth ? "Online" : reportedServerStatus;
    const databaseStatus = getStatusValue(["database.status", "database.connection", "database.state", "mongodb.status", "mongo.status", "database"]);
    const clusterStatus = getStatusValue(["cluster.status", "mongodb.cluster.status", "atlas.clusterStatus", "atlas.status"]);
    const backupStatus = getStatusValue(["backup.status", "database.backup.status", "backups.status"]);
    const uptime = getHealthValue(systemHealth, ["uptime", "server.uptime", "process.uptime"], null);
    const cpuLoad = getHealthValue(systemHealth, ["cpu.load", "cpu.usage", "system.cpu.load", "host.cpu.load", "loadAverage"], NOT_REPORTED);
    const nodeVersion = getHealthValue(systemHealth, ["nodeVersion", "node.version", "runtime.nodeVersion"], NOT_REPORTED);
    const hostSystem = getHealthValue(systemHealth, ["host.name", "host.hostname", "server.host", "hostname"], NOT_REPORTED);
    const platform = getHealthValue(systemHealth, ["host.platform", "system.platform", "os.platform", "platform"], NOT_REPORTED);
    const apiLatency = getHealthValue(systemHealth, ["api.latency", "server.latency", "latency"], NOT_REPORTED);
    const visitorsOnline = getHealthValue(systemHealth, ["visitors.online", "traffic.online", "analytics.onlineVisitors"], NOT_REPORTED);
    const visitorsToday = getHealthValue(systemHealth, ["visitors.today", "traffic.today", "analytics.today"], NOT_REPORTED);
    const totalVisitors = getHealthValue(systemHealth, ["visitors.total", "traffic.total", "analytics.totalVisitors"], stats.totalVisitors ?? NOT_REPORTED);
    const databaseName = getHealthValue(systemHealth, ["database.name", "mongodb.database", "mongo.database", "dbName"], NOT_REPORTED);
    const clusterName = getHealthValue(systemHealth, ["cluster.name", "mongodb.cluster.name", "atlas.clusterName"], NOT_REPORTED);
    const lastBackup = getHealthValue(systemHealth, ["backup.lastRun", "backup.lastBackupAt", "backups.lastRun"], NOT_REPORTED);
    const nextBackup = getHealthValue(systemHealth, ["backup.nextRun", "backup.nextBackupAt", "backups.nextRun"], NOT_REPORTED);
    const processId = getHealthValue(systemHealth, ["process.pid", "pid"], NOT_REPORTED);
    const cpuCores = getHealthValue(systemHealth, ["cpu.cores", "system.cpu.cores", "host.cpu.cores"], NOT_REPORTED);
    const ramUsage = formatMemoryPair(systemMemory, ["used", "usedBytes", "active"], ["total", "totalBytes"]);
    const processMemoryUsage = formatMemoryPair(processMemory);
    const storageUsage = formatStoragePair(mongodbStorage);
    const hasCollections = collectionRows.length > 0;

    return (
      <section className="admin-ops-center">
        <div className="ops-header">
          <div>
            <span className="ops-eyebrow">Platform control room</span>
            <h3>Operations Center</h3>
            <p>Track server health, database readiness, backups, traffic and host resources from one professional admin view.</p>
          </div>
          <div className="ops-refresh-pill">
            <span className={`ops-status-dot ${getStatusClass(serverStatus)}`} />
            <div>
              <span>Last refreshed</span>
              <strong>{systemHealthFetchedAt ? formatDateTime(systemHealthFetchedAt) : NOT_REPORTED}</strong>
            </div>
          </div>
        </div>

        <div className="ops-metrics-grid">
          {renderOpsMetric({ label: "Server Status", value: serverStatus, detail: hostSystem, status: serverStatus, accent: "green" })}
          {renderOpsMetric({ label: "Database", value: databaseStatus, detail: databaseName, status: databaseStatus, accent: "blue" })}
          {renderOpsMetric({ label: "Server Uptime", value: uptime !== null ? formatUptime(uptime) : NOT_REPORTED, detail: "Process runtime", accent: "violet" })}
          {renderOpsMetric({ label: "Cluster Status", value: clusterStatus, detail: clusterName, status: clusterStatus, accent: "cyan" })}
          {renderOpsMetric({ label: "CPU Load", value: formatCpuLoad(cpuLoad), detail: `${formatMetricValue(cpuCores)} CPU cores`, accent: "amber" })}
          {renderOpsMetric({ label: "System RAM", value: ramUsage, detail: platform, accent: "slate" })}
          {renderOpsMetric({ label: "Process Memory", value: processMemoryUsage, detail: `PID ${formatMetricValue(processId)}`, accent: "indigo" })}
          {renderOpsMetric({ label: "MongoDB Atlas Storage", value: storageUsage, detail: "Storage used / limit", accent: "teal" })}
          {renderOpsMetric({ label: "Backup Status", value: backupStatus, detail: `Last: ${formatDateTime(lastBackup)}`, status: backupStatus, accent: "green" })}
          {renderOpsMetric({ label: "Visitors Online", value: visitorsOnline, detail: `${formatMetricValue(visitorsToday)} today`, accent: "pink" })}
          {renderOpsMetric({ label: "Email Delivery", value: emailDelivery.activeProviderLabel || NOT_REPORTED, detail: emailDelivery.deliveryChainLabel, status: emailDelivery.canSend ? "online" : "offline", accent: "blue" })}
        </div>

        <div className="ops-panels-grid">
          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Server Runtime</h4>
              <span className={`ops-status-badge ${getStatusClass(serverStatus)}`}>{formatMetricValue(serverStatus)}</span>
            </div>
            {renderDetailRow("Host system", hostSystem)}
            {renderDetailRow("Platform", platform)}
            {renderDetailRow("Node.js", nodeVersion)}
            {renderDetailRow("Process ID", processId)}
            {renderDetailRow("Uptime", uptime !== null ? formatUptime(uptime) : NOT_REPORTED)}
            {renderDetailRow("API latency", apiLatency)}
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Database & Collections</h4>
              <span className={`ops-status-badge ${getStatusClass(databaseStatus)}`}>{formatMetricValue(databaseStatus)}</span>
            </div>
            {renderDetailRow("Database name", databaseName)}
            {renderDetailRow("Atlas cluster", clusterName)}
            {renderDetailRow("Atlas storage", storageUsage)}
            <div className="ops-collection-list">
              {hasCollections ? collectionRows.slice(0, 6).map(collection => (
                <div className="ops-collection-row" key={collection.name || collection.collection || collection._id}>
                  <span>{collection.name || collection.collection || "Collection"}</span>
                  <strong>{formatDashboardNumber(collection.count ?? collection.documents ?? collection.size ?? 0)}</strong>
                </div>
              )) : (
                <div className="ops-empty-state">Collection telemetry is not reported yet.</div>
              )}
            </div>
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Data Management & Backup</h4>
              <span className={`ops-status-badge ${getStatusClass(backupStatus)}`}>{formatMetricValue(backupStatus)}</span>
            </div>
            {renderDetailRow("Users", stats.totalUsers || 0)}
            {renderDetailRow("Products", stats.totalProducts || 0)}
            {renderDetailRow("Services", stats.totalServices || 0)}
            {renderDetailRow("Projects", stats.totalProjects || 0)}
            {renderDetailRow("Gallery items", stats.totalGalleryItems || 0)}
            {renderDetailRow("Job posts", stats.totalJobs || 0)}
            {renderDetailRow("Job applications", stats.totalJobApplications || 0)}
            {renderDetailRow("Last backup", formatDateTime(lastBackup))}
            {renderDetailRow("Next backup", formatDateTime(nextBackup))}
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Visitors & Traffic</h4>
              <span className="ops-status-badge unknown">Analytics</span>
            </div>
            {renderDetailRow("Online now", visitorsOnline)}
            {renderDetailRow("Visitors today", visitorsToday)}
            {renderDetailRow("Total visitors", totalVisitors)}
            {renderDetailRow("Contact messages", stats.totalContacts || 0)}
            {renderDetailRow("Product inquiries", stats.totalProductInquiries || 0)}
            {renderDetailRow("Service quotes", stats.totalServiceQuotes || 0)}
          </article>

          <article className="ops-panel">
            <div className="ops-panel-header">
              <h4>Email Delivery</h4>
              <span className={`ops-status-badge ${emailDelivery.canSend ? "online" : "offline"}`}>
                {emailDelivery.canSend ? "Ready" : "Missing"}
              </span>
            </div>
            {renderDetailRow("Mode", formatStatusLabel(emailDelivery.mode || "auto"))}
            {renderDetailRow("Active provider", emailDelivery.activeProviderLabel || NOT_REPORTED)}
            {renderDetailRow("Delivery chain", emailDelivery.deliveryChainLabel || NOT_REPORTED)}
            {renderDetailRow("Mailjet", emailDelivery.configured?.mailjet ? "Configured" : "Missing keys", emailDelivery.configured?.mailjet ? "online" : "offline")}
            {renderDetailRow("Gmail SMTP", emailDelivery.configured?.gmail ? "Configured" : "Missing credentials", emailDelivery.configured?.gmail ? "online" : "offline")}
          </article>
        </div>
      </section>
    );
  };

  const filteredGalleryItems = galleryItems.filter((item) => {
    const term = gallerySearch.trim().toLowerCase();
    if (!term) return true;
    return [item.title, item.description, item.category]
      .some((value) => String(value || "").toLowerCase().includes(term));
  });

  const filteredJobs = jobs.filter((job) => {
    const term = jobsSearch.trim().toLowerCase();
    if (!term) return true;
    return [job.title, job.department, job.location, job.employmentType, job.description]
      .some((value) => String(value || "").toLowerCase().includes(term));
  });

  if (loading) {
    return (
      <div className="admin-modal">
        <div className="admin-content">
          <div className="admin-header">
            <h2>Admin Dashboard - SAPTech Uganda</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="loading">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-modal">
        <div className="admin-content">
          <div className="admin-header">
            <h2>Admin Dashboard - SAPTech Uganda</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-modal">
      <div className="admin-content">
        <div className="admin-header">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle navigation">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h2>Admin-Dashboard - SAPTech Uganda</h2>
          <div className="admin-user-info">
            <span>Welcome, {user?.name}</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`message ${/(failed|couldn't|error)/i.test(message) ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <div className="admin-main">
          {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
          <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
            <nav className="sidebar-nav">
              <button className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCCA"}</span>
                <span>Overview</span>
              </button>
              <button className={`nav-btn ${activeTab === "operations" ? "active" : ""}`}
                onClick={() => { setActiveTab("operations"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDDA5\uFE0F"}</span>
                <span>Operations</span>
              </button>
              <button className={`nav-btn ${activeTab === "users" ? "active" : ""}`}
                onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDC65"}</span>
                <span>Users ({dashboardStats?.stats?.totalUsers || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "contacts" ? "active" : ""}`}
                onClick={() => { setActiveTab("contacts"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE7"}</span>
                <span>Contacts ({dashboardStats?.stats?.totalContacts || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "newsletters" ? "active" : ""}`}
                onClick={() => { setActiveTab("newsletters"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCF0"}</span>
                <span>Newsletter ({dashboardStats?.stats?.totalNewsletterSubscribers || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "services" ? "active" : ""}`}
                onClick={() => { setActiveTab("services"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDEE0\uFE0F"}</span>
                <span>Services ({dashboardStats?.stats?.totalServices || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "projects" ? "active" : ""}`}
                onClick={() => { setActiveTab("projects"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDE80"}</span>
                <span>Projects ({dashboardStats?.stats?.totalProjects || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "partners" ? "active" : ""}`}
                onClick={() => { setActiveTab("partners"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83E\uDD1D"}</span>
                <span>Partners ({dashboardStats?.stats?.totalPartners || partners.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "partnership-requests" ? "active" : ""}`}
                onClick={() => { setActiveTab("partnership-requests"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCDD"}</span>
                <span>Partnership Requests ({dashboardStats?.stats?.totalPartnershipRequests || partnershipRequests.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "gallery" ? "active" : ""}`}
                onClick={() => { setActiveTab("gallery"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDDBC\uFE0F"}</span>
                <span>Gallery ({dashboardStats?.stats?.totalGalleryItems || galleryItems.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "jobs" ? "active" : ""}`}
                onClick={() => { setActiveTab("jobs"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCBC"}</span>
                <span>Careers ({dashboardStats?.stats?.totalJobs || jobs.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "job-applications" ? "active" : ""}`}
                onClick={() => { setActiveTab("job-applications"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE8"}</span>
                <span>Job Applications ({dashboardStats?.stats?.totalJobApplications || jobApplications.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "products" ? "active" : ""}`}
                onClick={() => { setActiveTab("products"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE6"}</span>
                <span>Products ({dashboardStats?.stats?.totalProducts || products.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "product-inquiries" ? "active" : ""}`}
                onClick={() => { setActiveTab("product-inquiries"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE8"}</span>
                <span>Product Inquiries ({dashboardStats?.stats?.totalProductInquiries || productInquiries.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "service-quotes" ? "active" : ""}`}
                onClick={() => { setActiveTab("service-quotes"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCBC"}</span>
                <span>Service Quotes ({dashboardStats?.stats?.totalServiceQuotes || serviceQuotes.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "awards" ? "active" : ""}`}
                onClick={() => { setActiveTab("awards"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83C\uDFC6"}</span>
                <span>SAPTech Awards 2026</span>
              </button>
              <button className={`nav-btn ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => { setActiveTab("analytics"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCCA"}</span>
                <span>Visitor Analytics</span>
              </button>
              <button className={`nav-btn ${activeTab === "settings" ? "active" : ""}`}
                onClick={() => { setActiveTab("settings"); setSidebarOpen(false); }}>
                <span className="nav-icon" aria-hidden="true">{"\u2699\uFE0F"}</span>
                <span>Settings</span>
              </button>
            </nav>
          </aside>
          <div className="tab-content">
            {activeTab === "overview" && (
              <div className="dashboard-overview">
                {renderExecutiveOverview()}

                <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDC65"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalUsers || 0}</h3>
                    <p>Total Users</p>
                    <small>+{dashboardStats?.stats?.newUsersLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDC51"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalAdmins || 0}</h3>
                    <p>Administrators</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCE7"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalContacts || 0}</h3>
                    <p>Contact Messages</p>
                    <small>+{dashboardStats?.stats?.newContactsLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCF0"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalNewsletterSubscribers || 0}</h3>
                    <p>Newsletter Subscribers</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDEE0\uFE0F"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalServices || 0}</h3>
                    <p>Services</p>
                    <small>{dashboardStats?.stats?.featuredServices || 0} featured</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCAC"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalServiceQuotes || 0}</h3>
                    <p>Service Quotes</p>
                    <small>+{dashboardStats?.stats?.newServiceQuotesLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDE80"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProjects || 0}</h3>
                    <p>Projects</p>
                    <small>{dashboardStats?.stats?.completedProjects || 0} completed</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83E\uDD1D"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalPartners || 0}</h3>
                    <p>Partners</p>
                    <small>{dashboardStats?.stats?.activePartners || 0} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDD14"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalPartnershipRequests || 0}</h3>
                    <p>Partnership Requests</p>
                    <small>{dashboardStats?.stats?.pendingPartnershipRequests || 0} pending</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCE6"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProducts || 0}</h3>
                    <p>Products</p>
                    <small>{dashboardStats?.stats?.featuredProducts || 0} featured</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDDBC\uFE0F"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalGalleryItems || 0}</h3>
                    <p>Gallery Items</p>
                    <small>{dashboardStats?.stats?.activeGalleryItems || 0} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCBC"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalJobs || 0}</h3>
                    <p>Job Posts</p>
                    <small>{dashboardStats?.stats?.activeJobs || 0} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCE8"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalJobApplications || 0}</h3>
                    <p>Job Applications</p>
                    <small>+{dashboardStats?.stats?.newJobApplicationsLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCCB"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProductInquiries || 0}</h3>
                    <p>Product Inquiries</p>
                    <small>+{dashboardStats?.stats?.newProductInquiriesLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83C\uDFC6"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalAwards || 0}</h3>
                    <p>Award Nominations</p>
                    <small>{dashboardStats?.stats?.approvedAwards || 0} approved</small>
                  </div>
                </div>
              </div>

              {renderOperationsCenter()}

              <div className="recent-users">
                <h3>Recent Users</h3>
                <div className="users-list">
                  {dashboardStats?.recentUsers?.map(user => (
                    <div key={user._id} className="user-item">
                      <div className="user-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <div className="user-meta">
                        <span className={`role-badge ${user.role}`}>{user.role.toUpperCase()}</span>
                        <span className="join-date">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Debug Tools Section */}
              <div className="debug-section" style={{ marginTop: '2rem' }}>
                <AdminDebugTools />
              </div>
            </div>
          )}

          {activeTab === "operations" && (
            <div className="tab-panel">
              {renderOperationsCenter()}
            </div>
          )}

          {activeTab === "users" && (
            <div className="users-section">
              <div className="section-header">
                <h3 className="section-title">User Management</h3>
                <div className="filters">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={usersSearch}
                    onChange={(e) => setUsersSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={usersRoleFilter}
                    onChange={(e) => setUsersRoleFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div className="action-buttons">
                  <button onClick={() => fetchUsers(1)} className="btn-refresh">
                     Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Logins</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>{user.loginCount || 0}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? "active" : "inactive"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="actions">
                          <select
                            value={user.role}
                            onChange={(e) => handleUserRoleUpdate(user._id, e.target.value)}
                            className="role-select"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button
                            onClick={() => handleUserDelete(user._id, user.name)}
                            className="btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  onClick={() => fetchUsers(usersPagination.currentPage - 1)}
                  disabled={!usersPagination.hasPrevPage}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {usersPagination.currentPage} of {usersPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchUsers(usersPagination.currentPage + 1)}
                  disabled={!usersPagination.hasNextPage}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="contacts-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactsSearch}
                    onChange={(e) => setContactsSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={contactsStatusFilter}
                    onChange={(e) => setContactsStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <button onClick={() => fetchContacts(1)} className="btn-refresh">
                   Refresh
                </button>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => (
                      <tr key={contact._id}>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone || "N/A"}</td>
                        <td>{contact.subject || "General Inquiry"}</td>
                        <td className="message-cell">
                          {contact.message.length > 50 
                            ? `${contact.message.substring(0, 50)}...`
                            : contact.message
                          }
                        </td>
                        <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${contact.status || "pending"}`}>
                            {(contact.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td className="actions">
                          <select
                            value={contact.status || "pending"}
                            onChange={(e) => handleContactStatusUpdate(contact._id, e.target.value)}
                            className="status-select"
                          >
                            <option value="pending">Pending</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button
                            onClick={() => handleContactDelete(contact._id, contact.name)}
                            className="btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  onClick={() => fetchContacts(contactsPagination.currentPage - 1)}
                  disabled={!contactsPagination.hasPrevPage}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {contactsPagination.currentPage} of {contactsPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchContacts(contactsPagination.currentPage + 1)}
                  disabled={!contactsPagination.hasNextPage}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "newsletters" && (
            <div className="newsletters-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="Search subscribers..."
                    value={newslettersSearch}
                    onChange={(e) => setNewslettersSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
                <button onClick={() => fetchNewsletters(1)} className="btn-refresh">
                   Refresh
                </button>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Subscribed Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsletters.map(subscriber => (
                      <tr key={subscriber._id}>
                        <td>{subscriber.email}</td>
                        <td>{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleNewsletterDelete(subscriber._id, subscriber.email)}
                            className="btn-danger btn-small"
                          >
                            Unsubscribe
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  onClick={() => fetchNewsletters(newslettersPagination.currentPage - 1)}
                  disabled={!newslettersPagination.hasPrevPage}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {newslettersPagination.currentPage} of {newslettersPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchNewsletters(newslettersPagination.currentPage + 1)}
                  disabled={!newslettersPagination.hasNextPage}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="services-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={servicesSearch}
                    onChange={(e) => setServicesSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={servicesCategoryFilter}
                    onChange={(e) => setServicesCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="IoT">IoT</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                  <select
                    value={servicesStatusFilter}
                    onChange={(e) => setServicesStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={() => setShowServiceForm(true)} 
                    className="btn-primary"
                  >
                     Add Service
                  </button>
                  <button onClick={() => fetchServices(1)} className="btn-refresh">
                     Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Price</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => (
                      <tr key={service._id}>
                        <td>{service.title}</td>
                        <td>{service.category}</td>
                        <td>
                          <span className={`status-badge ${service.status}`}>
                            {service.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleServiceToggleFeatured(service._id)}
                            className={`btn-small ${service.featured ? "btn-warning" : "btn-secondary"}`}
                          >
                            {service.featured ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>
                          {service.pricing?.basePrice ? 
                            `${service.pricing.currency || "$"}${service.pricing.basePrice}` : 
                            "Contact"
                          }
                        </td>
                        <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <div className="action-buttons">
                            <button
                              className="btn-small btn-edit"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleServiceEdit(service);
                              }}
                              title="Edit Service"
                              style={{ cursor: "pointer", pointerEvents: "auto" }}
                            >
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button
                              className="btn-small btn-delete"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleServiceDelete(service._id, service.title);
                              }}
                              title="Delete Service"
                              style={{ cursor: "pointer", pointerEvents: "auto" }}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  onClick={() => fetchServices(servicesPagination.currentPage - 1)}
                  disabled={!servicesPagination.hasPrevPage}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {servicesPagination.currentPage} of {servicesPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchServices(servicesPagination.currentPage + 1)}
                  disabled={!servicesPagination.hasNextPage}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {activeTab === "projects" && (
            <div className="projects-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="Search projects..."
                    value={projectsSearch}
                    onChange={(e) => setProjectsSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={projectsCategoryFilter}
                    onChange={(e) => setProjectsCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    <option value="Web Application">Web Application</option>
                    <option value="Mobile App">Mobile App</option>
                    <option value="IoT Solution">IoT Solution</option>
                    <option value="Software solutions"> Software solutions</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Electrical System">Electrical System</option>
                  </select>
                  <select
                    value={projectsStatusFilter}
                    onChange={(e) => setProjectsStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="action-buttons">
                  <button 
                    onClick={() => setShowProjectForm(true)} 
                    className="btn-primary"
                  >
                     Add Project
                  </button>
                  <button onClick={() => fetchProjects(1)} className="btn-refresh">
                     Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Client</th>
                      <th>Progress</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => (
                      <tr key={project._id}>
                        <td>{project.title}</td>
                        <td>{project.category}</td>
                        <td>
                          <span className={`status-badge ${project.status}`}>
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleProjectToggleFeatured(project._id)}
                            className={`btn-small ${project.featured ? "btn-warning" : "btn-secondary"}`}
                          >
                            {project.featured ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>{project.client?.name || "Internal"}</td>
                        <td>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill" 
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                            <span className="progress-text">{project.progress || 0}%</span>
                          </div>
                        </td>
                        <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleProjectEdit(project)}
                            className="btn-secondary btn-small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleProjectDelete(project._id, project.title)}
                            className="btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button
                  onClick={() => fetchProjects(projectsPagination.currentPage - 1)}
                  disabled={!projectsPagination.hasPrevPage}
                  className="btn-secondary"
                >
                  Previous
                </button>
                <span>
                  Page {projectsPagination.currentPage} of {projectsPagination.totalPages}
                </span>
                <button
                  onClick={() => fetchProjects(projectsPagination.currentPage + 1)}
                  disabled={!projectsPagination.hasNextPage}
                  className="btn-secondary"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Partners Tab */}
          {activeTab === "partners" && (
            <div className="tab-panel">
              <div className="tab-panel-header">
                <h3>Partners Management</h3>
                <button 
                  className="btn-primary"
                  onClick={() => setShowPartnerForm(true)}
                >
                  Add New Partner
                </button>
              </div>

              <div className="filters">
                <input
                  type="text"
                  placeholder="Search partners..."
                  value={partnersSearch}
                  onChange={(e) => setPartnersSearch(e.target.value)}
                  className="search-input"
                />
                <select
                  value={partnersStatusFilter}
                  onChange={(e) => setPartnersStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Logo</th>
                      <th>Name</th>
                      <th>Website</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((partner) => (
                      <tr key={partner._id}>
                        <td>
                          <div className="partner-logo-cell">
                            {partner.logo ? (
                              <img 
                                src={getImageUrl(partner.logo)} 
                                alt={`${getPartnerDisplayName(partner)} logo`}
                                className="partner-logo-thumbnail"
                              />
                            ) : (
                              <div className="logo-placeholder">
                                {getPartnerInitial(partner)}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{partner.name?.trim() || <span className="no-description">Logo only</span>}</td>
                        <td>
                          {partner.website ? (
                            <a 
                              href={partner.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="website-link"
                            >
                              Visit
                            </a>
                          ) : (
                            <span className="no-website">-</span>
                          )}
                        </td>
                        <td>
                          <div className="description-cell">
                            {partner.description ? (
                              <span title={partner.description}>
                                {partner.description.length > 50 
                                  ? partner.description.substring(0, 50) + "..."
                                  : partner.description
                                }
                              </span>
                            ) : (
                              <span className="no-description">-</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => handlePartnerToggleActive(partner._id)}
                            className={`status-badge ${partner.isActive ? "active" : "inactive"}`}
                          >
                            {partner.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>{partner.order}</td>
                        <td className="actions">
                          <button
                            onClick={() => handlePartnerEdit(partner)}
                            className="btn-secondary btn-small"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handlePartnerDelete(partner._id, getPartnerDisplayName(partner))}
                            className="btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {partners.length === 0 && (
                <div className="empty-state">
                  <p>No partners found. Add your first partner to get started!</p>
                </div>
              )}

              {partners.length > 0 && partnersPagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchPartners(partnersPagination.currentPage - 1)}
                    disabled={!partnersPagination.hasPrevPage}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <span>
                    Page {partnersPagination.currentPage} of {partnersPagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchPartners(partnersPagination.currentPage + 1)}
                    disabled={!partnersPagination.hasNextPage}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Partnership Requests Tab */}
          {activeTab === "partnership-requests" && (
            <div className="tab-panel">
              <div className="tab-panel-header">
                <h3>Partnership Requests</h3>
                <button 
                  className="btn-primary"
                  onClick={() => fetchPartnershipRequests(1)}
                >
                  Refresh
                </button>
              </div>

              <div className="filters">
                <input
                  type="text"
                  placeholder="Search partnership requests..."
                  value={partnershipRequestsSearch}
                  onChange={(e) => setPartnershipRequestsSearch(e.target.value)}
                  className="search-input"
                />
                <select
                  value={partnershipRequestsStatusFilter}
                  onChange={(e) => setPartnershipRequestsStatusFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Website</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnershipRequests.map((request) => (
                      <tr key={request._id}>
                        <td>{request.companyName}</td>
                        <td>{request.contactPerson}</td>
                        <td>
                          <a href={`mailto:${request.contactEmail}`} className="email-link">
                            {request.contactEmail}
                          </a>
                        </td>
                        <td>
                          {request.website ? (
                            <a 
                              href={request.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="website-link"
                            >
                              Visit
                            </a>
                          ) : (
                            <span className="no-website">-</span>
                          )}
                        </td>
                        <td>
                          <div className="description-cell">
                            <span title={request.description}>
                              {request.description.length > 60 
                                ? request.description.substring(0, 60) + "..."
                                : request.description
                              }
                            </span>
                          </div>
                        </td>
                        <td>
                          <select
                            value={request.status}
                            onChange={(e) => handlePartnershipRequestStatusUpdate(request._id, e.target.value)}
                            className={`status-select status-${request.status}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td>
                          <span className="date-cell">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="actions">
                          <button
                            onClick={() => handleViewPartnershipRequest(request)}
                            className="btn-secondary btn-small"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDeletePartnershipRequest(request._id, request.companyName)}
                            className="btn-danger btn-small"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {partnershipRequests.length === 0 && (
                <div className="empty-state">
                  <p>No partnership requests found.</p>
                </div>
              )}

              {partnershipRequests.length > 0 && partnershipRequestsPagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => fetchPartnershipRequests(partnershipRequestsPagination.currentPage - 1)}
                    disabled={!partnershipRequestsPagination.hasPrevPage}
                    className="btn-secondary"
                  >
                    Previous
                  </button>
                  <span>
                    Page {partnershipRequestsPagination.currentPage} of {partnershipRequestsPagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchPartnershipRequests(partnershipRequestsPagination.currentPage + 1)}
                    disabled={!partnershipRequestsPagination.hasNextPage}
                    className="btn-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === "gallery" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Gallery Management</h2>
                <p>Manage public gallery images, categories and display order</p>
              </div>

              <div className="controls-section">
                <div className="left-controls">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingGallery(null);
                      setShowGalleryForm(true);
                    }}
                  >
                    <i className="fas fa-plus"></i> Add Gallery Item
                  </button>
                </div>

                <div className="right-controls">
                  <input
                    type="text"
                    placeholder="Search gallery..."
                    value={gallerySearch}
                    onChange={(e) => setGallerySearch(e.target.value)}
                    className="search-input"
                  />
                  <button className="btn-refresh" onClick={fetchGalleryItems}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Order</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGalleryItems.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                            <div>
                              <p>No gallery items found</p>
                              <small>
                                {gallerySearch ? "Try another search term" : "Click 'Add Gallery Item' to upload your first image"}
                              </small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredGalleryItems.map((item) => {
                          const media = getGalleryMedia(item);
                          const primaryMedia = media.find((mediaItem) => mediaItem.type === "image") || media[0];
                          const primaryUrl = getImageUrl(primaryMedia?.url);

                          return (
                          <tr key={item._id}>
                            <td>
                              <div className="product-image-cell gallery-media-cell">
                                {primaryMedia?.type === "video" ? (
                                  <video
                                    src={primaryUrl}
                                    className="table-product-image"
                                    preload="metadata"
                                    muted
                                  />
                                ) : (
                                  <img
                                    src={primaryUrl || PLACEHOLDERS.product}
                                    alt={item.title || "Gallery item"}
                                    className="table-product-image"
                                    onError={(e) => {
                                      if (!e.target.dataset.errorHandled) {
                                        e.target.dataset.errorHandled = "true";
                                        e.target.src = PLACEHOLDERS.error;
                                      }
                                    }}
                                  />
                                )}
                                {primaryMedia?.type === "video" && <span className="gallery-table-badge">Video</span>}
                                {media.length > 1 && <span className="gallery-table-count">{media.length}</span>}
                              </div>
                            </td>
                            <td>
                              <strong>{item.title || "Untitled"}</strong>
                              {item.description && <small className="table-subtext">{item.description}</small>}
                            </td>
                            <td><span className="category-badge">{item.category || "other"}</span></td>
                            <td>
                              <span className={`status-badge ${item.isActive ? "active" : "inactive"}`}>
                                {item.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>{item.displayOrder || 0}</td>
                            <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small btn-edit"
                                  onClick={() => handleGalleryEdit(item)}
                                  title="Edit Gallery Item"
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn-small btn-delete"
                                  onClick={() => handleGalleryDelete(item._id, item.title)}
                                  title="Delete Gallery Item"
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Jobs Tab */}
          {activeTab === "jobs" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Careers Management</h2>
                <p>Create and manage job openings shown on the Careers page</p>
              </div>

              <div className="controls-section">
                <div className="left-controls">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setEditingJob(null);
                      setShowJobForm(true);
                    }}
                  >
                    <i className="fas fa-plus"></i> Post Job
                  </button>
                </div>

                <div className="right-controls">
                  <input
                    type="text"
                    placeholder="Search jobs..."
                    value={jobsSearch}
                    onChange={(e) => setJobsSearch(e.target.value)}
                    className="search-input"
                  />
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
                      {filteredJobs.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                            <div>
                              <p>No job postings found</p>
                              <small>
                                {jobsSearch ? "Try another search term" : "Click 'Post Job' to create the first careers listing"}
                              </small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredJobs.map((job) => (
                          <tr key={job._id}>
                            <td>
                              {job.poster ? (
                                <img
                                  src={getImageUrl(job.poster)}
                                  alt={job.posterAlt || `${job.title} poster`}
                                  className="table-job-poster"
                                  onError={(e) => {
                                    if (!e.target.dataset.errorHandled) {
                                      e.target.dataset.errorHandled = "true";
                                      e.target.src = PLACEHOLDERS.error;
                                    }
                                  }}
                                />
                              ) : (
                                <span className="table-muted">No poster</span>
                              )}
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
                              {job.applicationDeadline
                                ? new Date(job.applicationDeadline).toLocaleDateString()
                                : "Rolling"}
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small btn-edit"
                                  onClick={() => handleJobEdit(job)}
                                  title="Edit Job"
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn-small btn-delete"
                                  onClick={() => handleJobDelete(job._id, job.title)}
                                  title="Delete Job"
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Job Applications Tab */}
          {activeTab === "job-applications" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Job Applications</h2>
                <p>Review applications submitted from the public Careers page</p>
              </div>

              <div className="controls-section">
                <div className="right-controls">
                  <input
                    type="text"
                    placeholder="Search applicants..."
                    value={jobApplicationsSearch}
                    onChange={(e) => setJobApplicationsSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={jobApplicationsStatusFilter}
                    onChange={(e) => setJobApplicationsStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="interviewed">Interviewed</option>
                    <option value="accepted">Accepted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button className="btn-refresh" onClick={() => fetchJobApplications(1)}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
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
                      {jobApplications.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ textAlign: "center", padding: "2rem" }}>
                            <div>
                              <p>No job applications found</p>
                              <small>
                                {jobApplicationsSearch || jobApplicationsStatusFilter
                                  ? "Try adjusting your search or status filter"
                                  : "Applications submitted from Careers will appear here"}
                              </small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        jobApplications.map((application) => (
                          <tr key={application._id}>
                            <td>
                              <strong>{application.fullName}</strong>
                              {application.coverLetter && (
                                <small className="table-subtext">
                                  {application.coverLetter.substring(0, 120)}
                                  {application.coverLetter.length > 120 ? "..." : ""}
                                </small>
                              )}
                            </td>
                            <td>
                              <strong>{application.job?.title || "Job removed"}</strong>
                              <small className="table-subtext">
                                {[application.job?.department, application.job?.location]
                                  .filter(Boolean)
                                  .join(" • ") || "No job details"}
                              </small>
                            </td>
                            <td>
                              <a href={`mailto:${application.email}`}>{application.email}</a>
                              {application.phone && <small className="table-subtext">{application.phone}</small>}
                            </td>
                            <td>
                              <div className="application-file-links">
                                {application.resumeUrl && (
                                  <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer">
                                    Resume URL
                                  </a>
                                )}
                                {application.resumeFile?.url && (
                                  <a
                                    href={getImageUrl(application.resumeFile.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={application.resumeFile.originalName || "CV / resume file"}
                                  >
                                    CV file
                                  </a>
                                )}
                                {application.coverLetterFile?.url && (
                                  <a
                                    href={getImageUrl(application.coverLetterFile.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title={application.coverLetterFile.originalName || "Cover letter file"}
                                  >
                                    Cover letter
                                  </a>
                                )}
                                {!application.resumeUrl && !application.resumeFile?.url && !application.coverLetterFile?.url && (
                                  <span className="table-muted">No documents</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <select
                                value={application.status || "pending"}
                                onChange={(e) => handleJobApplicationStatusUpdate(application._id, e.target.value)}
                                className={`status-select status-${application.status || "pending"}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="reviewed">Reviewed</option>
                                <option value="interviewed">Interviewed</option>
                                <option value="accepted">Accepted</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                            <td>{application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "-"}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small btn-view"
                                  onClick={() => {
                                    alert(`
Applicant: ${application.fullName}
Email: ${application.email}
Phone: ${application.phone || "N/A"}
Job: ${application.job?.title || "Job removed"}
Status: ${application.status || "pending"}
Submitted: ${application.createdAt ? new Date(application.createdAt).toLocaleString() : "N/A"}
Resume: ${application.resumeUrl || "N/A"}
CV File: ${application.resumeFile?.url ? getImageUrl(application.resumeFile.url) : "N/A"}
Cover Letter File: ${application.coverLetterFile?.url ? getImageUrl(application.coverLetterFile.url) : "N/A"}

Cover Letter:
${application.coverLetter || "No cover letter provided."}
                                    `.trim());
                                  }}
                                  title="View Application"
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {jobApplicationsPagination.totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn-page"
                      onClick={() => fetchJobApplications(jobApplicationsPagination.currentPage - 1)}
                      disabled={!jobApplicationsPagination.hasPrevPage}
                    >
                      Previous
                    </button>
                    <span className="page-info">
                      Page {jobApplicationsPagination.currentPage} of {jobApplicationsPagination.totalPages}
                      ({jobApplicationsPagination.totalItems || 0} applications)
                    </span>
                    <button
                      className="btn-page"
                      onClick={() => fetchJobApplications(jobApplicationsPagination.currentPage + 1)}
                      disabled={!jobApplicationsPagination.hasNextPage}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === "products" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Products Management</h2>
                <p>Manage your company's key products and technical specifications</p>
              </div>

              {/* Products Controls */}
              <div className="controls-section">
                <div className="left-controls">
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowProductForm(true)}
                  >
                    <i className="fas fa-plus"></i> Add New Product
                  </button>
                </div>

                <div className="right-controls">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productsSearch}
                    onChange={(e) => setProductsSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={productsCategoryFilter}
                    onChange={(e) => setProductsCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Categories</option>
                    <option value="IoT Devices">IoT Devices</option>
                    <option value="Software Solutions">Software Solutions</option>
                    <option value="Web Applications">Web Applications</option>
                    <option value="Mobile Apps">Mobile Apps</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Electricals">Electricals</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Automation">Automation</option>
                    <option value="AI/ML Products">AI/ML Products</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    value={productsStatusFilter}
                    onChange={(e) => setProductsStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Price</th>
                        <th>Order</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div>
                              <p>No products found</p>
                              <small>
                                {productsSearch || productsCategoryFilter || (productsStatusFilter && productsStatusFilter !== "all") 
                                  ? "Try adjusting your filters or search terms"
                                  : "Click 'Add New Product' to create your first product"
                                }
                              </small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        products.map((product) => (
                          <tr key={product._id}>
                            <td>
                              <div className="product-image-cell">
                                <img 
                                  src={getImageUrl(product.image) || PLACEHOLDERS.product}
                                  alt={product.name}
                                  className="table-product-image"
                                  onError={(e) => {
                                    if (!e.target.dataset.errorHandled) {
                                      e.target.dataset.errorHandled = 'true';
                                      e.target.src = PLACEHOLDERS.error;
                                    }
                                  }}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="product-name-cell">
                                <strong>{product.name}</strong>
                                <small>{product.shortDescription}</small>
                              </div>
                            </td>
                            <td>
                              <span className="category-badge">{product.category}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <span className={`featured-badge ${product.isFeatured ? 'featured' : ''}`}>
                                {product.isFeatured ? 'Featured' : '-'}
                              </span>
                            </td>
                            <td>{product.formattedPrice || 'Contact for Price'}</td>
                            <td>{product.displayOrder}</td>
                            <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small btn-edit"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingProduct(product);
                                    setShowProductForm(true);
                                  }}
                                  title="Edit Product"
                                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                                >
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button
                                  className="btn-small btn-delete"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                      try {
                                        await apiService.deleteProduct(product._id);
                                        setProducts((prev) => removeById(prev, product._id));
                                        setAutoMessage(`Product "${product.name}" removed successfully`);
                                        fetchProducts(productsPagination.currentPage);
                                        fetchDashboardStats();
                                      } catch (error) {
                                        console.error('Delete product error:', error);
                                        setAutoMessage("Couldn't delete product", true);
                                      }
                                    }
                                  }}
                                  title="Delete Product"
                                  style={{ cursor: "pointer", pointerEvents: "auto" }}
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Products Pagination */}
                {productsPagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="btn-page"
                      onClick={() => fetchProducts(productsPagination.currentPage - 1)}
                      disabled={!productsPagination.hasPrev}
                    >
                       Previous
                    </button>
                    <span className="page-info">
                      Page {productsPagination.currentPage} of {productsPagination.totalPages}
                      ({productsPagination.totalProducts || 0} products)
                    </span>
                    <button 
                      className="btn-page"
                      onClick={() => fetchProducts(productsPagination.currentPage + 1)}
                      disabled={!productsPagination.hasNext}
                    >
                      Next 
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Inquiries Tab */}
          {activeTab === "product-inquiries" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Product Inquiries</h2>
                <p>Customer inquiries about products - saved even if emails fail</p>
              </div>

              {/* Product Inquiries Controls */}
              <div className="controls-section">
                <div className="right-controls">
                  <input
                    type="text"
                    placeholder="Search inquiries..."
                    value={productInquiriesSearch}
                    onChange={(e) => setProductInquiriesSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={productInquiriesStatusFilter}
                    onChange={(e) => setProductInquiriesStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="new"> New</option>
                    <option value="contacted"> Contacted</option>
                    <option value="resolved"> Resolved</option>
                    <option value="closed"> Closed</option>
                  </select>
                </div>
              </div>

              {/* Product Inquiries Table */}
              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Customer Email</th>
                        <th>Phone</th>
                        <th>Preferred Contact</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productInquiries.length === 0 ? (
                        <tr>
                          <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div>
                              <p>No product inquiries found</p>
                              <small>
                                {productInquiriesSearch || productInquiriesStatusFilter 
                                  ? "Try adjusting your filters or search terms"
                                  : "Product inquiries will appear here when customers submit them"
                                }
                              </small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        productInquiries.map((inquiry) => (
                          <tr key={inquiry._id}>
                            <td>
                              <strong>{inquiry.productName || 'Product Deleted'}</strong>
                            </td>
                            <td>{inquiry.customerEmail}</td>
                            <td>{inquiry.customerPhone || '-'}</td>
                            <td>
                              <span className="contact-method">
                                {inquiry.preferredContact || 'Email'}
                              </span>
                            </td>
                            <td>
                              <div className="message-preview" title={inquiry.message}>
                                {inquiry.message?.substring(0, 50)}{inquiry.message?.length > 50 ? '...' : ''}
                              </div>
                            </td>
                            <td>
                              <select
                                value={inquiry.status || 'new'}
                                onChange={(e) => handleUpdateInquiryStatus(inquiry._id, e.target.value)}
                                className={`status-select status-${inquiry.status || 'new'}`}
                              >
                                <option value="new"> New</option>
                                <option value="contacted"> Contacted</option>
                                <option value="resolved"> Resolved</option>
                                <option value="closed"> Closed</option>
                              </select>
                            </td>
                            <td>{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small btn-view"
                                  onClick={() => {
                                    alert(`
Product: ${inquiry.productName}
Customer: ${inquiry.customerEmail}
Phone: ${inquiry.customerPhone || 'N/A'}
Preferred Contact: ${inquiry.preferredContact}
Message: ${inquiry.message}
Submitted: ${new Date(inquiry.createdAt).toLocaleString()}
IP: ${inquiry.metadata?.ipAddress || 'N/A'}
                                    `.trim());
                                  }}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn-small btn-delete"
                                  onClick={() => handleDeleteInquiry(inquiry._id, inquiry.productName)}
                                  title="Delete Inquiry"
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Product Inquiries Pagination */}
                {productInquiriesPagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="btn-page"
                      onClick={() => fetchProductInquiries(productInquiriesPagination.currentPage - 1)}
                      disabled={!productInquiriesPagination.hasPrev}
                    >
                       Previous
                    </button>
                    <span className="page-info">
                      Page {productInquiriesPagination.currentPage} of {productInquiriesPagination.totalPages}
                      ({productInquiriesPagination.totalInquiries || 0} inquiries)
                    </span>
                    <button 
                      className="btn-page"
                      onClick={() => fetchProductInquiries(productInquiriesPagination.currentPage + 1)}
                      disabled={!productInquiriesPagination.hasNext}
                    >
                      Next 
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Service Quotes Tab */}
          {activeTab === "service-quotes" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Service Quote Requests</h2>
                <p>Customer quote requests for services - saved even if emails fail</p>
              </div>

              {/* Service Quotes Controls */}
              <div className="controls-section">
                <div className="right-controls">
                  <input
                    type="text"
                    placeholder="Search quotes..."
                    value={serviceQuotesSearch}
                    onChange={(e) => setServiceQuotesSearch(e.target.value)}
                    className="search-input"
                  />
                  <select
                    value={serviceQuotesStatusFilter}
                    onChange={(e) => setServiceQuotesStatusFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">All Status</option>
                    <option value="new"> New</option>
                    <option value="contacted"> Contacted</option>
                    <option value="quoted"> Quoted</option>
                    <option value="accepted"> Accepted</option>
                    <option value="rejected"> Rejected</option>
                    <option value="expired"> Expired</option>
                  </select>
                </div>
              </div>

              {/* Service Quotes Table */}
              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Budget</th>
                        <th>Timeline</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceQuotes.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                            <div>
                              <p>No service quotes found</p>
                              <small>
                                {serviceQuotesSearch || serviceQuotesStatusFilter 
                                  ? "Try adjusting your filters or search terms"
                                  : "Service quote requests will appear here when customers submit them"
                                }
                              </small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        serviceQuotes.map((quote) => (
                          <tr key={quote._id}>
                            <td>
                              <strong>{quote.serviceName || 'Service Deleted'}</strong>
                            </td>
                            <td>
                              <div>
                                <strong>{quote.customerName}</strong>
                                <br />
                                <small>{quote.customerEmail}</small>
                              </div>
                            </td>
                            <td>{quote.companyName || '-'}</td>
                            <td>
                              <div>
                                {quote.customerPhone}
                                <br />
                                <span className="contact-method">
                                  {quote.preferredContact}
                                </span>
                              </div>
                            </td>
                            <td>{quote.budget || '-'}</td>
                            <td>{quote.timeline || '-'}</td>
                            <td>
                              <select
                                value={quote.status || 'new'}
                                onChange={(e) => handleUpdateQuoteStatus(quote._id, e.target.value)}
                                className={`status-select status-${quote.status || 'new'}`}
                              >
                                <option value="new"> New</option>
                                <option value="contacted"> Contacted</option>
                                <option value="quoted"> Quoted</option>
                                <option value="accepted"> Accepted</option>
                                <option value="rejected"> Rejected</option>
                                <option value="expired"> Expired</option>
                              </select>
                            </td>
                            <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="btn-small btn-view"
                                  onClick={() => {
                                    alert(`
Service: ${quote.serviceName}
Customer: ${quote.customerName}
Email: ${quote.customerEmail}
Phone: ${quote.customerPhone}
Company: ${quote.companyName || 'N/A'}
Preferred Contact: ${quote.preferredContact}
Budget: ${quote.budget || 'Not specified'}
Timeline: ${quote.timeline || 'Not specified'}
Project Details: ${quote.projectDetails}
Submitted: ${new Date(quote.createdAt).toLocaleString()}
IP: ${quote.metadata?.ipAddress || 'N/A'}
                                    `.trim());
                                  }}
                                  title="View Details"
                                >
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button
                                  className="btn-small btn-delete"
                                  onClick={() => handleDeleteQuote(quote._id, quote.serviceName)}
                                  title="Delete Quote"
                                >
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Service Quotes Pagination */}
                {serviceQuotesPagination.totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="btn-page"
                      onClick={() => fetchServiceQuotes(serviceQuotesPagination.currentPage - 1)}
                      disabled={!serviceQuotesPagination.hasPrev}
                    >
                       Previous
                    </button>
                    <span className="page-info">
                      Page {serviceQuotesPagination.currentPage} of {serviceQuotesPagination.totalPages}
                      ({serviceQuotesPagination.totalQuotes || 0} quotes)
                    </span>
                    <button 
                      className="btn-page"
                      onClick={() => fetchServiceQuotes(serviceQuotesPagination.currentPage + 1)}
                      disabled={!serviceQuotesPagination.hasNext}
                    >
                      Next 
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Awards Tab */}
          {activeTab === "awards" && (
            <div className="tab-panel">
              <AwardsAdmin />
            </div>
          )}

          {/* Visitor Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="tab-panel">
              <VisitorAnalytics />
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="tab-panel">
              <div className="section-header">
                <h2>Admin Settings</h2>
              </div>

              {/* Settings Subtabs */}
              <div className="subtab-navigation">
                <button
                  className={`subtab-btn ${settingsSubTab === "email" ? "active" : ""}`}
                  onClick={() => setSettingsSubTab("email")}
                >
                  Email Delivery
                </button>
                <button 
                  className={`subtab-btn ${settingsSubTab === "signature" ? "active" : ""}`}
                  onClick={() => setSettingsSubTab("signature")}
                >
                   Signature
                </button>
                <button 
                  className={`subtab-btn ${settingsSubTab === "certificates" ? "active" : ""}`}
                  onClick={() => setSettingsSubTab("certificates")}
                >
                   All Certificates
                </button>
              </div>

              {settingsSubTab === "email" && renderEmailProviderSettings()}

              {/* Signature Subtab */}
              {settingsSubTab === "signature" && (
                <div className="settings-section">
                  <h3>Certificate Signature</h3>
                  <p className="section-description">
                    Upload a signature image that will appear on all generated certificates. 
                    The signature will be displayed above "SAPTech Awards 2026 Committee" text.
                  </p>

                  {currentSignature && (
                    <div className="current-signature">
                      <h4>Current Signature:</h4>
                      <div className="signature-info">
                        <p><strong>File:</strong> {currentSignature.originalName}</p>
                        <p><strong>Uploaded:</strong> {new Date(currentSignature.uploadedAt).toLocaleDateString()}</p>
                        <p><strong>Size:</strong> {(currentSignature.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button 
                        className="btn-delete"
                        onClick={handleDeleteSignature}
                      >
                         Delete Current Signature
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSignatureUpload} className="signature-upload-form">
                    <div className="form-group">
                      <label htmlFor="signatureFile">
                        {currentSignature ? "Upload New Signature" : "Upload Signature"}
                      </label>
                      <input
                        type="file"
                        id="signatureFile"
                        accept="image/*"
                        onChange={(e) => setSignatureFile(e.target.files[0])}
                        disabled={uploadingSignature}
                      />
                      {signatureFile && (
                        <p className="file-selected">
                          Selected: {signatureFile.name} ({(signatureFile.size / 1024).toFixed(2)} KB)
                        </p>
                      )}
                      <small>Accepted formats: any image format (Max 5MB)</small>
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={!signatureFile || uploadingSignature}
                    >
                      {uploadingSignature ? "Uploading..." : "Upload Signature"}
                    </button>
                  </form>

                  <div className="signature-preview-note">
                    <strong>Note:</strong> The signature will be embedded in certificates at 120x40 pixels. 
                    For best results, use a transparent PNG with your signature centered.
                  </div>
                </div>
              )}

              {/* Certificates List Subtab */}
              {settingsSubTab === "certificates" && (
                <div className="settings-section">
                  <h3>Generated Certificates</h3>
                  <p className="section-description">
                    View and manage all generated certificates with verification links.
                  </p>

                  {/* Search and Filter Controls */}
                  <div className="certificates-controls">
                    <input
                      type="text"
                      placeholder="Search by nominee name or certificate ID..."
                      value={certificatesSearch}
                      onChange={(e) => setCertificatesSearch(e.target.value)}
                      className="search-input"
                    />
                    <select
                      value={certificatesTypeFilter}
                      onChange={(e) => setCertificatesTypeFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="">All Types</option>
                      <option value="winner">Winners</option>
                      <option value="finalist">Finalists</option>
                      <option value="participation">Participation</option>
                    </select>
                  </div>

                  {/* Certificates Table */}
                  {updating ? (
                    <div className="loading-state">Loading certificates...</div>
                  ) : allCertificates.length === 0 ? (
                    <div className="empty-state">
                      <p>No certificates found. Generate certificates from the SAPTech Awards 2026 tab.</p>
                    </div>
                  ) : (
                    <>
                      <div className="certificates-table-container">
                        <table className="certificates-table">
                          <thead>
                            <tr>
                              <th>Nominee</th>
                              <th>Category</th>
                              <th>Type</th>
                              <th>Certificate ID</th>
                              <th>Generated</th>
                              <th>Storage</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allCertificates.map((cert) => (
                              <tr key={cert._id}>
                                <td><strong>{cert.nomineeName}</strong></td>
                                <td>{cert.categoryName || "N/A"}</td>
                                <td>
                                  <span className={`badge badge-${cert.status}`}>
                                    {cert.status === "winner" ? " Winner" : 
                                     cert.status === "finalist" ? " Finalist" : 
                                     " Participation"}
                                  </span>
                                </td>
                                <td>
                                  <code className="cert-id">{cert.certificateId}</code>
                                </td>
                                <td>{new Date(cert.generatedAt).toLocaleDateString()}</td>
                                <td>
                                  <span className={`badge badge-${cert.storage}`}>
                                    {cert.storage === "cloudinary" ? " Cloud" : " Local"}
                                  </span>
                                </td>
                                <td className="actions-cell">
                                  <a 
                                    href={cert.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-btn download-btn"
                                    title="Download Certificate"
                                  >
                                     Download
                                  </a>
                                  <a 
                                    href={cert.verificationUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="action-btn verify-btn"
                                    title="View Verification Page"
                                  >
                                     Verify
                                  </a>
                                  <button
                                    onClick={() => handleDeleteCertificate(cert._id, cert.nomineeName)}
                                    className="action-btn delete-btn"
                                    title="Delete Certificate"
                                    disabled={updating}
                                  >
                                     Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {certificatesPagination.totalPages > 1 && (
                        <div className="pagination">
                          <button 
                            className="btn-page"
                            onClick={() => fetchAllCertificates(certificatesPagination.currentPage - 1)}
                            disabled={!certificatesPagination.hasPrevPage}
                          >
                             Previous
                          </button>
                          <span className="page-info">
                            Page {certificatesPagination.currentPage} of {certificatesPagination.totalPages}
                            ({certificatesPagination.totalCertificates || 0} certificates)
                          </span>
                          <button 
                            className="btn-page"
                            onClick={() => fetchAllCertificates(certificatesPagination.currentPage + 1)}
                            disabled={!certificatesPagination.hasNextPage}
                          >
                            Next 
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <BackToTop />
      </div>
      
      {/* Service Form Modal */}
      {showServiceForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10001 }}>
          <ServiceForm 
            service={editingService}
            onClose={() => {
              setShowServiceForm(false);
              setEditingService(null);
            }}
            onSave={handleServiceSubmit}
          />
        </div>
      )}
      
      {/* Project Form Modal */}
      {showProjectForm && (
        <ProjectForm 
          project={editingProject}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
          onSave={handleProjectSubmit}
        />
      )}

      {/* Partner Form Modal */}
      {showPartnerForm && (
        <PartnerForm 
          isOpen={showPartnerForm}
          partner={editingPartner}
          onClose={() => {
            setShowPartnerForm(false);
            setEditingPartner(null);
          }}
          onSave={handlePartnerSave}
        />
      )}

      {/* Product Form Modal */}
      {showProductForm && (
        <ProductForm 
          isOpen={showProductForm}
          product={editingProduct}
          onClose={() => {
            setShowProductForm(false);
            setEditingProduct(null);
          }}
          onSuccess={(savedProduct) => {
            if (savedProduct?._id) {
              setProducts((prev) => {
                const withoutCurrent = prev.filter((product) => product._id !== savedProduct._id);
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
          }}
        />
      )}

      {/* Gallery Form Modal */}
      {showGalleryForm && (
        <GalleryForm
          isOpen={showGalleryForm}
          galleryItem={editingGallery}
          onClose={() => {
            setShowGalleryForm(false);
            setEditingGallery(null);
          }}
          onSave={handleGallerySave}
        />
      )}

      {/* Job Form Modal */}
      {showJobForm && (
        <JobForm
          isOpen={showJobForm}
          job={editingJob}
          onClose={() => {
            setShowJobForm(false);
            setEditingJob(null);
          }}
          onSave={handleJobSave}
        />
      )}
    </div>
    </div>
  );
};

export default AdminDashboard;
