/**
 * AdminDashboard Component
 * 
 * Central control panel for managing the entire application.
 * Features:
 * - Dashboard overview with statistics and charts
 * - User management (view, edit, delete users)
 * - Contact form submissions management
 * - Newsletter subscribers management
 * - Services, projects, partners, products management
 * - System health monitoring
 * - Auto-refresh capabilities
 * - Search and filter functionality
 * - Pagination for large datasets
 * 
 * @component
 */
import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import { LoadingOverlay, LoadingButton } from "../utils/alerts.jsx";
import BackToTop from "./BackToTop";
import ServiceForm from "./ServiceForm";
import ProjectForm from "./ProjectForm";
import PartnerForm from "./PartnerForm";
import ProductForm from "./ProductForm";
import AdminDebugTools from "./AdminDebugTools";
import AwardsAdmin from "./AwardsAdmin";
import "../styles/AdminDashboard.css";

const AdminDashboard = ({ user, onClose }) => {
  // Main navigation state - tracks which admin section is currently active
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data states - all the information we display in different admin sections
  const [dashboardStats, setDashboardStats] = useState(null); // Overview numbers and charts
  const [systemHealth, setSystemHealth] = useState(null); // Server performance info
  const [users, setUsers] = useState([]); // All registered users
  const [contacts, setContacts] = useState([]); // Contact form submissions
  const [newsletters, setNewsletters] = useState([]); // Newsletter subscribers
  const [services, setServices] = useState([]); // Services we offer
  const [projects, setProjects] = useState([]); // Portfolio projects
  const [partners, setPartners] = useState([]); // Business partners
  const [partnershipRequests, setPartnershipRequests] = useState([]); // New partnership requests
  const [products, setProducts] = useState([]); // Company products
  
  // UI state for loading and error handling
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(""); // Success/error messages for user actions
  const [refreshInterval, setRefreshInterval] = useState(null); // Auto-refresh timer
  
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

  // Form states for creating/editing
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editingPartner, setEditingPartner] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Utility function to set message with auto-dismissal
  const setAutoMessage = (msg, isError = false) => {
    setMessage(msg);
    const timeout = isError ? 6000 : 4000; // Longer timeout for errors
    setTimeout(() => setMessage(""), timeout);
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === "overview") {
        fetchDashboardStats();
        fetchSystemHealth();
      }
    }, 30000);
    
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);

  useEffect(() => {
    // Fetch data when tab changes
    switch (activeTab) {
      case "overview":
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
      case "products":
        fetchProducts();
        break;
      case "awards":
        // Awards data is loaded by the AwardsAdmin component itself
        break;
    }
  }, [activeTab, usersSearch, usersRoleFilter, contactsSearch, contactsStatusFilter, newslettersSearch, servicesSearch, servicesCategoryFilter, servicesStatusFilter, projectsSearch, projectsCategoryFilter, projectsStatusFilter, partnersSearch, partnersStatusFilter, partnershipRequestsSearch, partnershipRequestsStatusFilter, productsSearch, productsCategoryFilter, productsStatusFilter]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchSystemHealth()
      ]);
    } catch (error) {
      setError("Failed to load dashboard data");
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const response = await apiService.getAdminDashboardStats();
      setDashboardStats(response.data);
    } catch (error) {
      console.error("Stats fetch error:", error);
      if (error.message === "Authentication required") {
        window.location.href = "/login";
      }
    }
  };

  const fetchSystemHealth = async () => {
    try {
      const response = await apiService.getSystemHealth();
      setSystemHealth(response.data.system);
    } catch (error) {
      console.error("System health fetch error:", error);
      if (error.message === "Authentication required") {
        window.location.href = "/login";
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
      console.log("🛠️ Fetching services... Page:", page);
      const params = {
        page,
        limit: 50, // Increased from 10 to show more services per page
        search: servicesSearch,
        category: servicesCategoryFilter,
        status: servicesStatusFilter
      };
      console.log("🛠️ Request params:", params);
      const response = await apiService.getAllServices(params);
      console.log("🛠️ Services response:", response);
      console.log("✅ Services loaded:", response.data.services?.length || 0);
      setServices(response.data.services);
      setServicesPagination(response.data.pagination);
    } catch (error) {
      console.error("❌ Services fetch error:", error);
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
      console.log("📦 Fetching products... Page:", page);
      const params = {
        page,
        limit: 10,
        search: productsSearch,
        category: productsCategoryFilter,
        status: productsStatusFilter === "all" ? "" : productsStatusFilter
      };
      
      console.log("📦 Request params:", params);
      const response = await apiService.getProductsAdmin(params);
      console.log("📦 Products response:", response);
      
      if (response && response.data) {
        console.log("✅ Products loaded:", response.data.products?.length || 0);
        setProducts(response.data.products || []);
        setProductsPagination(response.data.pagination || { currentPage: 1, totalPages: 1 });
      } else {
        console.warn("⚠️ No data in response");
        setProducts([]);
      }
    } catch (error) {
      console.error("❌ Products fetch error:", error);
      console.error("Error details:", error.message, error.response);
      setProducts([]);
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
      
      const response = await fetch(`${apiService.baseURL}/api/partners?${new URLSearchParams(params)}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setPartners(Array.isArray(data) ? data : data.partners || []);
        if (data.pagination) {
          setPartnersPagination(data.pagination);
        }
      } else {
        console.error("Failed to fetch partners");
        setPartners([]);
      }
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
      
      const response = await fetch(`${apiService.baseURL}/api/partnership-requests?${new URLSearchParams(params)}`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setPartnershipRequests(Array.isArray(data) ? data : data.partnershipRequests || []);
        if (data.pagination) {
          setPartnershipRequestsPagination(data.pagination);
        }
      } else {
        console.error("Failed to fetch partnership requests");
        setPartnershipRequests([]);
      }
    } catch (error) {
      console.error("Partnership requests fetch error:", error);
      setPartnershipRequests([]);
    }
  };

  const handleUserRoleUpdate = async (userId, newRole) => {
    if (!window.confirm(`Are you sure you want to change this user"s role to ${newRole}?`)) {
      return;
    }

    try {
      await apiService.updateUserRole(userId, newRole);
      setAutoMessage(`User role updated to ${newRole} successfully`);
      fetchUsers(usersPagination.currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      setAutoMessage("Failed to update user role: " + error.message);
    }
  };

  const handleUserDelete = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiService.deleteUserAdmin(userId);
      setAutoMessage(`User "${userName}" deleted successfully`);
      fetchUsers(usersPagination.currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      setAutoMessage("Failed to delete user: " + error.message);
    }
  };

  const handleContactStatusUpdate = async (contactId, newStatus) => {
    try {
      await apiService.updateContactStatus(contactId, newStatus);
      setAutoMessage(`Contact status updated to ${newStatus}`);
      fetchContacts(contactsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Failed to update contact status: " + error.message);
    }
  };

  const handleContactDelete = async (contactId, contactName) => {
    if (!window.confirm(`Are you sure you want to delete contact from "${contactName}"?`)) {
      return;
    }

    try {
      await apiService.deleteContactAdmin(contactId);
      setAutoMessage("Contact deleted successfully");
      fetchContacts(contactsPagination.currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      setAutoMessage("Failed to delete contact: " + error.message);
    }
  };

  const handleNewsletterDelete = async (subscriberId, email) => {
    if (!window.confirm(`Are you sure you want to unsubscribe "${email}" from the newsletter?`)) {
      return;
    }

    try {
      await apiService.deleteNewsletterSubscriber(subscriberId);
      setAutoMessage("Newsletter subscriber removed successfully");
      fetchNewsletters(newslettersPagination.currentPage);
      fetchDashboardStats(); // Refresh stats
    } catch (error) {
      setAutoMessage("Failed to remove subscriber: " + error.message);
    }
  };

  // Service handlers
  const handleServiceSubmit = async (serviceData) => {
    try {
      if (editingService) {
        await apiService.updateService(editingService._id, serviceData);
        setAutoMessage("Service updated successfully");
      } else {
        await apiService.createService(serviceData);
        setAutoMessage("Service created successfully");
      }
      setShowServiceForm(false);
      setEditingService(null);
      fetchServices(servicesPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Failed to save service: " + error.message);
    }
  };

  const handleServiceEdit = (service) => {
    console.log("🖊️ Edit button clicked for service:", service);
    console.log("Service ID:", service._id);
    console.log("Service Title:", service.title);
    setEditingService(service);
    setShowServiceForm(true);
    console.log("✅ showServiceForm set to true");
  };

  const handleServiceDelete = async (serviceId, serviceName) => {
    if (!window.confirm(`Are you sure you want to delete service "${serviceName}"?`)) {
      return;
    }

    try {
      await apiService.deleteService(serviceId);
      setAutoMessage("Service deleted successfully");
      fetchServices(servicesPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Failed to delete service: " + error.message);
    }
  };

  const handleServiceToggleFeatured = async (serviceId) => {
    try {
      await apiService.toggleServiceFeatured(serviceId);
      setAutoMessage("Service featured status updated");
      fetchServices(servicesPagination.currentPage);
    } catch (error) {
      setAutoMessage("Failed to update featured status: " + error.message);
    }
  };

  // Project handlers
  const handleProjectSubmit = async (projectData) => {
    try {
      if (editingProject) {
        await apiService.updateProject(editingProject._id, projectData);
        setAutoMessage("Project updated successfully");
      } else {
        await apiService.createProject(projectData);
        setAutoMessage("Project created successfully");
      }
      setShowProjectForm(false);
      setEditingProject(null);
      fetchProjects(projectsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Failed to save project: " + error.message);
    }
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
      setAutoMessage("Project deleted successfully");
      fetchProjects(projectsPagination.currentPage);
      fetchDashboardStats();
    } catch (error) {
      setAutoMessage("Failed to delete project: " + error.message);
    }
  };

  const handleProjectToggleFeatured = async (projectId) => {
    try {
      await apiService.toggleProjectFeatured(projectId);
      setAutoMessage("Project featured status updated");
      fetchProjects(projectsPagination.currentPage);
    } catch (error) {
      setAutoMessage("Failed to update featured status: " + error.message);
    }
  };

  // Partner management functions
  const handlePartnerSave = async () => {
    try {
      setAutoMessage("Partner saved successfully");
      fetchPartners(partnersPagination.currentPage);
    } catch (error) {
      setAutoMessage("Failed to save partner: " + error.message);
    }
  };

  const handlePartnerEdit = (partner) => {
    setEditingPartner(partner);
    setShowPartnerForm(true);
  };

  const handlePartnerDelete = async (partnerId, partnerName) => {
    if (!window.confirm(`Are you sure you want to delete partner "${partnerName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${apiService.baseURL}/api/partners/${partnerId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setAutoMessage("Partner deleted successfully");
        fetchPartners(partnersPagination.currentPage);
      } else {
        const errorData = await response.json();
        setAutoMessage("Failed to delete partner: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      setAutoMessage("Failed to delete partner: " + error.message);
    }
  };

  const handlePartnerToggleActive = async (partnerId) => {
    try {
      const partner = partners.find(p => p._id === partnerId);
      if (!partner) return;

      const response = await fetch(`${apiService.baseURL}/api/partners/${partnerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          name: partner.name,
          isActive: !partner.isActive
        })
      });

      if (response.ok) {
        setAutoMessage("Partner status updated");
        fetchPartners(partnersPagination.currentPage);
      } else {
        const errorData = await response.json();
        setAutoMessage("Failed to update partner status: " + (errorData.message || "Unknown error"));
      }
    } catch (error) {
      setAutoMessage("Failed to update partner status: " + error.message);
    }
  };

  // Partnership Request Handlers
  const handlePartnershipRequestStatusUpdate = async (requestId, newStatus) => {
    try {
      const response = await fetch(`${apiService.baseURL}/api/partnership-requests/${requestId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setAutoMessage("Partnership request status updated");
        fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
      } else {
        const errorData = await response.json();
        setAutoMessage("Failed to update partnership request status: " + (errorData.message || "Unknown error"), true);
      }
    } catch (error) {
      setAutoMessage("Failed to update partnership request status: " + error.message, true);
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
      const response = await fetch(`${apiService.baseURL}/api/partnership-requests/${requestId}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (response.ok) {
        setAutoMessage("Partnership request deleted successfully");
        fetchPartnershipRequests(partnershipRequestsPagination.currentPage);
      } else {
        const errorData = await response.json();
        setAutoMessage("Failed to delete partnership request: " + (errorData.message || "Unknown error"), true);
      }
    } catch (error) {
      setAutoMessage("Failed to delete partnership request: " + error.message, true);
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="admin-modal">
        <div className="admin-content">
          <div className="admin-header">
            <h2>Admin Dashboard Sap-Technologies Uganda</h2>
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
            <h2>Admin Dashboard Sap-Technologies Uganda</h2>
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
          <h2>Admin Dashboard Sap-Technologies Uganda</h2>
          <div className="admin-user-info">
            <span>Welcome, {user?.name}</span>
            <span className="admin-badge">ADMIN</span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`message ${message.includes("Failed") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📊 Overview
          </button>
          <button 
            className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👥 Users ({dashboardStats?.stats?.totalUsers || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "contacts" ? "active" : ""}`}
            onClick={() => setActiveTab("contacts")}
          >
            📧 Contacts ({dashboardStats?.stats?.totalContacts || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "newsletters" ? "active" : ""}`}
            onClick={() => setActiveTab("newsletters")}
          >
            📰 Newsletter ({dashboardStats?.stats?.totalNewsletterSubscribers || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "services" ? "active" : ""}`}
            onClick={() => setActiveTab("services")}
          >
            🛠️ Services ({dashboardStats?.stats?.totalServices || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "projects" ? "active" : ""}`}
            onClick={() => setActiveTab("projects")}
          >
            🚀 Projects ({dashboardStats?.stats?.totalProjects || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "partners" ? "active" : ""}`}
            onClick={() => setActiveTab("partners")}
          >
            🤝 Partners ({partners.length || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "partnership-requests" ? "active" : ""}`}
            onClick={() => setActiveTab("partnership-requests")}
          >
            📝 Partnership Requests ({partnershipRequests.length || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            onClick={() => setActiveTab("products")}
          >
            📦 Products ({products.length || 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === "awards" ? "active" : ""}`}
            onClick={() => setActiveTab("awards")}
          >
            🏆 Awards Management
          </button>
        </div>

        <div className="admin-main">
          <div className="tab-content">
            {activeTab === "overview" && (
              <div className="dashboard-overview">
                <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalUsers || 0}</h3>
                    <p>Total Users</p>
                    <small>+{dashboardStats?.stats?.newUsersLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👑</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalAdmins || 0}</h3>
                    <p>Administrators</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📧</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalContacts || 0}</h3>
                    <p>Contact Messages</p>
                    <small>+{dashboardStats?.stats?.newContactsLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📰</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalNewsletterSubscribers || 0}</h3>
                    <p>Newsletter Subscribers</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🛠️</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalServices || 0}</h3>
                    <p>Services</p>
                    <small>{dashboardStats?.stats?.featuredServices || 0} featured</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🚀</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProjects || 0}</h3>
                    <p>Projects</p>
                    <small>{dashboardStats?.stats?.completedProjects || 0} completed</small>
                  </div>
                </div>
              </div>

              <div className="system-health">
                <h3>System Health</h3>
                <div className="health-grid">
                  <div className="health-item">
                    <span className="health-label">Database:</span>
                    <span className={`health-status ${systemHealth?.database === "connected" ? "online" : "offline"}`}>
                      {systemHealth?.database || "Unknown"}
                    </span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Uptime:</span>
                    <span className="health-value">{systemHealth ? formatUptime(systemHealth.uptime) : "Unknown"}</span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Memory:</span>
                    <span className="health-value">
                      {systemHealth ? `${systemHealth.memory.used}MB / ${systemHealth.memory.total}MB` : "Unknown"}
                    </span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Node.js:</span>
                    <span className="health-value">{systemHealth?.nodeVersion || "Unknown"}</span>
                  </div>
                </div>
              </div>

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
                    🔄 Refresh
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
                    <option value="responded">Responded</option>
                  </select>
                </div>
                <button onClick={() => fetchContacts(1)} className="btn-refresh">
                  🔄 Refresh
                </button>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
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
                        <td>{contact.subject}</td>
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
                            <option value="responded">Responded</option>
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
                  🔄 Refresh
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
                    ➕ Add Service
                  </button>
                  <button onClick={() => fetchServices(1)} className="btn-refresh">
                    🔄 Refresh
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
                            {service.featured ? "⭐" : "☆"}
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
                                console.log("✏️ Edit Service clicked:", service.title);
                                console.log("Service ID:", service._id);
                                handleServiceEdit(service);
                                console.log("✅ Service form should open now");
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
                                console.log("🗑️ Delete Service clicked:", service.title);
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
                    ➕ Add Project
                  </button>
                  <button onClick={() => fetchProjects(1)} className="btn-refresh">
                    🔄 Refresh
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
                            {project.featured ? "⭐" : "☆"}
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
                                src={`${apiService.baseURL}${partner.logo}`} 
                                alt={`${partner.name} logo`}
                                className="partner-logo-thumbnail"
                              />
                            ) : (
                              <div className="logo-placeholder">
                                {partner.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{partner.name}</td>
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
                            onClick={() => handlePartnerDelete(partner._id, partner.name)}
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
                                  src={product.image ? `${apiService.baseURL}${product.image}` : "/images/default-product.jpg"}
                                  alt={product.name}
                                  className="table-product-image"
                                  onError={(e) => {
                                    e.target.src = "/images/default-product.jpg";
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
                                {product.isFeatured ? '⭐ Featured' : '-'}
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
                                    console.log("✏️ Edit Product clicked:", product.name);
                                    console.log("Product ID:", product._id);
                                    setEditingProduct(product);
                                    setShowProductForm(true);
                                    console.log("✅ Product form should open now");
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
                                    console.log("🗑️ Delete Product clicked:", product.name);
                                    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                                      try {
                                        await apiService.deleteProduct(product._id);
                                        setAutoMessage(`Product "${product.name}" deleted successfully`);
                                        fetchProducts();
                                      } catch (error) {
                                        console.error('Delete product error:', error);
                                        setAutoMessage('Failed to delete product', true);
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
                      ← Previous
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
                      Next →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Awards Tab */}
          {activeTab === "awards" && (
            <div className="tab-panel">
              {console.log("🏆 Rendering Awards Tab!")}
              <AwardsAdmin />
            </div>
          )}
        </div>
        <BackToTop />
      </div>
      
      {/* Service Form Modal */}
      {showServiceForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10001 }}>
          {console.log("🎯 Rendering ServiceForm with:", { editingService, showServiceForm })}
          <ServiceForm 
            service={editingService}
            onClose={() => {
              console.log("❌ Closing ServiceForm");
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
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}
    </div>
    </div>
  );
};

export default AdminDashboard;