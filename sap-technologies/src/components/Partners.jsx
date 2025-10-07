/**
 * Partners Component
 * 
 * Displays our trusted business partners and allows partnership requests.
 * Features include:
 * - Partner showcase with logos and information
 * - Partner management (add, edit, delete) for admins
 * - Partnership request form for potential partners
 * - Authentication-based admin controls
 * - Responsive grid layout
 * 
 * @component
 */
import { useState, useEffect } from "react";
import PartnerForm from "./PartnerForm";
import PartnerRequestForm from "./PartnerRequestForm";
import ConfirmDialog from "./ConfirmDialog";
import { apiService } from "../services/api";
import "../styles/Partners.css";

const Partners = () => {
  /**
   * Data State
   */
  // Array of partner organizations
  const [partners, setPartners] = useState([]);
  // Loading indicator for data fetching
  const [loading, setLoading] = useState(true);
  // Error message if API fails
  const [error, setError] = useState("");
  
  /**
   * UI State Management
   */
  // Controls partner form modal visibility (admin)
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  // Controls partnership request form visibility (public)
  const [showRequestForm, setShowRequestForm] = useState(false);
  // Partner being edited (admin)
  const [editingPartner, setEditingPartner] = useState(null);
  // Controls delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Partner selected for deletion
  const [partnerToDelete, setPartnerToDelete] = useState(null);
  // Current authenticated user
  const [user, setUser] = useState(null);

  /**
   * Load partners and check user authentication on mount
   */
  useEffect(() => {
    fetchPartners();
    checkUserAuth();
  }, []);

  /**
   * Check if user is authenticated
   * Determines if admin controls should be shown
   */
  const checkUserAuth = async () => {
    try {
      const user = await apiService.getCurrentUser();
      setUser(user);
    } catch {
      // User not authenticated, which is fine
      console.log("User not authenticated");
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  /**
   * Fetch Partners from API
   * Loads all partner organizations to display
   */
  const fetchPartners = async () => {
    try {
      const partners = await apiService.getPartners();
      setPartners(partners);
    } catch (error) {
      console.error("Error fetching partners:", error);
      setError("Failed to load partners");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle partner save success
   * Refreshes partner list after add/edit
   */
  const handlePartnerSave = () => {
    // Refresh the partners list
    fetchPartners();
    setShowPartnerForm(false);
    setEditingPartner(null);
  };

  const handleEdit = (partner) => {
    setEditingPartner(partner);
    setShowPartnerForm(true);
  };

  const handleDelete = (partner) => {
    setPartnerToDelete(partner);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!partnerToDelete) return;

    try {
      await apiService.deletePartner(partnerToDelete._id);
      // Refresh the partners list
      fetchPartners();
      setShowDeleteDialog(false);
      setPartnerToDelete(null);
    } catch (error) {
      console.error("Error deleting partner:", error);
      alert("Network error. Please try again.");
    }
  };

  const cancelDelete = () => {
    setShowDeleteDialog(false);
    setPartnerToDelete(null);
  };

  if (loading) {
    return (
      <section className="partners">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading trusted partners...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="partners">
        <div className="container">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (partners.length === 0 && !loading && !error) {
    return (
      <section className="partners">
        <div className="container">
          <div className="partners-header">
            <h2>Trusted Partners</h2>
            <p className="partners-subtitle">
              We collaborate with amazing companies and clients to deliver exceptional results
            </p>
            <div className="partners-actions">
              {user && user.role === "admin" ? (
                <button 
                  className="add-partner-btn admin-btn"
                  onClick={() => {
                    setEditingPartner(null);
                    setShowPartnerForm(true);
                  }}
                >
                  + Add Partner
                </button>
              ) : (
                <button 
                  className="add-partner-btn request-btn"
                  onClick={() => setShowRequestForm(true)}
                >
                  Become a Partner
                </button>
              )}
            </div>
          </div>
          <div className="empty-state">
            <p>No partners to display yet.</p>
            {user && user.role === "admin" ? (
              <p>Click "Add Partner" to get started!</p>
            ) : (
              <p>Interested in partnering with us? Click "Become a Partner" above!</p>
            )}
          </div>
        </div>
        
        {/* Partner Form Modal */}
        {showPartnerForm && (
          <PartnerForm 
            isOpen={showPartnerForm}
            partner={editingPartner}
            onClose={() => {
              setShowPartnerForm(false);
              setEditingPartner(null);
            }}
            onSave={handlePartnerSave}
          />
        )}

        {/* Partner Request Modal */}
        {showRequestForm && (
          <PartnerRequestForm 
            isOpen={showRequestForm}
            onClose={() => setShowRequestForm(false)}
          />
        )}
      </section>
    );
  }

  return (
    <section className="partners">
      <div className="container">
          <div className="partners-header">
            <h2>Trusted Partners</h2>
            <p className="partners-subtitle">
              We collaborate with amazing companies and clients to deliver exceptional results
            </p>
            <div className="partners-actions">
              {user && user.role === "admin" ? (
                <button 
                  className="add-partner-btn admin-btn"
                  onClick={() => {
                    setEditingPartner(null);
                    setShowPartnerForm(true);
                  }}
                >
                  + Add Partner
                </button>
              ) : (
                <button 
                  className="add-partner-btn request-btn"
                  onClick={() => setShowRequestForm(true)}
                >
                  Become a Partner
                </button>
              )}
            </div>
          </div>        <div className="partners-grid">
          {partners.map((partner) => (
            <div key={partner._id} className="partner-card">
              {user && user.role === "admin" && (
                <div className="partner-admin-controls">
                  <button 
                    className="edit-btn"
                    onClick={() => handleEdit(partner)}
                    title="Edit Partner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button 
                    className="delete-btn"
                    onClick={() => handleDelete(partner)}
                    title="Delete Partner"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="partner-logo">
                <img 
                  src={partner.logo?.startsWith('http') ? partner.logo : `${apiService.baseURL}${partner.logo}`} 
                  alt={`${partner.name} logo`}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextElementSibling.style.display = "flex";
                  }}
                />
                <div className="logo-fallback" style={{ display: "none" }}>
                  <span>{partner.name.charAt(0).toUpperCase()}</span>
                </div>
              </div>
              
              <div className="partner-info">
                <h3 className="partner-name">{partner.name}</h3>
                
                {partner.description && (
                  <p className="partner-description">{partner.description}</p>
                )}
                
                {partner.website && (
                  <div className="partner-contact">
                    {partner.website.match(/^https?:\/\/.+/) ? (
                      <a 
                        href={partner.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="partner-website"
                      >
                        Visit Website
                        <svg 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                        >
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                          <polyline points="15,3 21,3 21,9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <div className="partner-info-text">
                        <span className="info-label">Contact:</span>
                        <span className="info-value">{partner.website}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Partner Form Modal */}
      {showPartnerForm && (
        <PartnerForm 
          isOpen={showPartnerForm}
          partner={editingPartner}
          onClose={() => {
            setShowPartnerForm(false);
            setEditingPartner(null);
          }}
          onSave={handlePartnerSave}
        />
      )}

      {/* Partner Request Modal */}
      {showRequestForm && (
        <PartnerRequestForm 
          isOpen={showRequestForm}
          onClose={() => setShowRequestForm(false)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && partnerToDelete && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Partner"
          message={`Are you sure you want to delete "${partnerToDelete.name}"? This action cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />
      )}
    </section>
  );
};

export default Partners;