import { getImageUrl } from "../../../utils/imageUrl";
import { getPartnerDisplayName } from "../utils/dashboardFormatters";
import { getPartnerInitial } from "../utils/dashboardFormatters";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function PartnersTab({
  fetchPartners,
  handlePartnerDelete,
  handlePartnerEdit,
  handlePartnerToggleActive,
  partners,
  partnersPagination,
  partnersSearch,
  partnersStatusFilter,
  setPartnersSearch,
  setPartnersStatusFilter,
  setShowPartnerForm
}) {
  return <div className="tab-panel">
              <div className="tab-panel-header">
                <h3>Partners Management</h3>
                <button className="btn-primary" onClick={() => setShowPartnerForm(true)}>
                  Add New Partner
                </button>
              </div>

              <div className="filters">
                <input type="text" placeholder="Search partners..." value={partnersSearch} onChange={e => setPartnersSearch(e.target.value)} className="search-input" />
                <select value={partnersStatusFilter} onChange={e => setPartnersStatusFilter(e.target.value)} className="filter-select">
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Logo</th>
                      <th>Name</th>
                      <th>Website</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Order</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map(partner => <tr key={partner._id}>
                        <td>
                          <div className="partner-logo-cell">
                            {partner.logo ? <img src={getImageUrl(partner.logo)} alt={`${getPartnerDisplayName(partner)} logo`} className="partner-logo-thumbnail" /> : <div className="logo-placeholder">
                                {getPartnerInitial(partner)}
                              </div>}
                          </div>
                        </td>
                        <td>{partner.name?.trim() || <span className="no-description">Logo only</span>}</td>
                        <td>
                          {partner.website ? <a href={partner.website} target="_blank" rel="noopener noreferrer" className="website-link">
                              Visit
                            </a> : <span className="no-website">-</span>}
                        </td>
                        <td>
                          <div className="description-cell">
                            {partner.description ? <span title={partner.description}>
                                {partner.description.length > 50 ? partner.description.substring(0, 50) + "..." : partner.description}
                              </span> : <span className="no-description">-</span>}
                          </div>
                        </td>
                        <td>
                          <button onClick={() => handlePartnerToggleActive(partner._id)} className={`status-badge ${partner.isActive ? "active" : "inactive"}`}>
                            {partner.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>{partner.order}</td>
                        <td className="actions">
                          <button onClick={() => handlePartnerEdit(partner)} className="btn-secondary btn-small">
                            Edit
                          </button>
                          <button onClick={() => handlePartnerDelete(partner._id, getPartnerDisplayName(partner))} className="btn-danger btn-small">
                            Delete
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {partners.length === 0 && <div className="empty-state">
                  <p>No partners found. Add your first partner to get started!</p>
                </div>}

              {partners.length > 0 && partnersPagination.totalPages > 1 && <div className="pagination">
                  <button onClick={() => fetchPartners(partnersPagination.currentPage - 1)} disabled={!partnersPagination.hasPrevPage} className="btn-secondary">
                    Previous
                  </button>
                  <span>
                    Page {partnersPagination.currentPage} of {partnersPagination.totalPages}
                  </span>
                  <button onClick={() => fetchPartners(partnersPagination.currentPage + 1)} disabled={!partnersPagination.hasNextPage} className="btn-secondary">
                    Next
                  </button>
                </div>}
            </div>;
}
