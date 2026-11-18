const {
  normalizeText,
  summarizeUserAgent,
  cleanString,
  normalizeStatus
} = require("./shared");
module.exports = {
  async sendNewsletterWelcome(subscriberData) {
    const unsubscribeLinks = this.createNewsletterUnsubscribeLinks(subscriberData.email);
    return this.deliver({
      to: subscriberData.email,
      subject: "Welcome to SAPTech Uganda updates",
      category: "newsletter",
      headers: unsubscribeLinks.oneClickUrl ? {
        "List-Unsubscribe": `<${unsubscribeLinks.oneClickUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click"
      } : {},
      html: () => this.buildEmail({
        title: "Welcome to SAPTech Updates",
        preheader: "You are now subscribed to SAPTech Uganda updates.",
        greeting: "Welcome",
        intro: "Thanks for subscribing. We will send occasional updates about useful technology, our services and products, and opportunities from the SAPTech Uganda team.",
        sections: [{
          title: "Subscription details",
          rows: [{
            label: "Email",
            value: subscriberData.email
          }, {
            label: "Subscribed",
            value: this.formatDate()
          }]
        }, {
          title: "What to expect",
          list: ["Product and service updates.", "Event and awards announcements.", "Career and partnership opportunities.", "Useful technology insights from our team."]
        }],
        cta: {
          label: "Visit SAPTech Uganda",
          href: this.brand.websiteUrl
        },
        unsubscribeUrl: unsubscribeLinks.pageUrl
      })
    });
  },
  async sendNewsletterUnsubscribeConfirmation(subscriberData) {
    return this.deliver({
      to: subscriberData.email,
      subject: "You have been unsubscribed from SAPTech Uganda updates",
      category: "newsletter_unsubscribe",
      html: () => this.buildEmail({
        tone: "warning",
        title: "Newsletter Unsubscribed",
        preheader: "You have been unsubscribed from SAPTech Uganda updates.",
        greeting: "Hello",
        intro: "You have been unsubscribed from SAPTech Uganda newsletter updates. You will no longer receive newsletter communications at this email address.",
        sections: [{
          title: "Subscription details",
          rows: [{
            label: "Email",
            value: subscriberData.email
          }, {
            label: "Unsubscribed",
            value: this.formatDate(subscriberData.unsubscribedAt || new Date())
          }]
        }, {
          title: "Changed your mind?",
          text: "You can subscribe again from the website at any time."
        }],
        cta: {
          label: "Visit SAPTech Uganda",
          href: this.brand.websiteUrl
        }
      })
    });
  },
  async sendUserSignupNotification(userData) {
    return this.deliver({
      to: userData.email,
      subject: "Welcome to your SAPTech Uganda account",
      category: "account_welcome",
      html: () => this.buildEmail({
        title: "Account Created",
        preheader: "Your SAPTech Uganda account is ready.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "Your account has been created successfully. You can now access your profile and use SAPTech Uganda services more smoothly.",
        sections: [{
          title: "Account details",
          rows: [{
            label: "Name",
            value: userData.name
          }, {
            label: "Email",
            value: userData.email
          }, {
            label: "Created",
            value: this.formatDate(userData.createdAt || new Date())
          }, {
            label: "IP address",
            value: userData.ipAddress
          }, {
            label: "Device/browser",
            value: summarizeUserAgent(userData.userAgent)
          }]
        }, {
          title: "Security note",
          list: ["Use a strong password.", "Do not share your account credentials.", "Contact us immediately if you notice suspicious activity."]
        }],
        cta: {
          label: "Open your account",
          href: `${this.brand.websiteUrl}/account`
        }
      })
    });
  },
  async sendUserWelcome(userData) {
    return this.sendUserSignupNotification(userData);
  },
  async sendUserLoginNotification(userData) {
    return this.deliver({
      to: userData.email,
      subject: "New sign-in to your SAPTech Uganda account",
      category: "account_login",
      html: () => this.buildEmail({
        title: "New Account Sign-In",
        preheader: "A successful sign-in was recorded on your SAPTech Uganda account.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "We noticed a successful sign-in to your SAPTech Uganda account. If this was you, no action is needed.",
        sections: [{
          title: "Sign-in details",
          rows: [{
            label: "Account",
            value: userData.email
          }, {
            label: "Signed in",
            value: this.formatDate(userData.loggedInAt || new Date())
          }, {
            label: "IP address",
            value: userData.ipAddress
          }, {
            label: "Device/browser",
            value: summarizeUserAgent(userData.userAgent)
          }, {
            label: "Total logins",
            value: userData.loginCount
          }]
        }, {
          title: "If this was not you",
          list: ["Reset your password immediately from the SAPTech Uganda website.", "Contact our support team so we can help secure your account.", "Do not share passwords, reset codes, or account access with anyone."]
        }],
        cta: {
          label: "Open your account",
          href: `${this.brand.websiteUrl}/account`
        },
        footerNote: "This security email was sent because your account was accessed successfully."
      })
    });
  },
  async sendProfileUpdatedNotification(userData) {
    return this.deliver({
      to: userData.email,
      subject: "Your SAPTech Uganda profile was updated",
      category: "account_profile_updated",
      html: () => this.buildEmail({
        title: "Profile Updated",
        preheader: "Your SAPTech Uganda profile details were updated.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "Your profile details were updated successfully. Keeping your profile accurate helps our team support you faster.",
        sections: [{
          title: "Updated details",
          rows: [{
            label: "Name",
            value: userData.name
          }, {
            label: "Email",
            value: userData.email
          }, {
            label: "Updated",
            value: this.formatDate(userData.updatedAt || new Date())
          }]
        }, {
          title: "Security note",
          text: "If you did not make this change, please contact SAPTech Uganda support immediately."
        }],
        cta: {
          label: "Review account",
          href: `${this.brand.websiteUrl}/account`
        },
        footerNote: "This email confirms a profile update on your SAPTech Uganda account."
      })
    });
  },
  async sendProfilePictureUpdatedNotification(userData) {
    return this.deliver({
      to: userData.email,
      subject: "Your SAPTech Uganda profile photo was updated",
      category: "account_profile_photo_updated",
      html: () => this.buildEmail({
        title: "Profile Photo Updated",
        preheader: "Your SAPTech Uganda profile photo was changed.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "Your profile photo was updated successfully.",
        sections: [{
          title: "Update details",
          rows: [{
            label: "Account",
            value: userData.email
          }, {
            label: "Updated",
            value: this.formatDate(userData.updatedAt || new Date())
          }]
        }, {
          title: "Security note",
          text: "If you did not update your profile photo, please contact our support team."
        }],
        cta: {
          label: "Review account",
          href: `${this.brand.websiteUrl}/account`
        }
      })
    });
  },
  async sendEmailChangeConfirmation(userData) {
    const oldEmail = cleanString(userData.oldEmail);
    const newEmail = cleanString(userData.newEmail || userData.email);
    const recipients = [newEmail, oldEmail].filter(Boolean).filter((email, index, list) => list.findIndex(item => item.toLowerCase() === email.toLowerCase()) === index);
    if (!recipients.length) {
      throw new Error("Email change confirmation requires at least one recipient.");
    }
    const sends = recipients.map(recipient => this.deliver({
      to: recipient,
      subject: "Your SAPTech Uganda email address was changed",
      category: recipient.toLowerCase() === oldEmail.toLowerCase() ? "account_email_changed_old" : "account_email_changed",
      html: () => this.buildEmail({
        tone: "warning",
        title: "Email Address Updated",
        preheader: "The email address on your SAPTech Uganda account was changed.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "The email address on your SAPTech Uganda account was changed successfully.",
        sections: [{
          title: "Change details",
          rows: [{
            label: "Previous email",
            value: oldEmail
          }, {
            label: "New email",
            value: newEmail
          }, {
            label: "Changed",
            value: this.formatDate(userData.updatedAt || new Date())
          }]
        }, {
          title: "If this was not you",
          list: ["Contact SAPTech Uganda support immediately.", "Reset your password if you still have access to the account.", "Do not share reset codes or passwords with anyone."]
        }],
        cta: {
          label: "Contact support",
          href: `mailto:${this.replyToEmail}`
        },
        footerNote: "This security confirmation was sent to the previous and current account email when available."
      })
    }));
    const results = await Promise.allSettled(sends);
    if (results.every(result => result.status === "rejected")) {
      throw results[0].reason;
    }
    return true;
  },
  async sendAccountDeletedNotification(userData) {
    return this.deliver({
      to: userData.email,
      subject: "Your SAPTech Uganda account was deleted",
      category: "account_deleted",
      html: () => this.buildEmail({
        tone: "warning",
        title: "Account Deleted",
        preheader: "Your SAPTech Uganda account has been deleted.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "This confirms that your SAPTech Uganda account has been deleted. You will no longer be able to use this account to access saved profile features.",
        sections: [{
          title: "Account details",
          rows: [{
            label: "Email",
            value: userData.email
          }, {
            label: "Deleted",
            value: this.formatDate(userData.deletedAt || new Date())
          }]
        }, {
          title: "Need help?",
          text: "If you did not request this deletion, contact SAPTech Uganda as soon as possible."
        }],
        cta: {
          label: "Contact support",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  },
  async sendUserRoleUpdatedNotification(userData) {
    const role = normalizeText(userData.role, "user");
    return this.deliver({
      to: userData.email,
      subject: `Your SAPTech Uganda role was updated to ${role}`,
      category: "account_role_updated",
      html: () => this.buildEmail({
        tone: role === "admin" ? "success" : "default",
        title: "Account Role Updated",
        preheader: "There is an update to your SAPTech Uganda account access.",
        greeting: `Hello ${normalizeText(userData.name, "there")}`,
        intro: "Your SAPTech Uganda account role has been updated by an administrator.",
        sections: [{
          title: "Role details",
          rows: [{
            label: "Account",
            value: userData.email
          }, {
            label: "New role",
            value: normalizeStatus(role)
          }, {
            label: "Updated",
            value: this.formatDate(userData.updatedAt || new Date())
          }]
        }, {
          title: "What this means",
          text: role === "admin" ? "You may now have access to additional admin tools. Please use them carefully and protect your login details." : "Your account now uses standard user access. If you expected different access, contact the SAPTech Uganda team."
        }],
        cta: {
          label: role === "admin" ? "Open admin dashboard" : "Open your account",
          href: `${this.brand.websiteUrl}/${role === "admin" ? "admin" : "account"}`
        }
      })
    });
  },
  async sendAdminUserSignupAlert(userData) {
    return this.deliver({
      to: this.notifyEmail,
      subject: `New user account: ${normalizeText(userData.name, userData.email)}`,
      category: "account_admin",
      html: () => this.buildEmail({
        title: "New User Registration",
        preheader: "A new user registered on the website.",
        intro: "A new user account was created on SAPTech Uganda.",
        sections: [{
          title: "User details",
          rows: [{
            label: "Name",
            value: userData.name
          }, {
            label: "Email",
            value: userData.email
          }, {
            label: "User ID",
            value: userData.id
          }, {
            label: "Registered",
            value: this.formatDate()
          }]
        }],
        cta: {
          label: "Open admin dashboard",
          href: `${this.brand.websiteUrl}/admin`
        }
      })
    });
  },
  async sendAdminAlert(alertData) {
    return this.deliver({
      to: this.notifyEmail,
      subject: alertData.subject || "SAPTech Uganda admin alert",
      category: "admin_alert",
      html: () => this.buildEmail({
        title: alertData.title || "Admin Alert",
        preheader: alertData.message || "A system alert was generated.",
        intro: alertData.message || "A system alert was generated.",
        sections: [{
          title: "Alert details",
          rows: alertData.rows || [],
          text: alertData.details
        }]
      })
    });
  }
};
