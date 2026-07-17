const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const STATUS_LABELS = {
  new: "New",
  pending: "Pending review",
  read: "Read by our team",
  replied: "Reply sent",
  reviewed: "Reviewed",
  contacted: "Contacted",
  resolved: "Resolved",
  closed: "Closed",
  archived: "Archived",
  quoted: "Quoted",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  converted: "Converted",
  interviewed: "Interview stage",
  winner: "Winner",
  finalist: "Finalist",
  approved: "Approved"
};

const TONES = {
  default: { accent: "#2563eb", soft: "#eff6ff", strong: "#1e3a8a" },
  success: { accent: "#047857", soft: "#ecfdf5", strong: "#064e3b" },
  warning: { accent: "#b45309", soft: "#fffbeb", strong: "#78350f" },
  danger: { accent: "#b91c1c", soft: "#fef2f2", strong: "#7f1d1d" },
  awards: { accent: "#7c3aed", soft: "#f5f3ff", strong: "#4c1d95" }
};

const escapeHtml = (value = "") => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const normalizeText = (value, fallback = "Not provided") => {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
};

const normalizeStatus = (status) => STATUS_LABELS[status] || normalizeText(status, "Updated");

const formatFileReference = (name, url) => {
  if (!name && !url) return "";
  if (name && url) return `${name} - ${url}`;
  return name || url;
};

const collectRecipients = (...values) => values.flatMap((value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
});

class EmailService {
  constructor() {
    this.brand = {
      name: process.env.EMAIL_FROM_NAME || process.env.BRAND_NAME || "SAPTech Uganda",
      awardsName: process.env.AWARDS_BRAND_NAME || "SAPTech Awards 2026",
      legalName: process.env.COMPANY_LEGAL_NAME || "SAPTech Uganda",
      websiteUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://saptechug.com",
      logoUrl: process.env.EMAIL_LOGO_URL || "",
      phone: process.env.COMPANY_PHONE || "+256 706 564 628",
      address: process.env.COMPANY_ADDRESS || "Ndejje, Kampala, Uganda",
      contactEmail: process.env.COMPANY_EMAIL || process.env.EMAIL_REPLY_TO || "info@saptechug.com"
    };

    const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    this.smtpSenderEmail = process.env.SMTP_FROM_EMAIL || smtpUser || "";
    this.replyToEmail = process.env.EMAIL_REPLY_TO || this.brand.contactEmail || "info@saptechug.com";
    this.notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || this.replyToEmail;
    this.fromEmail = process.env.EMAIL_FROM_ADDRESS
      || this.brand.contactEmail
      || process.env.SMTP_FROM_EMAIL
      || smtpUser
      || this.replyToEmail;
    this.fromName = process.env.EMAIL_FROM_NAME || this.brand.name;

    this.provider = "none";
    this.isConfigured = false;

    this.configureProvider();
  }

  configureProvider() {
    const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;
    if (!emailUser || !emailPass) {
      console.log("Email service not configured. Set SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_PASS.");
      return;
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT || 587);
    const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      pool: process.env.SMTP_POOL !== "false",
      maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
      maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 75),
      connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 30000),
      greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 30000),
      socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 45000),
      tls: {
        minVersion: "TLSv1.2",
        servername: host
      }
    });

    this.isConfigured = true;
    this.provider = "smtp";
    console.log(`Email service configured with SMTP ${host}:${port} (${secure ? "SSL" : "STARTTLS"})`);

    if (process.env.NODE_ENV !== "production") {
      this.transporter.verify((error) => {
        if (error) {
          console.warn(`SMTP verification failed: ${error.message}`);
        } else {
          console.log("SMTP connection verified.");
        }
      });
    }
  }

  extractEmail(address) {
    const match = String(address || "").match(/<([^>]+)>/);
    return (match ? match[1] : address || "").trim();
  }

  formatAddress(email = this.fromEmail, name = this.fromName) {
    const cleanEmail = this.extractEmail(email);
    if (!name) return cleanEmail;
    return `"${String(name).replace(/"/g, "")}" <${cleanEmail}>`;
  }

  formatDate(value = new Date()) {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "Not provided";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  htmlToText(html = "") {
    return String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<\/(p|div|tr|li|h1|h2|h3|h4)>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  buildRows(rows = []) {
    const visibleRows = rows.filter((row) => row && row.value !== undefined && row.value !== null && row.value !== "");
    if (!visibleRows.length) return "";

    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        ${visibleRows.map(({ label, value }) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </table>
    `;
  }

  buildSection(section = {}, tone) {
    const rows = this.buildRows(section.rows || []);
    const text = section.text
      ? `<p style="margin:0;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(section.text)}</p>`
      : "";
    const list = Array.isArray(section.list) && section.list.length
      ? `<ul style="margin:0;padding-left:20px;color:#334155;font-size:15px;line-height:1.8;">${section.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : "";

    return `
      <tr>
        <td style="padding:0 32px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${tone.soft};border:1px solid #dbeafe;border-left:4px solid ${tone.accent};border-radius:10px;">
            <tr>
              <td style="padding:20px;">
                <h3 style="margin:0 0 12px;color:${tone.strong};font-size:16px;line-height:1.35;">${escapeHtml(section.title || "Details")}</h3>
                ${rows}
                ${text}
                ${list}
                ${section.html || ""}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
  }

  buildEmail({
    title,
    preheader,
    greeting,
    intro,
    sections = [],
    cta,
    footerNote,
    tone = "default",
    brandName
  }) {
    const color = TONES[tone] || TONES.default;
    const companyName = brandName || this.brand.name;
    const hiddenPreheader = preheader
      ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>`
      : "";
    const logo = this.brand.logoUrl
      ? `<img src="${escapeHtml(this.brand.logoUrl)}" alt="${escapeHtml(companyName)}" width="120" style="display:block;border:0;margin:0 auto 12px;">`
      : "";

    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  ${hiddenPreheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#0f172a;padding:28px 32px;text-align:center;">
              ${logo}
              <p style="margin:0 0 8px;color:#93c5fd;font-size:13px;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(companyName)}</p>
              <h1 style="margin:0;color:#ffffff;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 32px 18px;">
              ${greeting ? `<p style="margin:0 0 14px;color:#0f172a;font-size:17px;font-weight:700;">${escapeHtml(greeting)}</p>` : ""}
              ${intro ? `<p style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>` : ""}
            </td>
          </tr>
          ${sections.map((section) => this.buildSection(section, color)).join("")}
          ${cta && cta.href ? `
          <tr>
            <td style="padding:2px 32px 28px;text-align:center;">
              <a href="${escapeHtml(cta.href)}" style="display:inline-block;background:${color.accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:8px;">${escapeHtml(cta.label || "Open")}</a>
            </td>
          </tr>` : ""}
          <tr>
            <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 32px;text-align:center;">
              <p style="margin:0 0 8px;color:#0f172a;font-size:14px;font-weight:700;">${escapeHtml(this.brand.legalName)}</p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
                ${escapeHtml(this.brand.address)}<br>
                ${escapeHtml(this.brand.phone)} | <a href="mailto:${escapeHtml(this.replyToEmail)}" style="color:${color.accent};text-decoration:none;">${escapeHtml(this.replyToEmail)}</a><br>
                <a href="${escapeHtml(this.brand.websiteUrl)}" style="color:${color.accent};text-decoration:none;">${escapeHtml(this.brand.websiteUrl)}</a>
              </p>
              ${footerNote ? `<p style="margin:14px 0 0;color:#94a3b8;font-size:12px;line-height:1.6;">${escapeHtml(footerNote)}</p>` : ""}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async prepareAttachments(attachments = []) {
    return Promise.all(attachments.map(async (attachment) => {
      if (attachment.content || !attachment.path) return attachment;
      const content = await fs.promises.readFile(attachment.path);
      return { ...attachment, content };
    }));
  }

  async sendEmail(emailOptions) {
    if (!this.isConfigured) {
      throw new Error("Email service is not configured. Add SMTP_USER/SMTP_PASS or GMAIL_USER/GMAIL_PASS.");
    }

    const attachments = await this.prepareAttachments(emailOptions.attachments || []);
    const fromName = emailOptions.fromName || this.fromName;
    const fromEmail = emailOptions.from || this.fromEmail;
    const envelopeRecipients = collectRecipients(emailOptions.to, emailOptions.cc, emailOptions.bcc);
    const html = emailOptions.html;
    const text = emailOptions.text || this.htmlToText(html);
    const headers = {
      "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      ...(emailOptions.headers || {})
    };

    await this.transporter.sendMail({
      from: this.formatAddress(fromEmail, fromName),
      envelope: this.smtpSenderEmail
        ? { from: this.smtpSenderEmail, to: envelopeRecipients }
        : undefined,
      to: emailOptions.to,
      cc: emailOptions.cc,
      bcc: emailOptions.bcc,
      replyTo: emailOptions.replyTo || this.replyToEmail,
      subject: emailOptions.subject,
      html,
      text,
      attachments,
      headers
    });
    return true;
  }

  async deliver(emailOptions) {
    if (!this.isConfigured) {
      console.log(`Email service not configured; skipped "${emailOptions.subject}".`);
      return false;
    }

    try {
      await this.sendEmail(emailOptions);
      console.log(`Email sent via ${this.provider}: ${emailOptions.subject} -> ${emailOptions.to}`);
      return true;
    } catch (error) {
      console.error(`Email failed: ${emailOptions.subject} -> ${emailOptions.to}: ${error.message}`);
      throw error;
    }
  }

  adminRows(source, data = {}) {
    return [
      { label: "Source", value: source },
      { label: "Received", value: this.formatDate(data.date || data.createdAt || new Date()) },
      { label: "Preferred contact", value: data.preferredContact },
      { label: "Customer email", value: data.email || data.customerEmail || data.contactEmail || data.applicantEmail },
      { label: "Customer phone", value: data.phone || data.customerPhone || data.applicantPhone }
    ];
  }

  async sendContactNotification(contactData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: contactData.email,
      subject: `New contact message from ${normalizeText(contactData.name, "Website visitor")}`,
      category: "contact_admin",
      html: this.buildEmail({
        title: "New Contact Message",
        preheader: "A visitor submitted the contact form.",
        intro: "A new message was submitted through the website contact page.",
        sections: [
          { title: "Contact details", rows: this.adminRows("Contact page", { ...contactData, date: new Date() }).concat([{ label: "Name", value: contactData.name }]) },
          { title: "Message", text: normalizeText(contactData.message, "No message provided") }
        ],
        cta: { label: "Reply by email", href: `mailto:${encodeURIComponent(contactData.email || "")}` }
      })
    });
  }

  async sendContactConfirmation(contactData) {
    return this.deliver({
      to: contactData.email,
      subject: "We received your message",
      category: "contact_confirmation",
      html: this.buildEmail({
        title: "Message Received",
        preheader: "Thank you for contacting SAPTech Uganda.",
        greeting: `Hello ${normalizeText(contactData.name, "there")}`,
        intro: "Thank you for reaching out to SAPTech Uganda. Our team has received your message and will respond as soon as possible.",
        sections: [
          { title: "Your submission", rows: [{ label: "Name", value: contactData.name }, { label: "Email", value: contactData.email }, { label: "Submitted", value: this.formatDate() }] },
          { title: "Message received", text: normalizeText(contactData.message, "No message provided") },
          { title: "What happens next", list: ["A team member will review your message.", "We will reply using the email address you provided.", "Urgent matters can be followed up by phone."] }
        ],
        footerNote: "You are receiving this because you submitted a contact form on the SAPTech Uganda website."
      })
    });
  }

  async sendContactStatusUpdate(contactData) {
    return this.deliver({
      to: contactData.email,
      subject: `Contact request update: ${normalizeStatus(contactData.status)}`,
      category: "contact_status",
      html: this.buildEmail({
        title: "Contact Request Update",
        preheader: "There is an update on your message to SAPTech Uganda.",
        greeting: `Hello ${normalizeText(contactData.name, "there")}`,
        intro: "There is an update on the message you sent to SAPTech Uganda.",
        sections: [
          {
            title: "Status details",
            rows: [
              { label: "Status", value: normalizeStatus(contactData.status) },
              { label: "Submitted", value: this.formatDate(contactData.submittedAt || contactData.createdAt) },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Your message", text: normalizeText(contactData.message, "No message provided") }
        ],
        cta: { label: "Contact SAPTech Uganda", href: `mailto:${this.replyToEmail}` }
      })
    });
  }

  async sendPartnershipNotification(partnershipData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: partnershipData.contactEmail,
      subject: `New partnership request from ${normalizeText(partnershipData.companyName, "a company")}`,
      category: "partnership_admin",
      html: this.buildEmail({
        title: "New Partnership Request",
        preheader: "A company submitted a partnership request.",
        intro: "A new partnership request has been submitted through the website.",
        sections: [
          {
            title: "Company details",
            rows: [
              { label: "Company", value: partnershipData.companyName },
              { label: "Contact person", value: partnershipData.contactPerson },
              { label: "Contact email", value: partnershipData.contactEmail },
              { label: "Website", value: partnershipData.website },
              { label: "Received", value: this.formatDate() }
            ]
          },
          { title: "Partnership brief", text: normalizeText(partnershipData.description, "No description provided") }
        ],
        cta: { label: "Reply to request", href: `mailto:${encodeURIComponent(partnershipData.contactEmail || "")}` }
      })
    });
  }

  async sendPartnershipConfirmation(partnershipData) {
    return this.deliver({
      to: partnershipData.contactEmail,
      subject: "Your partnership request was received",
      category: "partnership_confirmation",
      html: this.buildEmail({
        title: "Partnership Request Received",
        preheader: "Thank you for your interest in partnering with SAPTech Uganda.",
        greeting: `Hello ${normalizeText(partnershipData.contactPerson, "there")}`,
        intro: "Thank you for your interest in working with SAPTech Uganda. We have received your partnership request and our team will review it carefully.",
        sections: [
          {
            title: "Request summary",
            rows: [
              { label: "Company", value: partnershipData.companyName },
              { label: "Contact person", value: partnershipData.contactPerson },
              { label: "Contact email", value: partnershipData.contactEmail },
              { label: "Website", value: partnershipData.website },
              { label: "Submitted", value: this.formatDate() }
            ]
          },
          { title: "Your brief", text: normalizeText(partnershipData.description, "No description provided") },
          { title: "Next steps", list: ["We will review the fit and opportunity.", "Our team may contact you for more details.", "Approved partnership requests move into planning and onboarding."] }
        ],
        footerNote: "You are receiving this confirmation because a partnership request was submitted with this email address."
      })
    });
  }

  async sendPartnershipStatusUpdate(partnershipData) {
    return this.deliver({
      to: partnershipData.contactEmail,
      subject: `Partnership request update: ${normalizeStatus(partnershipData.status)}`,
      category: "partnership_status",
      html: this.buildEmail({
        tone: partnershipData.status === "rejected" ? "warning" : partnershipData.status === "approved" ? "success" : "default",
        title: "Partnership Request Update",
        preheader: "There is an update on your partnership request.",
        greeting: `Hello ${normalizeText(partnershipData.contactPerson, "there")}`,
        intro: "There is an update on the partnership request you submitted to SAPTech Uganda.",
        sections: [
          {
            title: "Status details",
            rows: [
              { label: "Company", value: partnershipData.companyName },
              { label: "Status", value: normalizeStatus(partnershipData.status) },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Team notes", text: normalizeText(partnershipData.adminNotes, "No additional notes were added.") }
        ],
        cta: { label: "Contact partnership team", href: `mailto:${this.replyToEmail}` }
      })
    });
  }

  async sendNewsletterWelcome(subscriberData) {
    return this.deliver({
      to: subscriberData.email,
      subject: "Welcome to SAPTech Uganda updates",
      category: "newsletter",
      html: this.buildEmail({
        title: "Welcome to SAPTech Updates",
        preheader: "You are now subscribed to SAPTech Uganda updates.",
        greeting: "Welcome",
        intro: "Thank you for subscribing. You will receive selected updates about technology services, products, events, awards, and opportunities from SAPTech Uganda.",
        sections: [
          { title: "Subscription details", rows: [{ label: "Email", value: subscriberData.email }, { label: "Subscribed", value: this.formatDate() }] },
          { title: "What to expect", list: ["Product and service updates.", "Event and awards announcements.", "Career and partnership opportunities.", "Useful technology insights from our team."] }
        ],
        cta: { label: "Visit SAPTech Uganda", href: this.brand.websiteUrl },
        footerNote: "You can unsubscribe from newsletter communications from the website."
      })
    });
  }

  async sendNewsletterUnsubscribeConfirmation(subscriberData) {
    return this.deliver({
      to: subscriberData.email,
      subject: "You have been unsubscribed from SAPTech Uganda updates",
      category: "newsletter_unsubscribe",
      html: this.buildEmail({
        tone: "warning",
        title: "Newsletter Unsubscribed",
        preheader: "You have been unsubscribed from SAPTech Uganda updates.",
        greeting: "Hello",
        intro: "You have been unsubscribed from SAPTech Uganda newsletter updates. You will no longer receive newsletter communications at this email address.",
        sections: [
          { title: "Subscription details", rows: [{ label: "Email", value: subscriberData.email }, { label: "Unsubscribed", value: this.formatDate(subscriberData.unsubscribedAt || new Date()) }] },
          { title: "Changed your mind?", text: "You can subscribe again from the website at any time." }
        ],
        cta: { label: "Visit SAPTech Uganda", href: this.brand.websiteUrl }
      })
    });
  }

  async sendUserSignupNotification(userData) {
    return this.deliver({
      to: userData.email,
      subject: "Welcome to your SAPTech Uganda account",
      category: "account_welcome",
      html: this.buildEmail({
        title: "Account Created",
        preheader: "Your SAPTech Uganda account is ready.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "Your account has been created successfully. You can now access your profile and use SAPTech Uganda services more smoothly.",
        sections: [
          { title: "Account details", rows: [{ label: "Name", value: userData.name }, { label: "Email", value: userData.email }, { label: "Created", value: this.formatDate() }] },
          { title: "Security note", list: ["Use a strong password.", "Do not share your account credentials.", "Contact us immediately if you notice suspicious activity."] }
        ],
        cta: { label: "Open your account", href: `${this.brand.websiteUrl}/account` }
      })
    });
  }

  async sendUserWelcome(userData) {
    return this.sendUserSignupNotification(userData);
  }

  async sendAdminUserSignupAlert(userData) {
    return this.deliver({
      to: this.notifyEmail,
      subject: `New user account: ${normalizeText(userData.name, userData.email)}`,
      category: "account_admin",
      html: this.buildEmail({
        title: "New User Registration",
        preheader: "A new user registered on the website.",
        intro: "A new user account was created on SAPTech Uganda.",
        sections: [
          { title: "User details", rows: [{ label: "Name", value: userData.name }, { label: "Email", value: userData.email }, { label: "User ID", value: userData.id }, { label: "Registered", value: this.formatDate() }] }
        ],
        cta: { label: "Open admin dashboard", href: `${this.brand.websiteUrl}/admin` }
      })
    });
  }

  async sendAdminAlert(alertData) {
    return this.deliver({
      to: this.notifyEmail,
      subject: alertData.subject || "SAPTech Uganda admin alert",
      category: "admin_alert",
      html: this.buildEmail({
        title: alertData.title || "Admin Alert",
        preheader: alertData.message || "A system alert was generated.",
        intro: alertData.message || "A system alert was generated.",
        sections: [{ title: "Alert details", rows: alertData.rows || [], text: alertData.details }]
      })
    });
  }

  async sendProductInquiryToAdmin(inquiryData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: inquiryData.customerEmail,
      subject: `Product inquiry: ${normalizeText(inquiryData.productName, "Product")}`,
      category: "product_inquiry_admin",
      html: this.buildEmail({
        title: "New Product Inquiry",
        preheader: "A customer asked about a product.",
        intro: "A product inquiry has been submitted on the website.",
        sections: [
          {
            title: "Inquiry details",
            rows: [
              { label: "Product", value: inquiryData.productName },
              { label: "Category", value: inquiryData.productCategory },
              { label: "Customer email", value: inquiryData.customerEmail },
              { label: "Customer phone", value: inquiryData.customerPhone },
              { label: "Preferred contact", value: inquiryData.preferredContact },
              { label: "Received", value: this.formatDate(inquiryData.inquiryDate) }
            ]
          },
          { title: "Customer message", text: normalizeText(inquiryData.message, "No message provided") }
        ],
        cta: { label: "Reply to customer", href: `mailto:${encodeURIComponent(inquiryData.customerEmail || "")}` }
      })
    });
  }

  async sendProductInquiryConfirmation(inquiryData) {
    return this.deliver({
      to: inquiryData.customerEmail,
      subject: `We received your inquiry about ${normalizeText(inquiryData.productName, "our product")}`,
      category: "product_inquiry_confirmation",
      html: this.buildEmail({
        title: "Product Inquiry Received",
        preheader: "Thank you for your product inquiry.",
        greeting: "Hello",
        intro: "Thank you for your interest in our products. Our team has received your inquiry and will follow up with the right details.",
        sections: [
          { title: "Inquiry summary", rows: [{ label: "Product", value: inquiryData.productName }, { label: "Email", value: inquiryData.customerEmail }, { label: "Submitted", value: this.formatDate() }] },
          { title: "Your message", text: normalizeText(inquiryData.message, "No message provided") },
          { title: "Next steps", list: ["We will review your request.", "A team member will contact you with product details.", "You can reply to this email if you need to add more information."] }
        ],
        cta: { label: "View products", href: `${this.brand.websiteUrl}/products` }
      })
    });
  }

  async sendProductInquiryStatusUpdate(inquiryData) {
    return this.deliver({
      to: inquiryData.customerEmail,
      subject: `Product inquiry update: ${normalizeStatus(inquiryData.status)}`,
      category: "product_inquiry_status",
      html: this.buildEmail({
        title: "Product Inquiry Update",
        preheader: "Your product inquiry status has changed.",
        greeting: "Hello",
        intro: "There is an update on your product inquiry with SAPTech Uganda.",
        sections: [
          {
            title: "Status update",
            rows: [
              { label: "Product", value: inquiryData.productName },
              { label: "Status", value: normalizeStatus(inquiryData.status) },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Team notes", text: normalizeText(inquiryData.adminNotes, "No additional notes were added.") }
        ],
        cta: { label: "Contact SAPTech Uganda", href: `mailto:${this.replyToEmail}` }
      })
    });
  }

  formatCartItems(items = []) {
    if (!items.length) return "No items listed.";
    return items.map((item, index) => {
      const name = item.productName || item.name || "Product";
      const quantity = item.quantity || 1;
      const price = item.price ? `, price: ${item.price}` : "";
      return `${index + 1}. ${name} - quantity: ${quantity}${price}`;
    }).join("\n");
  }

  async sendCartInquiryToAdmin({ items, customerName, customerEmail, customerPhone, preferredContact, message }) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: customerEmail,
      subject: `Cart inquiry from ${normalizeText(customerName, customerEmail)}`,
      category: "cart_inquiry_admin",
      html: this.buildEmail({
        title: "New Cart Inquiry",
        preheader: "A customer submitted a multi-product inquiry.",
        intro: "A customer submitted a cart inquiry with multiple products.",
        sections: [
          {
            title: "Customer details",
            rows: [
              { label: "Name", value: customerName },
              { label: "Email", value: customerEmail },
              { label: "Phone", value: customerPhone },
              { label: "Preferred contact", value: preferredContact },
              { label: "Received", value: this.formatDate() }
            ]
          },
          { title: "Requested products", text: this.formatCartItems(items) },
          { title: "Customer message", text: normalizeText(message, "No message provided") }
        ],
        cta: { label: "Reply to customer", href: `mailto:${encodeURIComponent(customerEmail || "")}` }
      })
    });
  }

  async sendCartInquiryConfirmation({ customerEmail, customerName, items }) {
    return this.deliver({
      to: customerEmail,
      subject: "We received your product enquiry",
      category: "cart_inquiry_confirmation",
      html: this.buildEmail({
        title: "Product Enquiry Received",
        preheader: "Your product enquiry was received.",
        greeting: `Hello ${normalizeText(customerName, "there")}`,
        intro: "Thank you for sending your product enquiry. We have received your selected items and will contact you with availability, pricing, and next steps.",
        sections: [
          { title: "Requested products", text: this.formatCartItems(items) },
          { title: "Next steps", list: ["Our team will review your selected products.", "We will confirm availability and any installation requirements.", "We will contact you using your provided email or phone number."] }
        ],
        cta: { label: "View more products", href: `${this.brand.websiteUrl}/products` }
      })
    });
  }

  async sendServiceQuoteToAdmin(quoteData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: quoteData.customerEmail,
      subject: `Service quote request: ${normalizeText(quoteData.serviceName, "Service")}`,
      category: "service_quote_admin",
      html: this.buildEmail({
        title: "New Service Quote Request",
        preheader: "A customer requested a service quote.",
        intro: "A new service quote request has been submitted through the website.",
        sections: [
          {
            title: "Quote details",
            rows: [
              { label: "Service", value: quoteData.serviceName },
              { label: "Category", value: quoteData.serviceCategory },
              { label: "Customer", value: quoteData.customerName },
              { label: "Email", value: quoteData.customerEmail },
              { label: "Phone", value: quoteData.customerPhone },
              { label: "Company", value: quoteData.companyName },
              { label: "Preferred contact", value: quoteData.preferredContact },
              { label: "Budget", value: quoteData.budget },
              { label: "Timeline", value: quoteData.timeline },
              { label: "Received", value: this.formatDate(quoteData.quoteDate) }
            ]
          },
          { title: "Project details", text: normalizeText(quoteData.projectDetails, "No project details provided") }
        ],
        cta: { label: "Reply to customer", href: `mailto:${encodeURIComponent(quoteData.customerEmail || "")}` }
      })
    });
  }

  async sendServiceQuoteConfirmation(quoteData) {
    return this.deliver({
      to: quoteData.customerEmail,
      subject: `We received your quote request for ${normalizeText(quoteData.serviceName, "our service")}`,
      category: "service_quote_confirmation",
      html: this.buildEmail({
        title: "Quote Request Received",
        preheader: "Your service quote request was received.",
        greeting: `Hello ${normalizeText(quoteData.customerName, "there")}`,
        intro: "Thank you for requesting a quote from SAPTech Uganda. Our team will review your project and contact you with the next steps.",
        sections: [
          { title: "Request summary", rows: [{ label: "Service", value: quoteData.serviceName }, { label: "Email", value: quoteData.customerEmail }, { label: "Submitted", value: this.formatDate() }] },
          { title: "Project details", text: normalizeText(quoteData.projectDetails, "No project details provided") },
          { title: "Next steps", list: ["We will review your requirements.", "We may contact you for clarification.", "You will receive guidance on scope, timeline, and pricing."] }
        ],
        cta: { label: "View services", href: `${this.brand.websiteUrl}/services` }
      })
    });
  }

  async sendServiceQuoteStatusUpdate(quoteData) {
    return this.deliver({
      to: quoteData.customerEmail,
      subject: `Service quote update: ${normalizeStatus(quoteData.status)}`,
      category: "service_quote_status",
      html: this.buildEmail({
        title: "Service Quote Update",
        preheader: "Your service quote status has changed.",
        greeting: `Hello ${normalizeText(quoteData.customerName, "there")}`,
        intro: "There is an update on your service quote request with SAPTech Uganda.",
        sections: [
          {
            title: "Status update",
            rows: [
              { label: "Service", value: quoteData.serviceName },
              { label: "Status", value: normalizeStatus(quoteData.status) },
              { label: "Budget", value: quoteData.budget },
              { label: "Timeline", value: quoteData.timeline },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Team notes", text: normalizeText(quoteData.adminNotes, "No additional notes were added.") }
        ],
        cta: { label: "Contact SAPTech Uganda", href: `mailto:${this.replyToEmail}` }
      })
    });
  }

  async queueNominationSubmissionEmail(nominationData) {
    const results = await Promise.allSettled([
      this.sendNominationSubmittedUser(nominationData),
      this.sendNominationSubmittedAdmin(nominationData)
    ]);

    const failed = results.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
    return true;
  }

  async sendNominationSubmittedUser(nominationData) {
    return this.deliver({
      to: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: "Your SAPTech Awards 2026 nomination was received",
      category: "awards_nomination_confirmation",
      html: this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "awards",
        title: "Nomination Received",
        preheader: "Your SAPTech Awards 2026 nomination has been received.",
        greeting: `Hello ${normalizeText(nominationData.nominatorName, "there")}`,
        intro: "Thank you for submitting a nomination for SAPTech Awards 2026. The awards team will review it before publication or further consideration.",
        sections: [
          {
            title: "Nomination summary",
            rows: [
              { label: "Nominee", value: nominationData.nomineeName },
              { label: "Category", value: nominationData.categoryName },
              { label: "Nominator", value: nominationData.nominatorName },
              { label: "Submitted", value: this.formatDate() }
            ]
          },
          { title: "Review process", list: ["The awards team reviews nominations for completeness.", "Approved nominations may be published for voting or recognition.", "You will receive email updates when the status changes."] }
        ],
        cta: { label: "View awards", href: `${this.brand.websiteUrl}/awards` }
      })
    });
  }

  async sendNominationSubmittedAdmin(nominationData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: `New SAPTech Awards 2026 nomination: ${normalizeText(nominationData.nomineeName, "Nominee")}`,
      category: "awards_nomination_admin",
      html: this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "awards",
        title: "New Awards Nomination",
        preheader: "A new SAPTech Awards 2026 nomination was submitted.",
        intro: "A new nomination needs review in the awards admin dashboard.",
        sections: [
          {
            title: "Nomination details",
            rows: [
              { label: "Nominee", value: nominationData.nomineeName },
              { label: "Category", value: nominationData.categoryName },
              { label: "Nominator", value: nominationData.nominatorName },
              { label: "Nominator email", value: nominationData.nominatorEmail },
              { label: "Received", value: this.formatDate() }
            ]
          }
        ],
        cta: { label: "Review nomination", href: `${this.brand.websiteUrl}/admin` }
      })
    });
  }

  async sendNominationStatusUpdate(nominationData) {
    const certificateHref = nominationData.certificateFile
      ? `${this.brand.websiteUrl}/awards`
      : undefined;

    return this.deliver({
      to: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: `SAPTech Awards 2026 nomination update: ${normalizeStatus(nominationData.status)}`,
      category: "awards_status",
      html: this.buildEmail({
        brandName: this.brand.awardsName,
        tone: nominationData.status === "rejected" ? "warning" : "awards",
        title: "Nomination Status Update",
        preheader: "Your SAPTech Awards 2026 nomination status has changed.",
        greeting: `Hello ${normalizeText(nominationData.nominatorName, "there")}`,
        intro: "There is an update on your SAPTech Awards 2026 nomination.",
        sections: [
          {
            title: "Status details",
            rows: [
              { label: "Nominee", value: nominationData.nomineeName },
              { label: "Category", value: nominationData.categoryName },
              { label: "Status", value: normalizeStatus(nominationData.status) },
              { label: "Certificate", value: nominationData.certificateFile ? "Generated" : "Not generated yet" },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Awards team notes", text: normalizeText(nominationData.adminNotes, "No additional notes were added.") }
        ],
        cta: certificateHref ? { label: "View awards", href: certificateHref } : { label: "Visit awards page", href: `${this.brand.websiteUrl}/awards` }
      })
    });
  }

  async sendNominationDeletedNotification(nominationData) {
    return this.deliver({
      to: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: "SAPTech Awards 2026 nomination update",
      category: "awards_deleted",
      html: this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "warning",
        title: "Nomination Removed",
        preheader: "A SAPTech Awards 2026 nomination was removed.",
        greeting: `Hello ${normalizeText(nominationData.nominatorName, "there")}`,
        intro: "We are writing to inform you that a nomination you submitted has been removed from SAPTech Awards 2026 records.",
        sections: [
          {
            title: "Nomination details",
            rows: [
              { label: "Nominee", value: nominationData.nomineeName },
              { label: "Category", value: nominationData.categoryName },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Reason or notes", text: normalizeText(nominationData.adminNotes, "No specific reason was provided.") }
        ],
        cta: { label: "Contact awards team", href: `mailto:${this.replyToEmail}` }
      })
    });
  }

  async queueJobApplicationEmail(applicationData) {
    const results = await Promise.allSettled([
      this.sendJobApplicationToAdmin(applicationData),
      this.sendJobApplicationConfirmation(applicationData)
    ]);

    const failed = results.find((result) => result.status === "rejected");
    if (failed) throw failed.reason;
    return true;
  }

  async sendJobApplicationToAdmin(applicationData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: applicationData.applicantEmail,
      subject: `New job application: ${normalizeText(applicationData.jobTitle, "Open role")}`,
      category: "job_application_admin",
      html: this.buildEmail({
        title: "New Job Application",
        preheader: "A candidate submitted a job application.",
        intro: "A new job application was submitted through the careers page.",
        sections: [
          {
            title: "Application details",
            rows: [
              { label: "Role", value: applicationData.jobTitle },
              { label: "Applicant", value: applicationData.applicantName },
              { label: "Email", value: applicationData.applicantEmail },
              { label: "Phone", value: applicationData.applicantPhone },
              { label: "Resume URL", value: applicationData.resumeUrl },
              { label: "CV / resume file", value: formatFileReference(applicationData.resumeFileName, applicationData.resumeFileUrl) },
              { label: "Cover letter file", value: formatFileReference(applicationData.coverLetterFileName, applicationData.coverLetterFileUrl) },
              { label: "Received", value: this.formatDate() }
            ]
          },
          { title: "Cover letter", text: normalizeText(applicationData.coverLetter, "No cover letter provided") }
        ],
        cta: { label: "Reply to applicant", href: `mailto:${encodeURIComponent(applicationData.applicantEmail || "")}` }
      })
    });
  }

  async sendJobApplicationConfirmation(applicationData) {
    return this.deliver({
      to: applicationData.applicantEmail,
      subject: `Application received for ${normalizeText(applicationData.jobTitle, "your role")}`,
      category: "job_application_confirmation",
      html: this.buildEmail({
        title: "Application Received",
        preheader: "Your job application was received.",
        greeting: `Hello ${normalizeText(applicationData.applicantName, "there")}`,
        intro: "Thank you for applying to SAPTech Uganda. Your application has been received and will be reviewed by our team.",
        sections: [
          {
            title: "Application summary",
            rows: [
              { label: "Role", value: applicationData.jobTitle },
              { label: "Applicant", value: applicationData.applicantName },
              { label: "Email", value: applicationData.applicantEmail },
              { label: "CV / resume file", value: applicationData.resumeFileName },
              { label: "Cover letter file", value: applicationData.coverLetterFileName },
              { label: "Submitted", value: this.formatDate() }
            ]
          },
          { title: "What happens next", list: ["We will review your application.", "Shortlisted candidates will be contacted for the next step.", "You can reply to this email if you need to update your information."] }
        ],
        cta: { label: "View careers", href: `${this.brand.websiteUrl}/careers` }
      })
    });
  }

  async sendJobApplicationStatusUpdate(applicationData) {
    return this.deliver({
      to: applicationData.applicantEmail,
      subject: `Application update: ${normalizeStatus(applicationData.status)}`,
      category: "job_application_status",
      html: this.buildEmail({
        tone: applicationData.status === "rejected" ? "warning" : "default",
        title: "Application Status Update",
        preheader: "Your job application status has changed.",
        greeting: `Hello ${normalizeText(applicationData.applicantName, "there")}`,
        intro: "There is an update on your job application with SAPTech Uganda.",
        sections: [
          {
            title: "Status details",
            rows: [
              { label: "Role", value: applicationData.jobTitle },
              { label: "Status", value: normalizeStatus(applicationData.status) },
              { label: "Updated", value: this.formatDate() }
            ]
          },
          { title: "Recruitment notes", text: normalizeText(applicationData.adminNotes, "No additional notes were added.") }
        ],
        cta: { label: "Contact HR", href: `mailto:${this.replyToEmail}` }
      })
    });
  }

  async sendCertificateEmail(certificateData) {
    const recipientEmail = certificateData.recipientEmail || certificateData.email || certificateData.nominatorEmail;
    const recipientName = certificateData.recipientName || certificateData.nomineeName || certificateData.name || "Recipient";
    const certificateFile = certificateData.certificateFile || certificateData.filename;
    const certificatePath = certificateData.certificatePath
      || (certificateFile ? path.join(__dirname, "../../uploads/certificates", certificateFile) : "");

    const attachments = [];
    if (certificatePath && fs.existsSync(certificatePath)) {
      attachments.push({
        filename: certificateFile || path.basename(certificatePath),
        path: certificatePath,
        contentType: "application/pdf"
      });
    }

    return this.deliver({
      to: recipientEmail,
      fromName: this.brand.awardsName,
      subject: `Your ${this.brand.awardsName} certificate`,
      category: "certificate",
      attachments,
      html: this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "awards",
        title: "Certificate Ready",
        preheader: "Your SAPTech Awards 2026 certificate is ready.",
        greeting: `Dear ${normalizeText(recipientName, "recipient")}`,
        intro: "Congratulations. Your official SAPTech Awards 2026 certificate has been prepared.",
        sections: [
          {
            title: "Certificate details",
            rows: [
              { label: "Recipient", value: recipientName },
              { label: "Category", value: certificateData.categoryName },
              { label: "Certificate ID", value: certificateData.certificateId },
              { label: "Recognition", value: normalizeStatus(certificateData.status) },
              { label: "Award year", value: "2026" }
            ]
          },
          { title: "How to use it", list: ["Keep the certificate for your professional records.", "Share it on LinkedIn or your portfolio.", "Contact our team if any details need correction."] }
        ],
        cta: certificateData.certificateUrl
          ? { label: "Open certificate", href: certificateData.certificateUrl }
          : { label: "Verify certificate", href: `${this.brand.websiteUrl}/verify/${certificateData.certificateId || ""}` }
      })
    });
  }

  async sendPasswordResetCode(userEmail, userName, verificationCode) {
    return this.deliver({
      to: userEmail,
      subject: "Your SAPTech Uganda password reset code",
      category: "password_reset",
      html: this.buildEmail({
        tone: "danger",
        title: "Password Reset Code",
        preheader: "Use this code to reset your SAPTech Uganda password.",
        greeting: `Hello ${normalizeText(userName, "there")}`,
        intro: "We received a request to reset your SAPTech Uganda account password. Use the verification code below to continue.",
        sections: [
          {
            title: "Verification code",
            html: `<p style="margin:0;color:#0f172a;font-size:30px;letter-spacing:6px;font-weight:800;text-align:center;">${escapeHtml(verificationCode)}</p><p style="margin:12px 0 0;color:#64748b;font-size:13px;text-align:center;">This code expires in 10 minutes.</p>`
          },
          { title: "Security reminder", list: ["Do not share this code with anyone.", "SAPTech Uganda will never ask for your password reset code.", "If you did not request this, you can ignore this email."] }
        ],
        footerNote: "This security email was sent because a password reset was requested for your account."
      })
    });
  }

  async sendPasswordChangeConfirmation(userEmail, userName) {
    return this.deliver({
      to: userEmail,
      subject: "Your SAPTech Uganda password was changed",
      category: "password_changed",
      html: this.buildEmail({
        tone: "success",
        title: "Password Changed",
        preheader: "Your password was changed successfully.",
        greeting: `Hello ${normalizeText(userName, "there")}`,
        intro: "Your SAPTech Uganda password was changed successfully.",
        sections: [
          { title: "Account security", rows: [{ label: "Changed", value: this.formatDate() }, { label: "Account email", value: userEmail }] },
          { title: "If this was not you", list: ["Contact SAPTech Uganda immediately.", "Do not share any reset codes you receive.", "Review your account activity after logging in."] }
        ],
        cta: { label: "Contact support", href: `mailto:${this.replyToEmail}` }
      })
    });
  }
}

module.exports = new EmailService();
