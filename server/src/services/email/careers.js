const {
  normalizeText,
  formatFileReference,
  getJobApplicationStatusContent,
  normalizeStatus
} = require("./shared");
module.exports = {
  async queueJobApplicationEmail(applicationData) {
    const results = await Promise.allSettled([this.sendJobApplicationToAdmin(applicationData), this.sendJobApplicationConfirmation(applicationData)]);
    const failed = results.find(result => result.status === "rejected");
    if (failed) throw failed.reason;
    return true;
  },
  async sendJobApplicationToAdmin(applicationData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: applicationData.applicantEmail,
      subject: `New job application: ${normalizeText(applicationData.jobTitle, "Open role")}`,
      category: "job_application_admin",
      html: () => this.buildEmail({
        title: "New Job Application",
        preheader: "A candidate submitted a job application.",
        intro: "A new job application was submitted through the careers page.",
        sections: [{
          title: "Application details",
          rows: [{
            label: "Role",
            value: applicationData.jobTitle
          }, {
            label: "Applicant",
            value: applicationData.applicantName
          }, {
            label: "Email",
            value: applicationData.applicantEmail
          }, {
            label: "Phone",
            value: applicationData.applicantPhone
          }, {
            label: "Resume URL",
            value: applicationData.resumeUrl
          }, {
            label: "CV / resume file",
            value: formatFileReference(applicationData.resumeFileName, applicationData.resumeFileUrl)
          }, {
            label: "Cover letter file",
            value: formatFileReference(applicationData.coverLetterFileName, applicationData.coverLetterFileUrl)
          }, {
            label: "Received",
            value: this.formatDate()
          }]
        }, {
          title: "Cover letter",
          text: normalizeText(applicationData.coverLetter, "No cover letter provided")
        }],
        cta: {
          label: "Reply to applicant",
          href: `mailto:${encodeURIComponent(applicationData.applicantEmail || "")}`
        }
      })
    });
  },
  async sendJobApplicationConfirmation(applicationData) {
    return this.deliver({
      to: applicationData.applicantEmail,
      subject: `Application received for ${normalizeText(applicationData.jobTitle, "your role")}`,
      category: "job_application_confirmation",
      html: () => this.buildEmail({
        title: "Application Received",
        preheader: "Your job application was received.",
        greeting: `Hello ${normalizeText(applicationData.applicantName, "there")}`,
        intro: "Thank you for applying to SAPTech Uganda. Your application has been received and will be reviewed by our team.",
        sections: [{
          title: "Application summary",
          rows: [{
            label: "Role",
            value: applicationData.jobTitle
          }, {
            label: "Applicant",
            value: applicationData.applicantName
          }, {
            label: "Email",
            value: applicationData.applicantEmail
          }, {
            label: "CV / resume file",
            value: applicationData.resumeFileName
          }, {
            label: "Cover letter file",
            value: applicationData.coverLetterFileName
          }, {
            label: "Submitted",
            value: this.formatDate()
          }]
        }, {
          title: "What happens next",
          list: ["We will review your application.", "Shortlisted candidates will be contacted for the next step.", "You can reply to this email if you need to update your information."]
        }],
        cta: {
          label: "View careers",
          href: `${this.brand.websiteUrl}/careers`
        }
      })
    });
  },
  async sendJobApplicationStatusUpdate(applicationData) {
    const statusContent = getJobApplicationStatusContent(applicationData.status);
    const sections = [{
      title: "Application details",
      rows: [{
        label: "Role",
        value: applicationData.jobTitle
      }, {
        label: "Previous status",
        value: applicationData.previousStatus ? normalizeStatus(applicationData.previousStatus) : ""
      }, {
        label: "Current status",
        value: normalizeStatus(applicationData.status)
      }, {
        label: "Updated",
        value: this.formatDate()
      }]
    }];
    if (applicationData.adminNotes) {
      sections.push({
        title: "Message from the recruitment team",
        text: normalizeText(applicationData.adminNotes, "")
      });
    }
    sections.push({
      title: "What happens next",
      list: statusContent.nextSteps
    });
    return this.deliver({
      to: applicationData.applicantEmail,
      subject: statusContent.subject,
      category: "job_application_status",
      html: () => this.buildEmail({
        tone: statusContent.tone,
        title: statusContent.title,
        preheader: statusContent.preheader,
        greeting: `Hello ${normalizeText(applicationData.applicantName, "there")}`,
        intro: statusContent.intro,
        sections,
        cta: {
          label: "Contact HR",
          href: `mailto:${this.careersEmail}`
        }
      })
    });
  },
  async sendJobApplicationManualEmail(applicationData) {
    const subject = normalizeText(applicationData.subject, `Message from SAPTech Uganda about your ${normalizeText(applicationData.jobTitle, "application")}`).replace(/[\r\n]+/g, " ").slice(0, 160);
    const message = normalizeText(applicationData.message, "");
    if (!message) {
      throw new Error("Message is required before sending an applicant email.");
    }
    return this.deliver({
      to: applicationData.applicantEmail,
      subject,
      category: "job_application_manual",
      html: () => this.buildEmail({
        tone: "default",
        title: "Message from SAPTech Uganda",
        preheader: subject,
        greeting: `Hello ${normalizeText(applicationData.applicantName, "there")}`,
        intro: "Our recruitment team has sent you a message about your job application.",
        sections: [{
          title: "Application summary",
          rows: [{
            label: "Role",
            value: applicationData.jobTitle
          }, {
            label: "Current status",
            value: normalizeStatus(applicationData.status)
          }, {
            label: "Sent",
            value: this.formatDate()
          }]
        }, {
          title: "Message",
          text: message
        }],
        cta: {
          label: "Reply to SAPTech Uganda",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  },
  async sendCustomAdminEmail({
    recipientEmail,
    recipientName,
    subject,
    message
  }) {
    const cleanSubject = normalizeText(subject, "From SAPTech Uganda").replace(/[\r\n]+/g, " ").slice(0, 160);
    const cleanMessage = normalizeText(message, "");
    if (!recipientEmail) throw new Error("Recipient email is required.");
    if (!cleanMessage) throw new Error("Message is required before sending a custom email.");
    return this.deliver({
      to: recipientEmail,
      subject: cleanSubject,
      category: "admin_custom_email",
      html: () => this.buildEmail({
        tone: "default",
        title: cleanSubject,
        preheader: cleanSubject,
        greeting: `Hello ${normalizeText(recipientName, "there")}`,
        intro: "",
        sections: [{
          text: cleanMessage
        }],
        cta: null,
        skipStandardClosing: true
      })
    });
  }
};
