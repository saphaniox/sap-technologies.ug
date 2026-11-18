// Presentational admin view; state and actions are supplied by the dashboard.
export default function PartnershipRequestsTab({
  fetchPartnershipRequests,
  handleDeletePartnershipRequest,
  handlePartnershipRequestStatusUpdate,
  handleViewPartnershipRequest,
  partnershipRequests,
  partnershipRequestsPagination,
  partnershipRequestsSearch,
  partnershipRequestsStatusFilter,
  setPartnershipRequestsSearch,
  setPartnershipRequestsStatusFilter
}) {
  return <div className="tab-panel">
              <div className="tab-panel-header">
                <h3>Partnership Requests</h3>
                <button className="btn-primary" onClick={() => fetchPartnershipRequests(1)}>
                  Refresh
                </button>
              </div>

              <div className="filters">
                <input type="text" placeholder="Search partnership requests..." value={partnershipRequestsSearch} onChange={e => setPartnershipRequestsSearch(e.target.value)} className="search-input" />
                <select value={partnershipRequestsStatusFilter} onChange={e => setPartnershipRequestsStatusFilter(e.target.value)} className="filter-select">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="table-responsive">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Contact Person</th>
                      <th>Email</th>
                      <th>Website</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Submitted</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnershipRequests.map(request => <tr key={request._id}>
                        <td>{request.companyName}</td>
                        <td>{request.contactPerson}</td>
                        <td>
                          <a href={`mailto:${request.contactEmail}`} className="email-link">
                            {request.contactEmail}
                          </a>
                        </td>
                        <td>
                          {request.website ? <a href={request.website} target="_blank" rel="noopener noreferrer" className="website-link">
                              Visit
                            </a> : <span className="no-website">-</span>}
                        </td>
                        <td>
                          <div className="description-cell">
                            <span title={request.description}>
                              {request.description.length > 60 ? request.description.substring(0, 60) + "..." : request.description}
                            </span>
                          </div>
                        </td>
                        <td>
                          <select value={request.status} onChange={e => handlePartnershipRequestStatusUpdate(request._id, e.target.value)} className={`status-select status-${request.status}`}>
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td>
                          <span className="date-cell">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="actions">
                          <button onClick={() => handleViewPartnershipRequest(request)} className="btn-secondary btn-small">
                            View
                          </button>
                          <button onClick={() => handleDeletePartnershipRequest(request._id, request.companyName)} className="btn-danger btn-small">
                            Delete
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              {partnershipRequests.length === 0 && <div className="empty-state">
                  <p>No partnership requests found.</p>
                </div>}

              {partnershipRequests.length > 0 && partnershipRequestsPagination.totalPages > 1 && <div className="pagination">
                  <button onClick={() => fetchPartnershipRequests(partnershipRequestsPagination.currentPage - 1)} disabled={!partnershipRequestsPagination.hasPrevPage} className="btn-secondary">
                    Previous
                  </button>
                  <span>
                    Page {partnershipRequestsPagination.currentPage} of {partnershipRequestsPagination.totalPages}
                  </span>
                  <button onClick={() => fetchPartnershipRequests(partnershipRequestsPagination.currentPage + 1)} disabled={!partnershipRequestsPagination.hasNextPage} className="btn-secondary">
                    Next
                  </button>
                </div>}
            </div>;
}
