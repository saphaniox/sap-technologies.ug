import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import SoftwareForm from "./SoftwareForm";
import ConfirmDialog from "./ConfirmDialog";
import ImageSlider from "./ImageSlider";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl, PLACEHOLDERS } from "../utils/imageUrl";
import { buildCountGroups, removeById, upsertById } from "../utils/realtimeCollection";
import "../styles/Software.css";

const Softwares = () => {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  
  // Admin state
  const [user, setUser] = useState(null);
  const [showSoftwareForm, setShowSoftwareForm] = useState(false);
  const [editingSoftware, setEditingSoftware] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [softwareToDelete, setSoftwareToDelete] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  
  useEffect(() => {
    fetchData();
    checkUserAuth();
  }, []);
  
  const fetchData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [softwareResponse, categoriesResponse] = await Promise.all([
        apiService.request("/api/software"),
        apiService.request("/api/software/categories")
      ]);
      
      if (softwareResponse.status === "success") {
        setSoftware(softwareResponse.data.software);
      }
      
      if (categoriesResponse.status === "success") {
        setCategories(categoriesResponse.data.categories);
      }
    } catch (error) {
      console.error("Error fetching software:", error);
      if (!silent) setError("We're having trouble loading our software list. Please refresh the page.");
    } finally {
      if (!silent) setLoading(false);
    }
  };
  
  const checkUserAuth = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
      if (currentUser && currentUser.role === "admin") {
        fetchAdminStats();
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    }
  };
  
  const fetchAdminStats = async () => {
    try {
      const response = await apiService.request("/api/software/admin/stats");
      if (response.status === "success") {
        setAdminStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  };
  
  const handleAddSoftware = () => {
    setEditingSoftware(null);
    setShowSoftwareForm(true);
  };
  
  const handleEditSoftware = (item) => {
    setEditingSoftware(item);
    setShowSoftwareForm(true);
  };
  
  const handleDeleteClick = (item) => {
    setSoftwareToDelete(item);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!softwareToDelete) return;
    
    try {
      const response = await apiService.request(
        `/api/software/${softwareToDelete._id}`,
        { method: "DELETE" }
      );
      
      if (response.status === "success") {
        showAlert.success("Removed!", "That software has been deleted.");
        setSoftware((prev) => {
          const nextSoftware = removeById(prev, softwareToDelete._id);
          setCategories(buildCountGroups(nextSoftware.filter((item) => item.isPublic !== false), "category"));
          return nextSoftware;
        });
        fetchData({ silent: true });
        fetchAdminStats();
      }
    } catch (error) {
      console.error("Error deleting software:", error);
      showAlert.error("Something went wrong", "Couldn't delete that software. Please try again.");
    } finally {
      setShowDeleteDialog(false);
      setSoftwareToDelete(null);
    }
  };
  
  const handleFormSuccess = (savedSoftware) => {
    if (savedSoftware?._id) {
      setSoftware((prev) => {
        const nextSoftware = upsertById(prev, savedSoftware, {
          orderKey: "order",
          include: (item) => item.isPublic !== false
        });
        setCategories(buildCountGroups(nextSoftware.filter((item) => item.isPublic !== false), "category"));
        return nextSoftware;
      });
    }

    fetchData({ silent: true });
    fetchAdminStats();
    setShowSoftwareForm(false);
    setEditingSoftware(null);
  };
  
  const trackSoftwareClick = async (itemId) => {
    try {
      await apiService.request(`/api/software/${itemId}/click`, { method: "POST" });
      setSoftware((prev) => prev.map((item) => (
        item._id === itemId
          ? { ...item, stats: { ...(item.stats || {}), clicks: (item.stats?.clicks || 0) + 1 } }
          : item
      )));
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };
  
  const filteredSoftware = selectedCategory === "all"
    ? software
    : software.filter(item => item.category === selectedCategory);
  
  const getStatusBadge = (status) => {
    const badges = {
      active: { text: "Active", class: "status-active" },
      inactive: { text: "Inactive", class: "status-inactive" },
      "coming-soon": { text: "Coming Soon", class: "status-coming-soon" },
      beta: { text: "Beta", class: "status-beta" }
    };
    return badges[status] || badges.active;
  };
  
  if (loading) {
    return (
      <section id="software" className="software">
        <div className="container">
          <div className="software-loading-state" role="status" aria-live="polite">
            <div className="software-loading-spinner" aria-hidden="true"></div>
            <h2>Loading software apps</h2>
            <p>Please wait while we fetch the latest software from the database.</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="software" className="software">
        <div className="container">
          <div className="software-loading-state" role="alert">
            <h2>Software apps could not load</h2>
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }
  
  return (
    <section id="software" className="software">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">Digital tools</span>
          <h2 className="section-title">Business software we build</h2>
          <p className="section-description">
            Browse web tools, downloadable apps, demos, and business-ready applications from SAPTech Uganda.
          </p>
        </div>
        
        {/* Admin Stats */}
        {user?.role === "admin" && adminStats && (
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-value">{adminStats.total}</span>
              <span className="stat-label">Total Software</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{adminStats.active}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{adminStats.totalClicks}</span>
              <span className="stat-label">Total Clicks</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{adminStats.totalViews}</span>
              <span className="stat-label">Total Views</span>
            </div>
          </div>
        )}
        
        {/* Admin Controls */}
        {user?.role === "admin" && (
          <div className="admin-controls">
            <button onClick={handleAddSoftware} className="btn-add">
              <i className="fas fa-plus"></i> Add Software
            </button>
          </div>
        )}
        
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="category-filter">
            <button
              className={`filter-btn ${selectedCategory === "all" ? "active" : ""}`}
              onClick={() => setSelectedCategory("all")}
            >
              All ({software.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat.name}
                className={`filter-btn ${selectedCategory === cat.name ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.name)}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>
        )}
        
        {/* Software Grid */}
        {filteredSoftware.length === 0 ? (
          <div className="no-software">
            <i className="fas fa-laptop-code"></i>
            <p>No software available at the moment.</p>
          </div>
        ) : (
          <div className="software-grid">
            {filteredSoftware.map((item) => (
              <div key={item._id} className="software-card">
                {/* Image */}
                <div className="software-image">
                  {item.images && item.images.length > 1 ? (
                    <ImageSlider
                      images={item.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))}
                      alt={item.name}
                      className="software-slider"
                    />
                  ) : (
                    <img
                      src={getImageUrl(item.primaryImage || item.image) || PLACEHOLDERS.software}
                      alt={item.name}
                      loading="lazy"
                    />
                  )}
                  
                  {/* Status Badge */}
                  <span className={`status-badge ${getStatusBadge(item.status).class}`}>
                    {getStatusBadge(item.status).text}
                  </span>
                </div>
                
                {/* Content */}
                <div className="software-content">
                  <h3 className="software-name">{item.name}</h3>
                  
                  {item.category && (
                    <span className="software-category">
                      <i className="fas fa-tag"></i> {item.category}
                    </span>
                  )}
                  
                  {item.description && (
                    <p className="software-description">{item.description}</p>
                  )}
                  
                  {/* Technologies */}
                  {item.technologies && item.technologies.length > 0 && (
                    <div className="software-technologies">
                      {item.technologies.map((tech, index) => (
                        <span key={index} className="tech-badge">{tech}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* Features */}
                  {item.features && item.features.length > 0 && (
                    <ul className="software-features">
                      {item.features.slice(0, 3).map((feature, index) => (
                        <li key={index}>
                          <i className="fas fa-check"></i> {feature}
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Actions */}
                  <div className="software-actions">
                    {/* Platform-specific launch buttons */}
                    <div className="platform-link-buttons">
                      {(item.links?.web || item.url) && item.status !== "inactive" && item.status !== "coming-soon" && (
                        <a
                          href={item.links?.web || item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="platform-btn btn-web"
                          onClick={() => trackSoftwareClick(item._id)}
                        >
                          🌐 Web
                        </a>
                      )}
                      {item.links?.playstore && (
                        <a href={item.links.playstore} target="_blank" rel="noopener noreferrer" className="platform-btn btn-playstore">
                          📱 Play Store
                        </a>
                      )}
                      {item.links?.appstore && (
                        <a href={item.links.appstore} target="_blank" rel="noopener noreferrer" className="platform-btn btn-appstore">
                          🍎 App Store
                        </a>
                      )}
                      {item.links?.github && (
                        <a href={item.links.github} target="_blank" rel="noopener noreferrer" className="platform-btn btn-github">
                          🐙 GitHub
                        </a>
                      )}
                      {item.links?.other && (
                        <a href={item.links.other} target="_blank" rel="noopener noreferrer" className="platform-btn btn-other">
                          🔗 Other
                        </a>
                      )}
                      {item.status === "coming-soon" && (
                        <button className="btn-launch" disabled>Coming Soon</button>
                      )}
                      {item.status === "inactive" && (
                        <button className="btn-launch" disabled>Inactive</button>
                      )}
                      {!item.links?.web && !item.url && !item.links?.playstore && !item.links?.appstore && !item.links?.github && !item.links?.other && item.status !== "coming-soon" && item.status !== "inactive" && (
                        <button className="btn-launch" disabled>No Link</button>
                      )}
                    </div>

                    {user?.role === "admin" && (
                      <div className="admin-actions">
                        <button
                          onClick={() => handleEditSoftware(item)}
                          className="btn-edit"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="btn-delete"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Stats (admin only) */}
                  {user?.role === "admin" && (
                    <div className="software-stats">
                      <span><i className="fas fa-eye"></i> {item.stats?.views || 0} views</span>
                      <span><i className="fas fa-mouse-pointer"></i> {item.stats?.clicks || 0} clicks</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Software Form Modal */}
      {showSoftwareForm && (
        <SoftwareForm
          isOpen={showSoftwareForm}
          onClose={() => {
            setShowSoftwareForm(false);
            setEditingSoftware(null);
          }}
          software={editingSoftware}
          onSuccess={handleFormSuccess}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Software"
          message={`Are you sure you want to delete "${softwareToDelete?.name}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setSoftwareToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </section>
  );
};

export default Softwares;
