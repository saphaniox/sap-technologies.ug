export default {
  async getAllServices(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/admin/services?${queryParams}`, {
      useCache: false
    });
  },
  async getServiceById(serviceId) {
    return this.request(`/api/admin/services/${serviceId}`, {
      useCache: false
    });
  },
  async createService(serviceData) {
    const config = {
      method: "POST"
    };

    // If serviceData is FormData, don"t set content-type header
    if (serviceData instanceof FormData) {
      config.body = serviceData;
    } else {
      config.body = JSON.stringify(serviceData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    const result = await this.request("/api/admin/services", config);
    // Clear services cache after mutation
    this.clearCache();
    return result;
  },
  async updateService(serviceId, serviceData) {
    const config = {
      method: "PUT"
    };

    // If serviceData is FormData, don"t set content-type header
    if (serviceData instanceof FormData) {
      config.body = serviceData;
    } else {
      config.body = JSON.stringify(serviceData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    const result = await this.request(`/api/admin/services/${serviceId}`, config);
    // Clear services cache after mutation
    this.clearCache();
    return result;
  },
  async deleteService(serviceId) {
    const result = await this.request(`/api/admin/services/${serviceId}`, {
      method: "DELETE"
    });
    // Clear services cache after mutation
    this.clearCache();
    return result;
  },
  async toggleServiceFeatured(serviceId) {
    return this.request(`/api/admin/services/${serviceId}/featured`, {
      method: "PATCH"
    });
  },
  async getServiceCategories() {
    return this.request("/api/admin/services/categories");
  },
  async getServiceStats() {
    return this.request("/api/admin/services/stats", {
      useCache: false
    });
  },
  async getAllProjects(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/admin/projects?${queryParams}`, {
      useCache: false
    });
  },
  async getProjectById(projectId) {
    return this.request(`/api/admin/projects/${projectId}`, {
      useCache: false
    });
  },
  async createProject(projectData) {
    const config = {
      method: "POST"
    };

    // If projectData is FormData, don"t set content-type header
    if (projectData instanceof FormData) {
      config.body = projectData;
    } else {
      config.body = JSON.stringify(projectData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    const result = await this.request("/api/admin/projects", config);
    // Clear projects cache after mutation
    this.clearCache();
    return result;
  },
  async updateProject(projectId, projectData) {
    const config = {
      method: "PUT"
    };

    // If projectData is FormData, don"t set content-type header
    if (projectData instanceof FormData) {
      config.body = projectData;
    } else {
      config.body = JSON.stringify(projectData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    const result = await this.request(`/api/admin/projects/${projectId}`, config);
    // Clear projects cache after mutation
    this.clearCache();
    return result;
  },
  async deleteProject(projectId) {
    const result = await this.request(`/api/admin/projects/${projectId}`, {
      method: "DELETE"
    });
    // Clear projects cache after mutation
    this.clearCache();
    return result;
  },
  async toggleProjectFeatured(projectId) {
    return this.request(`/api/admin/projects/${projectId}/featured`, {
      method: "PATCH"
    });
  },
  async getProjectStats() {
    return this.request("/api/admin/projects/stats", {
      useCache: false
    });
  },
  async getPublicServices(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/public/services${queryString ? `?${queryString}` : ""}`);
  },
  async getPublicProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/public/projects${queryString ? `?${queryString}` : ""}`, {
      method: "GET"
    });
  },
  async getPublicServiceById(serviceId) {
    return this.request(`/api/public/services/${serviceId}`);
  },
  async getPublicProjectById(projectId) {
    return this.request(`/api/public/projects/${projectId}`);
  },
  async getPublicServiceCategories() {
    return this.request("/api/public/services/categories");
  },
  async getPublicProjectCategories() {
    return this.request("/api/public/projects/categories");
  },
  async getProjectCategories() {
    return this.getPublicProjectCategories();
  },
  async getPartners() {
    return this.request("/api/partners/public");
  },
  async getAdminPartners(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/partners${query ? `?${query}` : ""}`, {
      useCache: false
    });
  },
  async deletePartner(partnerId) {
    return this.request(`/api/partners/${partnerId}`, {
      method: "DELETE"
    });
  },
  async getPartnershipRequests(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/partnership-requests${query ? `?${query}` : ""}`, {
      useCache: false
    });
  }
};
