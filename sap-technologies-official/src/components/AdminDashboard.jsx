import AdminNavigation from "./admin/AdminNavigation";
import AdminDialogs from "./admin/AdminDialogs";
import createAdminFetchers from "./admin/actions/createAdminFetchers";
import createAccountActions from "./admin/actions/createAccountActions";
import createCatalogActions from "./admin/actions/createCatalogActions";
import createContentActions from "./admin/actions/createContentActions";
import createInquiryActions from "./admin/actions/createInquiryActions";
import createEmailSettingsActions from "./admin/actions/createEmailSettingsActions";
import createEmailComposerActions from "./admin/actions/createEmailComposerActions";
import { NOT_REPORTED, getHealthValue, formatDashboardNumber, formatMetricValue, formatPercent, formatBytes, formatMemoryValue, JOB_APPLICATION_STATUS_OPTIONS, getStatusClass, DEFAULT_EMAIL_CONFIG_FORM } from "./admin/utils/dashboardFormatters";
import EmailsTab from "./admin/tabs/EmailsTab";
import OverviewTab from "./admin/tabs/OverviewTab";
import OperationsTab from "./admin/tabs/OperationsTab";
import UsersTab from "./admin/tabs/UsersTab";
import ContactsTab from "./admin/tabs/ContactsTab";
import NewslettersTab from "./admin/tabs/NewslettersTab";
import ServicesTab from "./admin/tabs/ServicesTab";
import ProjectsTab from "./admin/tabs/ProjectsTab";
import PartnersTab from "./admin/tabs/PartnersTab";
import PartnershipRequestsTab from "./admin/tabs/PartnershipRequestsTab";
import GalleryTab from "./admin/tabs/GalleryTab";
import JobsTab from "./admin/tabs/JobsTab";
import JobApplicationsTab from "./admin/tabs/JobApplicationsTab";
import ProductsTab from "./admin/tabs/ProductsTab";
import ProductInquiriesTab from "./admin/tabs/ProductInquiriesTab";
import ServiceQuotesTab from "./admin/tabs/ServiceQuotesTab";
import AwardsTab from "./admin/tabs/AwardsTab";
import AnalyticsTab from "./admin/tabs/AnalyticsTab";
import SettingsTab from "./admin/tabs/SettingsTab";
import ExecutiveOverview from "./admin/panels/ExecutiveOverview";
import EmailProviderSettings from "./admin/panels/EmailProviderSettings";
import OperationsCenter from "./admin/panels/OperationsCenter";
import { useState, useEffect } from "react";
import BackToTop from "./BackToTop";
import ThemeToggle from "./ThemeToggle";
import "../styles/AdminDashboard.css";
import "../styles/AdminWorkspace.css";
const AdminDashboard = ({
  user,
  onClose
}) => {
  const [compactNavigation, setCompactNavigation] = useState(() => window.matchMedia("(max-width: 1024px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)");
    const update = () => setCompactNavigation(media.matches);
    media.addEventListener("change", update);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      media.removeEventListener("change", update);
      document.body.style.overflow = previousOverflow;
    };
  }, []);
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
  const [usersPagination, setUsersPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [contactsPagination, setContactsPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [newslettersPagination, setNewslettersPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [servicesPagination, setServicesPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [projectsPagination, setProjectsPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [partnersPagination, setPartnersPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [partnershipRequestsPagination, setPartnershipRequestsPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [productsPagination, setProductsPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [productInquiriesPagination, setProductInquiriesPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [serviceQuotesPagination, setServiceQuotesPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [jobApplicationsPagination, setJobApplicationsPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });

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
  const [selectedJobApplication, setSelectedJobApplication] = useState(null);
  const [emailingJobApplication, setEmailingJobApplication] = useState(null);
  const [applicantEmailForm, setApplicantEmailForm] = useState({
    subject: "",
    message: ""
  });
  const [sendingApplicantEmail, setSendingApplicantEmail] = useState(false);

  // Settings states
  const [currentSignature, setCurrentSignature] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const [emailSettings, setEmailSettings] = useState(null);
  const [emailConfigForm, setEmailConfigForm] = useState(DEFAULT_EMAIL_CONFIG_FORM);
  const [savingEmailProvider, setSavingEmailProvider] = useState(false);
  const [savingEmailSettings, setSavingEmailSettings] = useState(false);
  const [sendingCustomEmail, setSendingCustomEmail] = useState(false);
  const [customEmailForm, setCustomEmailForm] = useState({
    recipientEmail: "",
    recipientName: "",
    subject: "",
    message: ""
  });
  const [savedEmailMessages, setSavedEmailMessages] = useState([]);
  const [settingsSubTab, setSettingsSubTab] = useState("email");
  const [allCertificates, setAllCertificates] = useState([]);
  const [certificatesPagination, setCertificatesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCertificates: 0
  });
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
        } else if (settingsSubTab === "email" || settingsSubTab === "saved-emails") {
          fetchEmailSettings();
          fetchSavedEmailMessages();
        }
        break;
      case "emails":
        fetchEmailSettings();
        fetchSavedEmailMessages();
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
          } else if (settingsSubTab === "email" || settingsSubTab === "saved-emails") {
            fetchEmailSettings();
            fetchSavedEmailMessages();
          }
          break;
        case "emails":
          fetchEmailSettings();
          fetchSavedEmailMessages();
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
  const {
    fetchDashboardStats,
    fetchSystemHealth,
    fetchUsers,
    fetchContacts,
    fetchNewsletters,
    fetchServices,
    fetchProjects,
    fetchProducts,
    fetchProductInquiries,
    fetchServiceQuotes,
    fetchPartners,
    fetchPartnershipRequests,
    fetchGalleryItems,
    fetchJobs,
    fetchJobApplications
  } = createAdminFetchers({
    setDashboardStats,
    setEmailSettings,
    setError,
    setLoading,
    onClose,
    setSystemHealth,
    setSystemHealthFetchedAt,
    usersSearch,
    usersRoleFilter,
    setUsers,
    setUsersPagination,
    contactsSearch,
    contactsStatusFilter,
    setContacts,
    setContactsPagination,
    newslettersSearch,
    setNewsletters,
    setNewslettersPagination,
    servicesSearch,
    servicesCategoryFilter,
    servicesStatusFilter,
    setServices,
    setServicesPagination,
    projectsSearch,
    projectsCategoryFilter,
    projectsStatusFilter,
    setProjects,
    setProjectsPagination,
    productsSearch,
    productsCategoryFilter,
    productsStatusFilter,
    setProducts,
    setProductsPagination,
    productInquiriesSearch,
    productInquiriesStatusFilter,
    setProductInquiries,
    setProductInquiriesPagination,
    serviceQuotesSearch,
    serviceQuotesStatusFilter,
    setServiceQuotes,
    setServiceQuotesPagination,
    partnersSearch,
    partnersStatusFilter,
    setPartners,
    setPartnersPagination,
    partnershipRequestsSearch,
    partnershipRequestsStatusFilter,
    setPartnershipRequests,
    setPartnershipRequestsPagination,
    setGalleryItems,
    setJobs,
    jobApplicationsSearch,
    jobApplicationsStatusFilter,
    setJobApplications,
    setJobApplicationsPagination
  });
  const {
    handleUserRoleUpdate,
    handleUserDelete,
    handleContactStatusUpdate,
    handleContactDelete,
    handleNewsletterDelete
  } = createAccountActions({
    setUsers,
    setAutoMessage,
    fetchUsers,
    usersPagination,
    fetchDashboardStats,
    setContacts,
    fetchContacts,
    contactsPagination,
    setNewsletters,
    fetchNewsletters,
    newslettersPagination
  });

  // Service handlers
  const {
    handleServiceSubmit,
    handleServiceEdit,
    handleServiceDelete,
    handleServiceToggleFeatured,
    handleProjectSubmit,
    handleProjectEdit,
    handleProjectDelete,
    handleProjectToggleFeatured,
    handlePartnerSave,
    handlePartnerEdit,
    handlePartnerDelete,
    handlePartnerToggleActive,
    handlePartnershipRequestStatusUpdate,
    handleViewPartnershipRequest,
    handleDeletePartnershipRequest
  } = createCatalogActions({
    setServices,
    setEditingService,
    setShowServiceForm,
    fetchServices,
    servicesPagination,
    fetchDashboardStats,
    setAutoMessage,
    setProjects,
    setEditingProject,
    setShowProjectForm,
    fetchProjects,
    projectsPagination,
    setPartners,
    fetchPartners,
    partnersPagination,
    setEditingPartner,
    setShowPartnerForm,
    partners,
    setPartnershipRequests,
    fetchPartnershipRequests,
    partnershipRequestsPagination
  });
  const {
    handleGallerySave,
    handleGalleryEdit,
    handleGalleryDelete,
    handleJobSave,
    handleJobEdit,
    handleJobDelete
  } = createContentActions({
    setGalleryItems,
    setShowGalleryForm,
    setEditingGallery,
    fetchGalleryItems,
    fetchDashboardStats,
    setAutoMessage,
    setJobs,
    setShowJobForm,
    setEditingJob,
    fetchJobs
  });
  const {
    openApplicantEmailComposer,
    closeApplicantEmailComposer,
    handleSendApplicantEmail,
    handleJobApplicationStatusUpdate,
    handleUpdateInquiryStatus,
    handleDeleteInquiry,
    handleUpdateQuoteStatus,
    handleDeleteQuote
  } = createInquiryActions({
    setEmailingJobApplication,
    setApplicantEmailForm,
    emailingJobApplication,
    applicantEmailForm,
    setAutoMessage,
    setSendingApplicantEmail,
    setJobApplications,
    setSelectedJobApplication,
    fetchJobApplications,
    jobApplicationsPagination,
    fetchDashboardStats,
    setProductInquiries,
    fetchProductInquiries,
    productInquiriesPagination,
    setServiceQuotes,
    fetchServiceQuotes,
    serviceQuotesPagination
  });
  const {
    fetchEmailSettings,
    handleEmailProviderChange,
    updateEmailConfigField,
    handleEmailSettingsSave,
    fetchCurrentSignature,
    fetchAllCertificates,
    handleSignatureUpload,
    handleDeleteSignature,
    handleDeleteCertificate
  } = createEmailSettingsActions({
    setEmailSettings,
    setEmailConfigForm,
    setAutoMessage,
    setSavingEmailProvider,
    setDashboardStats,
    fetchDashboardStats,
    fetchSystemHealth,
    setSavingEmailSettings,
    emailConfigForm,
    setCurrentSignature,
    setUpdating,
    certificatesSearch,
    certificatesTypeFilter,
    setAllCertificates,
    setCertificatesPagination,
    signatureFile,
    setUploadingSignature,
    setSignatureFile,
    certificatesPagination
  });
  const formatUptime = seconds => {
    const totalSeconds = Number(seconds);
    if (!Number.isFinite(totalSeconds)) return NOT_REPORTED;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds % 86400 / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };
  const getStatusValue = paths => {
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
  const formatStoragePair = storage => {
    if (!storage || typeof storage !== "object") return NOT_REPORTED;
    const used = getHealthValue(storage, ["used", "usedBytes", "dataSize", "storageSize"], null);
    const total = getHealthValue(storage, ["total", "totalBytes", "allocated", "limit"], null);
    if (used !== null && total !== null) return `${formatBytes(used)} / ${formatBytes(total)}`;
    if (used !== null) return formatBytes(used);
    return NOT_REPORTED;
  };
  const formatCpuLoad = value => {
    const formatLoadValue = item => {
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
  const normalizeCollections = collections => {
    if (Array.isArray(collections)) return collections;
    if (collections && typeof collections === "object") {
      return Object.entries(collections).map(([name, value]) => value && typeof value === "object" ? {
        name,
        ...value
      } : {
        name,
        count: value
      });
    }
    return [];
  };
  const renderOpsMetric = ({
    label,
    value,
    detail,
    status,
    accent = "neutral"
  }) => <div className={`ops-metric-card accent-${accent}`}>
      <div className="ops-metric-topline">
        <span>{label}</span>
        {status && <span className={`ops-status-dot ${getStatusClass(status)}`} aria-label={`${label} status`} />}
      </div>
      <strong>{formatMetricValue(value)}</strong>
      {detail && <small>{detail}</small>}
    </div>;
  const renderDetailRow = (label, value, status) => <div className="ops-detail-row">
      <span>{label}</span>
      <strong className={status ? `ops-text-${getStatusClass(status)}` : ""}>{formatMetricValue(value)}</strong>
    </div>;
  const getEmailDelivery = () => emailSettings?.emailDelivery || dashboardStats?.emailDelivery || getHealthValue(systemHealth, ["email"], null) || {};
  const formatStatusLabel = value => String(value || "unknown").replace(/[-_]/g, " ").replace(/\b\w/g, letter => letter.toUpperCase());
  const formatRelativeTime = value => {
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
    return <article className="status-breakdown-card">
        <div className="status-breakdown-title">
          <h4>{title}</h4>
          <span>{formatDashboardNumber(entries.reduce((total, [, count]) => total + Number(count), 0))}</span>
        </div>
        {entries.length ? entries.map(([status, count]) => <div className="status-breakdown-row" key={`${title}-${status}`}>
            <span>{formatStatusLabel(status)}</span>
            <strong>{formatDashboardNumber(count)}</strong>
          </div>) : <div className="status-breakdown-empty">No records yet</div>}
      </article>;
  };
  const renderExecutiveOverview = () => <ExecutiveOverview dashboardStats={dashboardStats} formatRelativeTime={formatRelativeTime} formatStatusLabel={formatStatusLabel} getEmailDelivery={getEmailDelivery} renderStatusBreakdown={renderStatusBreakdown} setActiveTab={setActiveTab} systemHealthFetchedAt={systemHealthFetchedAt} />;
  const {
    handleCustomEmailSend,
    fetchSavedEmailMessages,
    reuseSavedEmailMessage,
    deleteSavedEmailMessage
  } = createEmailComposerActions({
    customEmailForm,
    setAutoMessage,
    setSendingCustomEmail,
    setSavedEmailMessages,
    setCustomEmailForm,
    setSettingsSubTab
  });
  const renderEmailProviderSettings = () => <EmailProviderSettings customEmailForm={customEmailForm} emailConfigForm={emailConfigForm} emailSettings={emailSettings} fetchEmailSettings={fetchEmailSettings} formatStatusLabel={formatStatusLabel} getEmailDelivery={getEmailDelivery} handleCustomEmailSend={handleCustomEmailSend} handleEmailProviderChange={handleEmailProviderChange} handleEmailSettingsSave={handleEmailSettingsSave} savingEmailProvider={savingEmailProvider} savingEmailSettings={savingEmailSettings} sendingCustomEmail={sendingCustomEmail} setCustomEmailForm={setCustomEmailForm} setEmailConfigForm={setEmailConfigForm} updateEmailConfigField={updateEmailConfigField} />;
  const renderOperationsCenter = () => <OperationsCenter dashboardStats={dashboardStats} formatCpuLoad={formatCpuLoad} formatMemoryPair={formatMemoryPair} formatStatusLabel={formatStatusLabel} formatStoragePair={formatStoragePair} formatUptime={formatUptime} getEmailDelivery={getEmailDelivery} getStatusValue={getStatusValue} normalizeCollections={normalizeCollections} renderDetailRow={renderDetailRow} renderOpsMetric={renderOpsMetric} systemHealth={systemHealth} systemHealthFetchedAt={systemHealthFetchedAt} />;
  const filteredGalleryItems = galleryItems.filter(item => {
    const term = gallerySearch.trim().toLowerCase();
    if (!term) return true;
    return [item.title, item.description, item.category].some(value => String(value || "").toLowerCase().includes(term));
  });
  const filteredJobs = jobs.filter(job => {
    const term = jobsSearch.trim().toLowerCase();
    if (!term) return true;
    return [job.title, job.department, job.location, job.employmentType, job.description].some(value => String(value || "").toLowerCase().includes(term));
  });
  const jobApplicationStatusSummary = JOB_APPLICATION_STATUS_OPTIONS.map(option => ({
    ...option,
    count: jobApplications.filter(application => (application.status || "pending") === option.value).length
  }));
  const jobApplicationsAwaitingAction = jobApplications.filter(application => ["pending", "reviewed"].includes(application.status || "pending")).length;
  if (loading) {
    return <div className="admin-modal">
        <div className="admin-content">
          <div className="admin-header">
            <h2>Admin Dashboard - SAPTech Uganda</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="loading">Loading admin dashboard...</div>
        </div>
      </div>;
  }
  if (error) {
    return <div className="admin-modal">
        <div className="admin-content">
          <div className="admin-header">
            <h2>Admin Dashboard - SAPTech Uganda</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="error-message">{error}</div>
        </div>
      </div>;
  }
  return <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-dashboard-title">
      <div className="admin-content">
        <div className="admin-header">
          <button type="button" className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen} aria-controls="admin-navigation">
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="admin-heading">
            <span className="admin-workspace-label">SAPTech Uganda</span>
            <h2 id="admin-dashboard-title">Admin dashboard</h2>
          </div>
          <ThemeToggle className="admin-theme-toggle" />
          <div className="admin-user-info">
            <span>Welcome, {user?.name}</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <button type="button" className="close-btn" aria-label="Close admin dashboard" onClick={onClose}>&times;</button>
        </div>

        {message && <div className={`message ${/(failed|couldn't|error)/i.test(message) ? "error" : "success"}`}>
            {message}
          </div>}

        <div className="admin-main">
          {sidebarOpen && <button type="button" className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
          <aside id="admin-navigation" className={`admin-sidebar ${sidebarOpen ? "open" : ""}`} inert={compactNavigation && !sidebarOpen}>
            <AdminNavigation activeTab={activeTab} setActiveTab={setActiveTab} setSidebarOpen={setSidebarOpen} dashboardStats={dashboardStats} partners={partners} partnershipRequests={partnershipRequests} galleryItems={galleryItems} jobs={jobs} jobApplications={jobApplications} products={products} productInquiries={productInquiries} serviceQuotes={serviceQuotes} />
          </aside>
          <div className="tab-content">
            {activeTab === "emails" && <EmailsTab getEmailDelivery={getEmailDelivery} renderEmailProviderSettings={renderEmailProviderSettings} />}

            {activeTab === "overview" && <OverviewTab dashboardStats={dashboardStats} renderExecutiveOverview={renderExecutiveOverview} renderOperationsCenter={renderOperationsCenter} />}

          {activeTab === "operations" && <OperationsTab renderOperationsCenter={renderOperationsCenter} />}

          {activeTab === "users" && <UsersTab fetchUsers={fetchUsers} handleUserDelete={handleUserDelete} handleUserRoleUpdate={handleUserRoleUpdate} setUsersRoleFilter={setUsersRoleFilter} setUsersSearch={setUsersSearch} users={users} usersPagination={usersPagination} usersRoleFilter={usersRoleFilter} usersSearch={usersSearch} />}

          {activeTab === "contacts" && <ContactsTab contacts={contacts} contactsPagination={contactsPagination} contactsSearch={contactsSearch} contactsStatusFilter={contactsStatusFilter} fetchContacts={fetchContacts} handleContactDelete={handleContactDelete} handleContactStatusUpdate={handleContactStatusUpdate} setContactsSearch={setContactsSearch} setContactsStatusFilter={setContactsStatusFilter} />}

          {activeTab === "newsletters" && <NewslettersTab fetchNewsletters={fetchNewsletters} handleNewsletterDelete={handleNewsletterDelete} newsletters={newsletters} newslettersPagination={newslettersPagination} newslettersSearch={newslettersSearch} setNewslettersSearch={setNewslettersSearch} />}

          {activeTab === "services" && <ServicesTab fetchServices={fetchServices} handleServiceDelete={handleServiceDelete} handleServiceEdit={handleServiceEdit} handleServiceToggleFeatured={handleServiceToggleFeatured} services={services} servicesCategoryFilter={servicesCategoryFilter} servicesPagination={servicesPagination} servicesSearch={servicesSearch} servicesStatusFilter={servicesStatusFilter} setServicesCategoryFilter={setServicesCategoryFilter} setServicesSearch={setServicesSearch} setServicesStatusFilter={setServicesStatusFilter} setShowServiceForm={setShowServiceForm} />}

          {activeTab === "projects" && <ProjectsTab fetchProjects={fetchProjects} handleProjectDelete={handleProjectDelete} handleProjectEdit={handleProjectEdit} handleProjectToggleFeatured={handleProjectToggleFeatured} projects={projects} projectsCategoryFilter={projectsCategoryFilter} projectsPagination={projectsPagination} projectsSearch={projectsSearch} projectsStatusFilter={projectsStatusFilter} setProjectsCategoryFilter={setProjectsCategoryFilter} setProjectsSearch={setProjectsSearch} setProjectsStatusFilter={setProjectsStatusFilter} setShowProjectForm={setShowProjectForm} />}

          {/* Partners Tab */}
          {activeTab === "partners" && <PartnersTab fetchPartners={fetchPartners} handlePartnerDelete={handlePartnerDelete} handlePartnerEdit={handlePartnerEdit} handlePartnerToggleActive={handlePartnerToggleActive} partners={partners} partnersPagination={partnersPagination} partnersSearch={partnersSearch} partnersStatusFilter={partnersStatusFilter} setPartnersSearch={setPartnersSearch} setPartnersStatusFilter={setPartnersStatusFilter} setShowPartnerForm={setShowPartnerForm} />}

          {/* Partnership Requests Tab */}
          {activeTab === "partnership-requests" && <PartnershipRequestsTab fetchPartnershipRequests={fetchPartnershipRequests} handleDeletePartnershipRequest={handleDeletePartnershipRequest} handlePartnershipRequestStatusUpdate={handlePartnershipRequestStatusUpdate} handleViewPartnershipRequest={handleViewPartnershipRequest} partnershipRequests={partnershipRequests} partnershipRequestsPagination={partnershipRequestsPagination} partnershipRequestsSearch={partnershipRequestsSearch} partnershipRequestsStatusFilter={partnershipRequestsStatusFilter} setPartnershipRequestsSearch={setPartnershipRequestsSearch} setPartnershipRequestsStatusFilter={setPartnershipRequestsStatusFilter} />}

          {/* Gallery Tab */}
          {activeTab === "gallery" && <GalleryTab fetchGalleryItems={fetchGalleryItems} filteredGalleryItems={filteredGalleryItems} gallerySearch={gallerySearch} handleGalleryDelete={handleGalleryDelete} handleGalleryEdit={handleGalleryEdit} setEditingGallery={setEditingGallery} setGallerySearch={setGallerySearch} setShowGalleryForm={setShowGalleryForm} />}

          {/* Jobs Tab */}
          {activeTab === "jobs" && <JobsTab fetchJobs={fetchJobs} filteredJobs={filteredJobs} handleJobDelete={handleJobDelete} handleJobEdit={handleJobEdit} jobsSearch={jobsSearch} setEditingJob={setEditingJob} setJobsSearch={setJobsSearch} setShowJobForm={setShowJobForm} />}

          {/* Job Applications Tab */}
          {activeTab === "job-applications" && <JobApplicationsTab fetchJobApplications={fetchJobApplications} handleJobApplicationStatusUpdate={handleJobApplicationStatusUpdate} jobApplicationStatusSummary={jobApplicationStatusSummary} jobApplications={jobApplications} jobApplicationsAwaitingAction={jobApplicationsAwaitingAction} jobApplicationsPagination={jobApplicationsPagination} jobApplicationsSearch={jobApplicationsSearch} jobApplicationsStatusFilter={jobApplicationsStatusFilter} openApplicantEmailComposer={openApplicantEmailComposer} setJobApplicationsSearch={setJobApplicationsSearch} setJobApplicationsStatusFilter={setJobApplicationsStatusFilter} setSelectedJobApplication={setSelectedJobApplication} />}

          {/* Products Tab */}
          {activeTab === "products" && <ProductsTab fetchDashboardStats={fetchDashboardStats} fetchProducts={fetchProducts} products={products} productsCategoryFilter={productsCategoryFilter} productsPagination={productsPagination} productsSearch={productsSearch} productsStatusFilter={productsStatusFilter} setAutoMessage={setAutoMessage} setEditingProduct={setEditingProduct} setProducts={setProducts} setProductsCategoryFilter={setProductsCategoryFilter} setProductsSearch={setProductsSearch} setProductsStatusFilter={setProductsStatusFilter} setShowProductForm={setShowProductForm} />}

          {/* Product Inquiries Tab */}
          {activeTab === "product-inquiries" && <ProductInquiriesTab fetchProductInquiries={fetchProductInquiries} handleDeleteInquiry={handleDeleteInquiry} handleUpdateInquiryStatus={handleUpdateInquiryStatus} productInquiries={productInquiries} productInquiriesPagination={productInquiriesPagination} productInquiriesSearch={productInquiriesSearch} productInquiriesStatusFilter={productInquiriesStatusFilter} setProductInquiriesSearch={setProductInquiriesSearch} setProductInquiriesStatusFilter={setProductInquiriesStatusFilter} />}

          {/* Service Quotes Tab */}
          {activeTab === "service-quotes" && <ServiceQuotesTab fetchServiceQuotes={fetchServiceQuotes} handleDeleteQuote={handleDeleteQuote} handleUpdateQuoteStatus={handleUpdateQuoteStatus} serviceQuotes={serviceQuotes} serviceQuotesPagination={serviceQuotesPagination} serviceQuotesSearch={serviceQuotesSearch} serviceQuotesStatusFilter={serviceQuotesStatusFilter} setServiceQuotesSearch={setServiceQuotesSearch} setServiceQuotesStatusFilter={setServiceQuotesStatusFilter} />}

          {/* Awards Tab */}
          {activeTab === "awards" && <AwardsTab />}

          {/* Visitor Analytics Tab */}
          {activeTab === "analytics" && <AnalyticsTab />}

          {/* Settings Tab */}
          {activeTab === "settings" && <SettingsTab allCertificates={allCertificates} certificatesPagination={certificatesPagination} certificatesSearch={certificatesSearch} certificatesTypeFilter={certificatesTypeFilter} currentSignature={currentSignature} deleteSavedEmailMessage={deleteSavedEmailMessage} fetchAllCertificates={fetchAllCertificates} handleDeleteCertificate={handleDeleteCertificate} handleDeleteSignature={handleDeleteSignature} handleSignatureUpload={handleSignatureUpload} renderEmailProviderSettings={renderEmailProviderSettings} reuseSavedEmailMessage={reuseSavedEmailMessage} savedEmailMessages={savedEmailMessages} setCertificatesSearch={setCertificatesSearch} setCertificatesTypeFilter={setCertificatesTypeFilter} setSettingsSubTab={setSettingsSubTab} setSignatureFile={setSignatureFile} settingsSubTab={settingsSubTab} signatureFile={signatureFile} updating={updating} uploadingSignature={uploadingSignature} />}
        </div>
        <BackToTop />
      </div>

      <AdminDialogs selectedJobApplication={selectedJobApplication} setSelectedJobApplication={setSelectedJobApplication} openApplicantEmailComposer={openApplicantEmailComposer} emailingJobApplication={emailingJobApplication} closeApplicantEmailComposer={closeApplicantEmailComposer} handleSendApplicantEmail={handleSendApplicantEmail} sendingApplicantEmail={sendingApplicantEmail} applicantEmailForm={applicantEmailForm} setApplicantEmailForm={setApplicantEmailForm} showServiceForm={showServiceForm} editingService={editingService} setShowServiceForm={setShowServiceForm} setEditingService={setEditingService} handleServiceSubmit={handleServiceSubmit} showProjectForm={showProjectForm} editingProject={editingProject} setShowProjectForm={setShowProjectForm} setEditingProject={setEditingProject} handleProjectSubmit={handleProjectSubmit} showPartnerForm={showPartnerForm} editingPartner={editingPartner} setShowPartnerForm={setShowPartnerForm} setEditingPartner={setEditingPartner} handlePartnerSave={handlePartnerSave} showProductForm={showProductForm} editingProduct={editingProduct} setShowProductForm={setShowProductForm} setEditingProduct={setEditingProduct} setProducts={setProducts} fetchProducts={fetchProducts} productsPagination={productsPagination} fetchDashboardStats={fetchDashboardStats} showGalleryForm={showGalleryForm} editingGallery={editingGallery} setShowGalleryForm={setShowGalleryForm} setEditingGallery={setEditingGallery} handleGallerySave={handleGallerySave} showJobForm={showJobForm} editingJob={editingJob} setShowJobForm={setShowJobForm} setEditingJob={setEditingJob} handleJobSave={handleJobSave} />



      {/* Service Form Modal */}


      {/* Project Form Modal */}


      {/* Partner Form Modal */}


      {/* Product Form Modal */}


      {/* Gallery Form Modal */}


      {/* Job Form Modal */}

    </div>
    </div>;
};
export default AdminDashboard;
