import { useState, useEffect } from "react";
import GalleryForm from "./GalleryForm";
import ConfirmDialog from "./ConfirmDialog";
import apiService from "../services/api";
import { getImageUrl, getOptimizedVideoUrl } from "../utils/imageUrl";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/Gallery.css";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "services", label: "Services" },
  { value: "projects", label: "Projects" },
  { value: "events", label: "Events" },
  { value: "team", label: "Team" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" }
];

const getMediaType = (media = {}) => (
  media.type === "video" || media.mimeType?.startsWith("video/") ? "video" : "image"
);

const getGalleryMedia = (item) => {
  if (Array.isArray(item.media) && item.media.length > 0) {
    return item.media
      .filter((media) => media?.url)
      .map((media) => ({
        ...media,
        type: getMediaType(media)
      }));
  }

  return item.image
    ? [{ url: item.image, type: "image", originalName: item.title || "Gallery image" }]
    : [];
};

const sortGalleryItems = (galleryItems) => (
  [...galleryItems].sort((first, second) => {
    const firstOrder = Number(first.displayOrder || 0);
    const secondOrder = Number(second.displayOrder || 0);
    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return new Date(second.createdAt || 0) - new Date(first.createdAt || 0);
  })
);

const upsertVisibleGalleryItem = (galleryItems, item) => {
  if (!item?._id) return galleryItems;

  const withoutCurrent = galleryItems.filter((galleryItem) => galleryItem._id !== item._id);
  if (item.isActive === false) return withoutCurrent;

  return sortGalleryItems([item, ...withoutCurrent]);
};

const Gallery = () => {
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);

  useEffect(() => {
    fetchGallery();
    checkUserAuth();
  }, []);

  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter((item) => item.category === activeCategory));
    }
  }, [activeCategory, items]);

  const checkUserAuth = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    }
  };

  const fetchGallery = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getPublicGallery();
      const galleryItems = data.data || [];
      setItems(galleryItems);
    } catch (err) {
      console.error("Error fetching gallery:", err);
      if (!silent) setError("We're having trouble loading the gallery. Please refresh and try again.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (item) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiService.deleteGalleryItem(itemToDelete._id);
      setItems((prev) => prev.filter((i) => i._id !== itemToDelete._id));
      setShowDeleteDialog(false);
      setItemToDelete(null);
      await showAlert.success("Deleted", "Gallery item has been deleted.");
    } catch (error) {
      console.error("Error deleting gallery item:", error);
      await showAlert.error("Delete failed", error.message || "Could not delete. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setItemToDelete(null);
  };

  const handleSave = (savedItem) => {
    if (savedItem?._id) {
      setItems((prev) => upsertVisibleGalleryItem(prev, savedItem));
    }
    setShowForm(false);
    setEditingItem(null);
    fetchGallery({ silent: true });
  };

  const openLightbox = (media, item) => {
    const isVideo = getMediaType(media) === "video";

    setLightboxMedia({
      ...media,
      url: isVideo ? getOptimizedVideoUrl(media.url) : getImageUrl(media.url),
      title: item.title || media.originalName || "Gallery media"
    });
  };

  const closeLightbox = () => {
    setLightboxMedia(null);
  };

  const galleryCards = filteredItems.flatMap((item) => (
    getGalleryMedia(item).map((media, mediaIndex) => ({
      id: `${item._id}-${mediaIndex}`,
      item,
      media,
      mediaIndex,
      mediaTotal: getGalleryMedia(item).length
    }))
  ));

  if (loading) {
    return (
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading gallery...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="gallery-section">
      <div className="container">
        <div className="gallery-header">
          <h2>Our Gallery</h2>
          <p className="gallery-subtitle">
            Explore our work through photos and videos of services, projects, and team moments
          </p>
          {user && user.role === "admin" && (
            <button
              className="add-gallery-btn admin-btn"
              onClick={() => {
                setEditingItem(null);
                setShowForm(true);
              }}
            >
              + Add Gallery Item
            </button>
          )}
        </div>

        <div className="gallery-story-grid" aria-label="What SAPTech Uganda documents in the gallery">
          <article>
            <h3>Project Builds</h3>
            <p>
              Photos and videos from websites, business systems, IoT devices, electronics prototypes,
              installation work, testing sessions, and client-ready technology solutions.
            </p>
          </article>
          <article>
            <h3>Service Delivery</h3>
            <p>
              A visual record of design, software development, graphics, electrical engineering,
              automation, security, and digital transformation work delivered by the team.
            </p>
          </article>
          <article>
            <h3>Team & Events</h3>
            <p>
              Moments from workshops, training, office work, community events, partnerships,
              and the people behind SAPTech Uganda's engineering and technology projects.
            </p>
          </article>
        </div>

        <div className="gallery-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`filter-btn ${activeCategory === cat.value ? "active" : ""}`}
              onClick={() => setActiveCategory(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {galleryCards.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">Photo</div>
            <h3>No Gallery Items</h3>
            <p>
              {activeCategory === "all"
                ? "No gallery items have been added yet."
                : `No items in the "${activeCategory}" category.`}
            </p>
          </div>
        ) : (
          <div className="gallery-grid">
            {galleryCards.map(({ id, item, media, mediaIndex, mediaTotal }) => {
              const isVideo = media.type === "video";
              const mediaUrl = isVideo ? getOptimizedVideoUrl(media.url) : getImageUrl(media.url);

              return (
                <div key={id} className="gallery-card">
                  <div className={`gallery-image-wrapper ${isVideo ? "video-wrapper" : ""}`}>
                    {isVideo ? (
                      <video
                        src={mediaUrl}
                        controls
                        playsInline
                        preload="none"
                        className="gallery-video"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <img
                        src={mediaUrl}
                        alt={item.title || media.originalName || "Gallery image"}
                        loading="lazy"
                        onClick={() => openLightbox(media, item)}
                      />
                    )}
                    {isVideo && <span className="gallery-media-badge">Video</span>}
                    {mediaTotal > 1 && (
                      <span className="gallery-media-count">
                        {mediaIndex + 1}/{mediaTotal}
                      </span>
                    )}
                    <div className="gallery-overlay">
                      <button
                        className="lightbox-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLightbox(media, item);
                        }}
                        title={isVideo ? "Play video" : "View full size"}
                      >
                        {isVideo ? "Play" : "View"}
                      </button>
                      {user && user.role === "admin" && (
                        <>
                          <button
                            className="edit-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(item);
                            }}
                            title="Edit"
                          >
                            Edit
                          </button>
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(item);
                            }}
                            title="Delete"
                          >
                            Del
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {(item.title || item.description) && (
                    <div className="gallery-info">
                      {item.title && <h3>{item.title}</h3>}
                      {item.description && <p>{item.description}</p>}
                      <span className="gallery-category-badge">{item.category}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <GalleryForm
          isOpen={showForm}
          galleryItem={editingItem}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {showDeleteDialog && itemToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Gallery Item"
          message={`Are you sure you want to delete "${itemToDelete.title || "this gallery item"}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}

      {lightboxMedia && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              x
            </button>
            {lightboxMedia.type === "video" ? (
              <video src={lightboxMedia.url} controls autoPlay playsInline className="lightbox-video" />
            ) : (
              <img src={lightboxMedia.url} alt={lightboxMedia.title || "Full size"} />
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;
