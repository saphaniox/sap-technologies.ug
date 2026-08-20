import React from "react";
import { Link } from "react-router-dom";
import "../styles/Insights.css";

const insightGuides = [
  {
    title: "How a Ugandan business should plan a website before paying for development",
    summary: "A practical checklist for small businesses, schools, shops, startups, and organizations that want a website that actually supports daily work.",
    sections: [
      {
        heading: "Start with the job the website must do",
        body: "Before choosing colors or pages, write down the main action the website should help visitors take. For one business that may be requesting a quotation; for another it may be viewing products, calling WhatsApp, applying for a job, verifying a certificate, or reading service details. A focused website is easier to build, easier to maintain, and more useful to customers."
      },
      {
        heading: "Prepare real business information",
        body: "Good websites need real content: services, prices or price ranges, location, working hours, photos, contact details, policies, and examples of past work. When this information is missing, the website becomes thin and visitors cannot trust it. We encourage clients to collect these details early so the final site feels complete and human."
      },
      {
        heading: "Plan for maintenance, not just launch day",
        body: "A serious website needs updates, backups, security checks, content changes, and analytics. The best results come when the owner understands who will update products, jobs, gallery photos, service descriptions, and contact information after launch."
      }
    ]
  },
  {
    title: "When custom software is better than spreadsheets",
    summary: "A field guide for deciding when a business management system, inventory tool, school system, or dashboard is worth building.",
    sections: [
      {
        heading: "Look for repeated work",
        body: "If your team repeats the same task every day, such as recording sales, tracking stock, following up clients, printing receipts, managing student records, or preparing reports, software can reduce mistakes and save time. The strongest software projects usually begin with a simple process that is already happening manually."
      },
      {
        heading: "Protect the important data first",
        body: "Businesses often wait until data is lost before investing in a proper system. A custom system can add user accounts, permissions, backups, audit logs, and reports. These features matter when several people handle money, inventory, documents, certificates, applications, or customer records."
      },
      {
        heading: "Build in stages",
        body: "Not every organization needs a large system immediately. A practical first version may cover login, records, search, reports, and notifications. More advanced features such as payments, mobile apps, analytics, and integrations can come later after the workflow is clear."
      }
    ]
  },
  {
    title: "IoT and automation ideas that make sense for local organizations",
    summary: "Useful ways connected devices, sensors, dashboards, and alerts can support homes, schools, farms, offices, and small industries.",
    sections: [
      {
        heading: "Measure something important",
        body: "The best IoT projects begin with a clear measurement: power usage, water level, room access, temperature, soil moisture, machine status, battery voltage, or movement. Once the measurement is reliable, alerts and dashboards become useful instead of decorative."
      },
      {
        heading: "Design for local conditions",
        body: "Systems in Uganda must consider power stability, internet availability, dust, heat, installation safety, and maintenance. A solution that works in a demo may fail in the field if the enclosure, wiring, backup power, and support plan are ignored."
      },
      {
        heading: "Connect hardware to decisions",
        body: "IoT becomes valuable when someone can act on the data. A school may need security alerts, a farm may need irrigation decisions, a shop may need energy monitoring, and a home may need safer access control. The dashboard should explain what happened, where it happened, and what should happen next."
      }
    ]
  }
];

const qualitySignals = [
  "Clear service descriptions written for real customers",
  "Visible contact details and physical business location",
  "Original project explanations instead of copied text",
  "Privacy policy, terms of service, ads.txt, and a crawlable sitemap",
  "Pages that remain useful even when a product or job list is empty"
];

const Insights = () => (
  <section className="insights-page">
    <div className="insights-hero">
      <span className="insights-eyebrow">SAPTech Uganda insights</span>
      <h1>Practical engineering and technology guidance for growing teams</h1>
      <p>
        We publish these notes to help business owners, schools, shops, startups, and organizations make better
        technology decisions before they spend money. The guidance comes from the same work we do every day:
        websites, software systems, IoT projects, electrical designs, branding, and digital operations.
      </p>
      <div className="insights-actions">
        <Link to="/services">Explore our services</Link>
        <Link to="/contact" className="secondary">Talk to SAPTech Uganda</Link>
      </div>
    </div>

    <div className="insights-grid" aria-label="Technology guidance articles">
      {insightGuides.map((guide) => (
        <article className="insight-card" key={guide.title}>
          <h2>{guide.title}</h2>
          <p className="insight-summary">{guide.summary}</p>
          <div className="insight-sections">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      ))}
    </div>

    <aside className="adsense-readiness-card">
      <div>
        <span className="insights-eyebrow">Quality checklist</span>
        <h2>How we keep our pages useful</h2>
        <p>
          A useful website should give visitors enough context to decide whether to trust the business. These are
          the standards we maintain across SAPTech Uganda so real people can understand what we offer, how we work,
          and how to contact us before starting a project.
        </p>
      </div>
      <ul>
        {qualitySignals.map((signal) => (
          <li key={signal}>{signal}</li>
        ))}
      </ul>
    </aside>
  </section>
);

export default Insights;
