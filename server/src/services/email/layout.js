const {
  escapeHtml,
  emailTemplateContext,
  resolveTemplateTone,
  TONES
} = require("./shared");
module.exports = {
  buildRows(rows = []) {
    const visibleRows = rows.filter(row => row && row.value !== undefined && row.value !== null && row.value !== "");
    if (!visibleRows.length) return "";
    return `
      <table class="email-rows" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border-collapse:collapse;word-wrap:break-word;overflow-wrap:anywhere;">
        ${visibleRows.map(({
      label,
      value
    }) => `
          <tr class="email-row">
            <td class="email-row-label" style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#64748b;font-size:13px;width:38%;vertical-align:top;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(label)}</td>
            <td class="email-row-value" style="padding:10px 0;border-bottom:1px solid #e5e7eb;color:#0f172a;font-size:14px;font-weight:600;vertical-align:top;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </table>
    `;
  },
  buildSection(section = {}, color) {
    const rows = this.buildRows(section.rows || []);
    const text = section.text ? `<p class="email-section-text" style="margin:0;color:#334155;font-size:15px;line-height:1.7;white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(section.text)}</p>` : "";
    const list = Array.isArray(section.list) && section.list.length ? `<ul class="email-list" style="margin:0;padding-left:20px;color:#334155;font-size:15px;line-height:1.8;word-wrap:break-word;overflow-wrap:anywhere;word-break:break-word;">${section.list.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
    return `
      <tr>
        <td class="email-section-wrap" style="padding:0 32px 22px;">
          <table class="email-section" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color.soft};border:1px solid ${color.border || color.soft};border-left:4px solid ${color.accent};border-radius:10px;">
            <tr>
              <td class="email-section-body" style="padding:20px;">
                ${section.title ? `<h3 class="email-section-title" style="margin:0 0 12px;color:${color.strong};font-size:16px;line-height:1.35;">${escapeHtml(section.title)}</h3>` : ""}
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
  },
  buildEmail({
    title,
    preheader,
    greeting,
    intro,
    sections = [],
    cta,
    footerNote,
    unsubscribeUrl,
    tone = "default",
    category,
    brandName,
    skipStandardClosing = false
  }) {
    const templateCategory = category || emailTemplateContext.getStore()?.category || "";
    const templateTone = resolveTemplateTone(tone, templateCategory);
    const color = TONES[templateTone] || TONES.default;
    const companyName = brandName || this.brand.name;
    const greetingText = greeting && !/[,.!?]$/.test(greeting.trim()) ? `${greeting},` : greeting;
    const hiddenPreheader = preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>` : "";
    const logo = this.brand.logoUrl ? `<img class="email-logo" src="${escapeHtml(this.brand.logoUrl)}" alt="${escapeHtml(companyName)} logo" width="104" style="display:block;width:104px;max-width:104px;height:auto;border:0;margin:0 auto 14px;background:#ffffff;border-radius:14px;padding:8px;">` : "";
    const standardClosing = templateTone === "admin" ? "This is an internal notification for the SAPTech Uganda team." : "Questions? Reply to this email and our team will be happy to help.";
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(title)}</title>
  <style>
    body, table, td, p, a, li, h1, h3 { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; word-wrap: break-word; overflow-wrap: anywhere; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    .email-page { width: 100%; table-layout: fixed; }
    .email-card { width: 100%; max-width: 680px; table-layout: fixed; }
    .email-title, .email-copy, .email-section-title, .email-footer a { word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; }
    .email-button { display: inline-block; max-width: 100%; white-space: normal; word-wrap: break-word; overflow-wrap: anywhere; word-break: break-word; }
    @media only screen and (max-width: 520px) {
      .email-page { padding: 12px 6px !important; }
      .email-card { width: 100% !important; max-width: 100% !important; border-radius: 12px !important; }
      .email-header { padding: 22px 18px !important; }
      .email-logo { width: 76px !important; max-width: 76px !important; padding: 6px !important; margin-bottom: 12px !important; }
      .email-kicker { font-size: 11px !important; letter-spacing: .06em !important; }
      .email-tagline { font-size: 11px !important; line-height: 1.45 !important; margin-bottom: 12px !important; }
      .email-title { font-size: 22px !important; line-height: 1.22 !important; }
      .email-intro { padding: 22px 18px 14px !important; }
      .email-greeting { font-size: 16px !important; }
      .email-copy, .email-section-text, .email-list { font-size: 14px !important; line-height: 1.65 !important; }
      .email-section-wrap { padding: 0 18px 18px !important; }
      .email-section-body { padding: 16px !important; }
      .email-section-title { font-size: 15px !important; margin-bottom: 10px !important; }
      .email-row-label, .email-row-value { display: block !important; width: 100% !important; box-sizing: border-box !important; word-wrap: break-word !important; overflow-wrap: anywhere !important; word-break: break-word !important; }
      .email-row-label { padding: 10px 0 2px !important; border-bottom: 0 !important; font-size: 12px !important; }
      .email-row-value { padding: 0 0 10px !important; font-size: 14px !important; }
      .email-cta-wrap { padding: 2px 18px 24px !important; }
      .email-button { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 14px 16px !important; text-align: center !important; }
      .email-closing { padding: 0 18px 24px !important; }
      .email-footer { padding: 20px 18px !important; }
      .email-footer p { font-size: 12px !important; }
    }
    @media only screen and (max-width: 360px) {
      .email-header { padding: 20px 14px !important; }
      .email-title { font-size: 20px !important; }
      .email-intro, .email-section-wrap, .email-cta-wrap, .email-closing, .email-footer { padding-left: 14px !important; padding-right: 14px !important; }
      .email-section-body { padding: 14px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:${color.pageBg};font-family:Arial,Helvetica,sans-serif;">
  ${hiddenPreheader}
  <table class="email-page" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${color.pageBg};padding:28px 12px;">
    <tr>
      <td align="center">
        <table class="email-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border:1px solid ${color.border || "#e2e8f0"};border-radius:14px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
          <tr>
            <td class="email-header" style="background:${color.headerFrom};padding:28px 32px;text-align:center;">
              ${logo}
              <p class="email-kicker" style="margin:0 0 6px;color:${color.headerAccent};font-size:13px;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(companyName)}</p>
              <p class="email-tagline" style="margin:0 0 14px;color:${color.headerMuted};font-size:12px;line-height:1.5;">${escapeHtml(this.brand.tagline)}</p>
              <h1 class="email-title" style="margin:0;color:#ffffff;font-size:26px;line-height:1.25;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td class="email-intro" style="padding:30px 32px 18px;">
              ${greetingText ? `<p class="email-greeting" style="margin:0 0 14px;color:#0f172a;font-size:17px;font-weight:700;">${escapeHtml(greetingText)}</p>` : ""}
              ${intro ? `<p class="email-copy" style="margin:0;color:#334155;font-size:15px;line-height:1.7;">${escapeHtml(intro)}</p>` : ""}
            </td>
          </tr>
          ${sections.map(section => this.buildSection(section, color)).join("")}
          ${cta && cta.href ? `
          <tr>
            <td class="email-cta-wrap" style="padding:2px 32px 28px;text-align:center;">
              <a class="email-button" href="${escapeHtml(cta.href)}" style="display:inline-block;background:${color.accent};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 22px;border-radius:8px;">${escapeHtml(cta.label || "Open")}</a>
            </td>
          </tr>` : ""}
          ${skipStandardClosing ? "" : `<tr>
            <td class="email-closing" style="padding:0 32px 28px;">
              <p class="email-copy" style="margin:0;color:#334155;font-size:14px;line-height:1.7;">${escapeHtml(standardClosing)}</p>
              <p class="email-copy" style="margin:14px 0 0;color:#0f172a;font-size:14px;line-height:1.6;">Warm regards,<br><strong>The ${escapeHtml(companyName)} team</strong></p>
            </td>
          </tr>`}
          <tr>
            <td class="email-footer" style="background:#f8fafc;border-top:1px solid ${color.border || "#e2e8f0"};padding:22px 32px;text-align:center;word-wrap:break-word;overflow-wrap:anywhere;">
              <p style="margin:0 0 8px;color:#0f172a;font-size:14px;font-weight:700;">${escapeHtml(this.brand.legalName)}</p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.7;">
                ${escapeHtml(this.brand.address)}<br>
                ${escapeHtml(this.brand.phone)} | <a href="mailto:${escapeHtml(this.replyToEmail)}" style="color:${color.accent};text-decoration:none;">${escapeHtml(this.replyToEmail)}</a><br>
                <a href="${escapeHtml(this.brand.websiteUrl)}" style="color:${color.accent};text-decoration:none;">${escapeHtml(this.brand.websiteUrl)}</a>
              </p>
              ${unsubscribeUrl ? `<p class="email-unsubscribe" style="margin:14px 0 0;color:#475569;font-size:12px;line-height:1.6;">You are receiving these updates because you subscribed to the SAPTech Uganda newsletter. <a href="${escapeHtml(unsubscribeUrl)}" style="color:${color.accent};text-decoration:underline;">Unsubscribe</a></p>` : ""}
              ${footerNote ? `<p style="margin:14px 0 0;color:#64748b;font-size:12px;line-height:1.6;">${escapeHtml(footerNote)}</p>` : ""}
              <p style="margin:10px 0 0;color:#64748b;font-size:11px;line-height:1.6;">&copy; ${new Date().getFullYear()} ${escapeHtml(this.brand.legalName)}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
};
