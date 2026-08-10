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

const PrivacyPolicy = ({ onClose, onNavigate, onTermsOfServiceOpen }) => {
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
    <div className="legal-modal" role="dialog" aria-modal="true" aria-labelledby="privacy-policy-title" onClick={onClose}>
      <motion.div 
        className="legal-content"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ duration: 0.3 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="legal-header">
          <h1 id="privacy-policy-title">Privacy Policy</h1>
          <button type="button" className="legal-close-btn" onClick={onClose} aria-label="Close Privacy Policy">
            &times;
          </button>
        </div>

        <div className="legal-body">
          <p className="last-updated">Last updated: April 5, 2026</p>

          <section>
            <h2>1. Information We Collect</h2>
            <p>
              At SAPTech Uganda, we collect information you provide directly to us, such as when you:
            </p>
            <ul>
              <li>Fill out contact forms or request quotes</li>
              <li>Subscribe to our newsletter</li>
              <li>Create an account on our platform</li>
              <li>Communicate with us via email, phone, or chat</li>
              <li>Participate in surveys or feedback forms</li>
            </ul>

            <h3>Types of Information:</h3>
            <ul>
              <li><strong>Personal Information:</strong> Name, email address, phone number, company name</li>
              <li><strong>Project Information:</strong> Service requirements, project details, preferences</li>
              <li><strong>Technical Information:</strong> IP address, browser type, device information</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent on site, interaction patterns</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Respond to your inquiries and requests</li>
              <li>Send you relevant updates and newsletters (with your consent)</li>
              <li>Process service requests and project proposals</li>
              <li>Analyze website usage and improve user experience</li>
              <li>Comply with legal obligations and protect our rights</li>
            </ul>
          </section>

          <section>
            <h2>3. Information Sharing and Disclosure</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to outside parties except:
            </p>
            <ul>
              <li>With your explicit consent</li>
              <li>To trusted service providers who assist in our operations</li>
              <li>When required by law or to protect our rights</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section>
            <h2>4. Data Security</h2>
            <p>
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul>
              <li>SSL encryption for data transmission</li>
              <li>Secure servers with limited access</li>
              <li>Regular security audits and updates</li>
              <li>Employee training on data protection</li>
            </ul>
          </section>

          <section>
            <h2>5. Cookies and Tracking Technologies</h2>
            <p>
              We use cookies and similar technologies to enhance your experience on our website. 
              You can control cookie settings through your browser preferences.
            </p>
            <p>
              We may use Google AdSense and related Google services to display advertisements.
              Google and its partners may use cookies, web beacons, IP addresses, device identifiers,
              and browser information to serve, measure, and personalize ads. You can learn more about
              how Google uses information from sites and apps that use its services at{" "}
              <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
                Google partner sites
              </a>.
            </p>
          </section>

          <section>
            <h2>6. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Data portability (where applicable)</li>
            </ul>
          </section>

          <section>
            <h2>7. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place to protect your data.
            </p>
          </section>

          <section>
            <h2>8. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under 13 years of age. We do not 
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2>9. Updates to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any 
              material changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2>10. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="contact-info">
              <p><strong>Email:</strong> privacy@saptechug.com</p>
              <p><strong>Phone:</strong> +256 706 564 628</p>
              <p><strong>Address:</strong> Ndejje, Kampala, Uganda</p>
            </div>
          </section>
        </div>

        <div className="legal-page-footer" aria-label="Privacy Policy footer links">
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
                onTermsOfServiceOpen?.();
                onClose?.();
              }}
            >
              Terms
            </button>
          </div>
          <div className="legal-footer-contact">
            <a href="mailto:privacy@saptechug.com">Email</a>
            <a href="tel:+256706564628">Call</a>
            <a href="https://wa.me/256706564628" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </div>
        </div>

        <BackToTop />
      </motion.div>
    </div>
  );
};

export default PrivacyPolicy;
