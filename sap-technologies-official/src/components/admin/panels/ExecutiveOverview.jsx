import { formatDashboardNumber } from "../utils/dashboardFormatters";
import { formatDateTime } from "../utils/dashboardFormatters";
import { getStatusClass } from "../utils/dashboardFormatters";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function ExecutiveOverview({
  dashboardStats,
  formatRelativeTime,
  formatStatusLabel,
  getEmailDelivery,
  renderStatusBreakdown,
  setActiveTab,
  systemHealthFetchedAt
}) {
  const stats = dashboardStats?.stats || {};
  const workQueue = dashboardStats?.workQueue || [];
  const pipeline = dashboardStats?.pipeline || {};
  const recentActivity = dashboardStats?.recentActivity || [];
  const emailDelivery = getEmailDelivery();
  const openWork = stats.totalOpenWork ?? workQueue.reduce((total, item) => total + Number(item.count || 0), 0);
  const newLeads = Number(stats.newContactsLast30Days || 0) + Number(stats.newProductInquiriesLast30Days || 0) + Number(stats.newServiceQuotesLast30Days || 0);
  return <section className="executive-overview">
        <div className="executive-hero">
          <div>
            <span className="executive-eyebrow">Live business snapshot</span>
            <h3>Admin Command Center</h3>
            <p>Real data from users, leads, content, careers, awards, visitors, and email delivery.</p>
          </div>
          <div className="executive-refresh">
            <span>Data refreshed</span>
            <strong>{formatDateTime(dashboardStats?.generatedAt || systemHealthFetchedAt)}</strong>
          </div>
        </div>

        <div className="executive-kpis">
          <article className="executive-kpi">
            <span>Open work</span>
            <strong>{formatDashboardNumber(openWork)}</strong>
            <small>Items waiting for admin action</small>
          </article>
          <article className="executive-kpi">
            <span>Visitors today</span>
            <strong>{formatDashboardNumber(stats.visitorsToday || dashboardStats?.traffic?.visitorsToday || 0)}</strong>
            <small>{formatDashboardNumber(stats.pageViewsToday || dashboardStats?.traffic?.pageViewsToday || 0)} page views</small>
          </article>
          <article className="executive-kpi">
            <span>New leads</span>
            <strong>{formatDashboardNumber(newLeads)}</strong>
            <small>Contacts, product inquiries and quotes this month</small>
          </article>
          <article className={`executive-kpi email-kpi ${emailDelivery.canSend ? "healthy" : "attention"}`}>
            <span>Email provider</span>
            <strong>{emailDelivery.activeProviderLabel || "Not configured"}</strong>
            <small>{emailDelivery.mode ? `${formatStatusLabel(emailDelivery.mode)} mode` : "Mode not loaded"}</small>
          </article>
        </div>

        <div className="dashboard-intelligence-grid">
          <article className="intelligence-panel work-queue-panel">
            <div className="panel-title-row">
              <div>
                <h4>Work Queue</h4>
                <p>Things that need attention first.</p>
              </div>
              <strong>{formatDashboardNumber(openWork)}</strong>
            </div>
            <div className="queue-list">
              {workQueue.length ? workQueue.map(item => <button type="button" key={item.key} className={`queue-item tone-${item.tone || "info"}`} onClick={() => setActiveTab(item.tab)}>
                  <span>{item.label}</span>
                  <strong>{formatDashboardNumber(item.count)}</strong>
                </button>) : <div className="dashboard-empty-state">No work queue data yet.</div>}
            </div>
          </article>

          <article className="intelligence-panel recent-activity-panel">
            <div className="panel-title-row">
              <div>
                <h4>Recent Activity</h4>
                <p>Newest activity across operational records.</p>
              </div>
            </div>
            <div className="activity-feed">
              {recentActivity.length ? recentActivity.map((activity, index) => <button type="button" className="activity-feed-item" key={`${activity.type}-${activity.createdAt}-${index}`} onClick={() => activity.tab && setActiveTab(activity.tab)}>
                  <span className={`activity-status ${getStatusClass(activity.status)}`}>{formatStatusLabel(activity.status)}</span>
                  <div>
                    <strong>{activity.title}</strong>
                    <small>{activity.type}{activity.subtitle ? ` - ${activity.subtitle}` : ""}</small>
                  </div>
                  <time>{formatRelativeTime(activity.createdAt)}</time>
                </button>) : <div className="dashboard-empty-state">No recent activity yet.</div>}
            </div>
          </article>
        </div>

        <div className="pipeline-grid">
          {renderStatusBreakdown("Contacts", pipeline.contactStatusCounts)}
          {renderStatusBreakdown("Product Inquiries", pipeline.productInquiryStatusCounts)}
          {renderStatusBreakdown("Service Quotes", pipeline.serviceQuoteStatusCounts)}
          {renderStatusBreakdown("Job Applications", pipeline.jobApplicationStatusCounts)}
        </div>
      </section>;
}
