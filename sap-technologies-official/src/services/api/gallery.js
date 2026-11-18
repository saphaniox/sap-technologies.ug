export default {
  async getPublicGallery() {
    return this.request("/api/gallery/public");
  },
  async getAdminGallery() {
    return this.request("/api/gallery", {
      useCache: false
    });
  },
  async createGalleryItem(formData) {
    return this.request("/api/gallery", {
      method: "POST",
      body: formData
    });
  },
  async updateGalleryItem(galleryId, formData) {
    return this.request(`/api/gallery/${galleryId}`, {
      method: "PUT",
      body: formData
    });
  },
  async deleteGalleryItem(galleryId) {
    return this.request(`/api/gallery/${galleryId}`, {
      method: "DELETE"
    });
  }
};
