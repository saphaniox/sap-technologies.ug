// Presentational admin view; state and actions are supplied by the dashboard.
export default function NewslettersTab({
  fetchNewsletters,
  handleNewsletterDelete,
  newsletters,
  newslettersPagination,
  newslettersSearch,
  setNewslettersSearch
}) {
  return <div className="newsletters-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input type="text" placeholder="Search subscribers..." value={newslettersSearch} onChange={e => setNewslettersSearch(e.target.value)} className="search-input" />
                </div>
                <button onClick={() => fetchNewsletters(1)} className="btn-refresh">
                   Refresh
                </button>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Subscribed Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {newsletters.map(subscriber => <tr key={subscriber._id}>
                        <td>{subscriber.email}</td>
                        <td>{new Date(subscriber.createdAt).toLocaleDateString()}</td>
                        <td className="actions">
                          <button onClick={() => handleNewsletterDelete(subscriber._id, subscriber.email)} className="btn-danger btn-small">
                            Unsubscribe
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button onClick={() => fetchNewsletters(newslettersPagination.currentPage - 1)} disabled={!newslettersPagination.hasPrevPage} className="btn-secondary">
                  Previous
                </button>
                <span>
                  Page {newslettersPagination.currentPage} of {newslettersPagination.totalPages}
                </span>
                <button onClick={() => fetchNewsletters(newslettersPagination.currentPage + 1)} disabled={!newslettersPagination.hasNextPage} className="btn-secondary">
                  Next
                </button>
              </div>
            </div>;
}
