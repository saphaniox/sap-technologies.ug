import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Background3D from "./Background3D";
import ServiceQuoteForm from "./ServiceQuoteForm";
import ServiceForm from "./ServiceForm";
import ConfirmDialog from "./ConfirmDialog";
import ImageSlider from "./ImageSlider";
import apiService from "../services/api";
import { getImageUrl } from "../utils/imageUrl";
import { fadeInUp, staggerContainer, cardHover, iconSpin } from "../utils/animations";
import { showAlert } from "../utils/alerts.jsx";
import { upsertById } from "../utils/realtimeCollection";
import "../styles/Services.css";

const SERVICE_PLACEHOLDER = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%236b7280' font-family='Arial' font-size='20' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3EService Image%3C/text%3E%3C/svg%3E";

const transformServiceRecord = (service) => ({
  id: service._id || service.id,
  title: service.title,
  image: getImageUrl(service.image) || SERVICE_PLACEHOLDER,
  icon: service.icon,
  description: service.description,
  longDescription: service.longDescription || service.description,
  features: service.features || [],
  technologies: Array.isArray(service.technologies)
    ? service.technologies.map((tech) => (typeof tech === "string" ? tech : tech.name))
    : [],
  pricing: service.price && service.price.startingPrice
    ? `Starting from $${service.price.startingPrice}`
    : service.pricing || "Contact for pricing",
  deliveryTime: service.deliveryTime || "Contact for timeline",
  order: service.order || 0,
  createdAt: service.createdAt,
  _originalData: service
});

const Services = () => {
  /**
   * Modal and UI State Management
   */
  // Currently selected service for detail view
  const [selectedService, setSelectedService] = useState(null);
  // Controls modal popup visibility
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Controls quote request form visibility
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  
  /**
   * Data Management State
   */
  // Additional services fetched from backend/database
  const [apiServices, setApiServices] = useState([]);
  // Loading indicator while fetching API services
  const [loading, setLoading] = useState(true);
  // Error message if API fetch fails
  const [error, setError] = useState(null);
  
  /**
   * Admin State Management
   */
  // Current user (to check admin role)
  const [user, setUser] = useState(null);
  // Controls service form modal visibility (admin)
  const [showServiceForm, setShowServiceForm] = useState(false);
  // Service being edited (admin)
  const [editingService, setEditingService] = useState(null);
  // Controls delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Service selected for deletion
  const [serviceToDelete, setServiceToDelete] = useState(null);
  // Admin statistics
  const [adminStats, setAdminStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  /**
   * Persist service data across re-renders
   * Prevents data loss during form submission or modal transitions
   */
  const quoteServiceRef = useRef(null);
  
  /**
   * WhatsApp Support Number
   */
  const WHATSAPP_NUMBER = "+256706564628";

  const popularServiceSearches = [
    "Website design for global clients",
    "Custom software development worldwide",
    "Mobile app development",
    "IoT automation systems",
    "Smart home and security systems",
    "Electrical engineering designs",
    "Lithium battery power solutions",
    "Graphics and logo design",
    "Cloud services and cybersecurity"
  ];

  /**
   * Core Services Array
   * 
   * These are our primary service offerings that always display.
   * Serves as fallback content if API services fail to load.
   * Ensures users always see our core capabilities regardless of backend status.
   */
  const defaultServices = [
    {
      id: "web-design",
      title: "Web Design",
      image: "/images/WEB-DESIGN.jpg",
      icon: "🌐",
      description: "We create modern, responsive, and visually stunning websites tailored to your business needs. Our team uses the latest technologies and best practices to ensure your site is fast, secure, and user-friendly. From e-commerce to corporate sites, we deliver solutions that help you stand out online.",
      features: [
        "Responsive Design",
        "SEO Optimization", 
        "E-commerce Integration",
        "CMS Development",
        "Custom Web Applications"
      ],
      technologies: ["React", "Vue.js", "Node.js", "WordPress", "Shopify"],
      pricing: "Starting from $199",
      deliveryTime: "2-4 weeks"
    },
    {
      id: "graphics-design",
      title: "Graphics & Logo",
      image: "/images/graphics.jpg", 
      icon: "🎨",
      description: "Our creative designers craft unique graphics and memorable logos that capture your brand's identity. We offer branding packages, marketing materials, and digital assets to elevate your business presence both online and offline.",
      features: [
        "Logo Design",
        "Brand Identity",
        "Marketing Materials", 
        "Social Media Graphics",
        "Print Design"
      ],
      technologies: ["Adobe Illustrator", "Photoshop", "InDesign", "Figma", "Canva Pro"],
      pricing: "Starting from $49",
      deliveryTime: "3-7 days"
    },
    {
      id: "electrical-engineering",
      title: "Electrical Engineering Designs",
      image: "/images/electrical.jpg",
      icon: "⚡", 
      description: "We provide professional electrical schematics, circuit designs, and engineering solutions for residential, commercial, and industrial projects. Our certified engineers ensure safety, efficiency, and compliance with Ugandan and international standards.",
      features: [
        "Circuit Design",
        "Electrical Schematics",
        "Power System Analysis",
        "Safety Compliance",
        "AutoCAD Drawings"
      ],
      technologies: ["AutoCAD Electrical", "MATLAB", "PLC Programming", "SCADA", "Proteus"],
      pricing: "Starting from $79",
      deliveryTime: "1-3 weeks"
    },
    {
      id: "software-solutions",
      title: "Software Solutions",
      image: "/images/software.jpg",
      icon: "💻",
      description: "From custom business applications to mobile apps, we develop robust software tailored to your requirements. Our solutions streamline operations, improve productivity, and drive digital transformation for your organization.",
      features: [
        "Custom Software Development",
        "Mobile Applications", 
        "Database Design",
        "API Integration",
        "Cloud Solutions"
      ],
      technologies: ["React", "Python", "Java", "Flutter", "AWS"],
      pricing: "Starting from $899", 
      deliveryTime: "4-12 weeks"
    }
  ];

  /**
   * Load additional services on component mount
   */
  useEffect(() => {
    fetchServices();
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
      const response = await apiService.getServiceStats();
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
   * Fetch Additional Services from API
   * 
   * Loads custom services created through admin dashboard.
   * Transforms API response to match component structure.
   * Falls back gracefully if API is unavailable.
   */
  const fetchServices = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      const response = await apiService.getPublicServices();
      
      if (response.success && response.data.services.length > 0) {
        const transformedServices = response.data.services.map(transformServiceRecord);
        
        setApiServices(transformedServices);
      } else {
        setApiServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      if (!silent) {
        setError("We're having trouble loading services. Please try again.");
        setApiServices([]);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  /**
   * Open service details modal
   */
  const handleLearnMore = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  /**
   * Close service details modal
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
  };

  /**
   * Open quote request form for selected service
   */
  const handleGetQuote = (service) => {
    console.log("🎯 Opening quote form for service:", {
      id: service.id || service._id,
      title: service.title
    });
    // Open the quote request form
    setSelectedService(service);
    quoteServiceRef.current = service; // Persist service data in ref
    setShowQuoteForm(true);
    setIsModalOpen(false);
  };

  /**
   * Close quote request form
   */
  const handleCloseQuoteForm = () => {
    setShowQuoteForm(false);
    setSelectedService(null);
    quoteServiceRef.current = null;
  };

  /**
   * Submit quote request to backend API
   */
  const handleSubmitQuote = async (quoteData) => {
    try {
      const service = quoteServiceRef.current;
      console.log("🔍 Service data check:", {
        hasRef: !!service,
        serviceId: service?.id || service?._id,
        serviceName: service?.title,
        quoteData
      });
      console.log("📬 Submitting service quote:", quoteData);
      const response = await apiService.submitServiceQuote(quoteData);
      console.log("✅ Quote submitted successfully:", response);
      return response;
    } catch (error) {
      console.error("❌ Error submitting quote:", error);
      throw error;
    }
  };

  /**
   * Navigate to contact section
   * Smoothly scrolls to contact form after closing modal
   */
  const handleContactUs = () => {
    const contactSection = document.getElementById("contact");
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: "smooth" });
    }
    handleCloseModal();
  };

  /**
   * Admin Functions
   */
  // Handle edit service
  const handleEdit = (service) => {
    // Use original data if available, otherwise use the service
    setEditingService(service._originalData || service);
    setShowServiceForm(true);
  };

  // Handle delete service
  const handleDelete = (service) => {
    setServiceToDelete(service);
    setShowDeleteDialog(true);
  };

  // Confirm delete service
  const confirmDelete = async () => {
    if (!serviceToDelete) return;

    try {
      await apiService.deleteService(serviceToDelete.id);
      // Instantly remove from UI
      setApiServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      setShowDeleteDialog(false);
      setServiceToDelete(null);
      await showAlert.success("Service removed", "The service has been deleted successfully.");
      // Refresh in background to ensure data consistency
      fetchServices({ silent: true });
    } catch (error) {
      console.error("Error deleting service:", error);
      await showAlert.error("Couldn't delete", error.message || "Something went wrong deleting that service. Please try again.");
    }
  };

  // Cancel delete
  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setServiceToDelete(null);
  };

  // Handle service save success
  const handleServiceSave = (savedService) => {
    if (savedService?._id) {
      const transformedService = transformServiceRecord(savedService);
      setApiServices((prev) => upsertById(prev, transformedService, {
        orderKey: "order",
        include: (service) => service._originalData?.status === "active"
      }));
    }

    fetchServices({ silent: true });
    if (user?.role === "admin") fetchAdminStats();
    setShowServiceForm(false);
    setEditingService(null);
  };

  /**
   * WhatsApp Contact Handler
   */
  const handleWhatsAppContact = (service) => {
    const message = encodeURIComponent(`Hi, I'm interested in ${service.title}. Can you provide more information?`);
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      {/* Main Services Section */}
      <section id="services" className="services">
        {/* Animated 3D background */}
        <Background3D className="services-3d-background" />
        <div className="container">
          {/* Admin Info Panel - Displayed at Top for Admins */}
          {user && user.role === "admin" && (
            <div className="admin-info-panel" style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              marginBottom: "30px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
                <div>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: "1.5rem" }}>👨‍💻 Admin Mode Active</h3>
                  <p style={{ margin: 0, opacity: 0.9 }}>Managing services as {user.name}</p>
                </div>
                <button 
                  className="add-service-btn admin-btn"
                  onClick={() => {
                    setEditingService(null);
                    setShowServiceForm(true);
                  }}
                  style={{
                    background: "white",
                    color: "#f5576c",
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
                  + Add Service
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
                    <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{defaultServices.length + apiServices.length}</div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Total Services</div>
                  </div>
                  <div style={{
                    background: "rgba(255,255,255,0.15)",
                    padding: "15px",
                    borderRadius: "8px",
                    textAlign: "center"
                  }}>
                    <div style={{ fontSize: "2rem", fontWeight: "bold" }}>{apiServices.length}</div>
                    <div style={{ fontSize: "0.9rem", opacity: 0.9 }}>Custom Services</div>
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

          <div className="services-hero">
            <div className="services-hero-copy">
              {/* Section title with animation */}
              <motion.h2
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                Our Services
              </motion.h2>

              {/* Introduction text */}
              <p className="services-intro">
                Discover practical technology and engineering services for businesses, schools, startups,
                shops, homes, and organizations in Uganda, across Africa, and worldwide. We help with
                websites, software, IoT systems, automation, electrical designs, branding, cloud,
                cybersecurity, and power solutions.
              </p>
            </div>

            <div className="services-keyword-strip" aria-label="Popular SAPTech Uganda services">
              {popularServiceSearches.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
          </div>

          {/* Loading spinner while fetching API services */}
          {loading && (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading additional services...</p>
            </div>
          )}

          {/* Error message if API fetch fails */}
          {error && (
            <div className="error-state">
              <p>⚠️ {error}</p>
            </div>
          )}

          {/* Core Services - Always displayed */}
          <motion.div 
            className="services-list"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {defaultServices.map((service, index) => (
              <motion.div 
                key={service.id} 
                className="service"
                variants={cardHover}
                initial="rest"
                whileHover="hover"
              >
                <div className="service-content">
                  <motion.div 
                    className="service-icon"
                    variants={iconSpin}
                    initial="rest"
                    whileHover="hover"
                  >
                    {service.icon}
                  </motion.div>
                  <div className="service-image">
                    {service.images && Array.isArray(service.images) && service.images.length > 0 ? (
                      <ImageSlider 
                        images={service.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))} 
                        alt={service.title} 
                      />
                    ) : (
                      <img src={service.image} alt={service.title} className="service-img" />
                    )}
                    <div className="service-overlay">
                      <motion.button 
                        className="learn-more-btn"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLearnMore(service)}
                      >
                        Learn More
                      </motion.button>
                      <motion.button 
                        className="whatsapp-btn-service"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleWhatsAppContact(service)}
                        title="Contact us on WhatsApp"
                      >
                        💬 WhatsApp
                      </motion.button>
                    </div>

                    {/* Admin Controls */}
                    {user && user.role === "admin" && (
                      <div className="admin-controls-service">
                        <button 
                          className="edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit({...service, isDefault: true, images: [service.image]});
                          }}
                          title="Edit Service"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* ADDITIONAL SERVICES - API CREATED */}
          {!loading && apiServices.length > 0 && (
            <>
              <motion.h3 
                variants={fadeInUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="custom-services-title"
              >
                Additional Services
              </motion.h3>
              
              <motion.div 
                className="services-list custom-services"
                variants={staggerContainer}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {apiServices.map((service, index) => (
                  <motion.div 
                    key={service.id} 
                    className="service custom-service"
                    variants={cardHover}
                    initial="rest"
                    whileHover="hover"
                  >
                    <div className="service-content">
                      <motion.div 
                        className="service-icon"
                        variants={iconSpin}
                        initial="rest"
                        whileHover="hover"
                      >
                        {service.icon}
                      </motion.div>
                      <div className="service-image">
                        {service.images && Array.isArray(service.images) && service.images.length > 0 ? (
                          <ImageSlider 
                            images={service.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))} 
                            alt={service.title} 
                          />
                        ) : (
                          <img src={service.image} alt={service.title} className="service-img" />
                        )}
                        <div className="service-overlay">
                          <motion.button 
                            className="learn-more-btn"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLearnMore(service)}
                          >
                            Learn More
                          </motion.button>
                          <motion.button 
                            className="whatsapp-btn-service"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleWhatsAppContact(service)}
                            title="Contact us on WhatsApp"
                          >
                            💬 WhatsApp
                          </motion.button>
                        </div>

                        {/* Admin Controls */}
                        {user && user.role === "admin" && (
                          <div className="admin-controls-service">
                            <button 
                              className="edit-btn"
                              onClick={() => handleEdit(service)}
                              title="Edit Service"
                            >
                              ✏️
                            </button>
                            <button 
                              className="delete-btn"
                              onClick={() => handleDelete(service)}
                              title="Delete Service"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Service Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedService && (
          <motion.div 
            className="service-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div 
              className="service-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-title">
                  <span className="modal-icon">{selectedService.icon}</span>
                  <h2>{selectedService.title}</h2>
                </div>
                <button className="modal-close" onClick={handleCloseModal}>
                  ×
                </button>
              </div>

              <div className="modal-content">
                <div className="modal-image">
                  {selectedService.images && Array.isArray(selectedService.images) && selectedService.images.length > 0 ? (
                    <ImageSlider 
                      images={selectedService.images.map(img => getImageUrl(typeof img === 'string' ? img : img.url))} 
                      alt={selectedService.title} 
                    />
                  ) : (
                    <img src={selectedService.image} alt={selectedService.title} />
                  )}
                </div>

                <div className="modal-details">
                  <div className="modal-section">
                    <h3>Service Overview</h3>
                    <p>{selectedService.description}</p>
                  </div>

                  <div className="modal-section">
                    <h3>Key Features</h3>
                    <ul className="features-list">
                      {selectedService.features.map((feature, index) => (
                        <li key={index}>✓ {feature}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="modal-section">
                    <h3>Technologies We Use</h3>
                    <div className="technologies">
                      {selectedService.technologies.map((tech, index) => (
                        <span key={index} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>

                  <div className="modal-info">
                    <div className="info-item">
                      <strong>Pricing:</strong> {selectedService.pricing}
                    </div>
                    <div className="info-item">
                      <strong>Delivery:</strong> {selectedService.deliveryTime}
                    </div>
                  </div>

                  <div className="modal-actions">
                    <motion.button 
                      className="btn-primary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleGetQuote(selectedService)}
                    >
                      Get Quote
                    </motion.button>
                    <motion.button 
                      className="btn-secondary"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleContactUs}
                    >
                      Contact Us
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Quote Form Modal */}
      {showQuoteForm && selectedService && (
        <ServiceQuoteForm
          service={selectedService}
          onClose={handleCloseQuoteForm}
          onSubmit={handleSubmitQuote}
        />
      )}

      {/* Service Form Modal (Admin) */}
      {showServiceForm && (
        <ServiceForm 
          isOpen={showServiceForm}
          service={editingService}
          onClose={() => {
            setShowServiceForm(false);
            setEditingService(null);
          }}
          onSave={handleServiceSave}
        />
      )}

      {/* Delete Confirmation Dialog (Admin) */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Service"
          message={`Are you sure you want to delete "${serviceToDelete?.title}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </>
  );
};

export default Services;
