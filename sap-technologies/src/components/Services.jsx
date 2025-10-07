/**
 * Services Component
 * 
 * Displays our comprehensive service portfolio with interactive cards and detailed modals.
 * Features include:
 * - Default core services (Web Design, Graphics, Electrical Engineering, Software)
 * - Additional services loaded from API/database
 * - Interactive modal popups with full service details
 * - Quote request form integration
 * - Smooth animations and hover effects
 * 
 * @component
 */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Background3D from "./Background3D";
import ServiceQuoteForm from "./ServiceQuoteForm";
import apiService from "../services/api";
import { fadeInUp, staggerContainer, cardHover, iconSpin } from "../utils/animations";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/Services.css";

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
   * Persist service data across re-renders
   * Prevents data loss during form submission or modal transitions
   */
  const quoteServiceRef = useRef(null);

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
      pricing: "Starting from $300",
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
      pricing: "Starting from $100",
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
      pricing: "Starting from $100",
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
      pricing: "Starting from $500", 
      deliveryTime: "4-12 weeks"
    }
  ];

  /**
   * Load additional services on component mount
   */
  useEffect(() => {
    fetchServices();
  }, []);

  /**
   * Fetch Additional Services from API
   * 
   * Loads custom services created through admin dashboard.
   * Transforms API response to match component structure.
   * Falls back gracefully if API is unavailable.
   */
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPublicServices();
      
      if (response.success && response.data.services.length > 0) {
        // Transform API data to match component structure
        const transformedServices = response.data.services.map(service => {
          let imageUrl = "/images/web-design.png"; // fallback image
          
          if (service.image) {
            imageUrl = service.image.startsWith("http") ? service.image : `${apiService.baseURL}${service.image}`;
          }
          
          return {
            id: service._id || service.id,
            title: service.title,
            image: imageUrl,
            icon: service.icon,
            description: service.description,
            longDescription: service.longDescription || service.description,
            features: service.features || [],
            technologies: Array.isArray(service.technologies) 
              ? service.technologies.map(tech => 
                  typeof tech === "string" ? tech : tech.name
                )
              : [],
            pricing: service.price && service.price.startingPrice 
              ? `Starting from $${service.price.startingPrice}` 
              : service.pricing || "Contact for pricing",
            deliveryTime: service.deliveryTime || "Contact for timeline"
          };
        });
        
        setApiServices(transformedServices);
      } else {
        setApiServices([]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setError("Failed to load custom services");
      setApiServices([]);
    } finally {
      setLoading(false);
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

  return (
    <>
      {/* Main Services Section */}
      <section id="services" className="services">
        {/* Animated 3D background */}
        <Background3D className="services-3d-background" />
        <div className="container">
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
            Discover our comprehensive range of professional services designed to help your business thrive in the digital world.
          </p>

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
                data-aos="fade-up"
                data-aos-delay={index * 200}
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
                    <img src={service.image} alt={service.title} className="service-img" />
                    <div className="service-overlay">
                      <motion.button 
                        className="learn-more-btn"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleLearnMore(service)}
                      >
                        Learn More
                      </motion.button>
                    </div>
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
                    data-aos="fade-up"
                    data-aos-delay={index * 200}
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
                        <img src={service.image} alt={service.title} className="service-img" />
                        <div className="service-overlay">
                          <motion.button 
                            className="learn-more-btn"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleLearnMore(service)}
                          >
                            Learn More
                          </motion.button>
                        </div>
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
                  <img src={selectedService.image} alt={selectedService.title} />
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
    </>
  );
};

export default Services;
