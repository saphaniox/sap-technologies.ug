export default {
  async login(credentials) {
    // Send login request with email/password
    const response = await this.request("/api/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    const token = response?.data?.accessToken;
    if (token) {
      this.setAuthToken(token);
    }
    return response;
  },
  async signup(userData) {
    // Create new user account with name, email, password, and optional phone
    const payload = {
      name: userData.name?.trim(),
      email: userData.email?.trim(),
      password: userData.password
    };
    const phone = userData.phone?.trim();
    if (phone) {
      payload.phone = phone;
    }
    const response = await this.request("/api/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const token = response?.data?.accessToken;
    if (token) {
      this.setAuthToken(token);
    }
    return response;
  },
  async logout() {
    try {
      return await this.request("/api/logout", {
        method: "POST"
      });
    } finally {
      this.setAuthToken("");
    }
  },
  async requestPasswordReset(email) {
    // Request verification code for password reset
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({
        email
      })
    });
  },
  async resetPassword(resetData) {
    // Reset password with verification code
    return this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(resetData)
    });
  },
  async resendResetCode(email) {
    // Resend verification code
    return this.request("/auth/resend-reset-code", {
      method: "POST",
      body: JSON.stringify({
        email
      })
    });
  },
  async getAccount() {
    return this.request("/api/account");
  },
  async checkAuthStatus(options = {}) {
    const force = Boolean(options.force);
    if (!force) {
      const cached = this.getCachedAuthStatus();
      if (cached) return cached;
      if (this.authStatusPromise) {
        return this.authStatusPromise;
      }
    }
    this.authStatusPromise = (async () => {
      try {
        const response = await this.request("/api/account", {
          useCache: false
        });
        const status = {
          isAuthenticated: true,
          user: response?.data?.user
        };
        this.setAuthStatusCache(status);
        return status;
      } catch (error) {
        if (error.message.includes("Authentication required")) {
          const status = {
            isAuthenticated: false,
            user: null
          };
          this.setAuthStatusCache(status);
          return status;
        }
        throw error;
      } finally {
        this.authStatusPromise = null;
      }
    })();
    return this.authStatusPromise;
  },
  async updateAccount(userData) {
    return this.request("/api/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData)
    });
  },
  async updateEmail(email) {
    return this.request("/api/users/email", {
      method: "PUT",
      body: JSON.stringify({
        email
      })
    });
  },
  async updatePassword(passwordData) {
    return this.request("/api/users/password", {
      method: "PUT",
      body: JSON.stringify(passwordData)
    });
  },
  async uploadProfilePic(file) {
    const formData = new FormData();
    formData.append("profilePic", file);
    return this.request("/api/users/profile-pic", {
      method: "POST",
      headers: {},
      // Remove Content-Type to let browser set it for FormData
      body: formData
    });
  },
  async deleteAccount() {
    return this.request("/api/users/account", {
      method: "DELETE"
    });
  },
  async getUserActivity() {
    return this.request("/api/users/activity");
  }
};
