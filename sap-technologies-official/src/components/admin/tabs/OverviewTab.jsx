import AdminDebugTools from "../../AdminDebugTools";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function OverviewTab({
  dashboardStats,
  renderExecutiveOverview,
  renderOperationsCenter
}) {
  return <div className="dashboard-overview">
                {renderExecutiveOverview()}

                <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDC65"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalUsers || 0}</h3>
                    <p>Total Users</p>
                    <small>+{dashboardStats?.stats?.newUsersLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDC51"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalAdmins || 0}</h3>
                    <p>Administrators</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCE7"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalContacts || 0}</h3>
                    <p>Contact Messages</p>
                    <small>+{dashboardStats?.stats?.newContactsLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCF0"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalNewsletterSubscribers || 0}</h3>
                    <p>Newsletter Subscribers</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDEE0\uFE0F"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalServices || 0}</h3>
                    <p>Services</p>
                    <small>{dashboardStats?.stats?.featuredServices || 0} featured</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCAC"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalServiceQuotes || 0}</h3>
                    <p>Service Quotes</p>
                    <small>+{dashboardStats?.stats?.newServiceQuotesLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDE80"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProjects || 0}</h3>
                    <p>Projects</p>
                    <small>{dashboardStats?.stats?.completedProjects || 0} completed</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83E\uDD1D"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalPartners || 0}</h3>
                    <p>Partners</p>
                    <small>{dashboardStats?.stats?.activePartners || 0} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDD14"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalPartnershipRequests || 0}</h3>
                    <p>Partnership Requests</p>
                    <small>{dashboardStats?.stats?.pendingPartnershipRequests || 0} pending</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCE6"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProducts || 0}</h3>
                    <p>Products</p>
                    <small>{dashboardStats?.stats?.featuredProducts || 0} featured</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDDBC\uFE0F"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalGalleryItems || 0}</h3>
                    <p>Gallery Items</p>
                    <small>{dashboardStats?.stats?.activeGalleryItems || 0} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCBC"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalJobs || 0}</h3>
                    <p>Job Posts</p>
                    <small>{dashboardStats?.stats?.activeJobs || 0} active</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCE8"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalJobApplications || 0}</h3>
                    <p>Job Applications</p>
                    <small>+{dashboardStats?.stats?.newJobApplicationsLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83D\uDCCB"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalProductInquiries || 0}</h3>
                    <p>Product Inquiries</p>
                    <small>+{dashboardStats?.stats?.newProductInquiriesLast30Days || 0} this month</small>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">{"\uD83C\uDFC6"}</div>
                  <div className="stat-info">
                    <h3>{dashboardStats?.stats?.totalAwards || 0}</h3>
                    <p>Award Nominations</p>
                    <small>{dashboardStats?.stats?.approvedAwards || 0} approved</small>
                  </div>
                </div>
              </div>

              {renderOperationsCenter()}

              <div className="recent-users">
                <h3>Recent Users</h3>
                <div className="users-list">
                  {dashboardStats?.recentUsers?.map(user => <div key={user._id} className="user-item">
                      <div className="user-info">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                      <div className="user-meta">
                        <span className={`role-badge ${user.role}`}>{user.role.toUpperCase()}</span>
                        <span className="join-date">
                          Joined: {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>)}
                </div>
              </div>

              {/* Debug Tools Section */}
              <div className="debug-section" style={{
      marginTop: '2rem'
    }}>
                <AdminDebugTools />
              </div>
            </div>;
}
