// Main App component - this is the heart of our React application
// It handles user authentication, page navigation, and renders all the main components
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Header from "./components/Header";
import CertificateVerify from "./pages/CertificateVerify";
import Hero from "./components/Hero";
import Slider from "./components/Slider";
import About from "./components/About";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Partners from "./components/Partners";
import Companies from "./components/Companies";
import Products from "./components/Products";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import ForgotPassword from "./components/ForgotPassword";
import Account from "./components/Account";
import AdminDashboard from "./components/AdminDashboard";
import Awards from "./components/Awards";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfService from "./components/TermsOfService";
import BackToTop from "./components/BackToTop";
import apiService from "./services/api";
import { initializeAnimations } from "./utils/animations";
import { microAnimationStyles } from "./utils/microAnimations.jsx";
import "./styles/App.css";
import "./styles/ErrorBoundary.css";

function App() {
  // Authentication state - tracks if user is logged in and their basic info
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  
  // Modal state for login/signup popup
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: "login" });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Page/component visibility states - we use localStorage to remember user preferences
  // This way if they refresh the page, they stay on the same section
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
  const [showAwards, setShowAwards] = useState(() => {
    return localStorage.getItem("showAwards") === "true";
  });

  // Initialize the app - check if user is already logged in and set up animations
  useEffect(() => {
    checkAuthStatus(); // See if user has a valid session
    initializeAnimations(); // Start up our page animations
    
    // Inject micro-animation styles
    const styleElement = document.createElement("style");
    styleElement.textContent = microAnimationStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
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
        // User not authenticated - this is normal, no error
        setIsAuthenticated(false);
        setUserName("");
        setUserDetails(null);
      }
    } catch (error) {
      // Only log actual errors (not authentication issues)
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

  const handleLogout = async () => {
    try {
      await apiService.logout();
      setIsAuthenticated(false);
      setUserName("");
      setUserDetails(null);
      setShowAccount(false); // Close account modal on logout
      setShowAdmin(false); // Close admin modal on logout
      // Clear localStorage
      localStorage.removeItem("showAccount");
      localStorage.removeItem("showAdmin");
      localStorage.removeItem("showPrivacyPolicy");
      localStorage.removeItem("showTermsOfService");
      localStorage.removeItem("showAwards");
    } catch (error) {
      console.error("Logout error:", error);
      // Force logout on client side even if server request fails
      setIsAuthenticated(false);
      setUserName("");
      setUserDetails(null);
      setShowAccount(false);
      setShowAdmin(false);
      // Clear localStorage
      localStorage.removeItem("showAccount");
      localStorage.removeItem("showAdmin");
      localStorage.removeItem("showPrivacyPolicy");
      localStorage.removeItem("showTermsOfService");
      localStorage.removeItem("showAwards");
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

  const handleAwardsOpen = () => {
    setShowAwards(true);
    localStorage.setItem("showAwards", "true");
  };

  const handleAwardsClose = () => {
    setShowAwards(false);
    localStorage.removeItem("showAwards");
  };

  return (
    <ErrorBoundary>
      <div className="App">
        <Routes>
          {/* Certificate Verification Page - Public Route */}
          <Route path="/verify/:certificateId" element={<CertificateVerify />} />
          
          {/* Main Application - Default Route */}
          <Route path="/*" element={
            <>
              <Header 
                isAuthenticated={isAuthenticated}
                userName={userName}
                userRole={userDetails?.role}
                onAuthModalOpen={handleAuthModalOpen}
                onAccountOpen={handleAccountOpen}
                onAdminOpen={handleAdminOpen}
                onAwardsOpen={handleAwardsOpen}
                onLogout={handleLogout}
              />
              
              <main>
                <Hero />
                <Slider />
                <About />
                <Services />
                <Portfolio />
                <Partners />
                <Companies />
                <Products />
                <Contact />
              </main>
              
              <Footer 
                onPrivacyPolicyOpen={handlePrivacyPolicyOpen}
                onTermsOfServiceOpen={handleTermsOfServiceOpen}
                onNavigate={null} // Main page handles navigation internally
              />
              <BackToTop />
              
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
                />
              )}

              {showTermsOfService && (
                <TermsOfService 
                  onClose={handleTermsOfServiceClose}
                />
              )}

              {showAwards && (
                <Awards 
                  onClose={handleAwardsClose}
                />
              )}
            </>
          } />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;
