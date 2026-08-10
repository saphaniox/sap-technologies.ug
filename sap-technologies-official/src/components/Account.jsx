import React, { useState, useEffect } from "react";
import apiService from "../services/api";
import BackToTop from "./BackToTop";
import { showAlert } from "../utils/alerts.jsx";
import { getImageUrl } from "../utils/imageUrl";
import "../styles/Account.css";

const Account = ({ onClose }) => {
  const [userDetails, setUserDetails] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // Helper function to generate user initials for default avatar
  const getUserInitials = (name) => {
    if (!name) return "U"; // Default to "U" for User
    return name
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0].toUpperCase())
      .slice(0, 2) // Take first 2 initials
      .join('');
  };

  useEffect(() => {
    fetchUserDetails();
    if (activeTab === "activity") {
      fetchUserActivity();
    }
  }, [activeTab]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAccount();
      
      // The API returns { status: "success", data: { user: {...} } }
      const user = response?.data?.user;
      
      if (user) {
        setUserDetails(user);
        setFormData({
          name: user.name || "",
          email: user.email || "",
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        throw new Error("Invalid account data received");
      }
    } catch (error) {
      setError("We're having trouble loading your account. Please refresh and try again.");
      console.error("Account fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserActivity = async () => {
    try {
      const response = await apiService.getUserActivity();
      // Handle the response structure { status: "success", data: { activity: [...] } }
      const activity = response?.data?.activity || [];
      setUserActivity(activity);
    } catch (error) {
      console.error("Activity fetch error:", error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {
      await apiService.updateAccount({ name: formData.name });
      await fetchUserDetails();
      setIsEditing(false);
      setMessage("Profile updated successfully! 🎉");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage("Hmm, couldn't update your profile: " + error.message);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    
    try {
      await apiService.updateEmail(formData.email);
      await fetchUserDetails();
      setMessage("Email updated successfully! ✅");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage("Couldn't update your email: " + error.message);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage("Those passwords don't match — please try again");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    
    if (formData.newPassword.length < 6) {
      setMessage("Your new password needs to be at least 6 characters");
      setTimeout(() => setMessage(""), 5000);
      return;
    }
    
    try {
      await apiService.updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword
      });
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setMessage("Password updated successfully! 🔒");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage("Couldn't update your password: " + error.message);
      setTimeout(() => setMessage(""), 5000);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type?.startsWith("image/")) {
      const message = "Please pick a valid image file.";
      setMessage(message);
      showAlert.error("Wrong file type", message);
      e.target.value = "";
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      const message = "That image is a bit too large. Please keep it under 5MB.";
      setMessage(message);
      showAlert.error("Image too large", message);
      e.target.value = "";
      setTimeout(() => setMessage(""), 5000);
      return;
    }

    setUploading(true);
    setMessage("");

    try {
      await apiService.uploadProfilePic(file);
      await fetchUserDetails();
      setMessage("Profile picture updated!");
      await showAlert.success("Photo uploaded", "Your profile picture has been updated.");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      const message = "Couldn't upload your picture: " + error.message;
      setMessage(message);
      await showAlert.error("Upload failed", error.message || "Please try again.");
      setTimeout(() => setMessage(""), 5000);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This cannot be undone — everything will be permanently removed.")) {
      return;
    }

    if (!window.confirm("Last chance — this will wipe all your data for good. Are you absolutely certain?")) {
      return;
    }

    try {
      await apiService.deleteAccount();
      setMessage("Your account has been deleted. We're sorry to see you go.");
      setTimeout(() => {
        onClose();
        window.location.reload(); // Refresh to clear all state
      }, 1500);
    } catch (error) {
      setMessage("Couldn't delete your account: " + error.message);
    }
  };

  const clearMessage = () => {
    setTimeout(() => setMessage(""), 5000);
  };

  useEffect(() => {
    if (message) clearMessage();
  }, [message]);

  if (loading) {
    return (
      <div className="account-modal">
        <div className="account-content">
          <div className="account-header">
            <h2>My Account</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="loading">Loading account details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="account-modal">
        <div className="account-content">
          <div className="account-header">
            <h2>My Account</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-modal">
      <div className="account-content">
        <div className="account-header">
          <h2>My Account</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {message && (
          <div className={`message ${message.includes("Failed") || message.includes("Error") ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <div className="account-tabs">
          <button 
            className={`tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
          <button 
            className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            Security
          </button>
          <button 
            className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            Activity
          </button>
          <button 
            className={`tab-btn ${activeTab === "danger" ? "active" : ""}`}
            onClick={() => setActiveTab("danger")}
          >
            DELETE ACCOUNT
          </button>
        </div>

        <div className="tab-content">
          {activeTab === "profile" && (
            <div className="profile-tab">
              <div className="profile-picture-section">
                <div className="profile-pic-container">
                  {userDetails?.profilePic ? (
                    <img 
                      src={getImageUrl(userDetails.profilePic)} 
                      alt="Profile" 
                      className="profile-pic" 
                    />
                  ) : (
                    <div className="profile-pic-initials">
                      {getUserInitials(userDetails?.name)}
                    </div>
                  )}
                  <div className="profile-pic-overlay">
                    <label htmlFor="profile-pic-upload" className="upload-btn">
                      {uploading ? "Uploading..." : "Change Photo"}
                    </label>
                    <input
                      id="profile-pic-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicUpload}
                      disabled={uploading}
                      style={{ display: "none" }}
                    />
                  </div>
                </div>
              </div>

              <div className="profile-info">
                <h3>Profile Information</h3>
                {!isEditing ? (
                  <div className="info-display">
                    <div className="info-item">
                      <label>Name:</label>
                      <span>{userDetails?.name}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{userDetails?.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Role:</label>
                      <span className={`role-badge ${userDetails?.role}`}>
                        {userDetails?.role?.toUpperCase()}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Member Since:</label>
                      <span>{userDetails?.createdAt ? new Date(userDetails.createdAt).toLocaleDateString() : "N/A"}</span>
                    </div>
                    <div className="info-item">
                      <label>Last Login:</label>
                      <span>{userDetails?.lastLogin ? new Date(userDetails.lastLogin).toLocaleString() : "N/A"}</span>
                    </div>
                    <div className="info-item">
                      <label>Login Count:</label>
                      <span>{userDetails?.loginCount || 0}</span>
                    </div>
                    <button className="btn-primary" onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleProfileUpdate} className="edit-form">
                    <div className="form-group">
                      <label>Name:</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-primary">Save Changes</button>
                      <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="security-tab">
              <div className="security-section">
                <h3>Update Email</h3>
                <form onSubmit={handleEmailUpdate} className="update-form">
                  <div className="form-group">
                    <label>New Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-primary">Update Email</button>
                </form>
              </div>

              <div className="security-section">
                <h3>Change Password</h3>
                <form onSubmit={handlePasswordUpdate} className="update-form">
                  <div className="form-group">
                    <label>Current Password:</label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>New Password:</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirm New Password:</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength="6"
                    />
                  </div>
                  <button type="submit" className="btn-primary">Change Password</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === "activity" && (
            <div className="activity-tab">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {userActivity.length > 0 ? (
                  userActivity.slice().reverse().map((activity, index) => (
                    <div key={activity._id || index} className="activity-item">
                      <div className="activity-header">
                        <span className="activity-action">{activity.action}</span>
                        <span className="activity-timestamp">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                      {(activity.ipAddress || activity.userAgent) && (
                        <div className="activity-details">
                          {activity.ipAddress && (
                            <span className="activity-ip">IP: {activity.ipAddress}</span>
                          )}
                          {activity.userAgent && (
                            <span className="activity-browser" title={activity.userAgent}>
                              {activity.userAgent.substring(0, 50)}...
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No recent activity</p>
                )}
              </div>
              <button 
                className="btn-secondary" 
                onClick={fetchUserActivity}
              >
                Refresh Activity
              </button>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="danger-tab">
              <h3>Delete your Account</h3>
              <div className="danger-section">
                <div className="danger-info">
                  <h4>Delete Account</h4>
                  <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
                </div>
                <button className="btn-danger" onClick={handleDeleteAccount}>
                  Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
        <BackToTop />
      </div>
    </div>
  );
};

export default Account;
