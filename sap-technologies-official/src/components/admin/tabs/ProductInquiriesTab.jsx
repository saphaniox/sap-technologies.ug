// Presentational admin view; state and actions are supplied by the dashboard.
export default function ProductInquiriesTab({
  fetchProductInquiries,
  handleDeleteInquiry,
  handleUpdateInquiryStatus,
  productInquiries,
  productInquiriesPagination,
  productInquiriesSearch,
  productInquiriesStatusFilter,
  setProductInquiriesSearch,
  setProductInquiriesStatusFilter
}) {
  return <div className="tab-panel">
              <div className="section-header">
                <h2>Product Inquiries</h2>
                <p>Customer inquiries about products - saved even if emails fail</p>
              </div>

              {/* Product Inquiries Controls */}
              <div className="controls-section">
                <div className="right-controls">
                  <input type="text" placeholder="Search inquiries..." value={productInquiriesSearch} onChange={e => setProductInquiriesSearch(e.target.value)} className="search-input" />
                  <select value={productInquiriesStatusFilter} onChange={e => setProductInquiriesStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Status</option>
                    <option value="new"> New</option>
                    <option value="contacted"> Contacted</option>
                    <option value="resolved"> Resolved</option>
                    <option value="closed"> Closed</option>
                  </select>
                </div>
              </div>

              {/* Product Inquiries Table */}
              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Customer Email</th>
                        <th>Phone</th>
                        <th>Preferred Contact</th>
                        <th>Message</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productInquiries.length === 0 ? <tr>
                          <td colSpan="8" style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                            <div>
                              <p>No product inquiries found</p>
                              <small>
                                {productInquiriesSearch || productInquiriesStatusFilter ? "Try adjusting your filters or search terms" : "Product inquiries will appear here when customers submit them"}
                              </small>
                            </div>
                          </td>
                        </tr> : productInquiries.map(inquiry => <tr key={inquiry._id}>
                            <td>
                              <strong>{inquiry.productName || 'Product Deleted'}</strong>
                            </td>
                            <td>{inquiry.customerEmail}</td>
                            <td>{inquiry.customerPhone || '-'}</td>
                            <td>
                              <span className="contact-method">
                                {inquiry.preferredContact || 'Email'}
                              </span>
                            </td>
                            <td>
                              <div className="message-preview" title={inquiry.message}>
                                {inquiry.message?.substring(0, 50)}{inquiry.message?.length > 50 ? '...' : ''}
                              </div>
                            </td>
                            <td>
                              <select value={inquiry.status || 'new'} onChange={e => handleUpdateInquiryStatus(inquiry._id, e.target.value)} className={`status-select status-${inquiry.status || 'new'}`}>
                                <option value="new"> New</option>
                                <option value="contacted"> Contacted</option>
                                <option value="resolved"> Resolved</option>
                                <option value="closed"> Closed</option>
                              </select>
                            </td>
                            <td>{new Date(inquiry.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-small btn-view" onClick={() => {
                    alert(`
Product: ${inquiry.productName}
Customer: ${inquiry.customerEmail}
Phone: ${inquiry.customerPhone || 'N/A'}
Preferred Contact: ${inquiry.preferredContact}
Message: ${inquiry.message}
Submitted: ${new Date(inquiry.createdAt).toLocaleString()}
IP: ${inquiry.metadata?.ipAddress || 'N/A'}
                                    `.trim());
                  }} title="View Details">
                                  <i className="fas fa-eye"></i> View
                                </button>
                                <button className="btn-small btn-delete" onClick={() => handleDeleteInquiry(inquiry._id, inquiry.productName)} title="Delete Inquiry">
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>)}
                    </tbody>
                  </table>
                </div>

                {/* Product Inquiries Pagination */}
                {productInquiriesPagination.totalPages > 1 && <div className="pagination">
                    <button className="btn-page" onClick={() => fetchProductInquiries(productInquiriesPagination.currentPage - 1)} disabled={!productInquiriesPagination.hasPrev}>
                       Previous
                    </button>
                    <span className="page-info">
                      Page {productInquiriesPagination.currentPage} of {productInquiriesPagination.totalPages}
                      ({productInquiriesPagination.totalInquiries || 0} inquiries)
                    </span>
                    <button className="btn-page" onClick={() => fetchProductInquiries(productInquiriesPagination.currentPage + 1)} disabled={!productInquiriesPagination.hasNext}>
                      Next
                    </button>
                  </div>}
              </div>
            </div>;
}
