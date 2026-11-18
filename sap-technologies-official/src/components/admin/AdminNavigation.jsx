export default function AdminNavigation({
  activeTab,
  setActiveTab,
  setSidebarOpen,
  dashboardStats,
  partners,
  partnershipRequests,
  galleryItems,
  jobs,
  jobApplications,
  products,
  productInquiries,
  serviceQuotes
}) {
  return <><nav className="sidebar-nav" aria-label="Admin sections">
              <button className={`nav-btn ${activeTab === "overview" ? "active" : ""}`} onClick={() => {
        setActiveTab("overview");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCCA"}</span>
                <span>Overview</span>
              </button>
              <button className={`nav-btn ${activeTab === "operations" ? "active" : ""}`} onClick={() => {
        setActiveTab("operations");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDDA5\uFE0F"}</span>
                <span>Operations</span>
              </button>
              <button className={`nav-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => {
        setActiveTab("users");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDC65"}</span>
                <span>Users ({dashboardStats?.stats?.totalUsers || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "contacts" ? "active" : ""}`} onClick={() => {
        setActiveTab("contacts");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE7"}</span>
                <span>Contacts ({dashboardStats?.stats?.totalContacts || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "newsletters" ? "active" : ""}`} onClick={() => {
        setActiveTab("newsletters");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCF0"}</span>
                <span>Newsletter ({dashboardStats?.stats?.totalNewsletterSubscribers || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "emails" ? "active" : ""}`} onClick={() => {
        setActiveTab("emails");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\u2709\uFE0F"}</span>
                <span>Emails</span>
              </button>
              <button className={`nav-btn ${activeTab === "services" ? "active" : ""}`} onClick={() => {
        setActiveTab("services");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDEE0\uFE0F"}</span>
                <span>Services ({dashboardStats?.stats?.totalServices || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "projects" ? "active" : ""}`} onClick={() => {
        setActiveTab("projects");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDE80"}</span>
                <span>Projects ({dashboardStats?.stats?.totalProjects || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "partners" ? "active" : ""}`} onClick={() => {
        setActiveTab("partners");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83E\uDD1D"}</span>
                <span>Partners ({dashboardStats?.stats?.totalPartners || partners.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "partnership-requests" ? "active" : ""}`} onClick={() => {
        setActiveTab("partnership-requests");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCDD"}</span>
                <span>Partnership Requests ({dashboardStats?.stats?.totalPartnershipRequests || partnershipRequests.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "gallery" ? "active" : ""}`} onClick={() => {
        setActiveTab("gallery");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDDBC\uFE0F"}</span>
                <span>Gallery ({dashboardStats?.stats?.totalGalleryItems || galleryItems.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "jobs" ? "active" : ""}`} onClick={() => {
        setActiveTab("jobs");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCBC"}</span>
                <span>Careers ({dashboardStats?.stats?.totalJobs || jobs.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "job-applications" ? "active" : ""}`} onClick={() => {
        setActiveTab("job-applications");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE8"}</span>
                <span>Job Applications ({dashboardStats?.stats?.totalJobApplications || jobApplications.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "products" ? "active" : ""}`} onClick={() => {
        setActiveTab("products");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE6"}</span>
                <span>Products ({dashboardStats?.stats?.totalProducts || products.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "product-inquiries" ? "active" : ""}`} onClick={() => {
        setActiveTab("product-inquiries");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCE8"}</span>
                <span>Product Inquiries ({dashboardStats?.stats?.totalProductInquiries || productInquiries.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "service-quotes" ? "active" : ""}`} onClick={() => {
        setActiveTab("service-quotes");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCBC"}</span>
                <span>Service Quotes ({dashboardStats?.stats?.totalServiceQuotes || serviceQuotes.length || 0})</span>
              </button>
              <button className={`nav-btn ${activeTab === "awards" ? "active" : ""}`} onClick={() => {
        setActiveTab("awards");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83C\uDFC6"}</span>
                <span>SAPTECH Awards 2026</span>
              </button>
              <button className={`nav-btn ${activeTab === "analytics" ? "active" : ""}`} onClick={() => {
        setActiveTab("analytics");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\uD83D\uDCCA"}</span>
                <span>Visitor Analytics</span>
              </button>
              <button className={`nav-btn ${activeTab === "settings" ? "active" : ""}`} onClick={() => {
        setActiveTab("settings");
        setSidebarOpen(false);
      }}>
                <span className="nav-icon" aria-hidden="true">{"\u2699\uFE0F"}</span>
                <span>Settings</span>
              </button>
            </nav></>;
}
