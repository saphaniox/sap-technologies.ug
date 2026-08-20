import React, { useState, useEffect, lazy, Suspense, useCallback, useMemo } from "react";
import { Navigate, Routes, Route, useLocation, useNavigate, useParams } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Slider from "./components/Slider";
import About from "./components/About";
import AuthModal from "./components/AuthModal";
import BackToTop from "./components/BackToTop";
import NotFound from "./components/NotFound";
import WhatsAppButton from "./components/WhatsAppButton";
import CookieConsent from "./components/CookieConsent";
import PhotoLightbox from "./components/PhotoLightbox";
import GoogleAdSense from "./components/GoogleAdSense";
import SEO from "./components/SEO";
import { CartProvider, useCart } from "./contexts/CartContext";
import Cart from "./components/Cart";
import apiService from "./services/api";
import keepAliveService from "./services/keepAliveService";
import { initializeAnimations } from "./utils/animations";

// Below-fold sections — lazy-loaded so initial bundle stays lean
const Services = lazy(() => import("./components/Services"));
const Portfolio = lazy(() => import("./components/Portfolio"));
const Partners = lazy(() => import("./components/Partners"));
const Companies = lazy(() => import("./components/Companies"));
const Products = lazy(() => import("./components/Products"));
const Contact = lazy(() => import("./components/Contact"));
const Footer = lazy(() => import("./components/Footer"));
const Testimonials = lazy(() => import("./components/Testimonials"));
const Insights = lazy(() => import("./components/Insights"));
import { microAnimationStyles } from "./utils/microAnimations.jsx";
import { useVisitorTracking } from "./hooks/useVisitorTracking";
import "./styles/App.css";
import "./styles/ErrorBoundary.css";
import "./styles/theme-complete.css";

const SITE_URL = "https://saptechug.com";

const CORE_SEARCH_TERMS = [
  "SAPTech Uganda",
  "technology company Uganda",
  "IT services Kampala",
  "web design Uganda",
  "website development Kampala",
  "custom software Uganda",
  "mobile app development Uganda",
  "IoT projects Uganda",
  "smart home systems Uganda",
  "security systems Uganda",
  "electrical engineering Uganda",
  "electronics design Uganda",
  "lithium battery solutions Uganda",
  "graphics design Uganda",
  "logo design Uganda",
  "cloud services Uganda",
  "cybersecurity Uganda",
  "digital transformation Uganda"
].join(", ");

const SECTION_ROUTE_MAP = {
  "/": "home",
  "/about": "about",
  "/services": "services",
  "/portfolio": "portfolio",
  "/products": "products",
  "/partners": "partners",
  "/companies": "companies",
  "/testimonials": "testimonials",
  "/contact": "contact"
};

const SECTION_ROUTES = Object.keys(SECTION_ROUTE_MAP);

const SECTION_SEO = {
  home: {
    path: "/",
    title: "SAPTech Uganda | Engineering & Technology Solutions",
    description: "SAPTech Uganda builds practical websites, software, IoT systems, electrical designs, branding, cloud, cybersecurity, and power solutions for businesses, schools, startups, homes, and organizations.",
    keywords: `${CORE_SEARCH_TERMS}, engineering and technology solutions`,
    topics: ["Web design", "Software development", "IoT projects", "Electrical engineering", "Power solutions"]
  },
  about: {
    path: "/about",
    title: "About SAPTech Uganda | Engineering & Technology Team",
    description: "Learn about SAPTech Uganda, a Ndejje, Kampala technology and engineering team building websites, software, IoT systems, electrical designs, branding, and digital tools for businesses and communities.",
    keywords: `${CORE_SEARCH_TERMS}, about SAPTech Uganda, technology team Uganda, engineering company Kampala, software team Kampala, Ndejje Kampala technology`,
    topics: ["Technology team", "Engineering company", "Software team", "Kampala business technology"]
  },
  services: {
    path: "/services",
    title: "Services | Web, Software, IoT & Engineering",
    description: "Explore SAPTech Uganda services for local and international clients: website design, ecommerce sites, custom software, mobile apps, cloud, cybersecurity, IoT automation, smart homes, security systems, electrical designs, lithium battery power, graphics, and branding.",
    keywords: `${CORE_SEARCH_TERMS}, ecommerce website Uganda, business website Uganda, software solutions Uganda, IoT services Uganda, Arduino projects Uganda, Raspberry Pi projects Uganda, ESP32 projects Uganda, circuit design Uganda`,
    topics: ["Website design", "Ecommerce development", "Custom software", "IoT automation", "Electrical designs", "Branding"]
  },
  portfolio: {
    path: "/portfolio",
    title: "Projects & Portfolio | SAPTech Uganda",
    description: "View SAPTech Uganda projects including ecommerce platforms, business websites, school management systems, inventory systems, restaurant ordering apps, IoT dashboards, mobile apps, and branding work.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda projects, technology portfolio Uganda, software projects Kampala, ecommerce platform Uganda, school management system Uganda, inventory management system Uganda`,
    topics: ["Ecommerce platforms", "Business websites", "School management systems", "Inventory management", "IoT dashboards"]
  },
  products: {
    path: "/products",
    title: "Technology Products | SAPTech Uganda",
    description: "Browse SAPTech Uganda technology products, electronics, software tools, power solutions, IoT devices, and digital business systems available for order or custom build.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda products, technology products Uganda, electronics products Uganda, software products Uganda, IoT devices Uganda, power solutions Uganda`,
    topics: ["Technology products", "Electronics", "IoT devices", "Power solutions", "Software products"]
  },
  partners: {
    path: "/partners",
    title: "Partners | SAPTech Uganda",
    description: "Meet SAPTech Uganda partners and collaborators supporting technology, engineering, software, IoT, electronics, education, and digital business growth in Uganda.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda partners, technology partners Uganda, engineering partners Uganda, business partners Kampala`,
    topics: ["Technology partners", "Engineering partners", "Business collaboration", "Digital growth"]
  },
  companies: {
    path: "/companies",
    title: "Platforms & Companies | SAPTech Uganda",
    description: "Explore SAPTech Uganda platforms, connected companies, and technology initiatives across software, engineering, IoT, products, education, and digital services.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda platforms, SAPTech companies, Uganda technology platforms, digital platforms Uganda`,
    topics: ["Technology platforms", "Digital services", "Software initiatives", "Engineering initiatives"]
  },
  testimonials: {
    path: "/testimonials",
    title: "Testimonials | SAPTech Uganda",
    description: "Read client feedback and testimonials from people and organizations working with SAPTech Uganda on websites, software, engineering, IoT, products, and digital projects.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda testimonials, SAPTech reviews, technology company reviews Uganda, software company reviews Kampala`,
    topics: ["Client testimonials", "Technology reviews", "Software project feedback", "Engineering project feedback"]
  },
  contact: {
    path: "/contact",
    title: "Contact SAPTech Uganda",
    description: "Contact SAPTech Uganda in Ndejje, Kampala for web design, software development, mobile apps, IoT systems, electrical engineering, graphics, cloud, cybersecurity, power solutions, and digital transformation projects.",
    keywords: `${CORE_SEARCH_TERMS}, contact SAPTech Uganda, SAPTech Kampala, Ndejje Kampala technology, software developer Uganda contact, website designer Kampala contact, IoT engineer Uganda contact`,
    topics: ["Contact SAPTech Uganda", "Software project inquiry", "Website project inquiry", "IoT project inquiry", "Engineering project inquiry"]
  }
};

const SECONDARY_PAGE_SEO = {
  insights: {
    title: "Insights | Practical Technology Guides from SAPTech Uganda",
    description: "Read practical SAPTech Uganda guides on planning websites, choosing custom software, using IoT systems, and making better engineering and technology decisions for real organizations.",
    keywords: `${CORE_SEARCH_TERMS}, technology guides Uganda, website planning Uganda, custom software advice Uganda, IoT automation advice, digital transformation guidance`,
    path: "/insights",
    topics: ["Technology guides", "Website planning", "Custom software", "IoT automation", "Digital operations"]
  },
  careers: {
    title: "Careers | Join SAPTech Uganda",
    description: "Explore open career opportunities at SAPTech Uganda and apply to join a team building websites, software, IoT systems, engineering solutions, and digital tools.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda careers, technology jobs Uganda, software jobs Kampala, engineering jobs Uganda`,
    path: "/careers"
  },
  gallery: {
    title: "Gallery | SAPTech Uganda Projects, Services & Team",
    description: "View photos from SAPTech Uganda projects, services, events, team moments, office work, and technology activities across software, IoT, design, and engineering.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Uganda gallery, SAPTech photos, technology projects Uganda, engineering project photos`,
    path: "/gallery"
  },
  awards: {
    title: "SAPTech Awards 2026 | SAPTech Uganda",
    description: "Explore SAPTech Awards 2026 nominations, categories, votes, and technology excellence recognition from SAPTech Uganda.",
    keywords: `${CORE_SEARCH_TERMS}, SAPTech Awards 2026, SAPTech Uganda awards, technology awards Uganda, engineering awards Uganda`,
    path: "/awards"
  }
};

const buildSectionStructuredData = ({ path, title, description, topics = [] }) => {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  const breadcrumbItems = [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": `${SITE_URL}/`
    }
  ];

  if (path !== "/") {
    breadcrumbItems.push({
      "@type": "ListItem",
      "position": 2,
      "name": title.split("|")[0].trim(),
      "item": url
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        "url": url,
        "name": title,
        "description": description,
        "isPartOf": {
          "@id": `${SITE_URL}/#website`
        },
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        },
        "inLanguage": "en-UG",
        "about": topics.map((name) => ({
          "@type": "Thing",
          "name": name
        }))
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        "itemListElement": breadcrumbItems
      }
    ]
  };
};

const normalizePath = (pathname) => {
  const cleanPath = pathname.replace(/\/+$/, "");
  return cleanPath || "/";
};

const getSectionIdFromPath = (pathname) => SECTION_ROUTE_MAP[normalizePath(pathname)];

// Secondary pages and modals — lazy-loaded so they don't bloat the initial bundle
const CertificateVerify = lazy(() => import("./pages/CertificateVerify"));
const SoftwarePage = lazy(() => import("./pages/SoftwarePage"));
const IoTPage = lazy(() => import("./pages/IoTPage"));
const Careers = lazy(() => import("./pages/Careers"));
const Gallery = lazy(() => import("./components/Gallery"));
const Awards = lazy(() => import("./components/Awards"));
const ForgotPassword = lazy(() => import("./components/ForgotPassword"));
const Account = lazy(() => import("./components/Account"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./components/TermsOfService"));

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Enable visitor tracking
  useVisitorTracking();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Persist page visibility across refreshes
  const [showAccount, setShowAccount] = useState(() => {
    return localStorage.getItem("showAccount") === "true";
  });
  const [showAdmin, setShowAdmin] = useState(() => {
    return localStorage.getItem("showAdmin") === "true";
  });
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(() => {
    return localStorage.getItem("showPrivacyPolicy") === "true";
  });
  const [showTermsOfService, setShowTermsOfService] = useState(() => {
    return localStorage.getItem("showTermsOfService") === "true";
  });
  const legalPageOpen = showPrivacyPolicy || showTermsOfService;
  const currentSectionId = getSectionIdFromPath(location.pathname);
  const currentSectionSeo = SECTION_SEO[currentSectionId] || SECTION_SEO.home;
  const currentSectionUrl = `${SITE_URL}${currentSectionSeo.path === "/" ? "/" : currentSectionSeo.path}`;
  const currentSectionStructuredData = useMemo(
    () => buildSectionStructuredData(currentSectionSeo),
    [currentSectionSeo]
  );

  useEffect(() => {
    // Start keep-alive service to prevent server from sleeping
    keepAliveService.start();
    
    // Also do an immediate wake-up call
    apiService.wakeUpServer();
    
    checkAuthStatus();
    initializeAnimations();
    
    localStorage.removeItem("showAwards");
    
    const styleElement = document.createElement("style");
    styleElement.textContent = microAnimationStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
      // Stop keep-alive service when app unmounts
      keepAliveService.stop();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authStatus = await apiService.checkAuthStatus();
      
      if (authStatus.isAuthenticated && authStatus.user) {
        setIsAuthenticated(true);
        setUserName(authStatus.user.name || "");
        setUserDetails(authStatus.user);
      } else {
        setIsAuthenticated(false);
        setUserName("");
        setUserDetails(null);
      }
    } catch (error) {
      console.error("Error checking authentication status:", error);
      setIsAuthenticated(false);
      setUserName("");
      setUserDetails(null);
    }
  };

  const handleAuthModalOpen = (mode) => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleAuthModalClose = () => {
    setAuthModal({ isOpen: false, mode: "login" });
  };

  const handleAuthModeSwitch = (newMode) => {
    if (newMode === "forgotPassword") {
      setAuthModal({ isOpen: false, mode: "login" });
      setShowForgotPassword(true);
    } else {
      setAuthModal({ isOpen: true, mode: newMode });
    }
  };

  const handleAuthSuccess = (data) => {
    setIsAuthenticated(true);
    // Extract user data from login response
    if (data.data) {
      setUserName(data.data.name || "");
      setUserDetails(data.data.user);
    } else {
      // Fallback for older response format
      setUserName(data.name || "");
      checkAuthStatus();
    }
  };

  const clearPanelState = () => {
    setShowAccount(false);
    setShowAdmin(false);
    localStorage.removeItem("showAccount");
    localStorage.removeItem("showAdmin");
    localStorage.removeItem("showPrivacyPolicy");
    localStorage.removeItem("showTermsOfService");
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      apiService.clearCache();
    } catch {
      apiService.clearCache();
    } finally {
      setIsAuthenticated(false);
      setUserName("");
      setUserDetails(null);
      clearPanelState();
    }
  };

  const handleAccountOpen = () => {
    setShowAccount(true);
    localStorage.setItem("showAccount", "true");
  };

  const handleAccountClose = () => {
    setShowAccount(false);
    localStorage.removeItem("showAccount");
  };

  const handleAdminOpen = () => {
    setShowAdmin(true);
    localStorage.setItem("showAdmin", "true");
  };

  const handleAdminClose = () => {
    setShowAdmin(false);
    localStorage.removeItem("showAdmin");
  };

  const handlePrivacyPolicyOpen = () => {
    setShowPrivacyPolicy(true);
    localStorage.setItem("showPrivacyPolicy", "true");
  };

  const handlePrivacyPolicyClose = () => {
    setShowPrivacyPolicy(false);
    localStorage.removeItem("showPrivacyPolicy");
  };

  const handleTermsOfServiceOpen = () => {
    setShowTermsOfService(true);
    localStorage.setItem("showTermsOfService", "true");
  };

  const handleTermsOfServiceClose = () => {
    setShowTermsOfService(false);
    localStorage.removeItem("showTermsOfService");
  };

  const scrollToMainSection = useCallback((sectionId, attempt = 0) => {
    if (!sectionId || sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (attempt < 18) {
      window.setTimeout(() => scrollToMainSection(sectionId, attempt + 1), 120);
    }
  }, []);

  useEffect(() => {
    const hashSectionId = location.hash
      ? decodeURIComponent(location.hash.replace("#", ""))
      : "";
    const routeSectionId = getSectionIdFromPath(location.pathname);
    const targetSectionId = hashSectionId || routeSectionId;

    if (!targetSectionId) {
      window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 0);
      return;
    }

    window.setTimeout(() => scrollToMainSection(targetSectionId), 140);
  }, [location.hash, location.pathname, location.search, scrollToMainSection]);

  const handleSiteNavigation = (sectionId) => {
    setShowPrivacyPolicy(false);
    setShowTermsOfService(false);
    localStorage.removeItem("showPrivacyPolicy");
    localStorage.removeItem("showTermsOfService");

    if (!sectionId) return;

    if (sectionId === "home") {
      if (location.pathname !== "/") {
        navigate("/");
      }
      window.setTimeout(() => scrollToMainSection("home"), 120);
      return;
    }

    if (location.pathname !== "/") {
      navigate({ pathname: "/", hash: `#${sectionId}` });
    } else {
      navigate({ pathname: "/", hash: `#${sectionId}` });
      window.setTimeout(() => scrollToMainSection(sectionId), 80);
    }
  };

  const renderHeader = () => (
    <Header
      key={`header-${isAuthenticated ? "auth" : "guest"}`}
      isAuthenticated={isAuthenticated}
      userName={userName}
      userRole={userDetails?.role}
      userProfilePic={userDetails?.profilePic}
      onAuthModalOpen={handleAuthModalOpen}
      onAccountOpen={handleAccountOpen}
      onAdminOpen={handleAdminOpen}
      onLogout={handleLogout}
      onNavigate={handleSiteNavigation}
      legalOpen={legalPageOpen}
    />
  );

  const renderFooter = () => (
    <Suspense fallback={null}>
      <Footer onNavigate={handleSiteNavigation} />
    </Suspense>
  );

  const renderSharedSiteTools = () => (
    <>
      <BackToTop />
      <WhatsAppButton />
      <CookieConsent onPrivacyPolicyOpen={handlePrivacyPolicyOpen} />
      <PhotoLightbox />
      <Cart />
      <CartFloatButton />

      <AuthModal
        isOpen={authModal.isOpen}
        mode={authModal.mode}
        onClose={handleAuthModalClose}
        onAuthSuccess={handleAuthSuccess}
        onModeSwitch={handleAuthModeSwitch}
      />

      <ForgotPassword
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />

      {showAccount && (
        <Account
          onClose={handleAccountClose}
        />
      )}

      {showAdmin && (
        <AdminDashboard
          user={userDetails}
          onClose={handleAdminClose}
        />
      )}

      {showPrivacyPolicy && (
        <PrivacyPolicy
          onClose={handlePrivacyPolicyClose}
          onNavigate={handleSiteNavigation}
          onTermsOfServiceOpen={handleTermsOfServiceOpen}
        />
      )}

      {showTermsOfService && (
        <TermsOfService
          onClose={handleTermsOfServiceClose}
          onNavigate={handleSiteNavigation}
          onPrivacyPolicyOpen={handlePrivacyPolicyOpen}
        />
      )}
    </>
  );

  const renderHomePage = () => (
    <>
      <SEO
        title={currentSectionSeo.title}
        description={currentSectionSeo.description}
        keywords={currentSectionSeo.keywords}
        canonicalUrl={currentSectionUrl}
        url={currentSectionUrl}
        ogImage="/images/logo.png"
        structuredData={currentSectionStructuredData}
      />
      {renderHeader()}

      <main>
        <Hero />
        <Slider />
        <About />
        <Suspense fallback={null}>
          <Services />
          <Portfolio />
          <Partners />
          <Companies />
          <Products />
          <Testimonials />
          <Contact />
        </Suspense>
      </main>

      {renderFooter()}
      {renderSharedSiteTools()}
    </>
  );

  const renderPublicPage = (children) => (
    <>
      {renderHeader()}
      <main className="route-page-shell">
        {children}
      </main>
      {renderFooter()}
      {renderSharedSiteTools()}
    </>
  );

  return (
    <ErrorBoundary>
      <CartProvider>
      <div className="App">
        <GoogleAdSense />
        <Suspense fallback={null}>
        <Routes>
          <Route path="/verify/:certificateId" element={<CertificateVerify />} />
          <Route path="/software" element={renderPublicPage(<SoftwarePage />)} />
          <Route path="/iot" element={renderPublicPage(<IoTPage />)} />
          <Route path="/careers" element={renderPublicPage(
            <>
              <SEO
                title={SECONDARY_PAGE_SEO.careers.title}
                description={SECONDARY_PAGE_SEO.careers.description}
                keywords={SECONDARY_PAGE_SEO.careers.keywords}
                canonicalUrl={`${SITE_URL}${SECONDARY_PAGE_SEO.careers.path}`}
                url={`${SITE_URL}${SECONDARY_PAGE_SEO.careers.path}`}
                ogImage="/images/logo.png"
              />
              <Careers />
            </>
          )} />
          <Route path="/careers/:jobId" element={renderPublicPage(
            <>
              <SEO
                title={SECONDARY_PAGE_SEO.careers.title}
                description={SECONDARY_PAGE_SEO.careers.description}
                keywords={SECONDARY_PAGE_SEO.careers.keywords}
                canonicalUrl={`${SITE_URL}${SECONDARY_PAGE_SEO.careers.path}`}
                url={`${SITE_URL}${SECONDARY_PAGE_SEO.careers.path}`}
                ogImage="/images/logo.png"
              />
              <Careers />
            </>
          )} />
          <Route path="/gallery" element={renderPublicPage(
            <>
              <SEO
                title={SECONDARY_PAGE_SEO.gallery.title}
                description={SECONDARY_PAGE_SEO.gallery.description}
                keywords={SECONDARY_PAGE_SEO.gallery.keywords}
                canonicalUrl={`${SITE_URL}${SECONDARY_PAGE_SEO.gallery.path}`}
                url={`${SITE_URL}${SECONDARY_PAGE_SEO.gallery.path}`}
                ogImage="/images/logo.png"
              />
              <Gallery />
            </>
          )} />
          <Route path="/insights" element={renderPublicPage(
            <>
              <SEO
                title={SECONDARY_PAGE_SEO.insights.title}
                description={SECONDARY_PAGE_SEO.insights.description}
                keywords={SECONDARY_PAGE_SEO.insights.keywords}
                canonicalUrl={`${SITE_URL}${SECONDARY_PAGE_SEO.insights.path}`}
                url={`${SITE_URL}${SECONDARY_PAGE_SEO.insights.path}`}
                ogImage="/images/logo.png"
                structuredData={buildSectionStructuredData(SECONDARY_PAGE_SEO.insights)}
              />
              <Insights />
            </>
          )} />
          <Route path="/awards" element={renderPublicPage(
            <>
              <SEO
                title={SECONDARY_PAGE_SEO.awards.title}
                description={SECONDARY_PAGE_SEO.awards.description}
                keywords={SECONDARY_PAGE_SEO.awards.keywords}
                canonicalUrl={`${SITE_URL}${SECONDARY_PAGE_SEO.awards.path}`}
                url={`${SITE_URL}${SECONDARY_PAGE_SEO.awards.path}`}
                ogImage="/images/logo.png"
              />
              <Awards onClose={() => navigate("/")} showStandaloneChrome={false} />
            </>
          )} />
          <Route path="/privacy-policy" element={
            <>
              <SEO
                title="Privacy Policy | SAPTech Uganda"
                description="Read the SAPTech Uganda privacy policy, including how we handle contact information, cookies, analytics, Google AdSense advertising, and user data."
                keywords="SAPTech Uganda privacy policy, SAPTech cookies, SAPTech AdSense privacy, Uganda technology company privacy policy"
                canonicalUrl={`${SITE_URL}/privacy-policy`}
                url={`${SITE_URL}/privacy-policy`}
                ogImage="/images/logo.png"
              />
              <PrivacyPolicy
                onClose={() => navigate("/")}
                onNavigate={handleSiteNavigation}
                onTermsOfServiceOpen={() => navigate("/terms-of-service")}
              />
            </>
          } />
          <Route path="/terms-of-service" element={
            <>
              <SEO
                title="Terms of Service | SAPTech Uganda"
                description="Read SAPTech Uganda terms of service for website use, technology services, software projects, engineering work, payments, intellectual property, and support."
                keywords="SAPTech Uganda terms of service, SAPTech service terms, software project terms Uganda, technology services terms"
                canonicalUrl={`${SITE_URL}/terms-of-service`}
                url={`${SITE_URL}/terms-of-service`}
                ogImage="/images/logo.png"
              />
              <TermsOfService
                onClose={() => navigate("/")}
                onNavigate={handleSiteNavigation}
                onPrivacyPolicyOpen={() => navigate("/privacy-policy")}
              />
            </>
          } />
          <Route path="/jobs/:jobId" element={<JobShareRedirect />} />
          {SECTION_ROUTES.map((path) => (
            <Route key={path} path={path} element={renderHomePage()} />
          ))}
          <Route path="*" element={renderPublicPage(<NotFound />)} />
        </Routes>
        </Suspense>
      </div>
      </CartProvider>
    </ErrorBoundary>
  );
}

function JobShareRedirect() {
  const { jobId } = useParams();
  return <Navigate to={`/careers/${jobId}`} replace />;
}

function CartFloatButton() {
  const { cartCount, openCart } = useCart();
  if (cartCount === 0) return null;
  return (
    <button
      className="cart-float-btn"
      onClick={openCart}
      aria-label={`Open cart, ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
      title="View cart"
    >
      🛒
      <span className="cart-float-badge">{cartCount}</span>
    </button>
  );
}

export default App;
