/**
 * Awards Component
 * 
 * SAP HANIOX Professional Awards system for recognizing excellence.
 * Features include:
 * - Browse award categories and nominations
 * - Submit nominations with photo uploads
 * - Vote for nominees
 * - Search and filter nominations by category/country
 * - Pagination and sorting options
 * - Professional awards ceremony platform
 * 
 * @component
 */
import React, { useState, useEffect, useRef } from "react";
import { showAlert } from "../utils/alerts";
import apiService from "../services/api";
import Footer from "./Footer";
import PrivacyPolicy from "./PrivacyPolicy";
import TermsOfService from "./TermsOfService";
import "../styles/Awards.css";

const Awards = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showNominationForm, setShowNominationForm] = useState(false);
  const containerRef = useRef(null);
  const [loading, setLoading] = useState({
    categories: true,
    nominations: true,
    submitting: false
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [filterCountry, setFilterCountry] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  
  // Modal states for Footer functionality
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);

  // Nomination form state
  const [nominationForm, setNominationForm] = useState({
    nomineeName: "",
    nomineeTitle: "",
    nomineeCompany: "",
    nomineeCountry: "Uganda",
    nomineePhoto: null,
    category: "",
    nominationReason: "",
    achievements: "",
    impactDescription: "",
    nominatorName: "",
    nominatorEmail: "",
    nominatorPhone: "",
    nominatorOrganization: ""
  });

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Load nominations when filters change
  useEffect(() => {
    loadNominations();
  }, [selectedCategory, searchTerm, sortBy, filterCountry, pagination.currentPage]);

  const loadCategories = async () => {
    try {
      const response = await apiService.get("/awards/categories");
      setCategories(response.data.categories);
    } catch (error) {
      showAlert.error("Error", "Failed to load award categories");
    } finally {
      setLoading(prev => ({ ...prev, categories: false }));
    }
  };

  const loadNominations = async () => {
    try {
      setLoading(prev => ({ ...prev, nominations: true }));
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 12,
        sortBy,
        sortOrder: "desc"
      });

      if (selectedCategory) params.append("category", selectedCategory);
      if (filterCountry) params.append("country", filterCountry);
      if (searchTerm) params.append("search", searchTerm);

      const response = await apiService.get(`/awards/nominations?${params}`);
      setNominations(response.data.nominations);
      setPagination(response.data.pagination);
    } catch (error) {
      showAlert.error("Error", "Failed to load nominations");
    } finally {
      setLoading(prev => ({ ...prev, nominations: false }));
    }
  };

  const handleNominationSubmit = async (e) => {
    e.preventDefault();
    
    if (!nominationForm.nomineePhoto) {
      showAlert.error("Error", "Please upload a photo of the nominee");
      return;
    }
    setLoading(prev => ({ ...prev, submitting: true }));

    try {
      const formData = new FormData();
      Object.keys(nominationForm).forEach(key => {
        if (nominationForm[key] !== null && nominationForm[key] !== "") {
          formData.append(key, nominationForm[key]);
          console.log(`📝 Added to FormData: ${key} = ${nominationForm[key]}`);
        }
      });

      console.log("🚀 Making API request to /awards/nominations");
      const response = await apiService.post("/awards/nominations", formData);
      // Note: Don't set Content-Type header for FormData - browser sets it automatically

      console.log("✅ API request successful:", response);

      await showAlert.success(
        "🎉 Nomination Submitted!",
        "Thank you for your nomination. It will be reviewed before being published.",
        { timer: 5000 }
      );

      // Reset form
      setNominationForm({
        nomineeName: "",
        nomineeTitle: "",
        nomineeCompany: "",
        nomineeCountry: "Uganda",
        nomineePhoto: null,
        category: "",
        nominationReason: "",
        achievements: "",
        impactDescription: "",
        nominatorName: "",
        nominatorEmail: "",
        nominatorPhone: "",
        nominatorOrganization: ""
      });
      setShowNominationForm(false);
      
      // Reload nominations
      loadNominations();
    } catch (error) {
      console.error("❌ API request failed:", error);
      console.error("📊 Error response:", error.response);
      
      // Extract detailed validation errors
      let errorMessage = "Failed to submit nomination. Please try again.";
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Show specific validation errors
        const validationErrors = error.response.data.errors.map(err => err.msg).join("\n• ");
        errorMessage = `Validation errors:\n• ${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      await showAlert.error(
        "❌ Submission Failed", 
        errorMessage,
        {
          position: 'center',
          showConfirmButton: true,
          confirmButtonText: 'OK'
        }
      );
    } finally {
      console.log("✅ Setting loading state to false");
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const handleVote = async (nominationId, voterEmail) => {
    try {
      await apiService.post(`/awards/nominations/${nominationId}/vote`, {
        voterEmail,
        voterName: "" // Optional
      });

      showAlert.success("Vote Submitted!", "Thank you for your vote!");
      loadNominations(); // Refresh to show updated vote count
    } catch (error) {
      showAlert.error("Vote Failed", error.message || "Failed to submit vote");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setNominationForm(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const getTopNominations = () => {
    return nominations.slice(0, 6).filter(nom => nom.votes > 0);
  };

  const uniqueCountries = [...new Set(nominations.map(nom => nom.nomineeCountry))];

  // Handler functions for Footer modals
  const handlePrivacyPolicyOpen = () => {
    setShowPrivacyPolicy(true);
  };

  const handlePrivacyPolicyClose = () => {
    setShowPrivacyPolicy(false);
  };

  const handleTermsOfServiceOpen = () => {
    setShowTermsOfService(true);
  };

  const handleTermsOfServiceClose = () => {
    setShowTermsOfService(false);
  };

  // Navigation handler for Footer
  const handleFooterNavigate = (sectionId) => {
    // Show alert to guide user to main page
    showAlert.info(
      `Navigate to ${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Section`,
      `To access the ${sectionId} section, please close this awards modal and scroll to the ${sectionId} section on the main page.`,
      {
        confirmButtonText: "Close Awards & Go to Main Page",
        cancelButtonText: "Stay Here",
        showCancelButton: true,
        timer: 6000,
        timerProgressBar: true
      }
    ).then((result) => {
      if (result.isConfirmed) {
        // Close the awards modal
        onClose();
        // Small delay to ensure modal closes first
        setTimeout(() => {
          // Try to scroll to the section on main page
          const element = document.getElementById(sectionId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }, 300);
      }
    });
  };

  return (
    <div className="awards-modal-overlay" onClick={onClose}>
      <div 
        className="awards-modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div 
          className="awards-modal-header"
        >
          <h2>🏆WELCOME TO SAPHANIOX AWARDS 2025</h2>
          <button 
            className="awards-modal-close" 
            onClick={onClose}
          >×</button>
        </div>
        
        <div 
          className="awards-page"
          ref={containerRef}
        >
      {/* Hero Section */}
      <section 
        className="awards-hero"
      >
        <div className="container">
          <div 
            className="hero-content"
          >
            <h1 
              className="hero-title animated-title"
            >
              <span 
                className="trophy-icon"
              >
                🏆
              </span>
              {' '}
              <span
                className="title-text"
              >
                <span 
                  className="word-saphaniox"
                >
                  Saphaniox
                </span>
                {' '}
                <span 
                  className="word-awards"
                >
                  awards
                </span>
                {' '}
                <span 
                  className="word-2025"
                >
                  2025
                </span>
              </span>
            </h1>
            <p 
              className="hero-subtitle clear-subtitle"
            >
              <span
                className="subtitle-celebrating"
              >
                Celebrating
              </span>
              {' '}
              <span
                className="subtitle-excellence"
              >
                Excellence
              </span>
              {' '}
              <span
                className="subtitle-in"
              >
                in
              </span>
              {' '}
              <span
                className="subtitle-engineering"
              >
                Engineering
              </span>
              {' '}
              <span
                className="subtitle-ampersand"
              >
                &
              </span>
              {' '}
              <span
                className="subtitle-technology"
              >
                Technology
              </span>
            </p>
            <p 
              className="hero-description"
            >
              Recognizing outstanding contributions to technology advancement, innovation, and engineering excellence 
              in Uganda and across the international community. Join us in honoring the minds that shape our digital future.
            </p>
            <div 
              className="hero-stats"
            >
              <div 
                className="stat"
              >
                <span className="stat-number">{categories.length}</span>
                <span className="stat-label">Award Categories</span>
              </div>
              <div 
                className="stat"
              >
                <span className="stat-number">{nominations.length}</span>
                <span className="stat-label">Nominations</span>
              </div>
              <div 
                className="stat"
              >
                <span className="stat-number">
                  {nominations.reduce((total, nom) => total + nom.votes, 0)}
                </span>
                <span className="stat-label">Total Votes</span>
              </div>
            </div>
            <div 
              className="hero-actions"
            >
              <button
                className="btn-primary btn-large"
                onClick={() => setShowNominationForm(true)}
              >
                <span style={{ display: 'inline-block', marginRight: '8px' }}>
                  🎯
                </span>
                <span>
                  Nominate Someone
                </span>
              </button>
              <button
                className="btn-secondary btn-large"
                onClick={() => document.getElementById('nominations')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <span style={{ display: 'inline-block', marginRight: '8px' }}>
                  🗳️
                </span>
                <span>
                  View & Vote
                </span>
              </button>
            </div>
            
            {/* Powered By Section */}
            <div 
              className="powered-by-section"
            >
              <p 
                className="powered-by-text enhanced-powered-by"
              >
                <span 
                  className="powered-word"
                >
                  powered
                </span>
                {' '}
                <span 
                  className="by-word"
                >
                  by
                </span>
                {' '}
                <span 
                  className="company-name enhanced-company-name"
                >
                  SAP Engineering & Technologies
                </span>
              </p>
              
              {/* Decorative elements */}
              <div
                className="powered-by-decorations"
                style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '1.2rem',
                  pointerEvents: 'none'
                }}
              >
                ⚡✨⚡
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Award Categories */}
      <section 
        className="awards-categories"
      >
        <div className="container">
          <h2>
            🏆 Award Categories
          </h2>
          <p>
            Explore our diverse categories celebrating different aspects of technological excellence
          </p>
          
          {loading.categories ? (
            <div 
              className="loading-state"
            >
              <div 
                className="spinner"
              ></div>
              <p>Loading categories...</p>
            </div>
          ) : (
            <div 
              className="categories-grid"
              >
              {categories.map((category, index) => (
                <div 
                  key={category._id} 
                  className={`category-card ${selectedCategory === category._id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(selectedCategory === category._id ? "" : category._id)}
                >
                  <div 
                    className="category-icon"
                  >
                    {category.icon}
                  </div>
                  <h3>
                    {category.name}
                  </h3>
                  <p>
                    {category.description}
                  </p>
                  <div 
                    className="category-stats"
                  >
                    <span className="nominations-count">
                      {category.approvedNominations} nominations
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Top Nominations */}
      {getTopNominations().length > 0 && (
        <section className="top-nominations">
          <div className="container">
            <h2>⭐ Leading Nominations</h2>
            <div className="top-nominees-grid">
              {getTopNominations().map((nomination, index) => (
                <div key={nomination._id} className="top-nominee-card">
                  <div className="rank-badge">{index + 1}</div>
                  <div className="nominee-photo">
                    <img src={nomination.nomineePhoto} alt={nomination.nomineeName} />
                  </div>
                  <div className="nominee-info">
                    <h3>{nomination.nomineeName}</h3>
                    {nomination.nomineeTitle && <p className="title">{nomination.nomineeTitle}</p>}
                    {nomination.nomineeCompany && <p className="company">{nomination.nomineeCompany}</p>}
                    <div className="category-tag">
                      {nomination.category?.icon} {nomination.category?.name}
                    </div>
                    <div className="votes-display">
                      🗳️ {nomination.votes} votes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nominations Section */}
      <section id="nominations" className="nominations-section">
        <div className="container">
          <div className="section-header">
            <h2>🎯 Current Nominations</h2>
            <p>Vote for your favorite nominees and help recognize excellence</p>
          </div>

          {/* Filters */}
          <div className="filters-bar">
            <div className="search-filters">
              <input
                type="text"
                placeholder="Search nominations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="votes">Most Voted</option>
                <option value="createdAt">Most Recent</option>
                <option value="nomineeName">Name (A-Z)</option>
              </select>

              {uniqueCountries.length > 1 && (
                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="filter-select"
                >
                  <option value="">All Countries</option>
                  {uniqueCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Nominations Grid */}
          {loading.nominations ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading nominations...</p>
            </div>
          ) : nominations.length === 0 ? (
            <div className="empty-state">
              <h3>No nominations found</h3>
              <p>Be the first to nominate someone for these prestigious awards!</p>
              <button
                className="btn-primary"
                onClick={() => setShowNominationForm(true)}
              >
                Submit Nomination
              </button>
            </div>
          ) : (
            <>
              <div className="nominations-grid">
                {nominations.map(nomination => (
                  <NominationCard
                    key={nomination._id}
                    nomination={nomination}
                    onVote={handleVote}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn-pagination"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  >
                    ← Previous
                  </button>
                  
                  <span className="pagination-info">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    className="btn-pagination"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Nomination Form Modal */}
      {showNominationForm && (
        <NominationModal
          categories={categories}
          nominationForm={nominationForm}
          onChange={handleInputChange}
          onSubmit={handleNominationSubmit}
          onClose={() => setShowNominationForm(false)}
          loading={loading.submitting}
        />
      )}
      
      {/* Footer */}
      <Footer 
        onPrivacyPolicyOpen={handlePrivacyPolicyOpen}
        onTermsOfServiceOpen={handleTermsOfServiceOpen}
        onNavigate={handleFooterNavigate}
      />
        </div>
      </div>
      
      {/* Privacy Policy Modal */}
      {showPrivacyPolicy && (
        <PrivacyPolicy onClose={handlePrivacyPolicyClose} />
      )}
      
      {/* Terms of Service Modal */}
      {showTermsOfService && (
        <TermsOfService onClose={handleTermsOfServiceClose} />
      )}
    </div>
  );
};

// Nomination Card Component
const NominationCard = ({ nomination, onVote }) => {
  const [voterEmail, setVoterEmail] = useState("");
  const [showVoteForm, setShowVoteForm] = useState(false);

  const handleVoteSubmit = (e) => {
    e.preventDefault();
    if (voterEmail.trim()) {
      onVote(nomination._id, voterEmail.trim());
      setVoterEmail("");
      setShowVoteForm(false);
    }
  };

  return (
    <div 
      className="nomination-card"
    >
      <div className="nominee-photo">
        <img src={nomination.nomineePhoto} alt={nomination.nomineeName} />
        <div className="country-badge">{nomination.nomineeCountry}</div>
      </div>
      
      <div className="card-content">
        <div className="nominee-header">
          <h3>{nomination.nomineeName}</h3>
          {nomination.nomineeTitle && <p className="title">{nomination.nomineeTitle}</p>}
          {nomination.nomineeCompany && <p className="company">@ {nomination.nomineeCompany}</p>}
        </div>

        <div className="category-badge">
          {nomination.category?.icon} {nomination.category?.name}
        </div>

        <div className="nomination-reason">
          <p>{nomination.nominationReason.substring(0, 120)}...</p>
        </div>

        {nomination.achievements && (
          <div className="achievements">
            <strong>Key Achievements:</strong>
            <p>{nomination.achievements.substring(0, 100)}...</p>
          </div>
        )}

        <div className="card-footer">
          <div className="votes-section">
            <span className="vote-count">🗳️ {nomination.votes} votes</span>
            
            {!showVoteForm ? (
              <button
                className="vote-btn"
                onClick={() => setShowVoteForm(true)}
              >
                Vote
              </button>
            ) : (
              <form onSubmit={handleVoteSubmit} className="vote-form">
                <input
                  type="email"
                  placeholder="Your email"
                  value={voterEmail}
                  onChange={(e) => setVoterEmail(e.target.value)}
                  required
                />
                <button type="submit">Submit Vote</button>
                <button type="button" onClick={() => setShowVoteForm(false)}>Cancel</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Nomination Modal Component  
const NominationModal = ({ categories, nominationForm, onChange, onSubmit, onClose, loading }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content nomination-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🎯 Submit Nomination</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={onSubmit} className="nomination-form">
          {/* Nominee Information */}
          <div className="form-section">
            <h3>👤 Nominee Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="nomineeName"
                  value={nominationForm.nomineeName}
                  onChange={onChange}
                  required
                  placeholder="Enter nominee's full name"
                />
              </div>
              
              <div className="form-group">
                <label>Professional Title</label>
                <input
                  type="text"
                  name="nomineeTitle"
                  value={nominationForm.nomineeTitle}
                  onChange={onChange}
                  placeholder="e.g., Senior Software Engineer"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company/Organization</label>
                <input
                  type="text"
                  name="nomineeCompany"
                  value={nominationForm.nomineeCompany}
                  onChange={onChange}
                  placeholder="Company or organization name"
                />
              </div>
              
              <div className="form-group">
                <label>Country</label>
                <select
                  name="nomineeCountry"
                  value={nominationForm.nomineeCountry}
                  onChange={onChange}
                >
                  <option value="Uganda">Uganda</option>
                  <option value="Kenya">Kenya</option>
                  <option value="Tanzania">Tanzania</option>
                  <option value="Rwanda">Rwanda</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="Ghana">Ghana</option>
                  <option value="South Africa">South Africa</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Photo *</label>
              <input
                type="file"
                name="nomineePhoto"
                onChange={onChange}
                accept="image/*"
                required
              />
              <small>Upload a professional photo of the nominee (max 5MB)</small>
            </div>
          </div>

          {/* Award Category */}
          <div className="form-section">
            <h3>🏆 Award Category</h3>
            <div className="category-selection">
              {categories.map(category => (
                <label key={category._id} className="category-option">
                  <input
                    type="radio"
                    name="category"
                    value={category._id}
                    checked={nominationForm.category === category._id}
                    onChange={onChange}
                    required
                  />
                  <div className="category-card-small">
                    <span className="icon">{category.icon}</span>
                    <span className="name">{category.name}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Nomination Details */}
          <div className="form-section">
            <h3>📝 Nomination Details</h3>
            
            <div className="form-group">
              <label>Why should this person win? *</label>
              <textarea
                name="nominationReason"
                value={nominationForm.nominationReason}
                onChange={onChange}
                required
                rows={4}
                placeholder="Explain why this person deserves to win this award (minimum 50 characters)"
                minLength={50}
              />
              <small>{nominationForm.nominationReason.length}/1000 characters</small>
            </div>

            <div className="form-group">
              <label>Key Achievements</label>
              <textarea
                name="achievements"
                value={nominationForm.achievements}
                onChange={onChange}
                rows={3}
                placeholder="List the nominee's key achievements and accomplishments"
              />
            </div>

            <div className="form-group">
              <label>Impact Description</label>
              <textarea
                name="impactDescription"
                value={nominationForm.impactDescription}
                onChange={onChange}
                rows={3}
                placeholder="Describe the impact of their work on the community or industry"
              />
            </div>
          </div>

          {/* Nominator Information */}
          <div className="form-section">
            <h3>👨‍💼 Your Information</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label>Your Full Name *</label>
                <input
                  type="text"
                  name="nominatorName"
                  value={nominationForm.nominatorName}
                  onChange={onChange}
                  required
                  placeholder="Enter your full name"
                />
              </div>
              
              <div className="form-group">
                <label>Your Email *</label>
                <input
                  type="email"
                  name="nominatorEmail"
                  value={nominationForm.nominatorEmail}
                  onChange={onChange}
                  required
                  placeholder="your.email@example.com"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="nominatorPhone"
                  value={nominationForm.nominatorPhone}
                  onChange={onChange}
                  placeholder="+256 xxx xxx xxx"
                />
              </div>
              
              <div className="form-group">
                <label>Your Organization</label>
                <input
                  type="text"
                  name="nominatorOrganization"
                  value={nominationForm.nominatorOrganization}
                  onChange={onChange}
                  placeholder="Your company or organization"
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit Nomination"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Awards;