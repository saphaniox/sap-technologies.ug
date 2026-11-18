export default {
  async getAwardsCategories() {
    return this.request("/awards/categories", {
      useCache: false
    });
  },
  async createAwardsCategory(categoryData) {
    return this.request("/awards/admin/categories", {
      method: "POST",
      body: JSON.stringify(categoryData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async updateAwardsCategory(categoryId, categoryData) {
    return this.request(`/awards/admin/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async deleteAwardsCategory(categoryId) {
    return this.request(`/awards/admin/categories/${categoryId}`, {
      method: "DELETE"
    });
  },
  async getAdminNominations(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/awards/admin/nominations${queryParams ? `?${queryParams}` : ""}`, {
      useCache: false
    });
  },
  async getAwardCandidateDrafts() {
    return this.request("/awards/admin/candidate-drafts", {
      useCache: false
    });
  },
  async createAwardCandidateDraft(candidate) {
    return this.request("/awards/admin/candidate-drafts", {
      method: "POST",
      body: JSON.stringify(candidate),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async updateAwardCandidateDraft(draftId, candidate) {
    return this.request(`/awards/admin/candidate-drafts/${draftId}`, {
      method: "PATCH",
      body: JSON.stringify(candidate),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async deleteAwardCandidateDraft(draftId) {
    return this.request(`/awards/admin/candidate-drafts/${draftId}`, {
      method: "DELETE"
    });
  },
  async updateNominationStatus(nominationId, status, adminNotes = "") {
    return this.request(`/awards/admin/nominations/${nominationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        adminNotes
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async addAdminVotes(nominationId, amount, reason) {
    return this.post(`/awards/admin/nominations/${nominationId}/votes`, {
      amount,
      reason
    });
  },
  async updateNomination(nominationId, formData) {
    return this.request(`/awards/admin/nominations/${nominationId}`, {
      method: "PUT",
      body: formData
    });
  },
  async deleteNomination(nominationId) {
    return this.request(`/awards/admin/nominations/${nominationId}`, {
      method: "DELETE"
    });
  },
  async getAwardsStats() {
    return this.request("/api/awards/admin/stats", {
      useCache: false
    });
  },
  async createAdminNomination(formData) {
    return this.request("/awards/nominations", {
      method: "POST",
      body: formData
    });
  }
};
