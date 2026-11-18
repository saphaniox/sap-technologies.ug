export default {
  async submitContact(contactData) {
    return this.request("/api/contact", {
      method: "POST",
      body: JSON.stringify(contactData)
    });
  },
  async subscribeNewsletter(email) {
    return this.request("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({
        email
      })
    });
  },
  async unsubscribeNewsletter(token) {
    return this.request("/api/newsletter/unsubscribe", {
      method: "POST",
      body: JSON.stringify({
        token
      }),
      useCache: false
    });
  },
  async healthCheck() {
    return this.request("/api/health");
  }
};
