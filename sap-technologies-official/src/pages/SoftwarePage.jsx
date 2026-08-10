import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import Softwares from "../components/Softwares";
import "../styles/Software.css";

const SoftwarePage = () => {
  const navigate = useNavigate();
  // SEO data for better search engine visibility
  const seoData = {
    title: "Software Apps & Business Systems | SAPTech Uganda",
    description: "Explore SAPTech Uganda software apps, custom web applications, business management systems, ecommerce tools, school systems, inventory systems, dashboards, and digital business platforms for clients in Uganda and worldwide.",
    keywords: "SAPTech Uganda software, software apps Uganda, custom software worldwide, custom software Uganda, web applications Uganda, web applications for global clients, business management software, school management system Uganda, inventory management system, ecommerce platform, restaurant ordering system, learning management system, digital tools Kampala, business apps worldwide",
    ogType: "website",
    ogImage: "/images/software.jpg",
    canonicalUrl: "/software",
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, Desktop, Mobile",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "price": "0",
      "description": "Software applications with web access, downloads, and installable deployment options"
    },
    "provider": {
      "@type": "Organization",
      "name": "SAPTech Uganda",
      "url": "https://saptechug.com"
    },
    "description": "Collection of innovative software applications, downloadable tools, and web systems developed by SAPTech Uganda for enhanced productivity and business efficiency."
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

      <div className="software-page">
        {/* Page Header */}
        <div className="software-page-header">
          <div className="container">
            <button onClick={() => navigate("/")} className="back-button" aria-label="Back to homepage">
              <i className="fas fa-arrow-left"></i> Back
            </button>
            <h1>Software Apps</h1>
            <p className="software-page-subtitle">
              Explore our portfolio of innovative web applications and digital tools. 
              Access apps in the browser, download installers, or deploy installed tools when your workflow requires it.
            </p>
            <div className="software-page-highlights" aria-label="Software app benefits">
              <span>Browser access</span>
              <span>Downloads available</span>
              <span>Installation support</span>
              <span>Business ready</span>
            </div>
          </div>
        </div>

        <section className="software-search-content" aria-labelledby="software-search-title">
          <div className="container">
            <h2 id="software-search-title">Software solutions for businesses worldwide</h2>
            <p>
              SAPTech Uganda builds reliable digital systems for companies, schools, shops,
              restaurants, startups, and organizations in Uganda, across Africa, and around
              the world. We design browser-based tools and offline installed apps for sales, records, orders, stock,
              learning, reporting, bookings, and team workflows.
            </p>
            <div className="software-search-grid" aria-label="Common software project types">
              <span>Custom business portals</span>
              <span>School records and results</span>
              <span>Inventory and stock control</span>
              <span>Ecommerce platforms</span>
              <span>Restaurant ordering tools</span>
              <span>Learning and training systems</span>
              <span>Booking and scheduling tools</span>
              <span>Reports and dashboards</span>
            </div>
          </div>
        </section>

        {/* Main Software Component */}
        <Softwares />
      </div>
    </>
  );
};

export default SoftwarePage;

