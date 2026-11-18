// Presentational admin view; state and actions are supplied by the dashboard.
export default function ServiceQuotesTab({
  fetchServiceQuotes,
  handleDeleteQuote,
  handleUpdateQuoteStatus,
  serviceQuotes,
  serviceQuotesPagination,
  serviceQuotesSearch,
  serviceQuotesStatusFilter,
  setServiceQuotesSearch,
  setServiceQuotesStatusFilter
}) {
  return <div className="tab-panel">
              <div className="section-header">
                <h2>Service Quote Requests</h2>
                <p>Customer quote requests for services - saved even if emails fail</p>
              </div>

              {/* Service Quotes Controls */}
              <div className="controls-section">
                <div className="right-controls">
                  <input type="text" placeholder="Search quotes..." value={serviceQuotesSearch} onChange={e => setServiceQuotesSearch(e.target.value)} className="search-input" />
                  <select value={serviceQuotesStatusFilter} onChange={e => setServiceQuotesStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Status</option>
                    <option value="new"> New</option>
                    <option value="contacted"> Contacted</option>
                    <option value="quoted"> Quoted</option>
                    <option value="accepted"> Accepted</option>
                    <option value="rejected"> Rejected</option>
                    <option value="expired"> Expired</option>
                  </select>
                </div>
              </div>

              {/* Service Quotes Table */}
              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Budget</th>
                        <th>Timeline</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceQuotes.length === 0 ? <tr>
                          <td colSpan="9" style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                            <div>
                              <p>No service quotes found</p>
                              <small>
                                {serviceQuotesSearch || serviceQuotesStatusFilter ? "Try adjusting your filters or search terms" : "Service quote requests will appear here when customers submit them"}
                              </small>
                            </div>
                          </td>
                        </tr> : serviceQuotes.map(quote => <tr key={quote._id}>
                            <td>
                              <strong>{quote.serviceName || 'Service Deleted'}</strong>
                            </td>
                            <td>
                              <div>
                                <strong>{quote.customerName}</strong>
                                <br />
                                <small>{quote.customerEmail}</small>
                              </div>
                            </td>
                            <td>{quote.companyName || '-'}</td>
                            <td>
                              <div>
                                {quote.customerPhone}
                                <br />
                                <span className="contact-method">
                                  {quote.preferredContact}
                                </span>
                              </div>
                            </td>
                            <td>{quote.budget || '-'}</td>
                            <td>{quote.timeline || '-'}</td>
                            <td>
                              <select value={quote.status || 'new'} onChange={e => handleUpdateQuoteStatus(quote._id, e.target.value)} className={`status-select status-${quote.status || 'new'}`}>
                                <option value="new"> New</option>
                                <option value="contacted"> Contacted</option>
                                <option value="quoted"> Quoted</option>
                                <option value="accepted"> Accepted</option>
                                <option value="rejected"> Rejected</option>
                                <option value="expired"> Expired</option>
                              </select>
                            </td>
                            <td>{new Date(quote.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-small btn-view" onClick={() => {
                    alert(`
Service: ${quote.serviceName}
Customer: ${quote.customerName}
Email: ${quote.customerEmail}
Phone: ${quote.customerPhone}
Company: ${quote.companyName || 'N/A'}
Preferred Contact: ${quote.preferredContact}
Budget: ${quote.budget || 'Not specified'}
Timeline: ${quote.timeline || 'Not specified'}
Project Details: ${quote.projectDetails}
Submitted: ${new Date(quote.createdAt).toLocaleString()}
IP: ${quote.metadata?.ipAddress || 'N/A'}
                                    `.trim());
                  }} title="View Details">
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button className="btn-small btn-delete" onClick={() => handleDeleteQuote(quote._id, quote.serviceName)} title="Delete Quote">
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>)}
                    </tbody>
                  </table>
                </div>

                {/* Service Quotes Pagination */}
                {serviceQuotesPagination.totalPages > 1 && <div className="pagination">
                    <button className="btn-page" onClick={() => fetchServiceQuotes(serviceQuotesPagination.currentPage - 1)} disabled={!serviceQuotesPagination.hasPrev}>
                       Previous
                    </button>
                    <span className="page-info">
                      Page {serviceQuotesPagination.currentPage} of {serviceQuotesPagination.totalPages}
                      ({serviceQuotesPagination.totalQuotes || 0} quotes)
                    </span>
                    <button className="btn-page" onClick={() => fetchServiceQuotes(serviceQuotesPagination.currentPage + 1)} disabled={!serviceQuotesPagination.hasNext}>
                      Next
                    </button>
                  </div>}
              </div>
            </div>;
}
