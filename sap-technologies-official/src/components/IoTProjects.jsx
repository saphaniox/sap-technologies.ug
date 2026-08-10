import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import IoTForm from "./IoTForm";
import ConfirmDialog from "./ConfirmDialog";
import ImageSlider from "./ImageSlider";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl, getOptimizedVideoUrl, PLACEHOLDERS } from "../utils/imageUrl";
import { removeById, upsertById } from "../utils/realtimeCollection";
import "../styles/IoT.css";

const buildCategoryList = (items) => (
  [...new Set(items.map((item) => item.category).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second))
);

const IoTProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [categories, setCategories] = useState([]);
  
  // Admin state
  const [user, setUser] = useState(null);
  const [showIoTForm, setShowIoTForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [adminStats, setAdminStats] = useState(null);
  
  useEffect(() => {
    fetchData();
    checkUserAuth();
  }, []);
  
  const fetchData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const [projectsResponse, categoriesResponse] = await Promise.all([
        apiService.request("/api/iot"),
        apiService.request("/api/iot/categories")
      ]);
      
      if (projectsResponse.status === "success") {
        setProjects(projectsResponse.data.iotProjects);
      }
      
      if (categoriesResponse.status === "success") {
        setCategories(categoriesResponse.data.categories);
      }
    } catch (error) {
      console.error("Error fetching IoT projects:", error);
      if (!silent) setError("We're having trouble loading IoT projects. Please refresh and try again.");
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
      const response = await apiService.request("/api/iot/admin/stats");
      if (response.status === "success") {
        setAdminStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  };
  
  const handleAddProject = () => {
    setEditingProject(null);
    setShowIoTForm(true);
  };
  
  const handleEditProject = (project) => {
    setEditingProject(project);
    setShowIoTForm(true);
  };
  
  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    try {
      const response = await apiService.request(
        `/api/iot/${projectToDelete._id}`,
        { method: "DELETE" }
      );
      
      if (response.status === "success") {
        showAlert.success("Removed!", "IoT project deleted successfully.");
        setProjects((prev) => {
          const nextProjects = removeById(prev, projectToDelete._id);
          setCategories(buildCategoryList(nextProjects));
          return nextProjects;
        });
        fetchData({ silent: true });
        if (user?.role === "admin") {
          fetchAdminStats();
        }
      }
    } catch (error) {
      showAlert.error("Couldn't delete", error.message || "Something went wrong deleting that project. Please try again.");
    } finally {
      setShowDeleteDialog(false);
      setProjectToDelete(null);
    }
  };
  
  const handleLike = async (projectId) => {
    try {
      const response = await apiService.request(`/api/iot/${projectId}/like`, { method: "POST" });
      const likes = response.data?.likes;
      setProjects((prev) => prev.map((project) => (
        project._id === projectId
          ? { ...project, stats: { ...(project.stats || {}), likes: likes ?? (project.stats?.likes || 0) + 1 } }
          : project
      )));
    } catch (error) {
      console.error("Error liking project:", error);
    }
  };
  
  const filteredProjects = projects.filter(project => {
    const categoryMatch = selectedCategory === "all" || project.category === selectedCategory;
    const statusMatch = selectedStatus === "all" || project.status === selectedStatus;
    return categoryMatch && statusMatch;
  });
  
  const getStatusBadge = (status) => {
    const badges = {
      completed: { label: "Completed", class: "status-completed" },
      "in-progress": { label: "In Progress", class: "status-progress" },
      prototype: { label: "Prototype", class: "status-prototype" },
      planning: { label: "Planning", class: "status-planning" }
    };
    return badges[status] || badges.completed;
  };
  
  if (loading) {
    return (
      <section className="iot-section" id="iot">
        <div className="container">
          <div className="iot-loading-state" role="status" aria-live="polite">
            <div className="iot-loading-spinner" aria-hidden="true"></div>
            <h2>Loading IoT projects</h2>
            <p>Please wait while we fetch the latest IoT projects from the database.</p>
          </div>
        </div>
      </section>
    );
  }
  
  if (error) {
    return <div className="iot-error">{error}</div>;
  }
  
  return (
    <section className="iot-section" id="iot">
      <div className="container">
        {/* Admin Stats Dashboard */}
        {user?.role === "admin" && adminStats && (
          <div className="iot-admin-stats">
            <h3>IoT Projects Admin Overview</h3>
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Projects</span>
                <span className="stat-value">{adminStats.totalProjects}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Completed</span>
                <span className="stat-value">{adminStats.completedProjects}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">In Progress</span>
                <span className="stat-value">{adminStats.inProgressProjects}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Featured</span>
                <span className="stat-value">{adminStats.featuredProjects}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Views</span>
                <span className="stat-value">{adminStats.totalViews}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Likes</span>
                <span className="stat-value">{adminStats.totalLikes}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Section Header */}
        <div className="iot-header">
          <div className="header-content">
            <h2 className="section-title">Featured IoT builds</h2>
            <p className="section-description">
              A practical look at the systems we build, test, and improve for real users.
            </p>
          </div>
          
          {user?.role === "admin" && (
            <button onClick={handleAddProject} className="btn-add-project">
              <i className="fas fa-plus"></i> Add Project
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="iot-filters">
          <div className="filter-group">
            <label htmlFor="iot-category-filter">Category</label>
            <select 
              id="iot-category-filter"
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">View all categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="iot-status-filter">Progress</label>
            <select 
              id="iot-status-filter"
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Any progress</option>
              <option value="completed">Completed</option>
              <option value="in-progress">In Progress</option>
              <option value="prototype">Prototype</option>
              <option value="planning">Planning</option>
            </select>
          </div>
          
          <div className="results-count">
            {filteredProjects.length} of {projects.length} projects shown
          </div>
        </div>
        
        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            <i className="fas fa-microchip fa-3x"></i>
            <p>No projects match those filters yet.</p>
          </div>
        ) : (
          <div className="iot-grid">
            {filteredProjects.map((project) => (
              <div key={project._id} className="iot-card">
                {project.isFeatured && (
                  <div className="featured-badge">Featured</div>
                )}
                
                <div className="iot-image-container">
                  {project.images && project.images.length > 1 ? (
                    <ImageSlider 
                      images={project.images.map(img => getImageUrl(img.url))} 
                      alt={project.title}
                    />
                  ) : (
                    <img 
                      src={getImageUrl(project.primaryImage) || PLACEHOLDERS.iot} 
                      alt={project.title}
                      className="iot-image"
                    />
                  )}
                  
                  <div className={`status-badge ${getStatusBadge(project.status).class}`}>
                    {getStatusBadge(project.status).label}
                  </div>
                </div>
                
                <div className="iot-content">
                  <h3 className="iot-title">{project.title}</h3>
                  
                  {project.category && (
                    <span className="iot-category">{project.category}</span>
                  )}
                  
                  <p className="iot-description">{project.description}</p>
                  
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="tech-tags">
                      {project.technologies.slice(0, 5).map((tech, index) => (
                        <span key={index} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  )}
                  
                  {project.hardware && project.hardware.length > 0 && (
                    <div className="hardware-tags">
                      <strong>Hardware:</strong>
                      {project.hardware.slice(0, 3).map((hw, index) => (
                        <span key={index} className="hardware-tag">{hw}</span>
                      ))}
                    </div>
                  )}
                  
                  <div className="iot-actions">
                    {project.projectUrl && (
                      <a 
                        href={project.projectUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-view"
                      >
                        <i className="fas fa-external-link-alt"></i> View Project
                      </a>
                    )}
                    
                    {project.githubUrl && (
                      <a 
                        href={project.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-github"
                      >
                        <i className="fab fa-github"></i> GitHub
                      </a>
                    )}

                    {project.videoUrl && (
                      <a
                        href={project.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-video"
                      >
                        <i className="fab fa-youtube"></i> Watch Demo
                      </a>
                    )}
                    
                    <button 
                      onClick={() => handleLike(project._id)}
                      className="btn-like"
                    >
                      <i className="fas fa-heart"></i> {project.stats?.likes || 0}
                    </button>
                  </div>

                  {/* Uploaded project videos */}
                  {project.videos && project.videos.length > 0 && (
                    <div className="iot-uploaded-videos">
                      {project.videos.map((video, idx) => {
                        const videoUrl = getOptimizedVideoUrl(video.url || video);
                        if (!videoUrl) return null;

                        return (
                          <video
                            key={idx}
                            src={videoUrl}
                            controls
                            playsInline
                            preload="none"
                            className="iot-video"
                          />
                        );
                      })}
                    </div>
                  )}
                  
                  {user?.role === "admin" && (
                    <div className="admin-actions">
                      <button 
                        onClick={() => handleEditProject(project)}
                        className="btn-edit"
                      >
                        <i className="fas fa-edit"></i> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(project)}
                        className="btn-delete"
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* IoT Form Modal */}
      {showIoTForm && (
        <IoTForm 
          isOpen={showIoTForm}
          onClose={() => setShowIoTForm(false)}
          project={editingProject}
          onSuccess={(savedProject) => {
            if (savedProject?._id) {
              setProjects((prev) => {
                const nextProjects = upsertById(prev, savedProject, {
                  orderKey: "order",
                  include: (item) => item.isPublic !== false
                });
                setCategories(buildCategoryList(nextProjects));
                return nextProjects;
              });
            }
            fetchData({ silent: true });
            if (user?.role === "admin") {
              fetchAdminStats();
            }
          }}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog 
          isOpen={showDeleteDialog}
          title="Delete IoT Project"
          message={`Are you sure you want to delete "${projectToDelete?.title}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => {
            setShowDeleteDialog(false);
            setProjectToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
          confirmButtonClass="btn-danger"
        />
      )}
    </section>
  );
};

export default IoTProjects;
