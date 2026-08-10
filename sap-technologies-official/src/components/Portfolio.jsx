/**
 * Portfolio Component
 * 
 * Displays our featured projects and showcases what we have built for clients.
 * Shows default projects immediately and loads additional projects from the API.
 */
import React, { useState, useEffect } from "react";
import Background3D from "./Background3D";
import ProjectForm from "./ProjectForm";
import ConfirmDialog from "./ConfirmDialog";
import ImageSlider from "./ImageSlider";
import apiService from "../services/api";
import { getImageUrl } from "../utils/imageUrl";
import { showAlert } from "../utils/alerts.jsx";
import { upsertById } from "../utils/realtimeCollection";
import "../styles/Portfolio.css";

const transformProjectRecord = (project) => ({
  _id: project._id,
  title: project.title,
  image: getImageUrl(project.image) || "/images/portfolio-app.jpg",
  images: project.images || [],
  description: project.description,
  techStack: Array.isArray(project.technologies)
    ? project.technologies
        .map((tech) => {
          if (typeof tech === "string") return tech;
          if (tech && typeof tech === "object" && tech.name) return String(tech.name);
          return String(tech || "");
        })
        .filter((tech) => tech && tech.trim())
    : [],
  order: project.order || 0,
  createdAt: project.createdAt,
  _originalData: project
});

const Portfolio = () => {
  // Manage projects loaded from the database API
  const [apiProjects, setApiProjects] = useState([]);
  
  // Track loading state while fetching projects from the server
  const [loading, setLoading] = useState(true);
  
  // Store any errors that occur during project fetching
  const [error, setError] = useState(null);

  /**
   * Admin State Management
   */
  // Current user (to check admin role)
  const [user, setUser] = useState(null);
  // Controls project form modal visibility (admin)
  const [showProjectForm, setShowProjectForm] = useState(false);
  // Project being edited (admin)
  const [editingProject, setEditingProject] = useState(null);
  // Controls delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Project selected for deletion
  const [projectToDelete, setProjectToDelete] = useState(null);
  // Admin statistics
  const [adminStats, setAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  /**
   * WhatsApp Support Number
   */
  const WHATSAPP_NUMBER = "+256706564628";

  /**
   * Default Portfolio Projects
   * 
   * These projects are always shown to visitors, ensuring the page
   * has content even if the API is slow or unavailable. This provides
   * a better user experience and showcases our core capabilities.
   */
  const defaultPortfolioItems = [
    {
      title: "E-Commerce Platform",
      image: "/images/ecommerce-platform.jpg",
      description: "Full-featured online store with shopping cart, payments, and admin dashboard.",
      techStack: ["React", "Node.js", "Express", "MongoDB"]
    },
    {
      title: "Business Website", 
      image: "/images/business-platform.jpg",
      description: "Responsive company site with blog, contact forms, and SEO optimization.",
      techStack: ["HTML", "CSS", "JavaScript", "Node.js"]
    },
    {
      title: "Graphics & Branding",
      image: "/images/GRAPHICS-DESIGN.jpg", 
      description: "Custom logo and brand identity design for startups and businesses.",
      techStack: ["Photoshop", "Illustrator","capcut", "Figma"]
    },
    {
      title: "IoT Dashboard",
      image: "/images/iot2.jpg",
      description: "Real-time monitoring and control dashboard for smart devices and sensors.",
      techStack: ["React", "Node.js", "Socket.io","MongoDB"]
    },
    {
      title: "School Management System",
      image: "/images/school-management.jpg",
      description: "Comprehensive platform for managing students, staff, classes, and results.",
      techStack: ["React", "Node.js", "MongoDB", "Express"]
    },
    {
      title: "Mobile Banking App",
      image: "/images/mobile-app.jpg",
      description: "Secure mobile app for digital banking and transfers.",
      techStack: ["React Native", "Node.js", "MongoDB"]
    },
    {
      title: "Portfolio Website",
      image: "/images/portfolio-app.jpg", 
      description: "Modern and responsive portfolio website showcasing projects and skills.",
      techStack: ["React", "CSS3", "JavaScript"]
    },
    {
      title: "Chat Application",
      image: "/images/chat-app.jpg",
      description: "Real-time chat app with group messaging, file sharing, and notifications.",
      techStack: ["React", "Node.js", "Socket.io","MongoDB"]
    },
    {
      title: "Restaurant Ordering System",
      image: "/images/restaurant-ordering.jpg",
      description: "Touch-friendly web app for digital menus, table reservations, and order management.",
      techStack: ["Vue.js", "Node.js", "MongoDB", "SQL"]
    },
    {
      title: "Learning Management System",
      image: "/images/LMS.jpg",
      description: "Platform for online courses, quizzes, and student progress tracking.",
      techStack: ["React", "Node.js", "MongoDB", "Express"]
    },
    {
      title: "Inventory Management",
      image: "/images/inventory-management.jpg",
      description: "Smart inventory tracking system with automated alerts and reporting features.",
      techStack: ["React", "Node.js", "MySQL", "Express"]
    },
    {
      title: "Event Booking Platform",
      image: "/images/event-booking.jpg",
      description: "Complete event management platform with booking, payments, and attendee management.",
      techStack: ["React", "Node.js", "MongoDB", "Stripe"]
    }
  ];

  // Load additional projects from the API when component mounts
  useEffect(() => {
    fetchProjects();
    checkUserAuth();
  }, []);

  /**
   * Check if user is authenticated and is admin
   */
  const checkUserAuth = async () => {
    try {
      const currentUser = await apiService.getCurrentUser();
      setUser(currentUser);
      // If admin, fetch statistics
      if (currentUser && currentUser.role === "admin") {
        fetchAdminStats();
      }
    } catch {
      // User not authenticated, which is fine
      setUser(null);
    }
  };

  /**
   * Fetch Admin Statistics
   */
  const fetchAdminStats = async () => {
    try {
      setLoadingStats(true);
      const response = await apiService.getProjectStats();
      if (response.success) {
        setAdminStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  /**
   * Fetch Projects from API
   * 
   * Loads additional projects created through the admin dashboard.
   * If the API call fails, we show an error but still display default projects.
   */
  const fetchProjects = async ({ silent = false } = {}) => {
    try {
      // Start loading and clear any previous errors
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      
      // Request projects from the backend API
      const response = await apiService.getPublicProjects();
      
              // Check if we got valid project data
      if (response.success && response.data.projects.length > 0) {
        // Transform API data into consistent format
        const transformedProjects = response.data.projects.map(transformProjectRecord);
        setApiProjects(transformedProjects);
      } else {
        // No projects found, set empty array
        setApiProjects([]);
      }
    } catch (error) {
      // Log error for debugging and show user-friendly message
      console.error("Error fetching projects:", error);
      if (!silent) {
        setError("We're having trouble loading projects. Please refresh the page.");
        setApiProjects([]);
      }
    } finally {
      // Always stop loading, whether successful or not
      if (!silent) setLoading(false);
    }
  };

  /**
   * Admin Functions
   */
  // Handle edit project
  const handleEdit = (project) => {
    setEditingProject(project._originalData || project);
    setShowProjectForm(true);
  };

  // Handle delete project
  const handleDelete = (project) => {
    setProjectToDelete(project);
    setShowDeleteDialog(true);
  };

  // Confirm delete project
  const confirmDelete = async () => {
    if (!projectToDelete) return;

    try {
      await apiService.deleteProject(projectToDelete._id);
      // Instantly remove from UI
      setApiProjects(prev => prev.filter(p => p._id !== projectToDelete._id));
      setShowDeleteDialog(false);
      setProjectToDelete(null);
      await showAlert.success("Project Deleted", "The project has been successfully deleted.");
      // Refresh in background to ensure data consistency
      fetchProjects({ silent: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      await showAlert.error("Delete Failed", error.message || "Failed to delete project. Please try again.");
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setProjectToDelete(null);
  };

  // Handle project save success
  const handleProjectSave = (savedProject) => {
    if (savedProject?._id) {
      const transformedProject = transformProjectRecord(savedProject);
      setApiProjects((prev) => upsertById(prev, transformedProject, {
        orderKey: "order",
        include: (project) => project._originalData?.status === "completed"
      }));
    }

    fetchProjects({ silent: true });
    if (user?.role === "admin") fetchAdminStats();
    setShowProjectForm(false);
    setEditingProject(null);
  };

  /**
   * WhatsApp Contact Handler
   */
  const handleWhatsAppContact = (project) => {
    const message = encodeURIComponent(`Hi, I'm interested in learning more about your ${project.title} project. Can you provide more information?`);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section id="portfolio" className="portfolio">
      <Background3D className="portfolio-3d-background" />
      <div className="container">
        {/* Admin Info Panel - Displayed at Top for Admins */}
        {user && user.role === "admin" && (
          <div className="admin-info-panel" style={{
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            color: "white",
            padding: "20px",
            borderRadius: "12px",
            marginBottom: "30px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
              <div>
                <h3 style={{ margin: "0 0 10px 0", fontSize: "1.5rem" }}>🚀 Admin Mode Active</h3>
                <p style={{ margin: 0, opacity: 0.9 }}>Managing portfolio as {user.name}</p>
              </div>
              <button 
                className="add-project-btn admin-btn"
                onClick={() => {
                  setEditingProject(null);
                  setShowProjectForm(true);
                }}
                style={{
                  background: "white",
                  color: "#4facfe",
                  border: "none",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "1rem",
                  transition: "transform 0.2s"
                }}
                onMouseEnter={(e) => e.target.style.transform = "scale(1.05)"}
                onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
              >
                + Add Project
              </button>
            </div>
            
            {/* Admin Statistics */}
            {adminStats && !loadingStats && (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "15px",
                marginTop: "20px"
              }}>
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "15px",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{defaultPortfolioItems.length + apiProjects.length}</div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Total Projects</div>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "15px",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{apiProjects.length}</div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Custom Projects</div>
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.15)",
                  padding: "15px",
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{adminStats.featuredCount || 0}</div>
                  <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Featured</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* User Info Badge - For logged-in non-admin users */}
        {user && user.role !== "admin" && (
          <div style={{
            background: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
            color: "#333",
            padding: "15px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            textAlign: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
          }}>
            <span style={{ fontSize: "1.1rem" }}>👋 Welcome back, <strong>{user.name}</strong>!</span>
          </div>
        )}

        <h2>Our Featured Projects</h2>
        <div className="portfolio-intro">
          <p className="intro-main">
            We are highly motivated and detail-oriented full-stack developers specializing in designing, 
            developing, and deploying scalable web applications and software solutions. Based in Ndejje, Kampala, Uganda, 
            our passionate team is committed to delivering high-quality code that meets the highest standards 
            of performance and excellence.
          </p>
          
          <div className="tech-stacks">
            <div className="tech-category">
              <h4>Frontend Technologies</h4>
              <p>HTML5, CSS3, JavaScript, React, Angular, Vue.js, Svelte</p>
            </div>
            
            <div className="tech-category">
              <h4>Backend Technologies</h4>
              <p>Node.js, Python, Ruby on Rails, Java, PHP, C#</p>
            </div>
            
            <div className="tech-category">
              <h4>Databases & Tools</h4>
              <p>MySQL, MongoDB, PostgreSQL, SQL Server, Git, GitHub</p>
            </div>
          </div>
          
          <p className="intro-experience">
            Our portfolio includes e-commerce platforms, business websites, custom software applications, 
            and innovative IoT solutions. We stay current with the latest trends and technologies, 
            ensuring we deliver exceptional results that help our clients achieve their goals.
          </p>
          
          <p className="intro-cta">
            Explore our featured projects below to see what we can create for you.
          </p>
        </div>

        {/* Show loading spinner while fetching additional projects */}
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading additional projects...</p>
          </div>
        )}

        {/* Display error message if project fetching fails */}
        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* Main Portfolio Gallery - Always visible default projects */}
        <div className="portfolio-gallery">
          {defaultPortfolioItems.map((item, index) => (
            <div 
              key={index} 
              className="portfolio-card" 
            >
              {/* Project Image with gradient overlay */}
              <div className="portfolio-image">
                {item.images && Array.isArray(item.images) && item.images.length > 0 ? (
                  <ImageSlider 
                    images={item.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))} 
                    alt={item.title} 
                  />
                ) : (
                  <img src={item.image} alt={item.title} />
                )}
                <div className="image-overlay">
                  <button 
                    className="whatsapp-btn-portfolio"
                    onClick={() => handleWhatsAppContact(item)}
                    title="Contact us on WhatsApp"
                  >
                    💬 WhatsApp Inquiry
                  </button>
                </div>

                {/* Admin Controls */}
                {user && user.role === "admin" && (
                  <div className="admin-controls-portfolio">
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit({...item, isDefault: true, images: [item.image]});
                      }}
                      title="Edit Project"
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
              
              {/* Project Details - Always visible */}
              <div className="portfolio-content">
                <h3 className="project-title">{item.title}</h3>
                
                <p className="project-description">{item.description}</p>
                
                {/* Technology Stack Section */}
                <div className="tech-stack-section">
                  <h4 className="tech-stack-label">Technologies:</h4>
                  <div className="tech-stack">
                    {item.techStack.map((tech, techIndex) => {
                      const techText = typeof tech === "string" ? tech : (tech?.name || String(tech || ""));
                      return <span key={techIndex} className="tech-tag">{techText}</span>;
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Projects from API - Only shown if available */}
        {!loading && apiProjects.length > 0 && (
          <>
            <h3 className="custom-projects-title">Additional Projects</h3>
            <div className="portfolio-gallery custom-projects">
              {apiProjects.map((item, index) => (
                <div 
                  key={index} 
                  className="portfolio-card" 
                >
                  {/* Project Image */}
                  <div className="portfolio-image">
                    {item.images && Array.isArray(item.images) && item.images.length > 0 ? (
                      <ImageSlider 
                        images={item.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))} 
                        alt={item.title} 
                      />
                    ) : (
                      <img src={item.image} alt={item.title} />
                    )}
                    <div className="image-overlay">
                      <button 
                        className="whatsapp-btn-portfolio"
                        onClick={() => handleWhatsAppContact(item)}
                        title="Contact us on WhatsApp"
                      >
                        💬 WhatsApp Inquiry
                      </button>
                    </div>

                    {/* Admin Controls */}
                    {user && user.role === "admin" && (
                      <div className="admin-controls-portfolio">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(item)}
                          title="Edit Project"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(item)}
                          title="Delete Project"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Project Information */}
                  <div className="portfolio-content">
                    <h3 className="project-title">{item.title}</h3>
                    
                    <p className="project-description">{item.description}</p>
                    
                    {/* Technologies Used */}
                    <div className="tech-stack-section">
                      <h4 className="tech-stack-label">Technologies:</h4>
                      <div className="tech-stack">
                        {item.techStack.map((tech, techIndex) => {
                          const techText = typeof tech === "string" ? tech : (tech?.name || String(tech || ""));
                          return <span key={techIndex} className="tech-tag">{techText}</span>;
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Project Form Modal (Admin) */}
      {showProjectForm && (
        <ProjectForm 
          isOpen={showProjectForm}
          project={editingProject}
          onClose={() => {
            setShowProjectForm(false);
            setEditingProject(null);
          }}
          onSave={handleProjectSave}
        />
      )}

      {/* Delete Confirmation Dialog (Admin) */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Project"
          message={`Are you sure you want to delete "${projectToDelete?.title}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </section>
  );
};

export default Portfolio;
