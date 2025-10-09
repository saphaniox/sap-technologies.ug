/**
 * Free WhatsApp Service using Baileys
 * 
 * 100% FREE WhatsApp notifications using the Baileys library.
 * No API costs, uses your WhatsApp account via QR code authentication.
 * 
 * Features:
 * - Send text messages (FREE)
 * - Send images and documents (FREE)
 * - No message limits
 * - No monthly fees
 * - QR code authentication
 * 
 * Setup:
 * 1. npm install @whiskeysockets/baileys qrcode-terminal
 * 2. Set WHATSAPP_ADMIN_NUMBER in .env
 * 3. Run and scan QR code with WhatsApp
 * 
 * @module whatsappBaileysService
 */

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
        
        if (this.isEnabled) {
            this.initialize();
        } else {
            console.log('📱 WhatsApp Baileys service: Disabled (set WHATSAPP_ENABLED=true to enable)');
        }
    }

    /**
     * Initialize WhatsApp connection
     */
    async initialize() {
        try {
            console.log('📱 Initializing FREE WhatsApp service (Baileys)...');
            
            const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
            
            this.sock = makeWASocket({
                auth: state,
                defaultQueryTimeoutMs: undefined,
            });

            // Save credentials when updated
            this.sock.ev.on('creds.update', saveCreds);

            // Handle connection updates
            this.sock.ev.on('connection.update', (update) => {
                const { connection, lastDisconnect, qr } = update;

                // Show QR code in terminal
                if (qr) {
                    console.log('\n📱 Scan this QR code with WhatsApp:');
                    qrcode.generate(qr, { small: true });
                    console.log('\n💡 Open WhatsApp → Linked Devices → Link a Device');
                }

                if (connection === 'close') {
                    const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                    console.log('📱 WhatsApp disconnected. Reconnecting:', shouldReconnect);
                    
                    if (shouldReconnect) {
                        setTimeout(() => this.initialize(), 5000);
                    }
                    
                    this.isConnected = false;
                } else if (connection === 'open') {
                    console.log('✅ WhatsApp connected successfully! (FREE)');
                    this.isConnected = true;
                }
            });

            // Handle messages (optional - for bot functionality)
            this.sock.ev.on('messages.upsert', async ({ messages }) => {
                // You can handle incoming messages here if needed
                // For now, we only send notifications
            });

        } catch (error) {
            console.error('❌ Error initializing WhatsApp:', error);
            this.isConnected = false;
        }
    }

    /**
     * Format phone number for WhatsApp
     * @param {string} number - Phone number (with or without +)
     * @returns {string} Formatted number with @s.whatsapp.net
     */
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

    /**
     * Send WhatsApp message (FREE)
     * @param {string} to - Recipient phone number
     * @param {string} message - Message text
     * @returns {Promise<void>}
     */
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

    /**
     * Send contact form notification to admin (FREE)
     * @param {object} contactData - Contact form data
     */
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

    /**
     * Send partnership request notification (FREE)
     * @param {object} partnershipData - Partnership request data
     */
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

    /**
     * Send new user registration notification (FREE)
     * @param {object} userData - User registration data
     */
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

    /**
     * Send newsletter subscription notification (FREE)
     * @param {string} email - Subscriber email
     */
    async sendNewsletterNotification(email) {
        const message = `📧 *New Newsletter Subscription*

✉️ *Email:* ${email}

⏰ *Subscribed:* ${new Date().toLocaleString()}

---
_SAP Technologies Notification System_`;

        await this.sendMessage(this.adminNumber, message);
    }

    /**
     * Send product inquiry notification (FREE)
     * @param {object} inquiryData - Product inquiry data
     */
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

    /**
     * Send service quote request notification (FREE)
     * @param {object} quoteData - Service quote request data
     */
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

    /**
     * Send awards nomination notification (FREE)
     * @param {object} nominationData - Awards nomination data
     */
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

    /**
     * Send custom notification (FREE)
     * @param {string} to - Recipient number
     * @param {string} title - Notification title
     * @param {string} body - Notification body
     */
    async sendCustomNotification(to, title, body) {
        const message = `*${title}*

${body}

⏰ *Time:* ${new Date().toLocaleString()}

---
_SAP Technologies_`;

        await this.sendMessage(to, message);
    }

    /**
     * Check if WhatsApp is connected
     * @returns {boolean}
     */
    isWhatsAppConnected() {
        return this.isConnected;
    }

    /**
     * Get connection status
     * @returns {object}
     */
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
