// Presentational admin view; state and actions are supplied by the dashboard.
export default function ServicesTab({
  fetchServices,
  handleServiceDelete,
  handleServiceEdit,
  handleServiceToggleFeatured,
  services,
  servicesCategoryFilter,
  servicesPagination,
  servicesSearch,
  servicesStatusFilter,
  setServicesCategoryFilter,
  setServicesSearch,
  setServicesStatusFilter,
  setShowServiceForm
}) {
  return <div className="services-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input type="text" placeholder="Search services..." value={servicesSearch} onChange={e => setServicesSearch(e.target.value)} className="search-input" />
                  <select value={servicesCategoryFilter} onChange={e => setServicesCategoryFilter(e.target.value)} className="filter-select">
                    <option value="">All Categories</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="IoT">IoT</option>
                    <option value="Graphics Design">Graphics Design</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </select>
                  <select value={servicesStatusFilter} onChange={e => setServicesStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
                <div className="action-buttons">
                  <button onClick={() => setShowServiceForm(true)} className="btn-primary">
                     Add Service
                  </button>
                  <button onClick={() => fetchServices(1)} className="btn-refresh">
                     Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Featured</th>
                      <th>Price</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map(service => <tr key={service._id}>
                        <td>{service.title}</td>
                        <td>{service.category}</td>
                        <td>
                          <span className={`status-badge ${service.status}`}>
                            {service.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => handleServiceToggleFeatured(service._id)} className={`btn-small ${service.featured ? "btn-warning" : "btn-secondary"}`}>
                            {service.featured ? "Yes" : "No"}
                          </button>
                        </td>
                        <td>
                          {service.pricing?.basePrice ? `${service.pricing.currency || "$"}${service.pricing.basePrice}` : "Contact"}
                        </td>
                        <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <div className="action-buttons">
                            <button className="btn-small btn-edit" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleServiceEdit(service);
                }} title="Edit Service" style={{
                  cursor: "pointer",
                  pointerEvents: "auto"
                }}>
                              <i className="fas fa-edit"></i> Edit
                            </button>
                            <button className="btn-small btn-delete" onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleServiceDelete(service._id, service.title);
                }} title="Delete Service" style={{
                  cursor: "pointer",
                  pointerEvents: "auto"
                }}>
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button onClick={() => fetchServices(servicesPagination.currentPage - 1)} disabled={!servicesPagination.hasPrevPage} className="btn-secondary">
                  Previous
                </button>
                <span>
                  Page {servicesPagination.currentPage} of {servicesPagination.totalPages}
                </span>
                <button onClick={() => fetchServices(servicesPagination.currentPage + 1)} disabled={!servicesPagination.hasNextPage} className="btn-secondary">
                  Next
                </button>
              </div>
            </div>;
}
