const {
  normalizeText,
  normalizeStatus
} = require("./shared");
module.exports = {
  async sendProductInquiryToAdmin(inquiryData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: inquiryData.customerEmail,
      subject: `Product inquiry: ${normalizeText(inquiryData.productName, "Product")}`,
      category: "product_inquiry_admin",
      html: () => this.buildEmail({
        title: "New Product Inquiry",
        preheader: "A customer asked about a product.",
        intro: "A product inquiry has been submitted on the website.",
        sections: [{
          title: "Inquiry details",
          rows: [{
            label: "Product",
            value: inquiryData.productName
          }, {
            label: "Category",
            value: inquiryData.productCategory
          }, {
            label: "Customer email",
            value: inquiryData.customerEmail
          }, {
            label: "Customer phone",
            value: inquiryData.customerPhone
          }, {
            label: "Preferred contact",
            value: inquiryData.preferredContact
          }, {
            label: "Received",
            value: this.formatDate(inquiryData.inquiryDate)
          }]
        }, {
          title: "Customer message",
          text: normalizeText(inquiryData.message, "No message provided")
        }],
        cta: {
          label: "Reply to customer",
          href: `mailto:${encodeURIComponent(inquiryData.customerEmail || "")}`
        }
      })
    });
  },
  async sendProductInquiryConfirmation(inquiryData) {
    return this.deliver({
      to: inquiryData.customerEmail,
      subject: `We received your inquiry about ${normalizeText(inquiryData.productName, "our product")}`,
      category: "product_inquiry_confirmation",
      html: () => this.buildEmail({
        title: "Product Inquiry Received",
        preheader: "Thank you for your product inquiry.",
        greeting: "Hello",
        intro: "Thank you for your interest in our products. Our team has received your inquiry and will follow up with the right details.",
        sections: [{
          title: "Inquiry summary",
          rows: [{
            label: "Product",
            value: inquiryData.productName
          }, {
            label: "Email",
            value: inquiryData.customerEmail
          }, {
            label: "Submitted",
            value: this.formatDate()
          }]
        }, {
          title: "Your message",
          text: normalizeText(inquiryData.message, "No message provided")
        }, {
          title: "Next steps",
          list: ["We will review your request.", "A team member will contact you with product details.", "You can reply to this email if you need to add more information."]
        }],
        cta: {
          label: "View products",
          href: `${this.brand.websiteUrl}/products`
        }
      })
    });
  },
  async sendProductInquiryStatusUpdate(inquiryData) {
    return this.deliver({
      to: inquiryData.customerEmail,
      subject: `Product inquiry update: ${normalizeStatus(inquiryData.status)}`,
      category: "product_inquiry_status",
      html: () => this.buildEmail({
        title: "Product Inquiry Update",
        preheader: "Your product inquiry status has changed.",
        greeting: "Hello",
        intro: "There is an update on your product inquiry with SAPTech Uganda.",
        sections: [{
          title: "Status update",
          rows: [{
            label: "Product",
            value: inquiryData.productName
          }, {
            label: "Status",
            value: normalizeStatus(inquiryData.status)
          }, {
            label: "Updated",
            value: this.formatDate()
          }]
        }, {
          title: "Team notes",
          text: normalizeText(inquiryData.adminNotes, "No additional notes were added.")
        }],
        cta: {
          label: "Contact SAPTech Uganda",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  },
  formatCartItems(items = []) {
    if (!items.length) return "No items listed.";
    return items.map((item, index) => {
      const name = item.productName || item.name || "Product";
      const quantity = item.quantity || 1;
      const price = item.price ? `, price: ${item.price}` : "";
      return `${index + 1}. ${name} - quantity: ${quantity}${price}`;
    }).join("\n");
  },
  async sendCartInquiryToAdmin({
    items,
    customerName,
    customerEmail,
    customerPhone,
    preferredContact,
    message
  }) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: customerEmail,
      subject: `Cart inquiry from ${normalizeText(customerName, customerEmail)}`,
      category: "cart_inquiry_admin",
      html: () => this.buildEmail({
        title: "New Cart Inquiry",
        preheader: "A customer submitted a multi-product inquiry.",
        intro: "A customer submitted a cart inquiry with multiple products.",
        sections: [{
          title: "Customer details",
          rows: [{
            label: "Name",
            value: customerName
          }, {
            label: "Email",
            value: customerEmail
          }, {
            label: "Phone",
            value: customerPhone
          }, {
            label: "Preferred contact",
            value: preferredContact
          }, {
            label: "Received",
            value: this.formatDate()
          }]
        }, {
          title: "Requested products",
          text: this.formatCartItems(items)
        }, {
          title: "Customer message",
          text: normalizeText(message, "No message provided")
        }],
        cta: {
          label: "Reply to customer",
          href: `mailto:${encodeURIComponent(customerEmail || "")}`
        }
      })
    });
  },
  async sendCartInquiryConfirmation({
    customerEmail,
    customerName,
    items
  }) {
    return this.deliver({
      to: customerEmail,
      subject: "We received your product inquiry",
      category: "cart_inquiry_confirmation",
      html: () => this.buildEmail({
        title: "Product Inquiry Received",
        preheader: "Your product inquiry was received.",
        greeting: `Hello ${normalizeText(customerName, "there")}`,
        intro: "Thank you for sending your product inquiry. We have received your selected items and will contact you with availability, pricing, and next steps.",
        sections: [{
          title: "Requested products",
          text: this.formatCartItems(items)
        }, {
          title: "Next steps",
          list: ["Our team will review your selected products.", "We will confirm availability and any installation requirements.", "We will contact you using your provided email or phone number."]
        }],
        cta: {
          label: "View more products",
          href: `${this.brand.websiteUrl}/products`
        }
      })
    });
  },
  async sendServiceQuoteToAdmin(quoteData) {
    return this.deliver({
      to: this.notifyEmail,
      replyTo: quoteData.customerEmail,
      subject: `Service quote request: ${normalizeText(quoteData.serviceName, "Service")}`,
      category: "service_quote_admin",
      html: () => this.buildEmail({
        title: "New Service Quote Request",
        preheader: "A customer requested a service quote.",
        intro: "A new service quote request has been submitted through the website.",
        sections: [{
          title: "Quote details",
          rows: [{
            label: "Service",
            value: quoteData.serviceName
          }, {
            label: "Category",
            value: quoteData.serviceCategory
          }, {
            label: "Customer",
            value: quoteData.customerName
          }, {
            label: "Email",
            value: quoteData.customerEmail
          }, {
            label: "Phone",
            value: quoteData.customerPhone
          }, {
            label: "Company",
            value: quoteData.companyName
          }, {
            label: "Preferred contact",
            value: quoteData.preferredContact
          }, {
            label: "Budget",
            value: quoteData.budget
          }, {
            label: "Timeline",
            value: quoteData.timeline
          }, {
            label: "Received",
            value: this.formatDate(quoteData.quoteDate)
          }]
        }, {
          title: "Project details",
          text: normalizeText(quoteData.projectDetails, "No project details provided")
        }],
        cta: {
          label: "Reply to customer",
          href: `mailto:${encodeURIComponent(quoteData.customerEmail || "")}`
        }
      })
    });
  },
  async sendServiceQuoteConfirmation(quoteData) {
    return this.deliver({
      to: quoteData.customerEmail,
      subject: `We received your quote request for ${normalizeText(quoteData.serviceName, "our service")}`,
      category: "service_quote_confirmation",
      html: () => this.buildEmail({
        title: "Quote Request Received",
        preheader: "Your service quote request was received.",
        greeting: `Hello ${normalizeText(quoteData.customerName, "there")}`,
        intro: "Thank you for requesting a quote from SAPTech Uganda. Our team will review your project and contact you with the next steps.",
        sections: [{
          title: "Request summary",
          rows: [{
            label: "Service",
            value: quoteData.serviceName
          }, {
            label: "Email",
            value: quoteData.customerEmail
          }, {
            label: "Submitted",
            value: this.formatDate()
          }]
        }, {
          title: "Project details",
          text: normalizeText(quoteData.projectDetails, "No project details provided")
        }, {
          title: "Next steps",
          list: ["We will review your requirements.", "We may contact you for clarification.", "You will receive guidance on scope, timeline, and pricing."]
        }],
        cta: {
          label: "View services",
          href: `${this.brand.websiteUrl}/services`
        }
      })
    });
  },
  async sendServiceQuoteStatusUpdate(quoteData) {
    return this.deliver({
      to: quoteData.customerEmail,
      subject: `Service quote update: ${normalizeStatus(quoteData.status)}`,
      category: "service_quote_status",
      html: () => this.buildEmail({
        title: "Service Quote Update",
        preheader: "Your service quote status has changed.",
        greeting: `Hello ${normalizeText(quoteData.customerName, "there")}`,
        intro: "There is an update on your service quote request with SAPTech Uganda.",
        sections: [{
          title: "Status update",
          rows: [{
            label: "Service",
            value: quoteData.serviceName
          }, {
            label: "Status",
            value: normalizeStatus(quoteData.status)
          }, {
            label: "Budget",
            value: quoteData.budget
          }, {
            label: "Timeline",
            value: quoteData.timeline
          }, {
            label: "Updated",
            value: this.formatDate()
          }]
        }, {
          title: "Team notes",
          text: normalizeText(quoteData.adminNotes, "No additional notes were added.")
        }],
        cta: {
          label: "Contact SAPTech Uganda",
          href: `mailto:${this.replyToEmail}`
        }
      })
    });
  }
};
