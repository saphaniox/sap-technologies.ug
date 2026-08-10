import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import IoTProjects from "../components/IoTProjects";
import "../styles/IoT.css";

const IoTPage = () => {
  const navigate = useNavigate();
  // SEO data for better search engine visibility
  const seoData = {
    title: "IoT Projects, Automation & Smart Systems | SAPTech Uganda",
    description: "Explore SAPTech Uganda IoT projects, smart home systems, security systems, farm monitoring, industrial automation, Arduino, Raspberry Pi, ESP32, sensors, and connected devices for clients in Uganda and worldwide.",
    keywords: "IoT projects Uganda, Internet of Things Uganda, SAPTech Uganda IoT, IoT services worldwide, IoT services Uganda, smart home systems worldwide, smart home systems Uganda, security systems Uganda, automation projects worldwide, automation projects Uganda, Arduino projects Uganda, Raspberry Pi projects Uganda, ESP32 projects Uganda, embedded systems Uganda, sensor networks Uganda, remote monitoring worldwide, smart farming Uganda, industrial IoT worldwide, connected devices Africa",
    ogType: "website",
    ogImage: "/images/ioT.jpg",
    canonicalUrl: "/iot",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "IoT Projects",
    "description": "Practical Internet of Things projects and embedded systems developed by SAPTech Uganda",
    "provider": {
      "@type": "Organization",
      "name": "SAPTech Uganda",
      "url": "https://saptechug.com"
    },
    "about": {
      "@type": "Technology",
      "name": "Internet of Things (IoT)",
      "description": "Smart connected devices and embedded systems"
    }
  };

  return (
    <>
      {/* SEO Component with comprehensive meta tags */}
      <SEO 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        ogType={seoData.ogType}
        ogImage={seoData.ogImage}
        canonicalUrl={seoData.canonicalUrl}
        structuredData={structuredData}
      />

      <div className="iot-page">
        {/* Page Header */}
        <div className="iot-page-header">
          <div className="container">
            <button onClick={() => navigate("/")} className="back-button" aria-label="Back to homepage">
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <h1>IoT Projects</h1>
            <p className="iot-page-subtitle">
              Explore connected systems designed for homes, farms, workshops, schools, and businesses.
              We turn sensors, devices, and automation into useful tools people can actually rely on.
            </p>
          </div>
        </div>

        <section className="iot-search-content" aria-labelledby="iot-search-title">
          <div className="container">
            <h2 id="iot-search-title">Connected systems we build</h2>
            <p>
              SAPTech Uganda develops sensor-based systems for monitoring, automation, and
              control in real environments. We combine embedded hardware, dashboards, alerts,
              and connectivity so homes, farms, schools, workshops, and businesses can track
              what matters and respond faster.
            </p>
            <div className="iot-search-grid" aria-label="Common IoT project types">
              <span>Smart home automation</span>
              <span>Security and surveillance systems</span>
              <span>Smart farming and agriculture tech</span>
              <span>Environmental monitoring</span>
              <span>Industrial monitoring dashboards</span>
              <span>Remote monitoring and control</span>
              <span>Sensor networks and alerts</span>
              <span>Custom device prototypes</span>
            </div>
          </div>
        </section>

        {/* Main IoT Projects Component */}
        <IoTProjects />
      </div>
    </>
  );
};

export default IoTPage;

