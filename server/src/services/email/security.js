const {
  normalizeText,
  escapeHtml
} = require("./shared");
module.exports = {
  async sendPasswordResetCode(userEmail, userName, verificationCode) {
    return this.deliver({
      to: userEmail,
      subject: "Your SAPTech Uganda password reset code",
      category: "password_reset",
      html: () => this.buildEmail({
        tone: "danger",
        title: "Password Reset Code",
        preheader: "Use this code to reset your SAPTech Uganda password.",
        greeting: `Hello ${normalizeText(userName, "there")}`,
        intro: "We received a request to reset your SAPTech Uganda account password. Use the verification code below to continue.",
        sections: [{
          title: "Verification code",
          html: `<p style="margin:0;color:#0f172a;font-size:30px;letter-spacing:6px;font-weight:800;text-align:center;">${escapeHtml(verificationCode)}</p><p style="margin:12px 0 0;color:#64748b;font-size:13px;text-align:center;">This code expires in 10 minutes.</p>`
        }, {
          title: "Security reminder",
          list: ["Do not share this code with anyone.", "SAPTech Uganda will never ask for your password reset code.", "If you did not request this, you can ignore this email."]
        }],
        footerNote: "This security email was sent because a password reset was requested for your account."
      })
    });
  },
  async sendPasswordChangeConfirmation(userEmail, userName) {
    return this.deliver({
      to: userEmail,
      subject: "Your SAPTech Uganda password was changed",
      category: "password_changed",
      html: () => this.buildEmail({
        tone: "success",
        title: "Password Changed",
        preheader: "Your password was changed successfully.",
        greeting: `Hello ${normalizeText(userName, "there")}`,
        intro: "Your SAPTech Uganda password was changed successfully.",
        sections: [{
          title: "Account security",
          rows: [{
            label: "Changed",
            value: this.formatDate()
          }, {
            label: "Account email",
            value: userEmail
          }]
        }, {
          title: "If this was not you",
          list: ["Contact SAPTech Uganda immediately.", "Do not share any reset codes you receive.", "Review your account activity after logging in."]
        }],
        cta: {
          label: "Contact support",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  }
};
