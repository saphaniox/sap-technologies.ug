const {
  normalizeText,
  normalizeStatus
} = require("./shared");
module.exports = {
  adminRows(source, data = {}) {
    return [{
      label: "Source",
      value: source
    }, {
      label: "Received",
      value: this.formatDate(data.date || data.createdAt || new Date())
    }, {
      label: "Preferred contact",
      value: data.preferredContact
    }, {
      label: "Customer email",
      value: data.email || data.customerEmail || data.contactEmail || data.applicantEmail
    }, {
      label: "Customer phone",
      value: data.phone || data.customerPhone || data.applicantPhone
    }];
  },
  async sendContactNotification(contactData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: contactData.email,
      subject: `New contact message from ${normalizeText(contactData.name, "Website visitor")}`,
      category: "contact_admin",
      html: () => this.buildEmail({
        title: "New Contact Message",
        preheader: "A visitor submitted the contact form.",
        intro: "A new message was submitted through the website contact page.",
        sections: [{
          title: "Contact details",
          rows: this.adminRows("Contact page", {
            ...contactData,
            date: new Date()
          }).concat([{
            label: "Name",
            value: contactData.name
          }, {
            label: "Subject",
            value: contactData.subject || "Not provided"
          }, {
            label: "Phone",
            value: contactData.phone || "Not provided"
          }])
        }, {
          title: "Message",
          text: normalizeText(contactData.message, "No message provided")
        }],
        cta: {
          label: "Reply by email",
          href: `mailto:${encodeURIComponent(contactData.email || "")}`
        }
      })
    });
  },
  async sendContactConfirmation(contactData) {
    return this.deliver({
      to: contactData.email,
      subject: "We received your message",
      category: "contact_confirmation",
      html: () => this.buildEmail({
        title: "Message Received",
        preheader: "Thank you for contacting SAPTech Uganda.",
        greeting: `Hello ${normalizeText(contactData.name, "there")}`,
        intro: "Thank you for reaching out to SAPTech Uganda. Our team has received your message and will respond as soon as possible.",
        sections: [{
          title: "Your submission",
          rows: [{
            label: "Name",
            value: contactData.name
          }, {
            label: "Email",
            value: contactData.email
          }, {
            label: "Submitted",
            value: this.formatDate()
          }]
        }, {
          title: "Message received",
          text: normalizeText(contactData.message, "No message provided")
        }, {
          title: "What happens next",
          list: ["A team member will review your message.", "We will reply using the email address you provided.", "Urgent matters can be followed up by phone."]
        }],
        footerNote: "You are receiving this because you submitted a contact form on the SAPTech Uganda website."
      })
    });
  },
  async sendContactStatusUpdate(contactData) {
    return this.deliver({
      to: contactData.email,
      subject: `Contact request update: ${normalizeStatus(contactData.status)}`,
      category: "contact_status",
      html: () => this.buildEmail({
        title: "Contact Request Update",
        preheader: "There is an update on your message to SAPTech Uganda.",
        greeting: `Hello ${normalizeText(contactData.name, "there")}`,
        intro: "There is an update on the message you sent to SAPTech Uganda.",
        sections: [{
          title: "Status details",
          rows: [{
            label: "Status",
            value: normalizeStatus(contactData.status)
          }, {
            label: "Submitted",
            value: this.formatDate(contactData.submittedAt || contactData.createdAt)
          }, {
            label: "Updated",
            value: this.formatDate()
          }]
        }, {
          title: "Your message",
          text: normalizeText(contactData.message, "No message provided")
        }],
        cta: {
          label: "Contact SAPTech Uganda",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  },
  async sendPartnershipNotification(partnershipData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: partnershipData.contactEmail,
      subject: `New partnership request from ${normalizeText(partnershipData.companyName, "a company")}`,
      category: "partnership_admin",
      html: () => this.buildEmail({
        title: "New Partnership Request",
        preheader: "A company submitted a partnership request.",
        intro: "A new partnership request has been submitted through the website.",
        sections: [{
          title: "Company details",
          rows: [{
            label: "Company",
            value: partnershipData.companyName
          }, {
            label: "Contact person",
            value: partnershipData.contactPerson
          }, {
            label: "Contact email",
            value: partnershipData.contactEmail
          }, {
            label: "Website",
            value: partnershipData.website
          }, {
            label: "Received",
            value: this.formatDate()
          }]
        }, {
          title: "Partnership brief",
          text: normalizeText(partnershipData.description, "No description provided")
        }],
        cta: {
          label: "Reply to request",
          href: `mailto:${encodeURIComponent(partnershipData.contactEmail || "")}`
        }
      })
    });
  },
  async sendPartnershipConfirmation(partnershipData) {
    return this.deliver({
      to: partnershipData.contactEmail,
      subject: "Your partnership request was received",
      category: "partnership_confirmation",
      html: () => this.buildEmail({
        title: "Partnership Request Received",
        preheader: "Thank you for your interest in partnering with SAPTech Uganda.",
        greeting: `Hello ${normalizeText(partnershipData.contactPerson, "there")}`,
        intro: "Thank you for your interest in working with SAPTech Uganda. We have received your partnership request and our team will review it carefully.",
        sections: [{
          title: "Request summary",
          rows: [{
            label: "Company",
            value: partnershipData.companyName
          }, {
            label: "Contact person",
            value: partnershipData.contactPerson
          }, {
            label: "Contact email",
            value: partnershipData.contactEmail
          }, {
            label: "Website",
            value: partnershipData.website
          }, {
            label: "Submitted",
            value: this.formatDate()
          }]
        }, {
          title: "Your brief",
          text: normalizeText(partnershipData.description, "No description provided")
        }, {
          title: "Next steps",
          list: ["We will review the fit and opportunity.", "Our team may contact you for more details.", "Approved partnership requests move into planning and onboarding."]
        }],
        footerNote: "You are receiving this confirmation because a partnership request was submitted with this email address."
      })
    });
  },
  async sendPartnershipStatusUpdate(partnershipData) {
    return this.deliver({
      to: partnershipData.contactEmail,
      subject: `Partnership request update: ${normalizeStatus(partnershipData.status)}`,
      category: "partnership_status",
      html: () => this.buildEmail({
        tone: partnershipData.status === "rejected" ? "warning" : partnershipData.status === "approved" ? "success" : "default",
        title: "Partnership Request Update",
        preheader: "There is an update on your partnership request.",
        greeting: `Hello ${normalizeText(partnershipData.contactPerson, "there")}`,
        intro: "There is an update on the partnership request you submitted to SAPTech Uganda.",
        sections: [{
          title: "Status details",
          rows: [{
            label: "Company",
            value: partnershipData.companyName
          }, {
            label: "Status",
            value: normalizeStatus(partnershipData.status)
          }, {
            label: "Updated",
            value: this.formatDate()
          }]
        }, {
          title: "Team notes",
          text: normalizeText(partnershipData.adminNotes, "No additional notes were added.")
        }],
        cta: {
          label: "Contact partnership team",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  }
};
