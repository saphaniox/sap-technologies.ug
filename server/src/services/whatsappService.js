const twilio = require("twilio");

class WhatsAppService {
    constructor() {
        // Check for Twilio credentials (support both naming conventions)
        const twilioSid = process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID;
        const twilioAuth = process.env.TWILIO_AUTH || process.env.TWILIO_AUTH_TOKEN;
        
        if (twilioSid && twilioAuth) {
            this.client = twilio(twilioSid, twilioAuth);
            this.fromNumber = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";
            this.adminNumber = process.env.TWILIO_WHATSAPP_TO || process.env.ADMIN_WHATSAPP_NUMBER;
            this.isConfigured = true;
            console.log("✅ WhatsApp service configured");
            console.log("   From:", this.fromNumber);
            console.log("   To:", this.adminNumber);
        } else {
            this.isConfigured = false;
            console.log("❌ WhatsApp service: Twilio credentials not configured");
            console.log("   Expected: TWILIO_SID & TWILIO_AUTH or TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN");
        }
    }

    // Send WhatsApp notification for new contact form submission
    async sendContactNotification(contactData) {
        try {
            if (!this.isConfigured) {
                console.log("WhatsApp service not configured, skipping notification");
                return;
            }

            if (!this.adminNumber) {
                console.warn("Admin WhatsApp number not configured");
                return;
            }

            const message = `🔔 New Contact Form Submission

👤 Name: ${contactData.name}
📧 Email: ${contactData.email}
📱 Phone: ${contactData.phone || "Not provided"}
📝 Subject: ${contactData.subject}

💬 Message:
${contactData.message}

⏰ Submitted: ${new Date().toLocaleString()}`;

            await this.client.messages.create({
                from: this.fromNumber,
                to: this.adminNumber,
                body: message
            });

            console.log("✅ WhatsApp contact notification sent successfully");
        } catch (error) {
            console.error("Error sending WhatsApp contact notification:", error);
            throw error;
        }
    }

    // Send WhatsApp notification for new newsletter subscription
    async sendNewsletterNotification(email) {
        try {
            if (!this.isConfigured) {
                console.log("WhatsApp service not configured, skipping notification");
                return;
            }

            if (!this.adminNumber) {
                console.warn("Admin WhatsApp number not configured");
                return;
            }

            const message = `📧 New Newsletter Subscription

✉️ Email: ${email}
⏰ Subscribed: ${new Date().toLocaleString()}`;

            await this.client.messages.create({
                from: this.fromNumber,
                to: `whatsapp:${this.adminNumber}`,
                body: message
            });

            console.log("WhatsApp newsletter notification sent successfully");
        } catch (error) {
            console.error("Error sending WhatsApp newsletter notification:", error);
            throw error;
        }
    }

    // Send WhatsApp notification for new user registration
    async sendRegistrationNotification(userData) {
        try {
            if (!this.isConfigured) {
                console.log("WhatsApp service not configured, skipping notification");
                return;
            }

            if (!this.adminNumber) {
                console.warn("Admin WhatsApp number not configured");
                return;
            }

            const message = `👤 New User Registration

📝 Name: ${userData.name}
📧 Email: ${userData.email}
📱 Phone: ${userData.phone || "Not provided"}
⏰ Registered: ${new Date().toLocaleString()}`;

            await this.client.messages.create({
                from: this.fromNumber,
                to: `whatsapp:${this.adminNumber}`,
                body: message
            });

            console.log("WhatsApp registration notification sent successfully");
        } catch (error) {
            console.error("Error sending WhatsApp registration notification:", error);
            throw error;
        }
    }

    // Send WhatsApp notification for new partnership request
    async sendPartnershipNotification(partnershipData) {
        try {
            if (!this.isConfigured) {
                console.log("WhatsApp service not configured, skipping notification");
                return;
            }

            if (!this.adminNumber) {
                console.warn("Admin WhatsApp number not configured");
                return;
            }

            const message = `🤝 New Partnership Request

🏢 Company: ${partnershipData.companyName}
👤 Contact Person: ${partnershipData.contactPerson}
📧 Email: ${partnershipData.contactEmail}${partnershipData.website ? `
🌐 Website: ${partnershipData.website}` : ''}

📝 Description:
${partnershipData.description}

⏰ Submitted: ${new Date().toLocaleString()}`;

            await this.client.messages.create({
                from: this.fromNumber,
                to: `whatsapp:${this.adminNumber}`,
                body: message
            });

            console.log("WhatsApp partnership notification sent successfully");
        } catch (error) {
            console.error("Error sending WhatsApp partnership notification:", error);
            throw error;
        }
    }
}

module.exports = new WhatsAppService();
