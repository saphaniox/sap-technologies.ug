// Presentational admin view; state and actions are supplied by the dashboard.
export default function SettingsTab({
  allCertificates,
  certificatesPagination,
  certificatesSearch,
  certificatesTypeFilter,
  currentSignature,
  deleteSavedEmailMessage,
  fetchAllCertificates,
  handleDeleteCertificate,
  handleDeleteSignature,
  handleSignatureUpload,
  renderEmailProviderSettings,
  reuseSavedEmailMessage,
  savedEmailMessages,
  setCertificatesSearch,
  setCertificatesTypeFilter,
  setSettingsSubTab,
  setSignatureFile,
  settingsSubTab,
  signatureFile,
  updating,
  uploadingSignature
}) {
  return <div className="tab-panel">
              <div className="section-header">
                <h2>Admin Settings</h2>
              </div>

              {/* Settings Subtabs */}
              <div className="subtab-navigation">
                <button className={`subtab-btn ${settingsSubTab === "email" ? "active" : ""}`} onClick={() => setSettingsSubTab("email")}>
                  Email Delivery
                </button>
                <button className={`subtab-btn ${settingsSubTab === "saved-emails" ? "active" : ""}`} onClick={() => setSettingsSubTab("saved-emails")}>
                  Saved Emails
                </button>
                <button className={`subtab-btn ${settingsSubTab === "signature" ? "active" : ""}`} onClick={() => setSettingsSubTab("signature")}>
                   Signature
                </button>
                <button className={`subtab-btn ${settingsSubTab === "certificates" ? "active" : ""}`} onClick={() => setSettingsSubTab("certificates")}>
                   All Certificates
                </button>
              </div>

              {settingsSubTab === "email" && renderEmailProviderSettings()}

              {settingsSubTab === "saved-emails" && <div className="settings-section saved-emails-page">
                  <div className="saved-emails-header">
                    <div>
                      <h3>Saved Emails</h3>
                      <p className="section-description">Reuse previous custom messages without rewriting them. Sent custom emails are saved automatically.</p>
                    </div>
                    <button type="button" className="btn-primary" onClick={() => setSettingsSubTab("email")}>
                      <i className="fas fa-pen"></i> Compose email
                    </button>
                  </div>
                  {savedEmailMessages.length === 0 ? <div className="saved-emails-empty">
                      <i className="fas fa-envelope-open-text"></i>
                      <strong>No saved emails yet</strong>
                      <span>Send a custom email and it will appear here for quick reuse.</span>
                    </div> : <div className="saved-emails-grid">
                      {savedEmailMessages.map(savedMessage => <article className="saved-email-card" key={savedMessage.id}>
                          <div className="saved-email-card-top">
                            <span className="saved-email-icon"><i className="fas fa-envelope"></i></span>
                            <time>{savedMessage.savedAt ? new Date(savedMessage.savedAt).toLocaleDateString() : "Saved"}</time>
                          </div>
                          <h4>{savedMessage.subject}</h4>
                          <p className="saved-email-recipient">To: {savedMessage.recipientName || savedMessage.recipientEmail}</p>
                          <p className="saved-email-preview">{savedMessage.message}</p>
                          <div className="saved-email-actions">
                            <button type="button" className="btn-primary" onClick={() => reuseSavedEmailMessage(savedMessage)}>
                              <i className="fas fa-reply"></i> Reuse
                            </button>
                            <button type="button" className="btn-secondary" onClick={() => deleteSavedEmailMessage(savedMessage.id)}>
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </article>)}
                    </div>}
                </div>}

              {/* Signature Subtab */}
              {settingsSubTab === "signature" && <div className="settings-section">
                  <h3>Certificate Signature</h3>
                  <p className="section-description">
                    Upload a signature image that will appear on all generated certificates.
                    The signature will be displayed above "SAPTECH Awards 2026 Committee" text.
                  </p>

                  {currentSignature && <div className="current-signature">
                      <h4>Current Signature:</h4>
                      <div className="signature-info">
                        <p><strong>File:</strong> {currentSignature.originalName}</p>
                        <p><strong>Uploaded:</strong> {new Date(currentSignature.uploadedAt).toLocaleDateString()}</p>
                        <p><strong>Size:</strong> {(currentSignature.size / 1024).toFixed(2)} KB</p>
                      </div>
                      <button className="btn-delete" onClick={handleDeleteSignature}>
                         Delete Current Signature
                      </button>
                    </div>}

                  <form onSubmit={handleSignatureUpload} className="signature-upload-form">
                    <div className="form-group">
                      <label htmlFor="signatureFile">
                        {currentSignature ? "Upload New Signature" : "Upload Signature"}
                      </label>
                      <input type="file" id="signatureFile" accept="image/*" onChange={e => setSignatureFile(e.target.files[0])} disabled={uploadingSignature} />
                      {signatureFile && <p className="file-selected">
                          Selected: {signatureFile.name} ({(signatureFile.size / 1024).toFixed(2)} KB)
                        </p>}
                      <small>Accepted formats: any image format (Max 5MB)</small>
                    </div>

                    <button type="submit" className="btn-primary" disabled={!signatureFile || uploadingSignature}>
                      {uploadingSignature ? "Uploading..." : "Upload Signature"}
                    </button>
                  </form>

                  <div className="signature-preview-note">
                    <strong>Note:</strong> The signature will be embedded in certificates at 120x40 pixels.
                    For best results, use a transparent PNG with your signature centered.
                  </div>
                </div>}

              {/* Certificates List Subtab */}
              {settingsSubTab === "certificates" && <div className="settings-section">
                  <h3>Generated Certificates</h3>
                  <p className="section-description">
                    View and manage all generated certificates with verification links.
                  </p>

                  {/* Search and Filter Controls */}
                  <div className="certificates-controls">
                    <input type="text" placeholder="Search by nominee name or certificate ID..." value={certificatesSearch} onChange={e => setCertificatesSearch(e.target.value)} className="search-input" />
                    <select value={certificatesTypeFilter} onChange={e => setCertificatesTypeFilter(e.target.value)} className="filter-select">
                      <option value="">All Types</option>
                      <option value="winner">Winners</option>
                      <option value="finalist">Finalists</option>
                      <option value="participation">Participation</option>
                    </select>
                  </div>

                  {/* Certificates Table */}
                  {updating ? <div className="loading-state">Loading certificates...</div> : allCertificates.length === 0 ? <div className="empty-state">
                      <p>No certificates found. Generate certificates from the SAPTECH Awards 2026 tab.</p>
                    </div> : <>
                      <div className="certificates-table-container">
                        <table className="certificates-table">
                          <thead>
                            <tr>
                              <th>Nominee</th>
                              <th>Category</th>
                              <th>Type</th>
                              <th>Certificate ID</th>
                              <th>Generated</th>
                              <th>Storage</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allCertificates.map(cert => <tr key={cert._id}>
                                <td><strong>{cert.nomineeName}</strong></td>
                                <td>{cert.categoryName || "N/A"}</td>
                                <td>
                                  <span className={`badge badge-${cert.status}`}>
                                    {cert.status === "winner" ? " Winner" : cert.status === "finalist" ? " Finalist" : " Participation"}
                                  </span>
                                </td>
                                <td>
                                  <code className="cert-id">{cert.certificateId}</code>
                                </td>
                                <td>{new Date(cert.generatedAt).toLocaleDateString()}</td>
                                <td>
                                  <span className="badge badge-vps">
                                    VPS
                                  </span>
                                </td>
                                <td className="actions-cell">
                                  <a href={cert.downloadUrl} target="_blank" rel="noopener noreferrer" className="action-btn download-btn" title="Download Certificate">
                                     Download
                                  </a>
                                  <a href={cert.verificationUrl} target="_blank" rel="noopener noreferrer" className="action-btn verify-btn" title="View Verification Page">
                                     Verify
                                  </a>
                                  <button onClick={() => handleDeleteCertificate(cert._id, cert.nomineeName)} className="action-btn delete-btn" title="Delete Certificate" disabled={updating}>
                                     Delete
                                  </button>
                                </td>
                              </tr>)}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {certificatesPagination.totalPages > 1 && <div className="pagination">
                          <button className="btn-page" onClick={() => fetchAllCertificates(certificatesPagination.currentPage - 1)} disabled={!certificatesPagination.hasPrevPage}>
                             Previous
                          </button>
                          <span className="page-info">
                            Page {certificatesPagination.currentPage} of {certificatesPagination.totalPages}
                            ({certificatesPagination.totalCertificates || 0} certificates)
                          </span>
                          <button className="btn-page" onClick={() => fetchAllCertificates(certificatesPagination.currentPage + 1)} disabled={!certificatesPagination.hasNextPage}>
                            Next
                          </button>
                        </div>}
                    </>}
                </div>}
            </div>;
}
