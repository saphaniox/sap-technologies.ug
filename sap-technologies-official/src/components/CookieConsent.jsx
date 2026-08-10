import React, { useState, useEffect } from "react";
import "../styles/CookieConsent.css";

const STORAGE_KEY = "saptechug_cookie_consent";

const CookieConsent = ({ onPrivacyPolicyOpen }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Small delay so the banner doesn't pop immediately on first load
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">
      <div className="cookie-content">
        <p className="cookie-text">
          🍪 We use cookies to improve your experience and may use Google services for ads and
          measurement. By continuing to browse, you agree to our use of cookies in accordance with our{" "}
          <button className="cookie-policy-link" onClick={() => onPrivacyPolicyOpen && onPrivacyPolicyOpen()}>Privacy Policy</button>.
        </p>
        <div className="cookie-actions">
          <button className="cookie-btn cookie-accept" onClick={accept}>
            Accept
          </button>
          <button className="cookie-btn cookie-decline" onClick={decline}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
