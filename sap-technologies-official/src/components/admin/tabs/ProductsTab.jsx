import { PLACEHOLDERS } from "../../../utils/imageUrl";
import apiService from "../../../services/api";
import { getImageUrl } from "../../../utils/imageUrl";
import { removeById } from "../../../utils/realtimeCollection";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function ProductsTab({
  fetchDashboardStats,
  fetchProducts,
  products,
  productsCategoryFilter,
  productsPagination,
  productsSearch,
  productsStatusFilter,
  setAutoMessage,
  setEditingProduct,
  setProducts,
  setProductsCategoryFilter,
  setProductsSearch,
  setProductsStatusFilter,
  setShowProductForm
}) {
  return <div className="tab-panel">
              <div className="section-header">
                <h2>Products Management</h2>
                <p>Manage your company's key products and technical specifications</p>
              </div>

              {/* Products Controls */}
              <div className="controls-section">
                <div className="left-controls">
                  <button className="btn btn-primary" onClick={() => setShowProductForm(true)}>
                    <i className="fas fa-plus"></i> Add New Product
                  </button>
                </div>

                <div className="right-controls">
                  <input type="text" placeholder="Search products..." value={productsSearch} onChange={e => setProductsSearch(e.target.value)} className="search-input" />
                  <select value={productsCategoryFilter} onChange={e => setProductsCategoryFilter(e.target.value)} className="filter-select">
                    <option value="">All Categories</option>
                    <option value="IoT Devices">IoT Devices</option>
                    <option value="Software Solutions">Software Solutions</option>
                    <option value="Web Applications">Web Applications</option>
                    <option value="Mobile Apps">Mobile Apps</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Electricals">Electricals</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Automation">Automation</option>
                    <option value="AI/ML Products">AI/ML Products</option>
                    <option value="Other">Other</option>
                  </select>
                  <select value={productsStatusFilter} onChange={e => setProductsStatusFilter(e.target.value)} className="filter-select">
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Featured</th>
                        <th>Price</th>
                        <th>Order</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.length === 0 ? <tr>
                          <td colSpan="9" style={{
                textAlign: 'center',
                padding: '2rem'
              }}>
                            <div>
                              <p>No products found</p>
                              <small>
                                {productsSearch || productsCategoryFilter || productsStatusFilter && productsStatusFilter !== "all" ? "Try adjusting your filters or search terms" : "Click 'Add New Product' to create your first product"}
                              </small>
                            </div>
                          </td>
                        </tr> : products.map(product => <tr key={product._id}>
                            <td>
                              <div className="product-image-cell">
                                <img src={getImageUrl(product.image) || PLACEHOLDERS.product} alt={product.name} className="table-product-image" onError={e => {
                    if (!e.target.dataset.errorHandled) {
                      e.target.dataset.errorHandled = 'true';
                      e.target.src = PLACEHOLDERS.error;
                    }
                  }} />
                              </div>
                            </td>
                            <td>
                              <div className="product-name-cell">
                                <strong>{product.name}</strong>
                                <small>{product.shortDescription}</small>
                              </div>
                            </td>
                            <td>
                              <span className="category-badge">{product.category}</span>
                            </td>
                            <td>
                              <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              <span className={`featured-badge ${product.isFeatured ? 'featured' : ''}`}>
                                {product.isFeatured ? 'Featured' : '-'}
                              </span>
                            </td>
                            <td>{product.formattedPrice || 'Contact for Price'}</td>
                            <td>{product.displayOrder}</td>
                            <td>{new Date(product.createdAt).toLocaleDateString()}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-small btn-edit" onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingProduct(product);
                    setShowProductForm(true);
                  }} title="Edit Product" style={{
                    cursor: "pointer",
                    pointerEvents: "auto"
                  }}>
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button className="btn-small btn-delete" onClick={async e => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
                      try {
                        await apiService.deleteProduct(product._id);
                        setProducts(prev => removeById(prev, product._id));
                        setAutoMessage(`Product "${product.name}" removed successfully`);
                        fetchProducts(productsPagination.currentPage);
                        fetchDashboardStats();
                      } catch (error) {
                        console.error('Delete product error:', error);
                        setAutoMessage("Couldn't delete product", true);
                      }
                    }
                  }} title="Delete Product" style={{
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

                {/* Products Pagination */}
                {productsPagination.totalPages > 1 && <div className="pagination">
                    <button className="btn-page" onClick={() => fetchProducts(productsPagination.currentPage - 1)} disabled={!productsPagination.hasPrev}>
                       Previous
                    </button>
                    <span className="page-info">
                      Page {productsPagination.currentPage} of {productsPagination.totalPages}
                      ({productsPagination.totalProducts || 0} products)
                    </span>
                    <button className="btn-page" onClick={() => fetchProducts(productsPagination.currentPage + 1)} disabled={!productsPagination.hasNext}>
                      Next
                    </button>
                  </div>}
              </div>
            </div>;
}
