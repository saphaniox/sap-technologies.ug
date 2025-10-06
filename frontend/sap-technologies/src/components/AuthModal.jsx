/**
 * AuthModal Component
 * 
 * Authentication modal for user login and registration.
 * Features:
 * - Login and signup forms with validation
 * - Password visibility toggle
 * - Form submission with loading states
 * - Success/error alerts
 * - Automatic mode switching after signup
 * 
 * @component
 */
import React, { useState } from "react";
import apiService from "../services/api";
import { showAlert, LoadingButton, Spinners } from "../utils/alerts.jsx";
import "../styles/AuthModal.css";

const AuthModal = ({ isOpen, mode, onClose, onAuthSuccess, onModeSwitch }) => {
  // Form data state - tracks what user types in the form fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  
  // UI state for user feedback and form behavior
  const [message, setMessage] = useState(""); // Success/error messages
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state during form submission
  const [showPassword, setShowPassword] = useState(false); // Password visibility toggle

  // Toggle password visibility when user clicks the eye icon
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Update form data as user types in the fields
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle form submission - either login or registration
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setIsSubmitting(true); // Show loading state
    setMessage(""); // Clear any previous messages

    try {
      let result;
      if (mode === "login") {
        result = await apiService.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await apiService.signup(formData);
      }

      if (mode === "login") {
        // Show success alert for login
        await showAlert.success(
          "Login Successful!",
          `Welcome back! You have been logged in successfully.`,
          {
            timer: 2000,
            confirmButtonText: "Continue"
          }
        );
        
        onAuthSuccess(result);
        onClose();
        setFormData({ name: "", email: "", password: "" });
      } else {
        // Show success alert for signup
        await showAlert.success(
          "Account Created!",
          "Your account has been created successfully. Redirecting to login...",
          {
            timer: 2000,
            confirmButtonText: "Continue to Login"
          }
        );
        
        // Clear form and switch to login mode
        setFormData({ name: "", email: "", password: "" });
        
        // Redirect to login after a brief delay
        setTimeout(() => {
          if (onModeSwitch) {
            onModeSwitch("login");
          }
        }, 2000);
      }
    } catch (error) {
      // Show error alert
      await showAlert.error(
        mode === "login" ? "Login Failed" : "Signup Failed",
        error.message || `Failed to ${mode}. Please check your information and try again.`,
        {
          confirmButtonText: "Try Again"
        }
      );
      setMessage(error.message || `${mode === "login" ? "Login" : "Signup"} failed.`);
      // Auto-dismiss error message after 5 seconds
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="auth-modal" onClick={handleBackdropClick}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <form onSubmit={handleSubmit} className="auth-form">
          <h2>{mode === "login" ? "Login" : "Sign Up"}</h2>
          
          {mode === "signup" && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          )}
          
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle-btn"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M1 1l22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          </div>
          
          {mode === "signup" && (
            <div className="password-requirements">
              <p className="requirements-title">Password Requirements:</p>
              <ul>
                <li className={formData.password.length >= 8 ? 'requirement-met' : 'requirement-unmet'}>
                  At least 8 characters long
                </li>
                <li className={/[a-z]/.test(formData.password) ? 'requirement-met' : 'requirement-unmet'}>
                  At least 1 lowercase letter
                </li>
                <li className={/[A-Z]/.test(formData.password) ? 'requirement-met' : 'requirement-unmet'}>
                  At least 1 uppercase letter
                </li>
                <li className={/[0-9]/.test(formData.password) ? 'requirement-met' : 'requirement-unmet'}>
                  At least 1 number
                </li>
                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'requirement-met' : 'requirement-unmet'}>
                  At least 1 symbol (!@#$%^&*(),.?":{}|&lt;&gt;)
                </li>
              </ul>
            </div>
          )}
          
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (mode === "login" ? "Logging in..." : "Signing up...") 
              : (mode === "login" ? "Login" : "Sign Up")
            }
          </button>
          
          {mode === "login" && (
            <div className="forgot-password-link">
              <a 
                href="#" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (onModeSwitch) {
                    onModeSwitch("forgotPassword");
                  }
                }}
              >
                Forgot Password?
              </a>
            </div>
          )}
          
          {message && (
            <div className={`form-message ${message.includes("successful") ? "success" : "error"}`}>
              {message}
            </div>
          )}
          
          <p>
            <a href="#" className="shortcut-home" onClick={(e) => { e.preventDefault(); onClose(); }}>
              ← Back to Home
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
