// Presentational admin view; state and actions are supplied by the dashboard.
export default function ContactsTab({
  contacts,
  contactsPagination,
  contactsSearch,
  contactsStatusFilter,
  fetchContacts,
  handleContactDelete,
  handleContactStatusUpdate,
  setContactsSearch,
  setContactsStatusFilter
}) {
  return <div className="contacts-tab">
              <div className="tab-controls">
                <div className="search-filters">
                  <input type="text" placeholder="Search contacts..." value={contactsSearch} onChange={e => setContactsSearch(e.target.value)} className="search-input" />
                  <select value={contactsStatusFilter} onChange={e => setContactsStatusFilter(e.target.value)} className="filter-select">
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="read">Read</option>
                    <option value="replied">Replied</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <button onClick={() => fetchContacts(1)} className="btn-refresh">
                   Refresh
                </button>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Subject</th>
                      <th>Message</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => <tr key={contact._id}>
                        <td>{contact.name}</td>
                        <td>{contact.email}</td>
                        <td>{contact.phone || "N/A"}</td>
                        <td>{contact.subject || "General Inquiry"}</td>
                        <td className="message-cell">
                          {contact.message.length > 50 ? `${contact.message.substring(0, 50)}...` : contact.message}
                        </td>
                        <td>{new Date(contact.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${contact.status || "pending"}`}>
                            {(contact.status || "pending").toUpperCase()}
                          </span>
                        </td>
                        <td className="actions">
                          <select value={contact.status || "pending"} onChange={e => handleContactStatusUpdate(contact._id, e.target.value)} className="status-select">
                            <option value="pending">Pending</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                            <option value="archived">Archived</option>
                          </select>
                          <button onClick={() => handleContactDelete(contact._id, contact.name)} className="btn-danger btn-small">
                            Delete
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button onClick={() => fetchContacts(contactsPagination.currentPage - 1)} disabled={!contactsPagination.hasPrevPage} className="btn-secondary">
                  Previous
                </button>
                <span>
                  Page {contactsPagination.currentPage} of {contactsPagination.totalPages}
                </span>
                <button onClick={() => fetchContacts(contactsPagination.currentPage + 1)} disabled={!contactsPagination.hasNextPage} className="btn-secondary">
                  Next
                </button>
              </div>
            </div>;
}
