// Presentational admin view; state and actions are supplied by the dashboard.
export default function EmailsTab({
  getEmailDelivery,
  renderEmailProviderSettings
}) {
  return <div className="admin-email-page">
                <div className="admin-email-page-header">
                  <div>
                    <span className="section-eyebrow">Communication workspace</span>
                    <h2>Emails</h2>
                    <p>Compose thoughtful messages, send them to any recipient, and reuse saved email drafts from one place.</p>
                  </div>
                  <div className="admin-email-page-status">
                    <span className={`email-health-dot ${getEmailDelivery().canSend ? "ready" : "offline"}`}></span>
                    <span>{getEmailDelivery().canSend ? "Ready to send" : "Email provider needs setup"}</span>
                  </div>
                </div>
                {renderEmailProviderSettings()}
              </div>;
}
