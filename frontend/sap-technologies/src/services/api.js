// API Service - handles all communication between frontend and backend
// This is like a translator that helps our React app talk to our Express server
// It handles authentication, error handling, and data formatting

// Production API configuration - always use production server
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://sap-technologies-ug.onrender.com";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Main method for making HTTP requests to our backend
  // This handles all the common stuff like headers, cookies, and error handling
  async request(endpoint, options = {}) {
    // Ensure endpoint starts with /api unless it already does
    const apiEndpoint = endpoint.startsWith('/api') ? endpoint : `/api${endpoint}`;
    const url = `${this.baseURL}${apiEndpoint}`;
    
    // Set up headers - but be careful with file uploads!
    // FormData needs special handling (browser sets Content-Type automatically)
    const headers = {};
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }
    
    const config = {
      method: "GET", // Default to GET request
      headers: {
        ...headers,
        ...options.headers,
      },
      credentials: "include", // Super important! This sends cookies so server knows who we are
      ...options,
    };

    try {
      // Actually make the request to our server
      const response = await fetch(url, config);
      
      // Try to figure out what kind of response we got back
      const contentType = response.headers.get("Content-Type");
      let data;
      
      try {
        // Most of our API returns JSON, but sometimes it's just text
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.text();
        }
      } catch (parseError) {
        // Sometimes the server sends back weird responses we can't parse
        console.error("Failed to parse response:", parseError);
        console.error("Response status:", response.status);
        console.error("Response headers:", response.headers);
        // Create a fallback error message so the app doesn't crash
        data = { 
          message: `Server error: ${response.status} ${response.statusText}`,
          status: response.status 
        };
      }

      if (!response.ok) {
        // Handle authentication errors more gracefully
        if (response.status === 401) {
          throw new Error("Authentication required");
        }
        
        // Create enhanced error with response data
        const error = new Error(data.message || `HTTP error! status: ${response.status}`);
        error.response = {
          status: response.status,
          statusText: response.statusText,
          data: data
        };
        throw error;
      }

      return data;
    } catch (error) {
      // Only log errors that aren"t authentication-related to reduce console noise
      if (!error.message.includes("Authentication required")) {
        console.error("API request failed:", error);
      }
      throw error;
    }
  }

  // Authentication methods - handle user login/logout/registration
  // These are the core methods that let users access their accounts
  
  async login(credentials) {
    // Send login request with email/password
    return this.request("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData) {
    // Create new user account with name, email, password
    return this.request("/api/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.request("/api/logout", {
      method: "POST",
    });
  }

  // Password Reset Methods
  async requestPasswordReset(email) {
    // Request verification code for password reset
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(resetData) {
    // Reset password with verification code
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(resetData),
    });
  }

  async resendResetCode(email) {
    // Resend verification code
    return this.request("/auth/resend-reset-code", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async getAccount() {
    return this.request("/api/account");
  }

  // Check authentication status without throwing errors for unauthenticated users
  async checkAuthStatus() {
    try {
      const response = await this.request("/api/account");
      return { isAuthenticated: true, user: response?.data?.user };
    } catch (error) {
      if (error.message.includes("Authentication required")) {
        return { isAuthenticated: false, user: null };
      }
      // Re-throw other errors
      throw error;
    }
  }

  async updateAccount(userData) {
    return this.request("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async updateEmail(email) {
    return this.request("/api/users/email", {
      method: "PUT",
      body: JSON.stringify({ email }),
    });
  }

  async updatePassword(passwordData) {
    return this.request("/api/users/password", {
      method: "PUT",
      body: JSON.stringify(passwordData),
    });
  }

  async uploadProfilePic(file) {
    const formData = new FormData();
    formData.append("profilePic", file);
    
    return this.request("/api/users/profile-pic", {
      method: "POST",
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  async deleteAccount() {
    return this.request("/api/users/account", {
      method: "DELETE",
    });
  }

  async getUserActivity() {
    return this.request("/api/users/activity");
  }

  // Admin endpoints
  async getAdminDashboardStats() {
    return this.request("/api/admin/dashboard/stats");
  }

  async getSystemHealth() {
    return this.request("/api/admin/system/health");
  }

  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users${query ? `?${query}` : ""}`);
  }

  async updateUserRole(userId, role) {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  }

  async deleteUserAdmin(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "DELETE",
    });
  }

  async getAllContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/contacts${query ? `?${query}` : ""}`);
  }

  async updateContactStatus(contactId, status) {
    return this.request(`/api/admin/contacts/${contactId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async deleteContactAdmin(contactId) {
    return this.request(`/api/admin/contacts/${contactId}`, {
      method: "DELETE",
    });
  }

  async getAllNewsletterSubscribers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/newsletter/subscribers${query ? `?${query}` : ""}`);
  }

  async deleteNewsletterSubscriber(subscriberId) {
    return this.request(`/api/admin/newsletter/subscribers/${subscriberId}`, {
      method: "DELETE",
    });
  }

  // Contact form
  async submitContact(contactData) {
    return this.request("/api/contact", {
      method: "POST",
      body: JSON.stringify(contactData),
    });
  }

  // Newsletter subscription
  async subscribeNewsletter(email) {
    return this.request("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  // Health check
  async healthCheck() {
    return this.request("/api/health");
  }

  // Services management
  async getAllServices(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/admin/services?${queryParams}`);
  }

  async getServiceById(serviceId) {
    return this.request(`/api/admin/services/${serviceId}`);
  }

  async createService(serviceData) {
    const config = {
      method: "POST",
    };
    
    // If serviceData is FormData, don"t set content-type header
    if (serviceData instanceof FormData) {
      config.body = serviceData;
    } else {
      config.body = JSON.stringify(serviceData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    return this.request("/api/admin/services", config);
  }

  async updateService(serviceId, serviceData) {
    const config = {
      method: "PUT",
    };
    
    // If serviceData is FormData, don"t set content-type header
    if (serviceData instanceof FormData) {
      config.body = serviceData;
    } else {
      config.body = JSON.stringify(serviceData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    return this.request(`/api/admin/services/${serviceId}`, config);
  }

  async deleteService(serviceId) {
    return this.request(`/api/admin/services/${serviceId}`, {
      method: "DELETE",
    });
  }

  async toggleServiceFeatured(serviceId) {
    return this.request(`/api/admin/services/${serviceId}/featured`, {
      method: "PATCH",
    });
  }

  async getServiceCategories() {
    return this.request("/api/admin/services/categories");
  }

  async getServiceStats() {
    return this.request("/api/admin/services/stats");
  }

  // Projects management
  async getAllProjects(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/admin/projects?${queryParams}`);
  }

  async getProjectById(projectId) {
    return this.request(`/api/admin/projects/${projectId}`);
  }

  async createProject(projectData) {
    const config = {
      method: "POST",
    };
    
    // If projectData is FormData, don"t set content-type header
    if (projectData instanceof FormData) {
      config.body = projectData;
    } else {
      config.body = JSON.stringify(projectData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    return this.request("/api/admin/projects", config);
  }

  async updateProject(projectId, projectData) {
    const config = {
      method: "PUT",
    };
    
    // If projectData is FormData, don"t set content-type header
    if (projectData instanceof FormData) {
      config.body = projectData;
    } else {
      config.body = JSON.stringify(projectData);
      config.headers = { "Content-Type": "application/json" };
    }
    
    return this.request(`/api/admin/projects/${projectId}`, config);
  }

  async deleteProject(projectId) {
    return this.request(`/api/admin/projects/${projectId}`, {
      method: "DELETE",
    });
  }

  async toggleProjectFeatured(projectId) {
    return this.request(`/api/admin/projects/${projectId}/featured`, {
      method: "PATCH",
    });
  }

  async getProjectStats() {
    return this.request("/api/admin/projects/stats");
  }

  // Public API methods (no authentication required)
  async getPublicServices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/public/services${queryString ? `?${queryString}` : ""}`);
  }

  async getPublicProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/public/projects${queryString ? `?${queryString}` : ""}`, {
      method: "GET"
    });
  }

  async getPublicServiceById(serviceId) {
    return this.request(`/api/public/services/${serviceId}`);
  }

  async getPublicProjectById(projectId) {
    return this.request(`/api/public/projects/${projectId}`);
  }

  async getPublicServiceCategories() {
    return this.request("/api/public/services/categories");
  }

  async getPublicProjectCategories() {
    return this.request("/api/public/projects/categories");
  }

  // Partner methods
  async getPartners() {
    return this.request("/api/partners/public");
  }

  async deletePartner(partnerId) {
    return this.request(`/api/partners/${partnerId}`, {
      method: "DELETE"
    });
  }

  // Awards Admin methods
  async getAwardsCategories() {
    return this.request("/awards/categories");
  }

  async createAwardsCategory(categoryData) {
    return this.request("/awards/admin/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async updateAwardsCategory(categoryId, categoryData) {
    return this.request(`/awards/admin/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteAwardsCategory(categoryId) {
    return this.request(`/awards/admin/categories/${categoryId}`, {
      method: "DELETE"
    });
  }

  async getAdminNominations(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/awards/admin/nominations${queryParams ? `?${queryParams}` : ""}`);
  }

  async updateNominationStatus(nominationId, status, adminNotes = "") {
    return this.request(`/awards/admin/nominations/${nominationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNotes }),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteNomination(nominationId) {
    return this.request(`/awards/admin/nominations/${nominationId}`, {
      method: "DELETE"
    });
  }

  async getAwardsStats() {
    return this.request("/awards/admin/stats");
  }

  async createAdminNomination(formData) {
    return this.request("/awards/nominations", {
      method: "POST",
      body: formData
    });
  }

  // Products methods
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/products${queryParams ? `?${queryParams}` : ""}`);
  }

  async getProduct(productId) {
    return this.request(`/api/products/${productId}`);
  }

  async getProductCategories() {
    return this.request("/api/products/categories");
  }

  // Products Admin methods
  async getProductsAdmin(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/products/admin/products${queryParams ? `?${queryParams}` : ""}`);
  }

  async createProduct(formData) {
    return this.request("/api/products/admin/products", {
      method: "POST",
      body: formData
    });
  }

  async updateProduct(productId, formData) {
    return this.request(`/api/products/admin/products/${productId}`, {
      method: "PUT",
      body: formData
    });
  }

  async deleteProduct(productId) {
    return this.request(`/api/products/admin/products/${productId}`, {
      method: "DELETE"
    });
  }

  async updateProductOrder(products) {
    return this.request("/api/products/admin/products-order", {
      method: "PUT",
      body: JSON.stringify({ products }),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getProductAnalytics() {
    return this.request("/api/products/admin/analytics");
  }

  // Product Inquiry methods
  async submitProductInquiry(inquiryData) {
    return this.request("/api/products/inquiries", {
      method: "POST",
      body: JSON.stringify(inquiryData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getProductInquiries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/products/admin/inquiries?${queryString}`);
  }

  async updateInquiryStatus(inquiryId, data) {
    return this.request(`/api/products/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteInquiry(inquiryId) {
    return this.request(`/api/products/admin/inquiries/${inquiryId}`, {
      method: "DELETE"
    });
  }

  async getInquiryStats() {
    return this.request("/api/products/admin/inquiries/stats");
  }

  // Service Quote methods
  async submitServiceQuote(quoteData) {
    return this.request("/api/services/quotes", {
      method: "POST",
      body: JSON.stringify(quoteData),
      headers: { "Content-Type": "application/json" }
    });
  }

  async getServiceQuotes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/services/admin/quotes?${queryString}`);
  }

  async updateQuoteStatus(quoteId, data) {
    return this.request(`/api/services/admin/quotes/${quoteId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" }
    });
  }

  async deleteQuote(quoteId) {
    return this.request(`/api/services/admin/quotes/${quoteId}`, {
      method: "DELETE"
    });
  }

  async getQuoteStats() {
    return this.request("/api/services/admin/quotes/stats");
  }

  // User methods
  async getCurrentUser() {
    const response = await this.request("/api/account");
    return response.data?.user;
  }

  // Generic HTTP methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      ...options
    });
  }

  async post(endpoint, body, options = {}) {
    const config = {
      method: "POST",
      ...options
    };

    // Handle FormData vs JSON
    if (body instanceof FormData) {
      config.body = body;
      // Remove Content-Type header for FormData to let browser set it
      if (config.headers && config.headers["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
    } else if (body) {
      config.body = JSON.stringify(body);
    }

    return this.request(endpoint, config);
  }

  async put(endpoint, body, options = {}) {
    const config = {
      method: "PUT",
      ...options
    };

    if (body instanceof FormData) {
      config.body = body;
      if (config.headers && config.headers["Content-Type"]) {
        delete config.headers["Content-Type"];
      }
    } else if (body) {
      config.body = JSON.stringify(body);
    }

    return this.request(endpoint, config);
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options
    });
  }

  // Certificate verification method (public endpoint)
  async verifyCertificate(certificateId) {
    return this.request(`/api/certificates/verify/${certificateId}`, {
      method: "GET"
    });
  }
}

// Create and export a single instance
const apiService = new ApiService();
export default apiService;
export { apiService };
