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

    formatNumber(number) {
        // Remove all non-numeric characters except +
        let formatted = number.replace(/[^\d+]/g, '');
        
        // Add + if not present
        if (!formatted.startsWith('+')) {
            formatted = '+' + formatted;
        }
        
        return formatted;
    }

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

    async sendBulkSMS(numbers, message) {
        return await this.sendSMS(numbers, message);
    }

    async sendContactNotification(contactData) {
        const message = `SAP TECH: New contact from ${contactData.name}. Email: ${contactData.email}. Check admin dashboard.`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendPartnershipNotification(partnershipData) {
        const message = `SAP TECH: New partnership request from ${partnershipData.companyName}. Contact: ${partnershipData.contactEmail}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendRegistrationNotification(userData) {
        const message = `SAP TECH: New user registered - ${userData.name} (${userData.email})`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendNewsletterNotification(email) {
        const message = `SAP TECH: New newsletter subscriber: ${email}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendProductInquiryNotification(inquiryData) {
        const message = `SAP TECH: Product inquiry from ${inquiryData.name} for ${inquiryData.productName}. Email: ${inquiryData.email}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendServiceQuoteNotification(quoteData) {
        const message = `SAP TECH: Service quote request from ${quoteData.name} for ${quoteData.serviceName}. Contact: ${quoteData.email}`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendAwardsNotification(nominationData) {
        const message = `SAP TECH AWARDS: New nomination for ${nominationData.nomineeName} in ${nominationData.categoryName}. Check dashboard.`;
        
        return await this.sendSMS(this.adminNumber, message);
    }

    async sendCustomSMS(to, message) {
        return await this.sendSMS(to, message);
    }

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

    async testSMS(testNumber = null) {
        const number = testNumber || this.adminNumber;
        const message = `Test message from SAP Technologies SMS system. Time: ${new Date().toLocaleString()}`;
        
        console.log(`📲 Sending test SMS to ${number}...`);
        return await this.sendSMS(number, message);
    }
}

// Export singleton instance
module.exports = new SMSAfricasTalkingService();
