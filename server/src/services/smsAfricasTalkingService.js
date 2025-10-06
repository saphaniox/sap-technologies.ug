/**
 * Africa's Talking SMS Service
 * 
 * Affordable SMS service for African countries.
 * FREE test credits + very cheap rates (~$0.01/SMS).
 * 
 * Features:
 * - FREE test sandbox
 * - Cheap production rates
 * - Great coverage in East/West Africa
 * - Bulk SMS support
 * - Delivery reports
 * 
 * Coverage:
 * - Kenya, Uganda, Tanzania, Rwanda, Nigeria, Ghana, South Africa, and more
 * 
 * Pricing (Production):
 * - Uganda: ~$0.01 per SMS
 * - Kenya: ~$0.008 per SMS
 * - Nigeria: ~$0.012 per SMS
 * 
 * Setup:
 * 1. Sign up at https://africastalking.com
 * 2. Get API key from dashboard
 * 3. Use 'sandbox' username for testing (FREE)
 * 4. Add your app name for production
 * 
 * @module smsAfricasTalkingService
 */

const AfricasTalking = require('africastalking');

class SMSAfricasTalkingService {
    constructor() {
        this.username = process.env.AFRICAS_TALKING_USERNAME || 'sandbox';
        this.apiKey = process.env.AFRICAS_TALKING_API_KEY;
        this.from = process.env.AFRICAS_TALKING_FROM || 'SAP_TECH';
        this.adminNumber = process.env.SMS_ADMIN_NUMBER || '+256706564628';
        
        this.isConfigured = !!(this.username && this.apiKey);
        
        if (this.isConfigured) {
            try {
                // Initialize Africa's Talking
                const africastalking = AfricasTalking({
                    apiKey: this.apiKey,
                    username: this.username
                });
                
                this.sms = africastalking.SMS;
                
                const mode = this.username === 'sandbox' ? 'TEST (FREE)' : 'PRODUCTION';
                console.log(`✅ Africa's Talking SMS configured in ${mode} mode`);
                console.log(`📱 Admin SMS number: ${this.adminNumber}`);
            } catch (error) {
                console.error('❌ Error initializing Africa\'s Talking:', error);
                this.isConfigured = false;
            }
        } else {
            console.log('📲 Africa\'s Talking SMS: Not configured (add AFRICAS_TALKING_API_KEY to .env)');
        }
    }

    /**
     * Format phone number for Africa's Talking
     * @param {string} number - Phone number
     * @returns {string} Formatted number with +
     */
    formatNumber(number) {
        // Remove all non-numeric characters except +
        let formatted = number.replace(/[^\d+]/g, '');
        
        // Add + if not present
        if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        
        return formatted;
    }

    /**
     * Send SMS message
     * @param {string|array} to - Phone number(s) with country code
     * @param {string} message - SMS message (max 160 chars for single SMS)
     * @returns {Promise<object>} SMS sending result
     */
    async sendSMS(to, message) {
        try {
            if (!this.isConfigured) {
                console.log('📲 SMS service not configured, skipping');
                return { success: false, reason: 'not_configured' };
            }

            // Format recipient(s)
            const recipients = Array.isArray(to) 
                ? to.map(num => this.formatNumber(num))
                : [this.formatNumber(to)];

            const options = {
                to: recipients,
                message: message,
                from: this.from
            };

            const result = await this.sms.send(options);
            
            console.log(`✅ SMS sent to ${recipients.join(', ')}`);
            console.log(`💰 Cost: ${result.SMSMessageData?.Recipients?.[0]?.cost || 'N/A'}`);
            
            return {
                success: true,
                result: result,
                cost: result.SMSMessageData?.Recipients?.[0]?.cost
            };

        } catch (error) {
            console.error('❌ Error sending SMS:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send bulk SMS to multiple numbers
     * @param {array} numbers - Array of phone numbers
     * @param {string} message - SMS message
     * @returns {Promise<object>}
     */
    async sendBulkSMS(numbers, message) {
        return await this.sendSMS(numbers, message);
    }

    /**
     * Send contact form notification SMS to admin
     * @param {object} contactData - Contact form data
     */
    async sendContactNotification(contactData) {
        const message = `SAP TECH: New contact from ${contactData.name}. Email: ${contactData.email}. Check admin dashboard.`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send partnership request notification SMS
     * @param {object} partnershipData - Partnership data
     */
    async sendPartnershipNotification(partnershipData) {
        const message = `SAP TECH: New partnership request from ${partnershipData.companyName}. Contact: ${partnershipData.contactEmail}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send new user registration notification SMS
     * @param {object} userData - User data
     */
    async sendRegistrationNotification(userData) {
        const message = `SAP TECH: New user registered - ${userData.name} (${userData.email})`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send newsletter subscription notification SMS
     * @param {string} email - Subscriber email
     */
    async sendNewsletterNotification(email) {
        const message = `SAP TECH: New newsletter subscriber: ${email}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send product inquiry notification SMS
     * @param {object} inquiryData - Inquiry data
     */
    async sendProductInquiryNotification(inquiryData) {
        const message = `SAP TECH: Product inquiry from ${inquiryData.name} for ${inquiryData.productName}. Email: ${inquiryData.email}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send service quote notification SMS
     * @param {object} quoteData - Quote request data
     */
    async sendServiceQuoteNotification(quoteData) {
        const message = `SAP TECH: Service quote request from ${quoteData.name} for ${quoteData.serviceName}. Contact: ${quoteData.email}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send awards nomination notification SMS
     * @param {object} nominationData - Nomination data
     */
    async sendAwardsNotification(nominationData) {
        const message = `SAP TECH AWARDS: New nomination for ${nominationData.nomineeName} in ${nominationData.categoryName}. Check dashboard.`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    /**
     * Send custom SMS
     * @param {string} to - Recipient number
     * @param {string} message - Message text
     */
    async sendCustomSMS(to, message) {
        return await this.sendSMS(to, message);
    }

    /**
     * Check account balance (production only)
     * @returns {Promise<object>} Balance information
     */
    async checkBalance() {
        try {
            if (!this.isConfigured) {
                return { success: false, reason: 'not_configured' };
            }

            if (this.username === 'sandbox') {
                return { 
                    success: true, 
                    mode: 'sandbox',
                    message: 'Sandbox mode - unlimited FREE test messages'
                };
            }

            // In production, you can fetch account data
            const application = AfricasTalking({
                apiKey: this.apiKey,
                username: this.username
            }).APPLICATION;

            const data = await application.fetchApplicationData();
            
            return {
                success: true,
                balance: data.UserData?.balance,
                currency: 'USD'
            };

        } catch (error) {
            console.error('Error checking balance:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get service status and pricing
     * @returns {object}
     */
    getStatus() {
        return {
            configured: this.isConfigured,
            mode: this.username === 'sandbox' ? 'TEST (FREE)' : 'PRODUCTION',
            adminNumber: this.adminNumber,
            from: this.from,
            pricing: {
                uganda: '$0.01/SMS',
                kenya: '$0.008/SMS',
                nigeria: '$0.012/SMS',
                tanzania: '$0.01/SMS'
            },
            features: [
                'FREE sandbox testing',
                'Bulk SMS support',
                'Delivery reports',
                '20+ African countries',
                'Very affordable rates'
            ]
        };
    }

    /**
     * Test SMS functionality
     * @param {string} testNumber - Number to send test SMS
     * @returns {Promise<object>}
     */
    async testSMS(testNumber = null) {
        const number = testNumber || this.adminNumber;
        const message = `Test message from SAP Technologies SMS system. Time: ${new Date().toLocaleString()}`;
        
        console.log(`📲 Sending test SMS to ${number}...`);
        return await this.sendSMS(number, message);
    }
}

// Export singleton instance
module.exports = new SMSAfricasTalkingService();
