import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Newsletter from "./Newsletter";
import "../styles/Footer.css";

const FOOTER_LINK_GROUPS = [
  {
    title: "Company",
    links: [
      { id: "home", label: "Home" },
      { id: "about", label: "About" },
      { id: "partners", label: "Partners" },
      { id: "companies", label: "Platforms" },
      { route: "/careers", label: "Careers" },
      { id: "contact", label: "Contact" }
    ]
  },
  {
    title: "Services",
    links: [
      { id: "services", label: "Services" },
      { id: "portfolio", label: "Projects" },
      { route: "/software", label: "Software Apps" },
      { route: "/iot", label: "IoT Projects" },
      { route: "/insights", label: "Insights" },
      { id: "products", label: "Products" },
      { route: "/gallery", label: "Gallery" }
    ]
  },
  {
    title: "Community",
    links: [
      { route: "/awards", label: "SAPTech Awards 2026" },
      { id: "testimonials", label: "Testimonials" },
      { route: "/privacy-policy", label: "Privacy Policy" },
      { route: "/terms-of-service", label: "Terms of Service" }
    ]
  }
];

const Footer = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (onNavigate) {
      onNavigate(sectionId);
      return;
    }

    navigate({ pathname: "/", hash: `#${sectionId}` });
  };

  const goToRoute = (route) => {
    onNavigate?.();
    if (location.pathname === route) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    navigate(route);
  };

  const renderFooterLink = (link) => {
    if (link.route) {
      return (
        <a
          href={link.route}
          onClick={(event) => {
            event.preventDefault();
            goToRoute(link.route);
          }}
        >
          {link.label}
        </a>
      );
    }

    return (
      <a
        href={`/#${link.id}`}
        onClick={(event) => {
          event.preventDefault();
          scrollToSection(link.id);
        }}
      >
        {link.label}
      </a>
    );
  };

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img src="/images/logo.png" alt="SAPTech Uganda" className="footer-logo" />
          <span>SAPTech Uganda</span>
          <p className="footer-brand-description">
            Engineering, software, IoT, products, and digital transformation for teams in Uganda and beyond.
          </p>
          <div className="footer-meta">
            <span>Ndejje, Kampala, Uganda</span>
            <span>Global delivery</span>
          </div>
        </div>

        <div className="footer-links">
          <h4>Explore</h4>
          <div className="footer-link-groups">
            {FOOTER_LINK_GROUPS.map((group) => (
              <div className="footer-link-group" key={group.title}>
                <h5>{group.title}</h5>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.route || link.id}>
                      {renderFooterLink(link)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="footer-contact">
          <h4>Contact</h4>
          <div className="footer-contact-list">
            <p>Email: <a href="mailto:info@saptechug.com">info@saptechug.com</a></p>
            <p>Phone: <a href="tel:+256706564628">+256 706 564 628</a></p>
            <p>WhatsApp: <a href="https://wa.me/256706564628" target="_blank" rel="noopener noreferrer">Chat with us</a></p>
          </div>
        </div>

        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="https://www.linkedin.com/in/saphan-muganza-a893a9258?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" title="LinkedIn">LinkedIn</a>
            <a href="https://github.com/dashboard" target="_blank" rel="noopener noreferrer" title="GitHub">GitHub</a>
            <a href="https://x.com/SaphanMuganza2?t=-9Ox4ssAxetvwLcFRtQ2YA&s=09" target="_blank" rel="noopener noreferrer" title="Twitter">Twitter</a>
            <a href="https://www.facebook.com/profile.php?id=61563028584961" target="_blank" rel="noopener noreferrer" title="Facebook">Facebook</a>
            <a href="https://wa.me/256706564628" target="_blank" rel="noopener noreferrer" title="WhatsApp">WhatsApp</a>
            <a href="mailto:info@saptechug.com" title="Email">Email</a>
          </div>

          <Newsletter />
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-legal">
          <p>&copy; 2026 SAPTech Uganda-Africa. All rights reserved.</p>
          <div className="legal-links">
            <a
              href="/privacy-policy"
              onClick={(event) => { event.preventDefault(); goToRoute("/privacy-policy"); }}
              className="legal-link"
              aria-label="Privacy Policy"
            >
              Privacy Policy
            </a>
            <span className="separator">|</span>
            <a
              href="/terms-of-service"
              onClick={(event) => { event.preventDefault(); goToRoute("/terms-of-service"); }}
              className="legal-link"
              aria-label="Terms of Service"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>

      <div className="footer-credits">
        <p>
          Designed & Powered by{" "}
          <a
            href="https://saptechug.com"
            target="_blank"
            rel="noopener noreferrer"
            className="credits-link"
          >
            SAPTech Uganda
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
