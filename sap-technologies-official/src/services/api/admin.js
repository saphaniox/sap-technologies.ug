export default {
  async getAdminDashboardStats() {
    return this.request("/api/admin/dashboard/stats", {
      useCache: false
    });
  },
  async getSystemHealth() {
    return this.request("/api/admin/system/health", {
      useCache: false
    });
  },
  async getAdminEmailSettings() {
    return this.request("/api/admin/settings/email", {
      useCache: false
    });
  },
  async updateAdminEmailProvider(providerMode) {
    const result = await this.request("/api/admin/settings/email/provider", {
      method: "PUT",
      body: JSON.stringify({
        providerMode
      })
    });
    this.clearCache();
    return result;
  },
  async updateAdminEmailSettings(settings) {
    const result = await this.request("/api/admin/settings/email", {
      method: "PUT",
      body: JSON.stringify(settings)
    });
    this.clearCache();
    return result;
  },
  async sendCustomAdminEmail(emailData = {}) {
    return this.request("/api/admin/email/send", {
      method: "POST",
      body: JSON.stringify(emailData)
    });
  },
  async getSavedEmailMessages() {
    return this.request("/api/admin/email/messages", {
      useCache: false
    });
  },
  async saveEmailMessage(emailData = {}) {
    return this.request("/api/admin/email/messages", {
      method: "POST",
      body: JSON.stringify(emailData)
    });
  },
  async deleteSavedEmailMessage(messageId) {
    return this.request(`/api/admin/email/messages/${messageId}`, {
      method: "DELETE"
    });
  },
  async getAllUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/users${query ? `?${query}` : ""}`, {
      useCache: false
    });
  },
  async updateUserRole(userId, role) {
    return this.request(`/api/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({
        role
      })
    });
  },
  async deleteUserAdmin(userId) {
    return this.request(`/api/admin/users/${userId}`, {
      method: "DELETE"
    });
  },
  async getAllContacts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/contacts${query ? `?${query}` : ""}`, {
      useCache: false
    });
  },
  async updateContactStatus(contactId, status) {
    return this.request(`/api/admin/contacts/${contactId}/status`, {
      method: "PUT",
      body: JSON.stringify({
        status
      })
    });
  },
  async deleteContactAdmin(contactId) {
    return this.request(`/api/admin/contacts/${contactId}`, {
      method: "DELETE"
    });
  },
  async getAllNewsletterSubscribers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/admin/newsletter/subscribers${query ? `?${query}` : ""}`, {
      useCache: false
    });
  },
  async deleteNewsletterSubscriber(subscriberId) {
    return this.request(`/api/admin/newsletter/subscribers/${subscriberId}`, {
      method: "DELETE"
    });
  }
};
