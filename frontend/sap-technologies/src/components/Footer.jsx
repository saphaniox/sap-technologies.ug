/**
 * Footer Component
 * 
 * Bottom section with navigation, contact info, and social links.
 * Features include:
 * - Quick navigation links to all sections
 * - Sister platform links with coming soon alerts
 * - Contact information (email, phone)
 * - Social media links (LinkedIn, GitHub, Twitter, Facebook, WhatsApp)
 * - Newsletter subscription form
 * - Privacy policy and terms of service links
 * - Copyright information
 * 
 * @component
 */
import React from "react";
import { showAlert } from "../utils/alerts.jsx";
import Newsletter from "./Newsletter";
import "../styles/Footer.css";

const Footer = ({ onPrivacyPolicyOpen, onTermsOfServiceOpen, onNavigate }) => {
  /**
   * Navigate to page section
   * Smoothly scrolls to section or shows navigation alert
   */
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // If the section exists on current page, scroll to it
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      // If section doesn't exist, navigate to main page with section
      if (onNavigate) {
        onNavigate(sectionId);
      } else {
        // Fallback: show alert that user needs to navigate to main page
        showAlert.info(
          `Navigate to ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Section`,
          "Please close this modal and navigate to the main page to access this section.",
          {
            confirmButtonText: "Got it!",
            timer: 4000,
            timerProgressBar: true
          }
        );
      }
    }
  };

  /**
   * Show coming soon alert for platforms in development
   */
  const handlePlatformComingSoon = (platformName) => {
    showAlert.info(
      `${platformName} - Coming Soon! 🚀`,
      "This exciting platform is currently being programmed. Stay tuned for the launch!",
      {
        confirmButtonText: "Exciting!",
        timer: 4000,
        timerProgressBar: true
      }
    );
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/images/logo2.jpg" alt="SAP Logo" className="footer-logo" />
          <span>SAP Technologies</span>
          <p>Kampala, Uganda</p>
        </div>
        
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home" onClick={(e) => { e.preventDefault(); scrollToSection("home"); }}>Home</a></li>
            <li><a href="#about" onClick={(e) => { e.preventDefault(); scrollToSection("about"); }}>About</a></li>
            <li><a href="#services" onClick={(e) => { e.preventDefault(); scrollToSection("services"); }}>Services</a></li>
            <li><a href="#portfolio" onClick={(e) => { e.preventDefault(); scrollToSection("portfolio"); }}>Our Featured Projects</a></li>
            <li><a href="#contact" onClick={(e) => { e.preventDefault(); scrollToSection("contact"); }}>Contact</a></li>
            <li><a href="#companies" onClick={(e) => { e.preventDefault(); scrollToSection("companies"); }}>Our Platforms</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handlePlatformComingSoon("SAP Engineering"); }}>SAP Engineering</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handlePlatformComingSoon("SAP Online Learning"); }}>SAP Online Learning</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); handlePlatformComingSoon("SAP E-Commerce"); }}>SAP E-Commerce</a></li>
          </ul>
        </div>
        
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Email: <a href="mailto:info@sap-technologies.com">info@sap-technologies.com</a></p>
          <p>Phone: <a href="tel:+256706564628">+256 706 564 628</a></p>
        </div>
        
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://www.linkedin.com/in/saphan-muganza-a893a9258?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" title="LinkedIn">LinkedIn</a>
            <a href="https://github.com/dashboard" target="_blank" rel="noopener noreferrer" title="GitHub">GitHub</a>
            <a href="https://x.com/SaphanMuganza2?t=-9Ox4ssAxetvwLcFRtQ2YA&s=09" target="_blank" rel="noopener noreferrer" title="Twitter">Twitter</a>
            <a href="https://www.facebook.com/profile.php?id=61563028584961" target="_blank" rel="noopener noreferrer" title="Facebook">Facebook</a>
            <a href="https://wa.me/256706564628" target="_blank" rel="noopener noreferrer" title="WhatsApp">WhatsApp</a>
            <a href="mailto:saphaniox@gmail.com" title="Email">Email</a>
          </div>
          
          <Newsletter />
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-legal">
          <p>&copy; 2025 SAP Technologies Uganda-Africa. All rights reserved.</p>
          <div className="legal-links">
            <button 
              onClick={onPrivacyPolicyOpen}
              className="legal-link"
              aria-label="Privacy Policy"
            >
              Privacy Policy
            </button>
            <span className="separator">|</span>
            <button 
              onClick={onTermsOfServiceOpen}
              className="legal-link"
              aria-label="Terms of Service"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
      
      <div className="footer-credits">
        <p>
          Designed & Powered by{" "}
          <a 
            href="https://sap-technologies.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="credits-link"
          >
            SAP-Technologies
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
