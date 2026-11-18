import { PLACEHOLDERS } from "../../../utils/imageUrl";
import { getGalleryMedia } from "../utils/dashboardFormatters";
import { getImageUrl } from "../../../utils/imageUrl";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function GalleryTab({
  fetchGalleryItems,
  filteredGalleryItems,
  gallerySearch,
  handleGalleryDelete,
  handleGalleryEdit,
  setEditingGallery,
  setGallerySearch,
  setShowGalleryForm
}) {
  return <div className="tab-panel">
              <div className="section-header">
                <h2>Gallery Management</h2>
                <p>Manage public gallery images, categories and display order</p>
              </div>

              <div className="controls-section">
                <div className="left-controls">
                  <button className="btn btn-primary" onClick={() => {
          setEditingGallery(null);
          setShowGalleryForm(true);
        }}>
                    <i className="fas fa-plus"></i> Add Gallery Item
                  </button>
                </div>

                <div className="right-controls">
                  <input type="text" placeholder="Search gallery..." value={gallerySearch} onChange={e => setGallerySearch(e.target.value)} className="search-input" />
                  <button className="btn-refresh" onClick={fetchGalleryItems}>
                    Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Image</th>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Order</th>
                        <th>Created</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredGalleryItems.length === 0 ? <tr>
                          <td colSpan="7" style={{
                textAlign: "center",
                padding: "2rem"
              }}>
                            <div>
                              <p>No gallery items found</p>
                              <small>
                                {gallerySearch ? "Try another search term" : "Click 'Add Gallery Item' to upload your first image"}
                              </small>
                            </div>
                          </td>
                        </tr> : filteredGalleryItems.map(item => {
              const media = getGalleryMedia(item);
              const primaryMedia = media.find(mediaItem => mediaItem.type === "image") || media[0];
              const primaryUrl = getImageUrl(primaryMedia?.url);
              return <tr key={item._id}>
                            <td>
                              <div className="product-image-cell gallery-media-cell">
                                {primaryMedia?.type === "video" ? <video src={primaryUrl} className="table-product-image" preload="metadata" muted /> : <img src={primaryUrl || PLACEHOLDERS.product} alt={item.title || "Gallery item"} className="table-product-image" onError={e => {
                      if (!e.target.dataset.errorHandled) {
                        e.target.dataset.errorHandled = "true";
                        e.target.src = PLACEHOLDERS.error;
                      }
                    }} />}
                                {primaryMedia?.type === "video" && <span className="gallery-table-badge">Video</span>}
                                {media.length > 1 && <span className="gallery-table-count">{media.length}</span>}
                              </div>
                            </td>
                            <td>
                              <strong>{item.title || "Untitled"}</strong>
                              {item.description && <small className="table-subtext">{item.description}</small>}
                            </td>
                            <td><span className="category-badge">{item.category || "other"}</span></td>
                            <td>
                              <span className={`status-badge ${item.isActive ? "active" : "inactive"}`}>
                                {item.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>{item.displayOrder || 0}</td>
                            <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}</td>
                            <td>
                              <div className="action-buttons">
                                <button className="btn-small btn-edit" onClick={() => handleGalleryEdit(item)} title="Edit Gallery Item">
                                  <i className="fas fa-edit"></i> Edit
                                </button>
                                <button className="btn-small btn-delete" onClick={() => handleGalleryDelete(item._id, item.title)} title="Delete Gallery Item">
                                  <i className="fas fa-trash"></i> Delete
                                </button>
                              </div>
                            </td>
                          </tr>;
            })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>;
}
