import React from "react";
import "../styles/Companies.css";

const Companies = () => {
  const platforms = [
    {
      title: "DateZone International Dating",
      image: "/images/datezone-live.png",
      description: "Meet people, create meaningful connections, and chat safely on DateZone International Dating.",
      url: "https://datezoneug.com"
    },
    {
      title: "QuiTech - Learn and Progress",
      image: "/images/quitech-live.png",
      description: "Practice knowledge across learning paths, test your progress, and earn certificates with QuiTech.",
      url: "https://quitech.online"
    },
    {
      title: "SAP Business Management System",
      image: "/images/sap-business-management-live.png",
      description: "Manage business operations, records, users, and performance from one connected platform.",
      url: "https://sapbms.com"
    }
  ];

  return (
    <section id="companies" className="companies">
      <div className="container">
        <h2>Our Platforms</h2>
        <div className="companies-list">
          {platforms.map((platform) => (
            <a
              key={platform.title}
              className="company-card"
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="company-logo-wrap">
                <img className="company-img company-logo" src={platform.image} alt={`${platform.title} logo`} />
              </div>
              <div className="company-content">
                <h3>{platform.title}</h3>
                <p>{platform.description}</p>
                <span className="company-link">Visit platform</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Companies;
