// Presentational admin view; state and actions are supplied by the dashboard.
export default function UsersTab({
  fetchUsers,
  handleUserDelete,
  handleUserRoleUpdate,
  setUsersRoleFilter,
  setUsersSearch,
  users,
  usersPagination,
  usersRoleFilter,
  usersSearch
}) {
  return <div className="users-section">
              <div className="section-header">
                <h3 className="section-title">User Management</h3>
                <div className="filters">
                  <input type="text" placeholder="Search users..." value={usersSearch} onChange={e => setUsersSearch(e.target.value)} className="search-input" />
                  <select value={usersRoleFilter} onChange={e => setUsersRoleFilter(e.target.value)} className="filter-select">
                    <option value="">All Roles</option>
                    <option value="user">Users</option>
                    <option value="admin">Admins</option>
                  </select>
                </div>
                <div className="action-buttons">
                  <button onClick={() => fetchUsers(1)} className="btn-refresh">
                     Refresh
                  </button>
                </div>
              </div>

              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Logins</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => <tr key={user._id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role.toUpperCase()}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>{user.loginCount || 0}</td>
                        <td>
                          <span className={`status-badge ${user.isActive ? "active" : "inactive"}`}>
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="actions">
                          <select value={user.role} onChange={e => handleUserRoleUpdate(user._id, e.target.value)} className="role-select">
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                          <button onClick={() => handleUserDelete(user._id, user.name)} className="btn-danger btn-small">
                            Delete
                          </button>
                        </td>
                      </tr>)}
                  </tbody>
                </table>
              </div>

              <div className="pagination">
                <button onClick={() => fetchUsers(usersPagination.currentPage - 1)} disabled={!usersPagination.hasPrevPage} className="btn-secondary">
                  Previous
                </button>
                <span>
                  Page {usersPagination.currentPage} of {usersPagination.totalPages}
                </span>
                <button onClick={() => fetchUsers(usersPagination.currentPage + 1)} disabled={!usersPagination.hasNextPage} className="btn-secondary">
                  Next
                </button>
              </div>
            </div>;
}
