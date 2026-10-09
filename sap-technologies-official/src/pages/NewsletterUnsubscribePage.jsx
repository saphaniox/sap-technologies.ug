import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import apiService from "../services/api";
import "../styles/NewsletterUnsubscribePage.css";

const NewsletterUnsubscribePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState("");

  const handleUnsubscribe = async () => {
    if (!token || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      await apiService.unsubscribeNewsletter(token);
      setIsComplete(true);
    } catch {
      setError("We could not update your preference. Please try again or contact our team.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="newsletter-unsubscribe-page">
      <section className="newsletter-unsubscribe-panel" aria-labelledby="newsletter-unsubscribe-title">
        <img src="/images/logo.png" alt="Saptech Uganda" className="newsletter-unsubscribe-logo" />
        <p className="newsletter-unsubscribe-eyebrow">Newsletter preferences</p>
        <h1 id="newsletter-unsubscribe-title">
          {isComplete ? "You are unsubscribed." : "Manage your email updates."}
        </h1>
        <p className="newsletter-unsubscribe-copy">
          {isComplete
            ? "You will no longer receive Saptech Uganda newsletter updates. This does not affect account, order, or application messages."
            : "Confirm below to stop receiving occasional news and updates from Saptech Uganda. This will not affect account, order, or application messages."}
        </p>

        {!isComplete && !token && (
          <p className="newsletter-unsubscribe-message" role="alert">
            This unsubscribe link is missing its confirmation token. Please use the link in the original email.
          </p>
        )}
        {error && <p className="newsletter-unsubscribe-message" role="alert">{error}</p>}

        {!isComplete && token && (
          <button
            type="button"
            className="newsletter-unsubscribe-button"
            onClick={handleUnsubscribe}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating preference..." : "Unsubscribe from updates"}
          </button>
        )}

        <Link to="/" className="newsletter-unsubscribe-home">Return to Saptech Uganda</Link>
      </section>
    </main>
  );
};

export default NewsletterUnsubscribePage;