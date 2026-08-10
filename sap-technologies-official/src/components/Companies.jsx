import React from "react";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/Companies.css";

const Companies = () => {
  const handleComingSoon = (platformName) => {
    showAlert.info(
      `${platformName} - Coming Soon!`,
      "We're putting the finishing touches on this one. Check back soon!",
      {
        confirmButtonText: "Can't Wait!",
        timer: 4000,
        timerProgressBar: true
      }
    );
  };

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
      description: "Modern online shopping platform for businesses and customers in Uganda and worldwide. Secure payments, product management, and seamless user experience.",
      comingSoon: true
    }
  ];

  const comingSoonCompanies = companies.filter((company) => company.comingSoon);

  return (
    <section id="companies" className="companies">
      <div className="container">
        <h2>Our Other Platforms</h2>

        {comingSoonCompanies.length > 0 && (
          <div className="coming-soon-roadmap">
            <p className="roadmap-label">More platforms on the way:</p>
            <div className="roadmap-items">
              {comingSoonCompanies.map((company, index) => (
                <button
                  key={index}
                  className="roadmap-item"
                  onClick={() => handleComingSoon(company.title)}
                  title={company.description}
                >
                  {company.title}
                  <span className="roadmap-badge">Coming Soon</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default Companies;
