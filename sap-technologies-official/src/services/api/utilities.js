export default {
  async getCurrentUser() {
    const authStatus = await this.checkAuthStatus();
    return authStatus.user || null;
  },
  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      return user && user.role === "admin";
    } catch {
      return false;
    }
  },
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      ...options
    });
  },
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
  },
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
  },
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options
    });
  },
  async verifyCertificate(certificateId) {
    return this.request(`/api/certificates/verify/${certificateId}`, {
      method: "GET"
    });
  },
  async search(q, type = 'all', limit = 20) {
    const params = new URLSearchParams({
      q,
      type,
      limit: String(limit)
    });
    return this.request(`/api/search?${params}`, {
      useCache: false
    });
  }
};
