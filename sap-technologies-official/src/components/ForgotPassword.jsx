// Forgot Password Modal Component
// Handles password reset flow with verification code
import React, { useState } from "react";
import apiService from "../services/api";
import { showAlert } from "../utils/alerts.jsx";
import "../styles/ForgotPassword.css";

const ForgotPassword = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: Enter email, 2: Enter code & new password
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Handle closing modal and resetting state
  const handleClose = () => {
    setStep(1);
    setEmail("");
    setVerificationCode("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setCountdown(0);
    onClose();
  };

  // Step 1: Request verification code
  const handleRequestCode = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await apiService.requestPasswordReset(email);
      
      await showAlert.success(
        "Check your inbox! 📧",
        response.message || "We've sent a verification code to your email. It should arrive any second.",
        {
          timer: 3000,
          confirmButtonText: "OK"
        }
      );

      setStep(2);
      setCountdown(60); // Start countdown for resend button
      
      // Countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      await showAlert.error(
        "That didn't go through",
        error.message || "We couldn't send the code right now. Please try again in a moment.",
        {
          confirmButtonText: "Try Again"
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Reset password with verification code
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!verificationCode || verificationCode.length !== 6) {
      await showAlert.warning(
        "Code looks off",
        "Please enter the full 6-digit code from your email.",
        { confirmButtonText: "OK" }
      );
      return;
    }

    if (newPassword.length < 6) {
      await showAlert.warning(
        "Password too short",
        "Your new password needs to be at least 6 characters long.",
        { confirmButtonText: "OK" }
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      await showAlert.warning(
        "Passwords don't match",
        "Make sure both password fields are identical before continuing.",
        { confirmButtonText: "OK" }
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiService.resetPassword({
        email,
        verificationCode,
        newPassword
      });

      await showAlert.success(
        "Password updated! 🔓",
        response.message || "You're all set. Go ahead and log in with your new password.",
        {
          timer: 3000,
          confirmButtonText: "Login Now"
        }
      );

      handleClose();
    } catch (error) {
      await showAlert.error(
        "Reset didn't work",
        error.message || "Something went wrong. Please double-check your verification code and try again.",
        {
          confirmButtonText: "Try Again"
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (countdown > 0) return;

    setIsSubmitting(true);

    try {
      const response = await apiService.resendResetCode(email);
      
      await showAlert.success(
        "New code sent! 📨",
        response.message || "A fresh verification code is on its way to your email.",
        {
          timer: 2000,
          confirmButtonText: "OK"
        }
      );

      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      await showAlert.error(
        "Couldn't resend",
        error.message || "We had trouble sending a new code. Please try again.",
        { confirmButtonText: "OK" }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="forgot-password-overlay" onClick={handleClose}>
      <div className="forgot-password-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={handleClose} aria-label="Close">
          ✕
        </button>

        <div className="modal-header">
          <div className="icon">🔐</div>
          <h2>{step === 1 ? "Forgot Password?" : "Reset Password"}</h2>
          <p>
            {step === 1
              ? "Enter your email to receive a verification code"
              : "Enter the code sent to your email and your new password"}
          </p>
        </div>

        {/* Step 1: Request Code */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="reset-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">📧</span>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Sending...
                </>
              ) : (
                <>Send Verification Code</>
              )}
            </button>
          </form>
        )}

        {/* Step 2: Enter Code and New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="reset-form">
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <div className="input-wrapper">
                <span className="input-icon">🔢</span>
                <input
                  type="text"
                  id="code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  required
                  disabled={isSubmitting}
                  className="code-input"
                />
              </div>
              <p className="helper-text">
                Check your email for the 6-digit verification code
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  disabled={isSubmitting}
                  minLength="6"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isSubmitting}
                  minLength="6"
                />
              </div>
            </div>

            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="spinner"></span> Resetting...
                </>
              ) : (
                <>Reset Password</>
              )}
            </button>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button
                type="button"
                className="resend-btn"
                onClick={handleResendCode}
                disabled={countdown > 0 || isSubmitting}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend Code"}
              </button>
            </div>

            <button
              type="button"
              className="back-btn"
              onClick={() => setStep(1)}
              disabled={isSubmitting}
            >
              ← Back to email
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
