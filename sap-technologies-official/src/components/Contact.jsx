/**
 * Contact Component
 *
 * Provides a polished contact form for users to reach out to SAPTech Uganda.
 */
import React, { useState } from "react";
import { motion } from "framer-motion";
import apiService from "../services/api";
import { fadeInUp, fadeInLeft, fadeInRight, staggerContainer } from "../utils/animations";
import { showAlert, LoadingButton } from "../utils/alerts.jsx";
import "../styles/Contact.css";

const contactInfo = [
  {
    iconClass: "mail",
    title: "Email",
    info: "info@saptechug.com",
    link: "mailto:info@saptechug.com"
  },
  {
    iconClass: "phone",
    title: "Phone",
    info: "+256 706 564 628",
    link: "tel:+256706564628"
  },
  {
    iconClass: "location",
    title: "Location",
    info: "Ndejje, Kampala, Uganda",
    link: "https://www.google.com/maps/search/Ndejje%2C%20Kampala%2C%20Uganda",
    external: true
  }
];

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: ""
};

const Contact = () => {
  const [formData, setFormData] = useState(emptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiService.submitContact(formData);

      await showAlert.success(
        "Message Sent Successfully!",
        "Thank you for contacting us! We will get back to you soon.",
        {
          confirmButtonText: "Great!",
          timer: 4000
        }
      );

      setFormData(emptyForm);
      setFormMessage("");
    } catch (error) {
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

  return (
    <section id="contact" className="contact">
      <div className="container">
        <motion.div
          className="contact-heading"
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <span className="contact-eyebrow">Contact Us</span>
          <h2>Get in Touch</h2>
          <p>Ready to start your next project? We&apos;d love to hear from you.</p>
        </motion.div>

        <div className="contact-content">
          <motion.div
            className="contact-info"
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <span className="contact-panel-label">SAPTech Uganda</span>
            <h3>Let&apos;s talk about your next build.</h3>
            <p>
              Send the details and our team will respond with a clear next step for your
              project, support request, or partnership idea.
            </p>

            <motion.div
              className="contact-items"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {contactInfo.map((item) => (
                <motion.a
                  key={item.title}
                  className="contact-item"
                  href={item.link}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noreferrer" : undefined}
                  variants={fadeInUp}
                  whileHover={{ x: 6 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className={`contact-icon ${item.iconClass}`} aria-hidden="true" />
                  <span className="contact-details">
                    <strong>{item.title}</strong>
                    <span>{item.info}</span>
                  </span>
                </motion.a>
              ))}
            </motion.div>

            <div className="contact-response">
              <span>Typical response</span>
              <strong>Within 24 hours</strong>
            </div>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            className="contact-form"
            variants={fadeInRight}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="contact-form-header">
              <span>Start a conversation</span>
              <h3>Send us a message</h3>
            </div>

            <div className="contact-form-grid">
              <motion.div className="form-group" variants={fadeInUp}>
                <label htmlFor="contact-name">Your Name</label>
                <motion.input
                  id="contact-name"
                  type="text"
                  name="name"
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="name"
                  className={focusedField === "name" ? "focused" : ""}
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div className="form-group" variants={fadeInUp}>
                <label htmlFor="contact-email">Your Email</label>
                <motion.input
                  id="contact-email"
                  type="email"
                  name="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  required
                  autoComplete="email"
                  className={focusedField === "email" ? "focused" : ""}
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div className="form-group" variants={fadeInUp}>
                <label htmlFor="contact-phone">
                  Your Phone Number <span>(optional)</span>
                </label>
                <motion.input
                  id="contact-phone"
                  type="tel"
                  name="phone"
                  placeholder="Your Phone Number (optional)"
                  value={formData.phone}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("phone")}
                  onBlur={() => setFocusedField(null)}
                  autoComplete="tel"
                  inputMode="tel"
                  className={focusedField === "phone" ? "focused" : ""}
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div className="form-group" variants={fadeInUp}>
                <label htmlFor="contact-subject">Subject</label>
                <motion.input
                  id="contact-subject"
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  value={formData.subject}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("subject")}
                  onBlur={() => setFocusedField(null)}
                  required
                  maxLength="200"
                  className={focusedField === "subject" ? "focused" : ""}
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>

              <motion.div className="form-group full-width" variants={fadeInUp}>
                <label htmlFor="contact-message">Your Message</label>
                <motion.textarea
                  id="contact-message"
                  name="message"
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("message")}
                  onBlur={() => setFocusedField(null)}
                  rows="6"
                  required
                  className={focusedField === "message" ? "focused" : ""}
                  whileFocus={{ scale: 1.01, borderColor: "#3b82f6" }}
                  transition={{ duration: 0.2 }}
                />
              </motion.div>
            </div>

            <LoadingButton
              type="submit"
              loading={isSubmitting}
              spinnerType="Pulse"
              spinnerSize={16}
              className="submit-button"
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
