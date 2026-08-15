import React, { useState } from "react";
import apiService from "../services/api";
import { showAlert, LoadingButton } from "../utils/alerts.jsx";
import "../styles/AuthModal.css";

const AuthModal = ({ isOpen, mode, onClose, onAuthSuccess, onModeSwitch }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: ""
  });
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isLogin = mode === "login";
  const title = isLogin ? "Welcome back" : "Create your account";
  const subtitle = isLogin
    ? "Sign in to manage orders, applications, admin tools, and SAPTech services."
    : "Join SAPTech Uganda and keep your requests, applications, and updates in one secure place.";

  const handleChange = (event) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", phone: "" });
    setMessage("");
    setShowPassword(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      let result;

      if (isLogin) {
        result = await apiService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        const signupData = {
          name: formData.name,
          email: formData.email,
          password: formData.password
        };

        const phone = formData.phone.trim();
        if (phone) signupData.phone = phone;

        result = await apiService.signup(signupData);
      }

      await showAlert.success(
        isLogin ? "You're in!" : "Welcome to SAPTech!",
        isLogin
          ? "Great to have you back. Taking you to your account now."
          : "Your account is ready. Taking you to your account now.",
        {
          timer: 2000,
          confirmButtonText: isLogin ? "Let's go" : "Continue"
        }
      );

      onAuthSuccess(result);
      onClose();
      resetForm();
    } catch (error) {
      const errorMessage = error.message || `We hit a snag ${isLogin ? "signing you in" : "creating your account"}. Double-check your details and give it another go.`;

      await showAlert.error(
        isLogin ? "Hmm, that didn't work" : "Couldn't create your account",
        errorMessage,
        { confirmButtonText: "Try Again" }
      );

      setMessage(errorMessage);
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  const handleModeSwitch = (nextMode) => {
    setMessage("");
    if (onModeSwitch) onModeSwitch(nextMode);
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className={`auth-card ${isLogin ? "auth-card-login" : "auth-card-signup"}`}>
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close authentication modal">
          &times;
        </button>

        <aside className="auth-brand-panel">
          <div className="auth-logo-wrap">
            <img src="/images/logo.png" alt="SAPTech Uganda logo" />
          </div>
          <span className="auth-badge">Secure SAPTech access</span>
          <h1>{isLogin ? "Continue your digital journey." : "Start with a trusted tech partner."}</h1>
          <p>
            Access your SAPTech Uganda account, track submitted requests, and keep communication with our team organized.
          </p>

          <div className="auth-benefits">
            <span><i className="fas fa-shield-alt"></i> Protected account access</span>
            <span><i className="fas fa-briefcase"></i> Careers and service updates</span>
            <span><i className="fas fa-bolt"></i> Faster follow-ups with our team</span>
          </div>
        </aside>

        <section className="auth-form-panel">
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-heading">
              <span className="auth-kicker">{isLogin ? "Account login" : "New account"}</span>
              <h2 id="auth-title">{title}</h2>
              <p>{subtitle}</p>
            </div>

            {!isLogin && (
              <label className="auth-field" htmlFor="auth-name">
                <span>Full name</span>
                <input
                  id="auth-name"
                  type="text"
                  name="name"
                  placeholder="e.g. Sarah Nakato"
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label className="auth-field" htmlFor="auth-email">
              <span>Email address</span>
              <input
                id="auth-email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </label>

            {!isLogin && (
              <label className="auth-field" htmlFor="auth-phone">
                <span>Phone number <small>optional</small></span>
                <input
                  id="auth-phone"
                  type="tel"
                  name="phone"
                  placeholder="+256 700 000000"
                  value={formData.phone}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </label>
            )}

            <label className="auth-field" htmlFor="auth-password">
              <span>Password</span>
              <div className="password-input-container">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={isLogin ? "Enter your password" : "Create a strong password"}
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`} aria-hidden="true"></i>
                  <span>{showPassword ? "Hide" : "Show"}</span>
                </button>
              </div>
            </label>

            {!isLogin && (
              <div className="password-requirements">
                <p className="requirements-title">Use a secure password</p>
                <ul>
                  <li className={formData.password.length >= 8 ? "requirement-met" : "requirement-unmet"}>At least 8 characters</li>
                  <li className={/[a-z]/.test(formData.password) ? "requirement-met" : "requirement-unmet"}>One lowercase letter</li>
                  <li className={/[A-Z]/.test(formData.password) ? "requirement-met" : "requirement-unmet"}>One uppercase letter</li>
                  <li className={/[0-9]/.test(formData.password) ? "requirement-met" : "requirement-unmet"}>One number</li>
                  <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? "requirement-met" : "requirement-unmet"}>One symbol</li>
                </ul>
              </div>
            )}

            {!isLogin && (
              <div className="auth-security-note">
                <i className="fas fa-lock" aria-hidden="true"></i>
                <span>Your account helps us keep applications, product inquiries, and support updates organized securely.</span>
              </div>
            )}

            <LoadingButton type="submit" className="auth-submit-btn" loading={isSubmitting} spinnerSize={18}>
              {isSubmitting ? (isLogin ? "Signing you in..." : "Creating account...") : (isLogin ? "Sign in securely" : "Create account")}
            </LoadingButton>

            {isLogin && (
              <div className="forgot-password-link">
                <button type="button" onClick={() => handleModeSwitch("forgotPassword")}>
                  Forgot password?
                </button>
              </div>
            )}

            {message && (
              <div className={`form-message ${message.includes("successful") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <div className="auth-switch-copy">
              <span>{isLogin ? "New to SAPTech Uganda?" : "Already have an account?"}</span>
              <button type="button" onClick={() => handleModeSwitch(isLogin ? "signup" : "login")}>
                {isLogin ? "Create account" : "Sign in"}
              </button>
            </div>

            <button type="button" className="shortcut-home" onClick={onClose}>
              Back to home
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AuthModal;
