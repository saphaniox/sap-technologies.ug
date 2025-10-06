/**
 * Terms of Service Component
 * 
 * Full-screen modal displaying SAP Technologies terms and conditions
 * for using services and website.
 * 
 * Features:
 * - Complete terms of service documentation
 * - Service descriptions and limitations
 * - User obligations and responsibilities
 * - Payment terms and intellectual property rights
 * - Warranty disclaimers and liability limitations
 * - Dispute resolution and governing law
 * - Animated modal entrance
 * - Back to top button for navigation
 * - Close button functionality
 * - Last updated date display
 * 
 * Sections Covered:
 * - Acceptance of terms
 * - Services overview
 * - User accounts and responsibilities
 * - Payment and billing
 * - Intellectual property
 * - Service modifications
 * - Warranties and disclaimers
 * - Limitation of liability
 * - Termination conditions
 * - Governing law and disputes
 * 
 * Props:
 * - onClose: Callback to close the modal
 * 
 * @component
 */

import React from "react";
import { motion } from "framer-motion";
import BackToTop from "./BackToTop";
import "../styles/LegalPages.css";

const TermsOfService = ({ onClose }) => {
  return (
    <div className="legal-modal">
      <motion.div 
        className="legal-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="legal-header">
          <h1>Terms of Service</h1>
          <button className="close-btn" onClick={onClose} aria-label="Close Terms of Service">
            &times;
          </button>
        </div>

        <div className="legal-body">
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>

          <section>
            <h2>1. Acceptance of Terms at Sap technologies</h2>
            <p>
              By accessing and using SAP Technologies" website and services, you accept and agree to be bound 
              by the terms and provision of this agreement. If you do not agree to abide by the above, 
              please do not use this service.
            </p>
          </section>

          <section>
            <h2>2. Services Overview</h2>
            <p>
              SAP Technologies provides comprehensive technology solutions including:
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

            <h3>5.2 SAP Technologies Rights</h3>
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
              SAP Technologies" liability is limited to the amount paid for the specific service. 
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
              <p><strong>Email:</strong> legal@sap-technologies.com</p>
              <p><strong>Phone:</strong> +256 706 564 628</p>
              <p><strong>Address:</strong> Kampala, Uganda</p>
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

        <BackToTop />
      </motion.div>
    </div>
  );
};

export default TermsOfService;