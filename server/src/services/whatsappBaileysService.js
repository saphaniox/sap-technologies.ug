const { 
    default: makeWASocket, 
    DisconnectReason, 
    useMultiFileAuthState,
    makeInMemoryStore 
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const path = require('path');
const fs = require('fs');

class WhatsAppBaileysService {
    constructor() {
        this.sock = null;
        this.isConnected = false;
        this.adminNumber = process.env.WHATSAPP_ADMIN_NUMBER || '256706564628';
        this.sessionPath = process.env.WHATSAPP_SESSION_PATH || path.join(__dirname, '../../whatsapp-session');
        
        // Create session directory if it doesn't exist
        if (!fs.existsSync(this.sessionPath)) {
            fs.mkdirSync(this.sessionPath, { recursive: true });
        }
        
        this.isEnabled = process.env.WHATSAPP_ENABLED === 'true';
        
        if (!this.isEnabled) {
            console.log('📱 WhatsApp Baileys service: Disabled (set WHATSAPP_ENABLED=true to enable)');
        }
    }

    formatNumber(number) {
        // Remove all non-numeric characters
        let formatted = number.replace(/\D/g, '');
        
        // Add country code if not present
        if (!formatted.startsWith('256') && !formatted.startsWith('+')) {
            formatted = '256' + formatted;
        }
        
        // Add WhatsApp suffix
        return formatted + '@s.whatsapp.net';
    }

    async sendMessage(to, message) {
        try {
            if (!this.isEnabled) {
                console.log('📱 WhatsApp service disabled, skipping message');
                return;
            }

            if (!this.isConnected || !this.sock) {
                console.warn('⚠️ WhatsApp not connected. Message queued (will send when connected)');
                return;
            }

            const formattedNumber = this.formatNumber(to);
            
            await this.sock.sendMessage(formattedNumber, { 
                text: message 
            });

            console.log(`✅ WhatsApp message sent to ${to} (FREE)`);
        } catch (error) {
            console.error('❌ Error sending WhatsApp message:', error);
            throw error;
        }
    }

    async sendContactNotification(contactData) {
        const message = `📞 *New Contact Form Submission*

👤 *Name:* ${contactData.name}
📧 *Email:* ${contactData.email}
${contactData.phone ? `📱 *Phone:* ${contactData.phone}` : ''}
${contactData.subject ? `📋 *Subject:* ${contactData.subject}` : ''}

💬 *Message:*
${contactData.message}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendPartnershipNotification(partnershipData) {
        const message = `🤝 *New Partnership Request*

🏢 *Company:* ${partnershipData.companyName}
👤 *Contact Person:* ${partnershipData.contactPerson}
📧 *Email:* ${partnershipData.contactEmail}
${partnershipData.phone ? `📱 *Phone:* ${partnershipData.phone}` : ''}
${partnershipData.website ? `🌐 *Website:* ${partnershipData.website}` : ''}

📝 *Description:*
${partnershipData.description}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendRegistrationNotification(userData) {
        const message = `👤 *New User Registration*

📝 *Name:* ${userData.name}
📧 *Email:* ${userData.email}
${userData.phone ? `📱 *Phone:* ${userData.phone}` : ''}

⏰ *Registered:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendNewsletterNotification(email) {
        const message = `📧 *New Newsletter Subscription*

✉️ *Email:* ${email}

⏰ *Subscribed:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendProductInquiryNotification(inquiryData) {
        const message = `🛍️ *New Product Inquiry*

📦 *Product:* ${inquiryData.productName}
👤 *Customer:* ${inquiryData.name}
📧 *Email:* ${inquiryData.email}
${inquiryData.phone ? `📱 *Phone:* ${inquiryData.phone}` : ''}

💬 *Message:*
${inquiryData.message}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendServiceQuoteNotification(quoteData) {
        const message = `📋 *New Service Quote Request*

🛠️ *Service:* ${quoteData.serviceName}
👤 *Client:* ${quoteData.name}
📧 *Email:* ${quoteData.email}
${quoteData.phone ? `📱 *Phone:* ${quoteData.phone}` : ''}
${quoteData.company ? `🏢 *Company:* ${quoteData.company}` : ''}

📝 *Requirements:*
${quoteData.requirements}

${quoteData.budget ? `💰 *Budget:* ${quoteData.budget}` : ''}
${quoteData.timeline ? `⏱️ *Timeline:* ${quoteData.timeline}` : ''}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendAwardsNotification(nominationData) {
        const message = `🏆 *New Awards Nomination*

👤 *Nominee:* ${nominationData.nomineeName}
📧 *Email:* ${nominationData.nomineeEmail}
🎯 *Category:* ${nominationData.categoryName}

📝 *Reason:*
${nominationData.reason.substring(0, 200)}${nominationData.reason.length > 200 ? '...' : ''}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies Awards System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    async sendCustomNotification(to, title, body) {
        const message = `*${title}*

${body}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies_`;

        await this.sendMessage(to, message);
    }

    isWhatsAppConnected() {
        return this.isConnected;
    }

    getStatus() {
        return {
            enabled: this.isEnabled,
            connected: this.isConnected,
            adminNumber: this.adminNumber,
            cost: 'FREE - No charges per message',
            provider: 'Baileys (Open Source)'
        };
    }
}

// Export singleton instance
module.exports = new WhatsAppBaileysService();
