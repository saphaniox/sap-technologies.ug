const {
  normalizeText,
  normalizeStatus
} = require("./shared");
module.exports = {
  async queueNominationSubmissionEmail(nominationData) {
    const results = await Promise.allSettled([this.sendNominationSubmittedUser(nominationData), this.sendNominationSubmittedAdmin(nominationData)]);
    const failed = results.find(result => result.status === "rejected");
    if (failed) throw failed.reason;
    return true;
  },
  async sendNominationSubmittedUser(nominationData) {
    return this.deliver({
      to: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: "Your SAPTech Awards 2026 nomination was received",
      category: "awards_nomination_confirmation",
      html: () => this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "awards",
        title: "Nomination Received",
        preheader: "Your SAPTech Awards 2026 nomination has been received.",
        greeting: `Hello ${normalizeText(nominationData.nominatorName, "there")}`,
        intro: "Thank you for submitting a nomination for SAPTech Awards 2026. The awards team will review it before publication or further consideration.",
        sections: [{
          title: "Nomination summary",
          rows: [{
            label: "Nominee",
            value: nominationData.nomineeName
          }, {
            label: "Category",
            value: nominationData.categoryName
          }, {
            label: "Nominator",
            value: nominationData.nominatorName
          }, {
            label: "Submitted",
            value: this.formatDate()
          }]
        }, {
          title: "Review process",
          list: ["The awards team reviews nominations for completeness.", "Approved nominations may be published for voting or recognition.", "You will receive email updates when the status changes."]
        }],
        cta: {
          label: "View awards",
          href: `${this.brand.websiteUrl}/awards`
        }
      })
    });
  },
  async sendNominationSubmittedAdmin(nominationData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: `New SAPTech Awards 2026 nomination: ${normalizeText(nominationData.nomineeName, "Nominee")}`,
      category: "awards_nomination_admin",
      html: () => this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "awards",
        title: "New Awards Nomination",
        preheader: "A new SAPTech Awards 2026 nomination was submitted.",
        intro: "A new nomination needs review in the awards admin dashboard.",
        sections: [{
          title: "Nomination details",
          rows: [{
            label: "Nominee",
            value: nominationData.nomineeName
          }, {
            label: "Category",
            value: nominationData.categoryName
          }, {
            label: "Nominator",
            value: nominationData.nominatorName
          }, {
            label: "Nominator email",
            value: nominationData.nominatorEmail
          }, {
            label: "Received",
            value: this.formatDate()
          }]
        }],
        cta: {
          label: "Review nomination",
          href: `${this.brand.websiteUrl}/admin`
        }
      })
    });
  },
  async sendNominationStatusUpdate(nominationData) {
    const certificateHref = nominationData.certificateFile ? `${this.brand.websiteUrl}/awards` : undefined;
    return this.deliver({
      to: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: `SAPTech Awards 2026 nomination update: ${normalizeStatus(nominationData.status)}`,
      category: "awards_status",
      html: () => this.buildEmail({
        brandName: this.brand.awardsName,
        tone: nominationData.status === "rejected" ? "warning" : "awards",
        title: "Nomination Status Update",
        preheader: "Your SAPTech Awards 2026 nomination status has changed.",
        greeting: `Hello ${normalizeText(nominationData.nominatorName, "there")}`,
        intro: "There is an update on your SAPTech Awards 2026 nomination.",
        sections: [{
          title: "Status details",
          rows: [{
            label: "Nominee",
            value: nominationData.nomineeName
          }, {
            label: "Category",
            value: nominationData.categoryName
          }, {
            label: "Status",
            value: normalizeStatus(nominationData.status)
          }, {
            label: "Certificate",
            value: nominationData.certificateFile ? "Generated" : "Not generated yet"
          }, {
            label: "Updated",
            value: this.formatDate()
          }]
        }, {
          title: "Awards team notes",
          text: normalizeText(nominationData.adminNotes, "No additional notes were added.")
        }],
        cta: certificateHref ? {
          label: "View awards",
          href: certificateHref
        } : {
          label: "Visit awards page",
          href: `${this.brand.websiteUrl}/awards`
        }
      })
    });
  },
  async sendNominationDeletedNotification(nominationData) {
    return this.deliver({
      to: nominationData.nominatorEmail,
      fromName: this.brand.awardsName,
      subject: "SAPTech Awards 2026 nomination update",
      category: "awards_deleted",
      html: () => this.buildEmail({
        brandName: this.brand.awardsName,
        tone: "warning",
        title: "Nomination Removed",
        preheader: "A SAPTech Awards 2026 nomination was removed.",
        greeting: `Hello ${normalizeText(nominationData.nominatorName, "there")}`,
        intro: "We are writing to inform you that a nomination you submitted has been removed from SAPTech Awards 2026 records.",
        sections: [{
          title: "Nomination details",
          rows: [{
            label: "Nominee",
            value: nominationData.nomineeName
          }, {
            label: "Category",
            value: nominationData.categoryName
          }, {
            label: "Updated",
            value: this.formatDate()
          }]
        }, {
          title: "Reason or notes",
          text: normalizeText(nominationData.adminNotes, "No specific reason was provided.")
        }],
        cta: {
          label: "Contact awards team",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  }
};
