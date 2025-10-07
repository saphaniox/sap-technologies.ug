/**
 * Companies Component
 * 
 * Showcases SAP Technologies sister companies and platforms.
 * Features include:
 * - Display of related business platforms
 * - Coming soon indicators for platforms in development
 * - Professional card layout with images and descriptions
 * - Interactive alert notifications for unreleased platforms
 * 
 * @component
 */
import React from "react";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/Companies.css";

const Companies = () => {
  /**
   * Show coming soon alert for platforms in development
   */
  const handleComingSoon = (platformName) => {
    showAlert.info(
      `${platformName} - Coming Soon! 🚀`,
      "This exciting platform is currently being programmed. Stay tuned for the launch!",
      {
        confirmButtonText: "Can\"t Wait!",
        timer: 4000,
        timerProgressBar: true
      }
    );
  };

  /**
   * Sister Companies and Platforms
   * Array of related business platforms under SAP Technologies umbrella
   */
  const companies = [
    {
      title: "SAP Engineering",
      image: "/images/SAP-ENGINEERING.jpg",
      description: "Specializing in electrical, civil, and mechanical engineering solutions for Uganda and beyond. We deliver innovative, safe, and efficient engineering projects for all sectors.",
      comingSoon: true
    },
    {
      title: "SAP Online Learning",
      image: "/images/sap-onlineplatform.png",
      description: "Your gateway to digital skills! Explore online courses in programming, design, engineering, and more, tailored for African learners and professionals.",
      comingSoon: true
    },
    {
      title: "SAP E-Commerce",
      image: "/images/sap-ecomerce-site.jpg",
      description: "Modern online shopping platform for Ugandan businesses and customers. Secure payments, product management, and seamless user experience.",
      comingSoon: true
    }
  ];

  return (
    <section id="companies" className="companies">
      <div className="container">
        <h2>Our Other Platforms</h2>
        <div className="companies-list">
          {companies.map((company, index) => (
            <div key={index} className="company-card">
              <img src={company.image} alt={company.title} className="company-img" />
              <div className="company-content">
                <h3>{company.title}</h3>
                <p>{company.description}</p>
                {company.comingSoon ? (
                  <button 
                    onClick={() => handleComingSoon(company.title)} 
                    className="company-link coming-soon-btn"
                  >
                    Coming Soon - {company.title}
                  </button>
                ) : (
                  <a href={company.link} target="_blank" rel="noopener noreferrer" className="company-link">
                    Visit {company.title}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Companies;
