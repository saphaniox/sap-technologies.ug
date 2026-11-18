import { NOT_REPORTED } from "../utils/dashboardFormatters";
import { formatDateTime } from "../utils/dashboardFormatters";
// Presentational admin view; state and actions are supplied by the dashboard.
export default function EmailProviderSettings({
  customEmailForm,
  emailConfigForm,
  emailSettings,
  fetchEmailSettings,
  formatStatusLabel,
  getEmailDelivery,
  handleCustomEmailSend,
  handleEmailProviderChange,
  handleEmailSettingsSave,
  savingEmailProvider,
  savingEmailSettings,
  sendingCustomEmail,
  setCustomEmailForm,
  setEmailConfigForm,
  updateEmailConfigField
}) {
  const emailDelivery = getEmailDelivery();
  const mode = emailDelivery.mode || "auto";
  const form = emailConfigForm;
  const providerOptions = [{
    mode: "auto",
    label: "Auto",
    description: "Mailjet first, Gmail SMTP fallback if Mailjet cannot send."
  }, {
    mode: "mailjet",
    label: "Mailjet",
    description: "Send only through Mailjet API."
  }, {
    mode: "gmail",
    label: "Gmail",
    description: "Send only through Gmail SMTP."
  }];
  return <div className="settings-section email-settings-section">
        <div className="email-settings-header">
          <div>
            <h3>Email Delivery</h3>
            <p className="section-description">
              Choose how website emails are sent and edit safe branding details. API keys, secret keys, Gmail app passwords, database, JWT and session secrets stay in environment variables.
            </p>
          </div>
          <span className={`email-health-badge ${emailDelivery.canSend ? "online" : "offline"}`}>
            {emailDelivery.canSend ? "Ready to send" : "Needs configuration"}
          </span>
        </div>

        <form className="custom-email-composer" onSubmit={handleCustomEmailSend}>
          <div className="custom-email-composer-header">
            <div>
              <span className="section-eyebrow">Direct message</span>
              <h4>Send a custom email</h4>
              <p>Enter any recipient and send a branded SAPTech Uganda email.</p>
            </div>
            <span className="custom-email-badge">Admin only</span>
          </div>

          <div className="custom-email-fields">
            <label>
              Recipient email <span>Required</span>
              <input type="email" value={customEmailForm.recipientEmail} onChange={event => setCustomEmailForm(current => ({
            ...current,
            recipientEmail: event.target.value
          }))} placeholder="someone@example.com" required />
            </label>
            <label>
              Recipient name <small>Optional</small>
              <input type="text" value={customEmailForm.recipientName} onChange={event => setCustomEmailForm(current => ({
            ...current,
            recipientName: event.target.value
          }))} placeholder="Their name" />
            </label>
            <label className="custom-email-wide">
              Subject <span>Required</span>
              <input type="text" maxLength={160} value={customEmailForm.subject} onChange={event => setCustomEmailForm(current => ({
            ...current,
            subject: event.target.value
          }))} placeholder="Email subject" required />
            </label>
            <label className="custom-email-wide">
              Message <span>Required</span>
              <textarea rows={7} maxLength={4000} value={customEmailForm.message} onChange={event => setCustomEmailForm(current => ({
            ...current,
            message: event.target.value
          }))} placeholder="Write your professional message..." required />
              <small className="custom-email-counter">{customEmailForm.message.length}/4000 characters</small>
            </label>
          </div>

          <div className="custom-email-actions">
            <button type="button" className="btn-secondary" onClick={() => setCustomEmailForm({
          recipientEmail: "",
          recipientName: "",
          subject: "",
          message: ""
        })} disabled={sendingCustomEmail}>
              Clear
            </button>
            <button type="submit" className="btn-primary" disabled={sendingCustomEmail || !emailDelivery.canSend}>
              <i className="fas fa-paper-plane"></i> {sendingCustomEmail ? "Sending..." : "Send custom email"}
            </button>
          </div>
        </form>

        <div className="email-provider-summary">
          <div>
            <span>Current mode</span>
            <strong>{formatStatusLabel(mode)}</strong>
          </div>
          <div>
            <span>Active provider</span>
            <strong>{emailDelivery.activeProviderLabel || "Not configured"}</strong>
          </div>
          <div>
            <span>Delivery chain</span>
            <strong>{emailDelivery.deliveryChainLabel || "No provider configured"}</strong>
          </div>
          <div>
            <span>Last changed</span>
            <strong>{formatDateTime(emailSettings?.setting?.updatedAt)}</strong>
          </div>
        </div>

        <form className="email-settings-form" onSubmit={handleEmailSettingsSave}>
          <div className="email-form-section">
            <div className="email-form-section-header">
              <h4>Safe Dashboard Settings</h4>
              <p>No API keys or passwords are stored here.</p>
            </div>

            <div className="email-settings-grid">
              <label>
                Provider Mode
                <select value={form.providerMode} onChange={event => setEmailConfigForm(current => ({
              ...current,
              providerMode: event.target.value
            }))}>
                  <option value="auto">Auto</option>
                  <option value="mailjet">Mailjet only</option>
                  <option value="gmail">Gmail only</option>
                </select>
              </label>
              <label>
                From Name
                <input type="text" value={form.sender.fromName} onChange={event => updateEmailConfigField("sender", "fromName", event.target.value)} />
              </label>
              <label>
                From Email
                <input type="email" value={form.sender.fromEmail} onChange={event => updateEmailConfigField("sender", "fromEmail", event.target.value)} />
              </label>
              <label>
                Reply-To Email
                <input type="email" value={form.sender.replyTo} onChange={event => updateEmailConfigField("sender", "replyTo", event.target.value)} />
              </label>
              <label>
                Admin Notification Email
                <input type="email" value={form.sender.notifyEmail} onChange={event => updateEmailConfigField("sender", "notifyEmail", event.target.value)} />
              </label>
              <label>
                Careers/HR Email
                <input type="email" value={form.brand.careersEmail} onChange={event => updateEmailConfigField("brand", "careersEmail", event.target.value)} />
              </label>
              <label>
                Logo URL
                <input type="url" value={form.brand.logoUrl} onChange={event => updateEmailConfigField("brand", "logoUrl", event.target.value)} />
              </label>
              <label>
                Brand Tagline
                <input type="text" value={form.brand.tagline} onChange={event => updateEmailConfigField("brand", "tagline", event.target.value)} />
              </label>
              <label>
                Company Phone
                <input type="text" value={form.brand.phone} onChange={event => updateEmailConfigField("brand", "phone", event.target.value)} />
              </label>
              <label className="email-form-wide">
                Company Address
                <input type="text" value={form.brand.address} onChange={event => updateEmailConfigField("brand", "address", event.target.value)} />
              </label>
              <label>
                Mailjet Sender Email
                <input type="email" value={form.mailjet.fromEmail} onChange={event => updateEmailConfigField("mailjet", "fromEmail", event.target.value)} />
              </label>
              <label>
                Mailjet Timeout
                <input type="number" min="3000" step="1000" value={form.mailjet.timeoutMs} onChange={event => updateEmailConfigField("mailjet", "timeoutMs", event.target.value)} />
              </label>
              <label>
                Gmail Sender Email
                <input type="email" value={form.gmail.fromEmail} onChange={event => updateEmailConfigField("gmail", "fromEmail", event.target.value)} />
              </label>
              <label className="email-checkbox-row">
                <input type="checkbox" checked={Boolean(form.mailjet.sandboxMode)} onChange={event => updateEmailConfigField("mailjet", "sandboxMode", event.target.checked)} />
                Mailjet sandbox mode
              </label>
            </div>

            <div className="email-sensitive-note">
              Keep `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `GMAIL_USER`, and `GMAIL_PASS` in Render env. The dashboard only changes safe display and routing settings.
            </div>

            <div className="settings-actions">
              <button type="submit" className="btn-primary" disabled={savingEmailSettings}>
                {savingEmailSettings ? "Saving..." : "Save Email Settings"}
              </button>
              <button type="button" className="btn-secondary" onClick={fetchEmailSettings} disabled={savingEmailSettings}>
                Reload
              </button>
            </div>
          </div>
        </form>

        <div className="provider-option-grid">
          {providerOptions.map(option => {
        const providerInfo = emailDelivery.providers?.[option.mode] || {};
        const isAvailable = providerInfo.available ?? option.mode === "auto";
        const isActive = mode === option.mode;
        return <button type="button" key={option.mode} className={`provider-option-card ${isActive ? "active" : ""} ${!isAvailable ? "disabled" : ""}`} disabled={savingEmailProvider || !isAvailable || isActive} onClick={() => handleEmailProviderChange(option.mode)}>
                <div>
                  <span>{option.label}</span>
                  <strong>{isActive ? "Active" : isAvailable ? "Available" : "Not configured"}</strong>
                </div>
                <p>{providerInfo.description || option.description}</p>
              </button>;
      })}
        </div>

        <div className="email-config-grid">
          <div className="email-config-card">
            <span>Mailjet</span>
            <strong>{emailDelivery.configured?.mailjet ? "Env keys configured" : "Env keys missing"}</strong>
            <small>{emailDelivery.sender?.mailjetFromEmail || "MAILJET_API_KEY and MAILJET_SECRET_KEY stay in env"}</small>
          </div>
          <div className="email-config-card">
            <span>Gmail SMTP</span>
            <strong>{emailDelivery.configured?.gmail ? "Env credentials configured" : "Env credentials missing"}</strong>
            <small>{emailDelivery.sender?.smtpFromEmail || "GMAIL_USER and GMAIL_PASS stay in env"}</small>
          </div>
          <div className="email-config-card">
            <span>Reply-to</span>
            <strong>{emailDelivery.sender?.replyTo || NOT_REPORTED}</strong>
            <small>Recipients can reply directly to this address.</small>
          </div>
        </div>

        {savingEmailProvider && <div className="settings-saving-note">Saving email provider...</div>}
      </div>;
}
