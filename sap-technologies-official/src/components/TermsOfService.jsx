import React, { useEffect } from "react";
import { motion } from "framer-motion";
import BackToTop from "./BackToTop";
import "../styles/LegalPages.css";

const LEGAL_FOOTER_LINKS = [
  { id: "home", label: "Home" },
  { id: "services", label: "Services" },
  { id: "products", label: "Products" },
  { id: "contact", label: "Contact" }
];

const TermsOfService = ({ onClose, onNavigate, onPrivacyPolicyOpen }) => {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="terms-of-service-title" onClick={onClose}>
      <motion.div 
        className="legal-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="legal-header">
          <h1 id="terms-of-service-title">Terms of Service</h1>
          <button type="button" className="legal-close-btn" onClick={onClose} aria-label="Close Terms of Service">
            &times;
          </button>
        </div>

        <div className="legal-body">
          <p className="last-updated">Last updated: April 5, 2026</p>

          <section>
            <h2>1. Acceptance of Terms at SAPTech Uganda</h2>
            <p>
              By accessing and using SAPTech Uganda's website and services, you accept and agree to be bound 
              by the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section>
            <h2>2. Services Overview</h2>
            <p>
              SAPTech Uganda provides comprehensive technology solutions including:
            </p>
            <ul>
              <li>Web Development and Design</li>
              <li>Mobile Application Development</li>
              <li>Software Engineering Solutions</li>
              <li>Graphics Design and Branding</li>
              <li>IoT and Electrical Engineering</li>
              <li>Digital Consulting Services</li>
            </ul>
          </section>

          <section>
            <h2>3. User Responsibilities</h2>
            <p>When using our services, you agree to:</p>
            <ul>
              <li>Provide accurate and complete information</li>
              <li>Maintain the confidentiality of your account credentials</li>
              <li>Use our services only for lawful purposes</li>
              <li>Respect intellectual property rights</li>
              <li>Not interfere with the operation of our services</li>
              <li>Not attempt to gain unauthorized access to our systems</li>
            </ul>
          </section>

          <section>
            <h2>4. Service Agreements</h2>
            <h3>4.1 Project Scope</h3>
            <p>
              All projects begin with a detailed scope document outlining deliverables, timelines, 
              and requirements. Changes to the scope may result in additional costs and timeline adjustments.
            </p>

            <h3>4.2 Payment Terms</h3>
            <ul>
              <li>Payment schedules are defined in individual project agreements</li>
              <li>Late payments may incur additional fees</li>
              <li>Refunds are subject to project-specific terms</li>
              <li>All prices are subject to applicable taxes</li>
            </ul>

            <h3>4.3 Delivery and Acceptance</h3>
            <p>
              Deliverables are considered accepted unless you notify us of defects within 7 days 
              of delivery. We provide a warranty period for bug fixes as specified in project agreements.
            </p>
          </section>

          <section>
            <h2>5. Intellectual Property</h2>
            <h3>5.1 Client Ownership</h3>
            <p>
              Upon full payment, clients own the final deliverables created specifically for their project, 
              excluding third-party components and our proprietary methodologies.
            </p>

            <h3>5.2 SAPTech Uganda Rights</h3>
            <p>
              We retain rights to our methodologies, frameworks, and general knowledge. We may use 
              project experiences for case studies (with anonymization when requested).
            </p>

            <h3>5.3 Third-Party Components</h3>
            <p>
              Projects may include third-party software, libraries, or services subject to their 
              respective licenses and terms.
            </p>
          </section>

          <section>
            <h2>6. Confidentiality</h2>
            <p>
              We respect the confidentiality of your business information and maintain strict 
              confidentiality agreements. We will not disclose your confidential information 
              to third parties without your consent.
            </p>
          </section>

          <section>
            <h2>7. Limitation of Liability</h2>
            <p>
              SAPTech Uganda's liability is limited to the amount paid for the specific service. 
              We are not liable for indirect, incidental, or consequential damages, including 
              but not limited to loss of profits, data, or business opportunities.
            </p>
          </section>

          <section>
            <h2>8. Service Availability</h2>
            <p>
              While we strive for maximum uptime, we do not guarantee uninterrupted service availability. 
              We may perform maintenance that temporarily affects service access.
            </p>
          </section>

          <section>
            <h2>9. Termination</h2>
            <p>
              Either party may terminate service agreements with appropriate notice as specified 
              in individual contracts. Upon termination:
            </p>
            <ul>
              <li>Payment for completed work is due immediately</li>
              <li>Work-in-progress ownership depends on payment status</li>
              <li>Confidentiality obligations continue indefinitely</li>
              <li>You must cease using our proprietary tools and methodologies</li>
            </ul>
          </section>

          <section>
            <h2>10. Dispute Resolution</h2>
            <p>
              Disputes will be resolved through good faith negotiation. If unsuccessful, 
              disputes will be subject to arbitration under the laws of Uganda.
            </p>
          </section>

          <section>
            <h2>11. Force Majeure</h2>
            <p>
              We are not liable for delays or failures due to circumstances beyond our reasonable 
              control, including natural disasters, government actions, or technical failures 
              by third-party services.
            </p>
          </section>

          <section>
            <h2>12. Updates to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Material changes will be 
              communicated to active clients. Continued use of our services constitutes acceptance 
              of updated terms.
            </p>
          </section>

          <section>
            <h2>13. Governing Law</h2>
            <p>
              These terms are governed by the laws of Uganda. Any legal proceedings will be 
              conducted in the appropriate courts of Uganda.
            </p>
          </section>

          <section>
            <h2>14. Contact Information</h2>
            <p>
              For questions about these Terms of Service, please contact us:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> info@saptechug.com</p>
              <p><strong>Phone:</strong> +256 706 564 628</p>
              <p><strong>Address:</strong> Ndejje, Kampala, Uganda</p>
            </div>
          </section>

          <section>
            <h2>15. Severability</h2>
            <p>
              If any provision of these terms is found to be unenforceable, the remaining 
              provisions will continue to be valid and enforceable.
            </p>
          </section>
        </div>

        <div className="legal-page-footer" aria-label="Terms of Service footer links">
          <div className="legal-footer-nav">
            {LEGAL_FOOTER_LINKS.map((link) => (
              <button
                key={link.id}
                type="button"
                onClick={() => onNavigate?.(link.id)}
              >
                {link.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                onPrivacyPolicyOpen?.();
                onClose?.();
              }}
            >
              Privacy
            </button>
          </div>
          <div className="legal-footer-contact">
            <a href="mailto:info@saptechug.com">Email</a>
            <a href="tel:+256706564628">Call</a>
            <a href="https://wa.me/256706564628" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>

        <BackToTop />
      </motion.div>
    </div>
  );
};

export default TermsOfService;
