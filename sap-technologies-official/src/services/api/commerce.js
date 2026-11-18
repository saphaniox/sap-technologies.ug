export default {
  async getProducts(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/products${queryParams ? `?${queryParams}` : ""}`);
  },
  async getProduct(productId) {
    return this.request(`/api/products/${productId}`);
  },
  async getProductCategories() {
    return this.request("/api/products/categories");
  },
  async getProductsAdmin(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    return this.request(`/api/products/admin/products${queryParams ? `?${queryParams}` : ""}`, {
      useCache: false
    });
  },
  async createProduct(formData) {
    const result = await this.request("/api/products/admin/products", {
      method: "POST",
      body: formData
    });
    // Clear products cache after mutation
    this.clearCache();
    return result;
  },
  async updateProduct(productId, formData) {
    const result = await this.request(`/api/products/admin/products/${productId}`, {
      method: "PUT",
      body: formData
    });
    // Clear products cache after mutation
    this.clearCache();
    return result;
  },
  async deleteProduct(productId) {
    const result = await this.request(`/api/products/admin/products/${productId}`, {
      method: "DELETE"
    });
    // Clear products cache after mutation
    this.clearCache();
    return result;
  },
  async updateProductOrder(products) {
    return this.request("/api/products/admin/products-order", {
      method: "PUT",
      body: JSON.stringify({
        products
      }),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async getProductAnalytics() {
    return this.request("/api/products/admin/analytics", {
      useCache: false
    });
  },
  async submitProductInquiry(inquiryData) {
    return this.request("/api/products/inquiries", {
      method: "POST",
      body: JSON.stringify(inquiryData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async submitCartInquiry(cartData) {
    return this.request("/api/products/cart-inquiry", {
      method: "POST",
      body: JSON.stringify(cartData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async getProductInquiries(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/products/admin/inquiries?${queryString}`, {
      useCache: false
    });
  },
  async updateInquiryStatus(inquiryId, data) {
    return this.request(`/api/products/admin/inquiries/${inquiryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async deleteInquiry(inquiryId) {
    return this.request(`/api/products/admin/inquiries/${inquiryId}`, {
      method: "DELETE"
    });
  },
  async getInquiryStats() {
    return this.request("/api/products/admin/inquiries/stats", {
      useCache: false
    });
  },
  async submitServiceQuote(quoteData) {
    return this.request("/api/services/quotes", {
      method: "POST",
      body: JSON.stringify(quoteData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async getServiceQuotes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/api/services/admin/quotes?${queryString}`, {
      useCache: false
    });
  },
  async updateQuoteStatus(quoteId, data) {
    return this.request(`/api/services/admin/quotes/${quoteId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      }
    });
  },
  async deleteQuote(quoteId) {
    return this.request(`/api/services/admin/quotes/${quoteId}`, {
      method: "DELETE"
    });
  },
  async getQuoteStats() {
    return this.request("/api/services/admin/quotes/stats", {
      useCache: false
    });
  }
};
