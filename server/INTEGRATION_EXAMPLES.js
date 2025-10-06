/**
 * Integration Example: Using FREE WhatsApp & SMS in Your Controllers
 * 
 * This shows how to integrate the FREE notification services
 * into your existing controllers (contact, user registration, etc.)
 * 
 * Benefits:
 * - 100% FREE WhatsApp notifications
 * - Very cheap SMS (~$0.01/message)
 * - No Twilio charges
 * - Easy to implement
 */

// Example 1: Contact Form Controller Integration
// File: server/src/controllers/contactController.js

const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappBaileysService'); // FREE
const smsService = require('../services/smsAfricasTalkingService'); // Cheap

class ContactController {
    async submitContact(req, res) {
        try {
            const { name, email, phone, subject, message } = req.body;
            
            // ... save to database ...
            
            // Send notifications (all in parallel, non-blocking)
            const notificationPromises = [];
            
            // 1. Email notification (existing - FREE with Gmail)
            notificationPromises.push(
                emailService.sendContactNotification({ name, email, message })
                    .catch(error => console.error('Email failed:', error))
            );
            
            // 2. WhatsApp notification (NEW - 100% FREE)
            notificationPromises.push(
                whatsappService.sendContactNotification({ name, email, phone, subject, message })
                    .catch(error => console.error('WhatsApp failed:', error))
            );
            
            // 3. SMS notification (NEW - ~$0.01 per message)
            // Optional: Only send SMS for high-priority notifications
            notificationPromises.push(
                smsService.sendContactNotification({ name, email, message })
                    .catch(error => console.error('SMS failed:', error))
            );
            
            // Execute all notifications without blocking response
            Promise.all(notificationPromises);
            
            res.status(201).json({
                status: 'success',
                message: 'Contact form submitted successfully'
            });
            
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

// =========================================================

// Example 2: User Registration Integration
// File: server/src/controllers/authController.js

class AuthController {
    async register(req, res) {
        try {
            const { name, email, password, phone } = req.body;
            
            // ... create user ...
            
            // Send welcome email + notifications
            const notifications = [];
            
            // Welcome email
            notifications.push(
                emailService.sendUserWelcome({ name, email })
                    .catch(error => console.error('Welcome email failed:', error))
            );
            
            // Admin WhatsApp notification (FREE)
            notifications.push(
                whatsappService.sendRegistrationNotification({ name, email, phone })
                    .catch(error => console.error('WhatsApp notification failed:', error))
            );
            
            // Admin SMS notification (Optional - only for VIP registrations)
            // notifications.push(
            //     smsService.sendRegistrationNotification({ name, email })
            //         .catch(error => console.error('SMS failed:', error))
            // );
            
            Promise.all(notifications);
            
            res.status(201).json({
                status: 'success',
                message: 'Registration successful'
            });
            
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

// =========================================================

// Example 3: Awards Nomination Integration
// File: server/src/controllers/awardsController.js

class AwardsController {
    async submitNomination(req, res) {
        try {
            const nominationData = req.body;
            
            // ... save nomination ...
            
            // Send notifications
            const notifications = [];
            
            // Email to nominee and admin
            notifications.push(
                emailService.sendNominationSubmittedUser(nominationData)
                    .catch(error => console.error('Email failed:', error))
            );
            
            notifications.push(
                emailService.sendNominationSubmittedAdmin(nominationData)
                    .catch(error => console.error('Admin email failed:', error))
            );
            
            // WhatsApp to admin (FREE - instant notification)
            notifications.push(
                whatsappService.sendAwardsNotification(nominationData)
                    .catch(error => console.error('WhatsApp failed:', error))
            );
            
            // SMS to admin (Optional - only for critical nominations)
            // notifications.push(
            //     smsService.sendAwardsNotification(nominationData)
            //         .catch(error => console.error('SMS failed:', error))
            // );
            
            Promise.all(notifications);
            
            res.status(201).json({
                status: 'success',
                message: 'Nomination submitted successfully'
            });
            
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

// =========================================================

// Example 4: Service Quote Request Integration

class ServiceController {
    async submitQuoteRequest(req, res) {
        try {
            const quoteData = req.body;
            
            // ... save quote request ...
            
            // Triple notification strategy
            const notifications = [];
            
            // 1. Email (Professional, detailed)
            notifications.push(
                emailService.sendServiceQuoteNotification(quoteData)
                    .catch(error => console.error('Email failed:', error))
            );
            
            // 2. WhatsApp (Instant, FREE)
            notifications.push(
                whatsappService.sendServiceQuoteNotification(quoteData)
                    .catch(error => console.error('WhatsApp failed:', error))
            );
            
            // 3. SMS (Backup, only for high-value quotes)
            if (quoteData.budget && parseInt(quoteData.budget) > 5000) {
                notifications.push(
                    smsService.sendServiceQuoteNotification(quoteData)
                        .catch(error => console.error('SMS failed:', error))
                );
            }
            
            Promise.all(notifications);
            
            res.status(201).json({
                status: 'success',
                message: 'Quote request submitted'
            });
            
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

// =========================================================

// Example 5: Newsletter Subscription

class NewsletterController {
    async subscribe(req, res) {
        try {
            const { email } = req.body;
            
            // ... save subscription ...
            
            // Notifications
            const notifications = [];
            
            // Welcome email to subscriber
            notifications.push(
                emailService.sendNewsletterWelcome({ email })
                    .catch(error => console.error('Welcome email failed:', error))
            );
            
            // WhatsApp notification to admin (FREE)
            notifications.push(
                whatsappService.sendNewsletterNotification(email)
                    .catch(error => console.error('WhatsApp failed:', error))
            );
            
            // No SMS needed for newsletter subscriptions
            
            Promise.all(notifications);
            
            res.status(201).json({
                status: 'success',
                message: 'Subscribed successfully'
            });
            
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

// =========================================================

// NOTIFICATION STRATEGY RECOMMENDATIONS:

/**
 * 1. Email (FREE with Gmail)
 *    - Use for: All notifications
 *    - Best for: Professional communication, detailed info
 *    - Cost: FREE
 * 
 * 2. WhatsApp via Baileys (100% FREE)
 *    - Use for: All important notifications
 *    - Best for: Instant alerts, rich formatting
 *    - Cost: FREE forever
 *    - Reliability: Very high
 * 
 * 3. SMS via Africa's Talking (Very Cheap)
 *    - Use for: Critical/urgent notifications only
 *    - Best for: Backup when WhatsApp fails
 *    - Cost: ~$0.01 per message
 *    - When to use:
 *      • High-value transactions
 *      • Critical alerts
 *      • When WhatsApp is down
 *      • User preference for SMS
 */

// =========================================================

// COST OPTIMIZATION TIPS:

/**
 * Smart Notification Strategy:
 * 
 * LOW PRIORITY (Newsletter, general inquiries):
 * ✅ Email only (FREE)
 * 
 * MEDIUM PRIORITY (Contact forms, registrations):
 * ✅ Email (FREE)
 * ✅ WhatsApp (FREE)
 * 
 * HIGH PRIORITY (Service quotes, partnerships):
 * ✅ Email (FREE)
 * ✅ WhatsApp (FREE)
 * ✅ SMS (only if value > threshold)
 * 
 * CRITICAL (Awards winners, high-value sales):
 * ✅ Email (FREE)
 * ✅ WhatsApp (FREE)
 * ✅ SMS (backup - $0.01)
 * 
 * This approach:
 * - Ensures delivery (triple redundancy)
 * - Keeps costs minimal
 * - Uses FREE channels first
 * - SMS only when really needed
 */

// =========================================================

// ERROR HANDLING BEST PRACTICES:

/**
 * All notification services use .catch() to handle errors gracefully
 * 
 * Benefits:
 * - Main request never fails due to notification errors
 * - Notifications are non-blocking
 * - Errors are logged but don't affect user experience
 * - Each service can fail independently
 * 
 * Example:
 * Even if WhatsApp is down, email and SMS still work
 * Even if all notifications fail, user gets success response
 */

module.exports = {
    ContactController,
    AuthController,
    AwardsController,
    ServiceController,
    NewsletterController
};
