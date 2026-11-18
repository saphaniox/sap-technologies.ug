export default {
  async getPublicJobs() {
    return this.request("/api/jobs/public");
  },
  async getJob(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      useCache: false
    });
  },
  async getAdminJobs() {
    return this.request("/api/jobs", {
      useCache: false
    });
  },
  async createJob(jobData) {
    const config = {
      method: "POST"
    };
    if (jobData instanceof FormData) {
      config.body = jobData;
    } else {
      config.body = JSON.stringify(jobData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    const result = await this.request("/api/jobs", config);
    this.clearCache();
    return result;
  },
  async updateJob(jobId, jobData) {
    const config = {
      method: "PUT"
    };
    if (jobData instanceof FormData) {
      config.body = jobData;
    } else {
      config.body = JSON.stringify(jobData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    const result = await this.request(`/api/jobs/${jobId}`, config);
    this.clearCache();
    return result;
  },
  async deleteJob(jobId) {
    return this.request(`/api/jobs/${jobId}`, {
      method: "DELETE"
    });
  },
  async applyForJob(jobId, applicationData) {
    const config = {
      method: "POST"
    };
    if (applicationData instanceof FormData) {
      config.body = applicationData;
    } else {
      config.body = JSON.stringify(applicationData);
      config.headers = {
        "Content-Type": "application/json"
      };
    }
    return this.request(`/api/jobs/${jobId}/apply`, config);
  },
  async getJobApplications(jobId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/jobs/${jobId}/applications${queryString ? `?${queryString}` : ""}`, {
      useCache: false
    });
  },
  async getAllJobApplications(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/jobs/admin/applications${queryString ? `?${queryString}` : ""}`, {
      useCache: false
    });
  },
  async updateApplicationStatus(applicationId, status, adminNotes = "") {
    return this.request(`/api/jobs/applications/${applicationId}/status`, {
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
  async sendJobApplicationEmail(applicationId, emailData = {}) {
    return this.request(`/api/jobs/applications/${applicationId}/email`, {
      method: "POST",
      body: JSON.stringify(emailData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};
