/**
 * Contact Component
 * 
 * Provides a contact form for users to reach out to SAP Technologies.
 * Features include:
 * - Interactive contact form with validation
 * - Real-time field focus effects
 * - Email and phone contact information display
 * - Form submission with loading states
 * - Success/error alert notifications
 * - Smooth animations with Framer Motion
 * 
 * @component
 */
import React, { useState } from "react";
import { motion } from "framer-motion";
import apiService from "../services/api";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer } from "../utils/animations";
import { showAlert, Spinners, LoadingButton } from "../utils/alerts.jsx";
import "../styles/Contact.css";

const Contact = () => {
  /**
   * Form Data State
   */
  // Contact form field values
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  
  /**
   * UI State Management
   */
  // Feedback message for form submission result
  const [formMessage, setFormMessage] = useState("");
  // Loading indicator during form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Tracks which field is currently focused for styling
  const [focusedField, setFocusedField] = useState(null);

  /**
   * Handle form input changes
   * Updates form data state as user types
   */
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  /**
   * Handle form submission
   * Submits contact data to backend API and displays success/error alerts
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiService.submitContact(formData);
      
      // Show success alert with SweetAlert2
      await showAlert.success(
        "Message Sent Successfully!",
        "Thank you for contacting us! We will get back to you soon.",
        {
          confirmButtonText: "Great!",
          timer: 4000
        }
      );
      
      // Reset form
      setFormData({ name: "", email: "", message: "" });
      setFormMessage("");
    } catch (error) {
      // Show error alert with SweetAlert2
      await showAlert.error(
        "Failed to Send Message",
        error.message || "There was an error sending your message. Please try again later.",
        {
          confirmButtonText: "Try Again"
        }
      );
      setFormMessage(error.message || "There was an error. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Contact Information Data
   * Display our contact details with clickable links
   */
  const contactInfo = [
    {
      icon: "📧",
      title: "Email",
      info: "ceo@saptechnologies.com",
      link: "mailto:ceo@saptechnologies.com"
    },
    {
      icon: "📱",
      title: "Phone",
      info: "+256 706 564 628",
      link: "tel:+256706564628"
    },
    {
      icon: "📍",
      title: "Location",
      info: "Kampala, Uganda",
      link: "#"
    }
  ];

  return (
    <section id="contact" className="contact">
      <div className="container">
        <motion.h2 
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          Contact Us
        </motion.h2>
        
        <div className="contact-content">
          <motion.div 
            className="contact-info"
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h3>Get in Touch</h3>
            <p>Ready to start your next project? We"d love to hear from you!</p>
            
            <motion.div 
              className="contact-items"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {contactInfo.map((item, index) => (
                <motion.div 
                  key={index}
                  className="contact-item"
                  variants={fadeInUp}
                  whileHover={{ scale: 1.05, x: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div className="contact-icon">{item.icon}</div>
                  <div className="contact-details">
                    <h4>{item.title}</h4>
                    <a href={item.link}>{item.info}</a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
          
          <motion.form 
            onSubmit={handleSubmit} 
            className="contact-form"
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div 
              className="form-group"
              variants={fadeInUp}
            >
              <motion.input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                required
                className={focusedField === "name" ? "focused" : ""}
                whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            <motion.div 
              className="form-group"
              variants={fadeInUp}
            >
              <motion.input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                required
                className={focusedField === "email" ? "focused" : ""}
                whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            <motion.div 
              className="form-group"
              variants={fadeInUp}
            >
              <motion.textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                onFocus={() => setFocusedField("message")}
                onBlur={() => setFocusedField(null)}
                rows="6"
                required
                className={focusedField === "message" ? "focused" : ""}
                whileFocus={{ scale: 1.02, borderColor: "#3b82f6" }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
            
            <LoadingButton
              type="submit"
              loading={isSubmitting}
              spinnerType="Pulse"
              spinnerSize={16}
              className="submit-button"
              style={{
                background: "#3b82f6",
                color: "white",
                border: "none",
                padding: "12px 24px",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                width: "100%",
                minHeight: "48px"
              }}
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </LoadingButton>
          </motion.form>
        </div>
        
        {formMessage && (
          <motion.div 
            className={`form-message ${formMessage.includes("error") || formMessage.includes("Error") ? "error" : "success"}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {formMessage}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default Contact;
