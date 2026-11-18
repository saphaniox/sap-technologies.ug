import apiService from "../../../services/api";
import { extractList } from "../utils/dashboardFormatters";
import { normalizePagination } from "../utils/dashboardFormatters";
export default function createAdminFetchers({
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
}) {
  const fetchDashboardStats = async () => {
    try {
      const response = await apiService.getAdminDashboardStats();
      setDashboardStats(response.data);
      if (response.data?.emailDelivery) {
        setEmailSettings(current => ({
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
        setEmailSettings(current => ({
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
        limit: 50,
        // Increased from 10 to show more services per page
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
        setProductsPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1
        });
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
      setJobApplicationsPagination({
        currentPage: 1,
        totalPages: 1
      });
    }
  };
  return {
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
  };
}
