const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');
const { Resend } = require('resend');

class EmailService {
    constructor() {
        // Set reply-to email (always use Gmail for replies)
        this.replyToEmail = process.env.GMAIL_USER || 'saptechnologies256@gmail.com';
        
        // Priority 1: Check for Resend API key (easiest, most reliable)
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            this.resend = new Resend(resendKey);
            this.useResend = true;
            this.isConfigured = true;
            // IMPORTANT: Resend requires using verified domain or onboarding@resend.dev
            this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
            this.notifyEmail = process.env.NOTIFY_EMAIL || process.env.GMAIL_USER || 'saptechnologies256@gmail.com';
            console.log("✅ Email service configured with Resend");
            console.log("📧 From Email:", this.fromEmail);
            console.log("↩️  Reply-To Email:", this.replyToEmail);
            console.log("📬 Notify Email:", this.notifyEmail);
            console.log("💡 Resend: 3,000 emails/month free, excellent deliverability");
            
            if (this.fromEmail !== 'onboarding@resend.dev' && !this.fromEmail.includes('@')) {
                console.warn("⚠️  WARNING: RESEND_FROM_EMAIL must be a valid email address");
                console.warn("   Use 'onboarding@resend.dev' for testing or verify your domain");
            }
            return;
        }
        
        // Priority 2: Check for SendGrid API key
        const sendgridKey = process.env.SENDGRID_API_KEY;
        if (sendgridKey) {
            sgMail.setApiKey(sendgridKey);
            this.useSendGrid = true;
            this.isConfigured = true;
            this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'saptechnologies256@gmail.com';
            this.notifyEmail = process.env.NOTIFY_EMAIL || this.fromEmail;
            console.log("✅ Email service configured with SendGrid");
            console.log("📧 From Email:", this.fromEmail);
            console.log("↩️  Reply-To Email:", this.replyToEmail);
            console.log("📬 Notify Email:", this.notifyEmail);
            return;
        }
        
        // Priority 3: Fallback to SMTP for local development
        const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
        const emailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;
        
        if (emailUser && emailPass) {
            // Use port 587 with STARTTLS for better cloud platform compatibility (Render, Heroku, etc.)
            const smtpPort = parseInt(process.env.SMTP_PORT || "587");
            const useSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
            
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: smtpPort,
                secure: useSecure, // true for 465 (SSL), false for 587 (STARTTLS)
                auth: {
                    user: emailUser,
                    pass: emailPass
                },
                tls: {
                    rejectUnauthorized: false, // Allow self-signed certificates
                    ciphers: 'SSLv3' // Fallback cipher for compatibility
                },
                connectionTimeout: 30000, // 30 seconds for slow connections
                greetingTimeout: 30000,
                socketTimeout: 30000,
                pool: true, // Use connection pooling
                maxConnections: 5,
                maxMessages: 100,
                rateDelta: 1000,
                rateLimit: 5
            });
            this.isConfigured = true;
            console.log("✅ Email service configured with Gmail SMTP:", emailUser);
            console.log("📧 SMTP Host:", process.env.SMTP_HOST || "smtp.gmail.com");
            console.log("🔌 SMTP Port:", smtpPort, useSecure ? "(SSL)" : "(STARTTLS)");
            console.log("↩️  Reply-To Email:", this.replyToEmail);
            
            // Test the connection (only in development)
            if (process.env.NODE_ENV !== 'production') {
                this.transporter.verify((error, success) => {
                    if (error) {
                        console.error("❌ SMTP connection test failed:", error.message);
                        console.warn("   💡 Troubleshooting:");
                        console.warn("   1. Check your Gmail App Password is correct");
                        console.warn("   2. Try port 587 instead of 465");
                        console.warn("   3. For production, use SendGrid: Set SENDGRID_API_KEY");
                    } else {
                        console.log("✅ SMTP connection verified - ready to send emails!");
                    }
                });
            } else {
                console.log("🚀 SMTP running in production with port", smtpPort);
                console.log("   Note: Using connection pooling and extended timeouts for cloud hosting");
            }
        } else {
            this.isConfigured = false;
            console.log("? Email service: No email credentials configured");
            console.log("   Expected: SENDGRID_API_KEY (recommended) or GMAIL_USER & GMAIL_PASS");
            console.log("   ?? Setup guide: https://docs.sendgrid.com/for-developers/sending-email/api-getting-started");
        }
    }

    async sendEmail(emailOptions) {
        if (!this.isConfigured) {
            const errorMsg = "❌ Email service not configured - No email provider found (RESEND_API_KEY, SENDGRID_API_KEY, or GMAIL credentials required)";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        try {
            console.log(`📧 Attempting to send email to: ${emailOptions.to}`);
            console.log(`   Subject: ${emailOptions.subject}`);
            console.log(`   Provider: ${this.useResend ? 'Resend' : this.useSendGrid ? 'SendGrid' : 'SMTP'}`);
            
            if (this.useResend) {
                // Resend API - Simple and reliable
                const resendOptions = {
                    from: emailOptions.from || this.fromEmail,
                    to: emailOptions.to,
                    subject: emailOptions.subject,
                    html: emailOptions.html,
                    reply_to: emailOptions.replyTo || this.replyToEmail,
                };

                // Add tags for tracking
                if (emailOptions.category) {
                    resendOptions.tags = [{ name: 'category', value: emailOptions.category }];
                }

                console.log(`   From: ${resendOptions.from}`);
                console.log(`   Reply-To: ${resendOptions.reply_to}`);
                
                const result = await this.resend.emails.send(resendOptions);
                console.log(`✅ Email sent successfully via Resend`);
                console.log(`   Email ID: ${result.id}`);
                return true;
                
            } else if (this.useSendGrid) {
                // SendGrid API with anti-spam configuration
                const msg = {
                    to: emailOptions.to,
                    from: {
                        email: emailOptions.from || this.fromEmail,
                        name: emailOptions.fromName || process.env.SENDGRID_FROM_NAME || 'SAP Technologies'
                    },
                    replyTo: emailOptions.replyTo || this.replyToEmail,
                    subject: emailOptions.subject,
                    html: emailOptions.html,
                    text: emailOptions.text || this.htmlToText(emailOptions.html), // Plain text version
                    
                    // Anti-spam settings
                    trackingSettings: {
                        clickTracking: { enable: true, enableText: false },
                        openTracking: { enable: true },
                        subscriptionTracking: { enable: false } // Disable default unsubscribe
                    },
                    
                    // Mail settings for better deliverability
                    mailSettings: {
                        bypassListManagement: { enable: false },
                        footer: { enable: false },
                        sandboxMode: { enable: false }
                    },
                    
                    // Category for tracking (helps SendGrid reputation)
                    categories: emailOptions.category ? [emailOptions.category] : ['transactional'],
                    
                    // Custom headers for better deliverability
                    headers: {
                        'X-Entity-Ref-ID': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    }
                };

                // Add List-Unsubscribe header for newsletters/marketing
                if (emailOptions.unsubscribeUrl) {
                    msg.headers['List-Unsubscribe'] = `<${emailOptions.unsubscribeUrl}>`;
                    msg.headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
                }
                
                await sgMail.send(msg);
                console.log(`✅ Email sent successfully via SendGrid`);
                console.log(`   Message ID: ${msg.messageId || 'N/A'}`);
                return true;
            } else {
                // SMTP (for local development)
                const mailOptions = {
                    from: emailOptions.from || '"SAP Technologies" <saptechnologies256@gmail.com>',
                    to: emailOptions.to,
                    replyTo: emailOptions.replyTo || this.replyToEmail, // Always set reply-to
                    subject: emailOptions.subject,
                    html: emailOptions.html
                };

                const info = await this.transporter.sendMail(mailOptions);
                console.log(`✅ Email sent successfully via SMTP`);
                console.log(`   Message ID: ${info.messageId}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ CRITICAL: Email sending failed!`);
            console.error(`   To: ${emailOptions.to}`);
            console.error(`   Subject: ${emailOptions.subject}`);
            console.error(`   Provider: ${this.useResend ? 'Resend' : this.useSendGrid ? 'SendGrid' : 'SMTP'}`);
            console.error(`   Error Type: ${error.name}`);
            console.error(`   Error Message: ${error.message}`);
            
            if (error.response) {
                console.error(`   API Response:`, JSON.stringify(error.response.body || error.response, null, 2));
            }
            if (error.stack) {
                console.error(`   Stack Trace:`, error.stack);
            }
            
            // Throw the error so calling code knows it failed
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    async sendContactNotification(contactData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping notification");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const adminEmail = process.env.ADMIN_EMAIL || emailUser;

            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: adminEmail,
                replyTo: contactData.email,
                subject: `?? New Contact Message from ${contactData.name}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Contact Message</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">Someone reached out to you</p>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">? Contact Information</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Name:</strong> ${contactData.name}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:${contactData.email}" style="color: #10b981; text-decoration: none;">${contactData.email}</a>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Date:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>

                            <!-- Message -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #05966915 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981;">
                                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Message</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${contactData.message}</p>
                            </div>

                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="mailto:${contactData.email}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    ?? Reply to ${contactData.name}
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    This is an automated notification from SAP Technologies Contact Form
                                </p>
                                <p style="color: #cbd5e0; margin: 5px 0; font-size: 12px;">
                                    Contact Management System
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Contact notification email sent to:", adminEmail);
        } catch (error) {
            console.error("? Error sending contact notification email:", error);
            throw error;
        }
    }

    async sendPartnershipNotification(partnershipData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping notification");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const adminEmail = process.env.ADMIN_EMAIL || emailUser;
            
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: adminEmail,
                replyTo: partnershipData.contactEmail,
                subject: `?? New Partnership Request - ${partnershipData.companyName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Partnership Request</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">A company wants to partner with you</p>
                            </div>

                            <!-- Company Info -->
                            <div style="background: linear-gradient(135deg, #8b5cf615 0%, #7c3aed15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #8b5cf6;">
                                <h2 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Company Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Company:</strong> ${partnershipData.companyName}
                                </p>
                                ${partnershipData.website ? `
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Website:</strong> <a href="${partnershipData.website}" style="color: #8b5cf6; text-decoration: none;">${partnershipData.website}</a>
                                </p>
                                ` : ''}
                            </div>

                            <!-- Contact Person Info -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Contact Person</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Name:</strong> ${partnershipData.contactPerson}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:${partnershipData.contactEmail}" style="color: #8b5cf6; text-decoration: none;">${partnershipData.contactEmail}</a>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Date:</strong> ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>

                            <!-- Partnership Description -->
                            <div style="background: #fffbeb; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">? Partnership Details</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${partnershipData.description}</p>
                            </div>

                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="mailto:${partnershipData.contactEmail}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                                    ?? Reply to ${partnershipData.contactPerson}
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    This is an automated notification from SAP Technologies Partnership Portal
                                </p>
                                <p style="color: #cbd5e0; margin: 5px 0; font-size: 12px;">
                                    Partnership Management System
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Partnership notification email sent to:", adminEmail);
        } catch (error) {
            console.error("? Error sending partnership notification email:", error);
            throw error;
        }
    }

    async sendNewsletterWelcome(subscriberData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping newsletter welcome");
            return;
        }
        
        try {
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: subscriberData.email,
                subject: "?? Welcome to SAP Technologies Newsletter!",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Welcome to SAP Technologies!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">Thank you for joining our community</p>
                            </div>

                            <!-- Welcome Message -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #3b82f6; text-align: center;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">You're Now Part of Something Special! ?</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    We're thrilled to have you on board! Get ready to receive exclusive updates, industry insights, and valuable content delivered straight to your inbox.
                                </p>
                            </div>

                            <!-- What You'll Receive -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? What You'll Receive</h2>
                                
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="font-size: 24px; margin-right: 12px;">??</span>
                                        <div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">Latest Technology Solutions</p>
                                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Stay updated with cutting-edge tech and innovations</p>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="font-size: 24px; margin-right: 12px;">??</span>
                                        <div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">Industry Insights & Tips</p>
                                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Expert advice to help grow your business</p>
                                        </div>
                                    </div>
                                </div>

                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="font-size: 24px; margin-right: 12px;">??</span>
                                        <div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">New Services & Products</p>
                                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Be the first to know about our launches</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="font-size: 24px; margin-right: 12px;">??</span>
                                        <div>
                                            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 15px;">Success Stories & Case Studies</p>
                                            <p style="margin: 5px 0 0 0; color: #718096; font-size: 14px;">Learn from real-world implementations</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Special Offer -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #05966915 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Welcome Gift</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    As a thank you, enjoy <strong>10% off</strong> your first service or product purchase! Use code <strong style="background: #10b98120; padding: 4px 12px; border-radius: 6px; color: #10b981;">WELCOME10</strong> at checkout.
                                </p>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Get in Touch</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>WhatsApp:</strong> <a href="https://wa.me/256706564628" style="color: #25D366; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Have questions or need assistance? We're here to help!
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                                    ?? Visit Our Website
                                </a>
                            </div>

                            <!-- Social Media -->
                            <div style="text-align: center; margin-top: 30px; padding-top: 25px; border-top: 2px solid #e2e8f0;">
                                <p style="color: #718096; margin: 0 0 15px 0; font-size: 14px;">Follow us on social media</p>
                                <div style="display: flex; justify-content: center; gap: 15px;">
                                    <a href="#" style="color: #3b82f6; text-decoration: none; font-size: 24px;">??</a>
                                    <a href="#" style="color: #1DA1F2; text-decoration: none; font-size: 24px;">??</a>
                                    <a href="#" style="color: #0A66C2; text-decoration: none; font-size: 24px;">??</a>
                                    <a href="#" style="color: #E4405F; text-decoration: none; font-size: 24px;">??</a>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Innovative Solutions for Your Business
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    You're receiving this because you subscribed to our newsletter at www.sap-technologies.com
                                </p>
                                <p style="color: #cbd5e0; margin: 5px 0; font-size: 12px;">
                                    <a href="https://www.sap-technologies.com/unsubscribe" style="color: #3b82f6; text-decoration: none;">Unsubscribe</a> | 
                                    <a href="https://www.sap-technologies.com/privacy" style="color: #3b82f6; text-decoration: none;">Privacy Policy</a>
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Newsletter welcome email sent to:", subscriberData.email);
        } catch (error) {
            console.error("? Error sending newsletter welcome email:", error);
            throw error;
        }
    }

    async sendUserWelcome(userData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping user welcome");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to your Gmail
                to: userData.email,
                subject: "Welcome to SAP-Technologies! Your account is ready ??",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">Welcome ${userData.name}! ??</h2>
                        <p>Your SAP Technologies account has been successfully created.</p>
                        <p><strong>Account Details:</strong></p>
                        <ul>
                            <li>Name: ${userData.name}</li>
                            <li>Email: ${userData.email}</li>
                            <li>Registration Date: ${new Date().toLocaleDateString()}</li>
                        </ul>
                        <p>You can now:</p>
                        <ul>
                            <li>? Access your personalized dashboard</li>
                            <li>? Submit partnership requests</li>
                            <li>? Connect with our team</li>
                            <li>? Receive priority support</li>
                        </ul>
                        <p>Thank you for choosing SAP Technologies!</p>
                        <p>Best regards,<br>The SAP Technologies Team</p>
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 15px; border-radius: 5px;">
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">?? Need Help? Contact Us</h4>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${emailUser}</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Our team is here to assist you!</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? User welcome email sent to:", userData.email);
        } catch (error) {
            console.error("Error sending user welcome email:", error);
        }
    }

    async sendAdminAlert(alertData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping admin alert");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || emailUser;
            
            const mailOptions = {
                from: '"SAP Technologies System" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to saptechnologies256@gmail.com
                to: notifyEmail,
                subject: `?? SAP Technologies Alert: ${alertData.type}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #ef4444;">?? System Alert</h2>
                        <p><strong>Alert Type:</strong> ${alertData.type}</p>
                        <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px;">
                            ${alertData.message}
                        </div>
                        ${alertData.details ? `
                            <p><strong>Details:</strong></p>
                            <pre style="background: #f9fafb; padding: 10px; border-radius: 5px; overflow-x: auto;">
${JSON.stringify(alertData.details, null, 2)}
                            </pre>
                        ` : ''}
                        <p>Please review and take appropriate action if needed.</p>
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 15px; border-radius: 5px;">
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">?? SAP Technologies Contact</h4>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>Admin Email:</strong> ${notifyEmail}</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Admin alert email sent to:", notifyEmail);
        } catch (error) {
            console.error("Error sending admin alert email:", error);
        }
    }

    async sendContactConfirmation(contactData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping contact confirmation");
            return;
        }
        
        try {
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: contactData.email,
                subject: "? We Received Your Message - SAP Technologies",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    <span style="font-size: 35px;">?</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Thank You, ${contactData.name}!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">We've received your message</p>
                            </div>

                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #05966915 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Your Message Has Been Received!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    Thank you for reaching out to us. Our team will review your message and get back to you within <strong>24 hours</strong>.
                                </p>
                            </div>

                            <!-- Message Summary -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Your Message</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>From:</strong> ${contactData.name}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> ${contactData.email}
                                </p>
                                <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 15px; border-left: 3px solid #10b981;">
                                    <p style="color: #4a5568; line-height: 1.8; margin: 0; font-size: 14px; white-space: pre-wrap; font-style: italic;">"${contactData.message}"</p>
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Need Immediate Assistance?</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>WhatsApp:</strong> <a href="https://wa.me/256706564628" style="color: #25D366; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    For urgent matters, feel free to call or WhatsApp us directly!
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    ?? Visit Our Website
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Innovative Solutions for Your Business
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated confirmation email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Contact confirmation email sent to:", contactData.email);
        } catch (error) {
            console.error("? Error sending contact confirmation email:", error);
            throw error;
        }
    }

    async sendPartnershipConfirmation(partnershipData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping partnership confirmation");
            return;
        }
        
        try {
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: partnershipData.contactEmail,
                subject: "?? Partnership Request Received - SAP Technologies",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Thank You, ${partnershipData.contactPerson}!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">Your partnership request has been received</p>
                            </div>

                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #8b5cf615 0%, #7c3aed15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #8b5cf6; text-align: center;">
                                <h2 style="color: #8b5cf6; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Your Partnership Request is Being Reviewed!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    We're excited about the potential collaboration with <strong>${partnershipData.companyName}</strong>. Our partnerships team will carefully review your proposal.
                                </p>
                            </div>

                            <!-- Request Summary -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Your Request Summary</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Company:</strong> ${partnershipData.companyName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Contact Person:</strong> ${partnershipData.contactPerson}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> ${partnershipData.contactEmail}
                                </p>
                                ${partnershipData.website ? `
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Website:</strong> <a href="${partnershipData.website}" style="color: #8b5cf6; text-decoration: none;">${partnershipData.website}</a>
                                </p>
                                ` : ''}
                            </div>

                            <!-- Next Steps -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? What Happens Next?</h2>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">1</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Our partnerships team will review your request and proposal</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">2</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">We'll schedule a discovery call within <strong>48 hours</strong></p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">3</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">We'll discuss potential collaboration opportunities and synergies</p>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #8b5cf6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">4</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">If aligned, we'll move forward with partnership agreements</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Partnership Team Contact</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>WhatsApp:</strong> <a href="https://wa.me/256706564628" style="color: #25D366; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Have questions? Don't hesitate to reach out!
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/partners" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);">
                                    ?? Learn About Our Partnerships
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Building Partnerships for Success
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated confirmation email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Partnership confirmation email sent to:", partnershipData.contactEmail);
        } catch (error) {
            console.error("? Error sending partnership confirmation email:", error);
            throw error;
        }
    }

    async sendUserSignupNotification(userData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping user signup notification");
            return;
        }
        
        try {
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: userData.email,
                subject: "?? Welcome to SAP Technologies - Account Created!",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Welcome, ${userData.name}! ??</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">Your SAP Technologies account is ready</p>
                            </div>

                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #14b8a615 0%, #0d948815 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #14b8a6; text-align: center;">
                                <h2 style="color: #14b8a6; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Account Successfully Created!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    You're now part of the SAP Technologies community. Start exploring our services and solutions.
                                </p>
                            </div>

                            <!-- Account Details -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Your Account Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Name:</strong> ${userData.name}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> ${userData.email}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Created:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <div style="background: #14b8a615; padding: 15px; border-radius: 8px; margin-top: 15px;">
                                    <p style="margin: 0; color: #14b8a6; font-weight: 600;">? Your account is now active!</p>
                                </div>
                            </div>

                            <!-- Features -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? What You Can Do Now</h2>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #14b8a6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Access your personalized dashboard</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #14b8a6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Submit partnership requests and proposals</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #14b8a6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Request quotes for products and services</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #14b8a6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Connect directly with our expert team</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #14b8a6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Receive priority support and updates</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="color: #14b8a6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Manage your profile and preferences</p>
                                </div>
                            </div>

                            <!-- Security Notice -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">?? Security Notice</h3>
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    Your password has been securely encrypted. Keep your credentials safe and use the "Forgot Password" option if needed.
                                </p>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Need Help?</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>WhatsApp:</strong> <a href="https://wa.me/256706564628" style="color: #25D366; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Our team is here to help you succeed!
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/account" style="display: inline-block; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(20, 184, 166, 0.4);">
                                    ?? Go to Dashboard
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Empowering Innovation, Delivering Excellence
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated welcome email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? User signup notification sent to:", userData.email);
        } catch (error) {
            console.error("? Error sending user signup notification:", error);
            throw error;
        }
    }

    async sendAdminUserSignupAlert(userData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping admin user signup alert");
            return;
        }
        
        try {
            const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || 'saptechnologies256@gmail.com';
            
            const mailOptions = {
                from: '"SAP Technologies System" <saptechnologies256@gmail.com>',
                to: notifyEmail,
                subject: `?? New User Registration: ${userData.name}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New User Registration</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">A new user has joined the platform</p>
                            </div>

                            <!-- Alert Message -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #3b82f6; text-align: center;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Account Successfully Created!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    A new user account has been registered on the SAP Technologies platform. The user has been sent a welcome email.
                                </p>
                            </div>

                            <!-- User Details -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? User Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Name:</strong> ${userData.name}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:${userData.email}" style="color: #3b82f6; text-decoration: none;">${userData.email}</a>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Registration Date:</strong> ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                </p>
                                ${userData.id ? `
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>User ID:</strong> ${userData.id}
                                </p>
                                ` : ''}
                                <div style="background: #10b98115; padding: 15px; border-radius: 8px; margin-top: 15px;">
                                    <p style="margin: 0; color: #10b981; font-weight: 600;">? Account Status: Active</p>
                                </div>
                            </div>

                            <!-- Registration Summary -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? Registration Summary</h2>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Email validation passed</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Password securely encrypted</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Welcome email sent to user</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">User profile created</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Activity log initialized</p>
                                </div>
                            </div>

                            <!-- User Access Box -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #059e6915 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981;">
                                <h3 style="color: #10b981; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">?? User Access Granted</h3>
                                <p style="margin: 0 0 12px 0; color: #2d3748; font-size: 14px;">The user can now:</p>
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #4a5568; font-size: 14px;">Access their personalized dashboard</p>
                                </div>
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #4a5568; font-size: 14px;">Submit contact forms and partnership requests</p>
                                </div>
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #4a5568; font-size: 14px;">Manage their profile and preferences</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #4a5568; font-size: 14px;">Receive notifications and updates</p>
                                </div>
                            </div>

                            <!-- Admin Actions -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? Admin Actions Available</h2>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #3b82f6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">View user profile in admin dashboard</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #3b82f6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Monitor user activity and engagement</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #3b82f6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Send targeted communications</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="color: #3b82f6; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Manage user permissions if needed</p>
                                </div>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/admin" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);">
                                    ?? View in Admin Dashboard
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies Admin System
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    System notification - User registration successful
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated system notification for administrators.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Admin user signup alert sent to:", notifyEmail);
        } catch (error) {
            console.error("? Error sending admin user signup alert:", error);
            throw error;
        }
    }

    // =====================
    // AWARDS EMAIL NOTIFICATIONS
    // =====================

    async sendNominationSubmittedUser(nominationData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping nomination confirmation");
            return;
        }
        
        try {
            const mailOptions = {
                from: '"SAPHANIOX Awards 2025" <saptechnologies256@gmail.com>',
                to: nominationData.nominatorEmail,
                subject: `🏆 Award Nomination Submitted Successfully - ${nominationData.nomineeName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    <span style="font-size: 35px;">🏆</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Nomination Submitted Successfully!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">SAPHANIOX Awards 2025</p>
                            </div>

                            <!-- Greeting -->
                            <div style="margin-bottom: 30px;">
                                <p style="color: #2d3748; margin: 0; font-size: 16px; line-height: 1.6;">
                                    Dear <strong>${nominationData.nominatorName}</strong>,
                                </p>
                                <p style="color: #4a5568; margin: 15px 0 0 0; font-size: 15px; line-height: 1.6;">
                                    Thank you for submitting a nomination for the <strong>SAPHANIOX Awards 2025</strong>! Your participation helps us recognize and celebrate excellence in technology and innovation.
                                </p>
                            </div>

                            <!-- Nomination Details -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🎯 Nomination Details</h2>
                                <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                                    <strong>Nominee:</strong> ${nominationData.nomineeName}
                                </p>
                                <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                                    <strong>Category:</strong> ${nominationData.categoryName}
                                </p>
                                <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                                    <strong>Company:</strong> ${nominationData.nomineeCompany || 'N/A'}
                                </p>
                                <p style="margin: 8px 0; color: #78350f; font-size: 15px;">
                                    <strong>Country:</strong> ${nominationData.nomineeCountry}
                                </p>
                                <div style="background: white; padding: 12px; border-radius: 8px; margin-top: 15px;">
                                    <p style="margin: 0; color: #f59e0b; font-weight: 600;">✅ Submission Status: Pending Review</p>
                                </div>
                            </div>

                            <!-- What Happens Next -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📋 What Happens Next?</h2>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">1</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Our awards team will review the nomination within <strong>48 hours</strong></p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">2</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">You'll receive an email notification when the status is updated</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">3</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">If approved, the nomination will be published for public voting</p>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">4</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Winners will be announced after the voting period ends</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Thank You Box -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #059e6915 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                                <h3 style="color: #15803d; margin: 0 0 10px 0; font-size: 16px; font-weight: 600;">🎉 Thank You for Participating!</h3>
                                <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                                    Your nomination helps us recognize and celebrate excellence in technology and innovation. We'll keep you updated on the nomination status.
                                </p>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📞 Questions? Contact Us</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Website:</strong> <a href="https://www.sap-technologies.com" style="color: #3b82f6; text-decoration: none;">www.sap-technologies.com</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Our awards team is here to help!
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/awards" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    🏆 View Awards Program
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAPHANIOX Awards 2025
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Celebrating Excellence in Technology & Innovation
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated confirmation email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("✅ Nomination confirmation sent to:", nominationData.nominatorEmail);
        } catch (error) {
            console.error("❌ Error sending nomination confirmation:", error);
            throw error;
        }
    }

    async sendNominationSubmittedAdmin(nominationData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping admin nomination alert");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || emailUser;
            
            const mailOptions = {
                from: '"SAPHANIOX Awards 2025 System" <saptechnologies256@gmail.com>',
                replyTo: emailUser,
                to: notifyEmail,
                subject: `?? New Award Nomination: ${nominationData.nomineeName} - ${nominationData.categoryName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #f59e0b;">?? New Award Nomination Received</h2>
                        <p>A new nomination has been submitted for the SAPHANIOX Awards 2025.</p>
                        
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                            <h3 style="color: #92400e; margin: 0 0 15px 0;">?? Nominee Information</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Title:</strong> ${nominationData.nomineeTitle || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Company:</strong> ${nominationData.nomineeCompany || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Country:</strong> ${nominationData.nomineeCountry}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                        </div>
                        
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0;">?? Nominator Information</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${nominationData.nominatorName}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${nominationData.nominatorEmail}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${nominationData.nominatorPhone || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Organization:</strong> ${nominationData.nominatorOrganization || 'N/A'}</p>
                        </div>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">?? Nomination Reason:</h4>
                            <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.nominationReason}</p>
                        </div>
                        
                        ${nominationData.achievements ? `
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">?? Achievements:</h4>
                                <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.achievements}</p>
                            </div>
                        ` : ''}
                        
                        ${nominationData.impactDescription ? `
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">?? Impact Description:</h4>
                                <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.impactDescription}</p>
                            </div>
                        ` : ''}
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">? Action Required</h4>
                            <p style="margin: 5px 0; color: #92400e;">Please review this nomination in the admin dashboard and update its status:</p>
                            <ul style="color: #92400e; margin: 10px 0;">
                                <li><strong>Approve</strong> - Nomination will be published for voting</li>
                                <li><strong>Reject</strong> - Nomination will not be published</li>
                            </ul>
                        </div>
                        
                        <p style="color: #374151;"><strong>Submitted:</strong> ${new Date(nominationData.createdAt).toLocaleString()}</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">?? SAPHANIOX Awards 2025 Admin Contact</h3>
                            <p style="margin: 5px 0;"><strong>?? Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>?? Admin Email:</strong> ${notifyEmail}</p>
                            <p style="margin: 15px 0 0 0; color: #059669; font-size: 14px;">Review and manage nominations in the admin dashboard</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Admin nomination alert sent to:", notifyEmail);
        } catch (error) {
            console.error("Error sending admin nomination alert:", error);
        }
    }

    async sendNominationStatusUpdate(nominationData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping status update notification");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const statusConfig = {
                approved: {
                    color: '#22c55e',
                    bgColor: '#f0fdf4',
                    icon: '?',
                    title: 'Nomination Approved!',
                    message: 'Great news! Your nomination has been approved and is now published for public voting.'
                },
                rejected: {
                    color: '#ef4444',
                    bgColor: '#fef2f2',
                    icon: '?',
                    title: 'Nomination Not Approved',
                    message: 'Thank you for your submission. Unfortunately, this nomination was not approved at this time.'
                },
                winner: {
                    color: '#f59e0b',
                    bgColor: '#fffbeb',
                    icon: '??',
                    title: 'Congratulations - Winner Announced!',
                    message: 'Exciting news! This nomination has been selected as a WINNER! Congratulations to the nominee!'
                },
                finalist: {
                    color: '#8b5cf6',
                    bgColor: '#faf5ff',
                    icon: '??',
                    title: 'Finalist Status Achieved!',
                    message: 'Wonderful news! This nomination has been selected as a FINALIST! An outstanding achievement!'
                }
            };
            
            const config = statusConfig[nominationData.status] || statusConfig.approved;
            
            const mailOptions = {
                from: '"SAPHANIOX Awards 2025" <saptechnologies256@gmail.com>',
                replyTo: emailUser,
                to: nominationData.nominatorEmail,
                subject: `${config.icon} Nomination Status Update: ${nominationData.nomineeName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: ${config.color};">${config.icon} ${config.title}</h2>
                        <p>Dear ${nominationData.nominatorName},</p>
                        <p>${config.message}</p>
                        
                        <div style="background: ${config.bgColor}; padding: 20px; border-radius: 8px; border-left: 4px solid ${config.color}; margin: 20px 0;">
                            <h3 style="color: ${config.color}; margin: 0 0 15px 0;">?? Nomination Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold; text-transform: uppercase;">${nominationData.status}</span></p>
                            <p style="margin: 15px 0 5px 0;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        ${nominationData.adminNotes ? `
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">?? Admin Notes:</h4>
                                <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.adminNotes}</p>
                            </div>
                        ` : ''}
                        
                        ${nominationData.status === 'approved' ? `
                            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #22c55e; margin: 20px 0;">
                                <h4 style="color: #15803d; margin: 0 0 10px 0;">?? What's Next?</h4>
                                <ul style="color: #15803d; margin: 10px 0;">
                                    <li>The nomination is now live for public voting</li>
                                    <li>Share with your network to gather more votes</li>
                                    <li>Voting will close before the awards ceremony</li>
                                    <li>Winners will be announced after voting ends</li>
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${nominationData.status === 'winner' || nominationData.status === 'finalist' ? `
                            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border: 2px solid #f59e0b; margin: 20px 0; text-align: center;">
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">?? Congratulations! ??</h3>
                                <p style="color: #92400e; font-size: 18px; margin: 10px 0;">This is an incredible achievement!</p>
                                <p style="color: #92400e; margin: 10px 0;">We'll be in touch soon with more details about the awards ceremony.</p>
                            </div>
                        ` : ''}
                        
                        ${nominationData.status === 'rejected' ? `
                            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <p style="color: #991b1b; margin: 5px 0;">We appreciate your participation in the SAPHANIOX Awards 2025. You're welcome to submit new nominations in the future.</p>
                            </div>
                        ` : ''}
                        
                        <p>Thank you for your participation in the SAPHANIOX Awards 2025!</p>
                        <p>Best regards,<br>The SAPHANIOX Awards 2025 Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">?? Questions? Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>?? Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>?? Email:</strong> ${emailUser}</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`? Status update (${nominationData.status}) sent to:`, nominationData.nominatorEmail);
        } catch (error) {
            console.error("Error sending status update notification:", error);
        }
    }

    async sendNominationDeletedNotification(nominationData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping deletion notification");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const mailOptions = {
                from: '"SAPHANIOX Awards 2025" <saptechnologies256@gmail.com>',
                replyTo: emailUser,
                to: nominationData.nominatorEmail,
                subject: `?? Nomination Removed: ${nominationData.nomineeName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #6b7280;">?? Nomination Removed</h2>
                        <p>Dear ${nominationData.nominatorName},</p>
                        <p>We want to inform you that a nomination you submitted has been removed from the SAPHANIOX Awards 2025.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin: 20px 0;">
                            <h3 style="color: #374151; margin: 0 0 15px 0;">?? Nomination Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Removed</p>
                            <p style="margin: 15px 0 5px 0;"><strong>Removed On:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        ${nominationData.adminNotes ? `
                            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                                <h4 style="color: #92400e; margin: 0 0 10px 0;">?? Reason for Removal:</h4>
                                <p style="color: #92400e; line-height: 1.6; margin: 0;">${nominationData.adminNotes}</p>
                            </div>
                        ` : ''}
                        
                        <p>If you have questions about this decision, please feel free to contact us.</p>
                        <p>Thank you for your interest in the SAPHANIOX Awards 2025.</p>
                        <p>Best regards,<br>The SAPHANIOX Awards 2025 Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">?? Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>?? Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>?? Email:</strong> ${emailUser}</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Deletion notification sent to:", nominationData.nominatorEmail);
        } catch (error) {
            console.error("Error sending deletion notification:", error);
        }
    }

    /**
     * Send certificate via email to recipient
     */
    async sendCertificateEmail(certificateData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping certificate email");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const fs = require('fs').promises;
            const path = require('path');
            
            // Read certificate file
            const certificatePath = path.join(__dirname, '../../uploads/certificates', certificateData.certificateFile);
            const certificateBuffer = await fs.readFile(certificatePath);
            
            // Determine email content based on status
            const statusConfig = {
                winner: {
                    color: '#f59e0b',
                    icon: '??',
                    title: 'Congratulations - Certificate of Achievement!',
                    message: `You are a WINNER! Congratulations on your outstanding achievement in the ${certificateData.categoryName}!`
                },
                finalist: {
                    color: '#8b5cf6',
                    icon: '??',
                    title: 'Congratulations - Certificate of Excellence!',
                    message: `You have been recognized as a FINALIST in the ${certificateData.categoryName}! An exceptional achievement!`
                },
                approved: {
                    color: '#2563eb',
                    icon: '?',
                    title: 'Certificate of Participation',
                    message: `Thank you for your participation in the ${certificateData.categoryName}!`
                }
            };
            
            const config = statusConfig[certificateData.status] || statusConfig.approved;
            
            const mailOptions = {
                from: '"SAPHANIOX Awards 2025" <saptechnologies256@gmail.com>',
                replyTo: emailUser,
                to: certificateData.recipientEmail,
                subject: `${config.icon} Your SAPHANIOX Awards 2025 Certificate - ${certificateData.nomineeName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: ${config.color};">${config.icon} ${config.title}</h2>
                        <p>Dear ${certificateData.recipientName || certificateData.nomineeName},</p>
                        <p>${config.message}</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">?? Certificate Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${certificateData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${certificateData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Certificate ID:</strong> ${certificateData.certificateId}</p>
                            <p style="margin: 5px 0;"><strong>Year:</strong> SAPHANIOX Awards 2025</p>
                        </div>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>?? Certificate Attached</strong><br>
                                Your official certificate is attached to this email as a PDF. You can download, print, and share it on your professional profiles.
                            </p>
                        </div>
                        
                        <p>This certificate recognizes your excellence and contribution to innovation and technology in our community.</p>
                        <p>Once again, congratulations on this well-deserved recognition!</p>
                        
                        <p>Best regards,<br>The SAPHANIOX Awards 2025 Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">?? Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>?? Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>?? Email:</strong> ${emailUser}</p>
                            <p style="margin: 5px 0;"><strong>?? Website:</strong> www.sap-technologies.com</p>
                        </div>
                    </div>
                `,
                attachments: [
                    {
                        filename: certificateData.certificateFile,
                        content: certificateBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Certificate email sent to:", certificateData.recipientEmail);
        } catch (error) {
            console.error("Error sending certificate email:", error);
            throw error;
        }
    }

    // Send product inquiry notification to admin
    async sendProductInquiryToAdmin(inquiryData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping admin notification");
            return;
        }

        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const adminEmail = process.env.ADMIN_EMAIL || emailUser;

            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: adminEmail,
                subject: `?? New Product Inquiry - ${inquiryData.productName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Product Inquiry</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">A customer is interested in your product</p>
                            </div>

                            <!-- Product Info -->
                            <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #667eea;">
                                <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Product Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Product:</strong> ${inquiryData.productName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Category:</strong> ${inquiryData.productCategory}
                                </p>
                            </div>

                            <!-- Customer Info -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Customer Information</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:${inquiryData.customerEmail}" style="color: #667eea; text-decoration: none;">${inquiryData.customerEmail}</a>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Phone:</strong> ${inquiryData.customerPhone}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Preferred Contact:</strong> <span style="background: #667eea20; padding: 4px 12px; border-radius: 20px; color: #667eea; font-weight: 600;">${inquiryData.preferredContact.toUpperCase()}</span>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Date:</strong> ${new Date(inquiryData.inquiryDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>

                            <!-- Message -->
                            ${inquiryData.message !== "No additional message" ? `
                            <div style="background: #fffbeb; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Customer Message</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            ` : ''}

                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="mailto:${inquiryData.customerEmail}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                                    ?? Reply to Customer
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    This is an automated notification from SAP Technologies
                                </p>
                                <p style="color: #cbd5e0; margin: 5px 0; font-size: 12px;">
                                    Product Inquiry Management System
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Product inquiry notification sent to admin");
        } catch (error) {
            console.error("? Error sending admin inquiry notification:", error);
            throw error;
        }
    }

    // Send product inquiry confirmation to customer
    async sendProductInquiryConfirmation(inquiryData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping customer confirmation");
            return;
        }

        try {
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: inquiryData.customerEmail,
                subject: `? We Received Your Inquiry - ${inquiryData.productName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    <span style="font-size: 35px;">?</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Thank You!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">We've received your product inquiry</p>
                            </div>

                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #05966915 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Your Inquiry Has Been Received!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    We appreciate your interest in <strong>${inquiryData.productName}</strong>. Our team will review your inquiry and get back to you as soon as possible.
                                </p>
                            </div>

                            <!-- What's Next -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? What Happens Next?</h2>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">1</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Our product specialists will review your inquiry</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">2</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">We'll contact you within <strong>24-48 hours</strong></p>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">3</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">We'll provide detailed information and answer your questions</p>
                                    </div>
                                </div>
                            </div>

                            ${inquiryData.message ? `
                            <!-- Your Message -->
                            <div style="background: #fffbeb; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Your Message</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            ` : ''}

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Need Immediate Assistance?</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>WhatsApp:</strong> <a href="https://wa.me/256706564628" style="color: #25D366; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Feel free to reach out if you have any urgent questions or need more information about our products and services.
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/products" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    ??? Explore More Products
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Innovative Solutions for Your Business
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated confirmation email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Product inquiry confirmation sent to customer:", inquiryData.customerEmail);
        } catch (error) {
            console.error("? Error sending customer inquiry confirmation:", error);
            throw error;
        }
    }

    // Service Quote Request - Send to Admin
    async sendServiceQuoteToAdmin(quoteData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping admin notification");
            return;
        }

        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const adminEmail = process.env.ADMIN_EMAIL || emailUser;

            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: adminEmail,
                subject: `?? New Service Quote Request - ${quoteData.serviceName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Service Quote Request</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">A potential client wants a quote</p>
                            </div>

                            <!-- Service Info -->
                            <div style="background: linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">??? Service Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Service:</strong> ${quoteData.serviceName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Category:</strong> ${quoteData.serviceCategory}
                                </p>
                            </div>

                            <!-- Customer Info -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Customer Information</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Name:</strong> ${quoteData.customerName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:${quoteData.customerEmail}" style="color: #f59e0b; text-decoration: none;">${quoteData.customerEmail}</a>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:${quoteData.customerPhone}" style="color: #f59e0b; text-decoration: none;">${quoteData.customerPhone}</a>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Company:</strong> ${quoteData.companyName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Preferred Contact:</strong> <span style="background: #f59e0b20; padding: 4px 12px; border-radius: 20px; color: #f59e0b; font-weight: 600;">${quoteData.preferredContact.toUpperCase()}</span>
                                </p>
                            </div>

                            <!-- Project Details -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #3b82f6;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Project Information</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Budget Range:</strong> <span style="background: #3b82f620; padding: 4px 12px; border-radius: 20px; color: #3b82f6; font-weight: 600;">${quoteData.budget}</span>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Timeline:</strong> <span style="background: #10b98120; padding: 4px 12px; border-radius: 20px; color: #10b981; font-weight: 600;">${quoteData.timeline}</span>
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Date:</strong> ${new Date(quoteData.quoteDate).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>

                            ${quoteData.projectDetails !== "No details provided" ? `
                            <!-- Project Details -->
                            <div style="background: #fffbeb; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Project Details</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${quoteData.projectDetails}</p>
                            </div>
                            ` : ''}

                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="mailto:${quoteData.customerEmail}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    ?? Send Quote to Customer
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    This is an automated notification from SAP Technologies
                                </p>
                                <p style="color: #cbd5e0; margin: 5px 0; font-size: 12px;">
                                    Service Quote Management System
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Service quote notification sent to admin");
        } catch (error) {
            console.error("? Error sending admin quote notification:", error);
            throw error;
        }
    }

    // Service Quote Request - Send confirmation to Customer
    async sendServiceQuoteConfirmation(quoteData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping customer confirmation");
            return;
        }

        try {
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                to: quoteData.customerEmail,
                subject: `? Quote Request Received - ${quoteData.serviceName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    <span style="font-size: 35px;">?</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Thank You, ${quoteData.customerName}!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">We've received your quote request</p>
                            </div>

                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b; text-align: center;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Your Quote Request Has Been Received!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    We appreciate your interest in <strong>${quoteData.serviceName}</strong>. Our team will carefully review your requirements and prepare a customized quote for you.
                                </p>
                            </div>

                            <!-- What's Next -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? What Happens Next?</h2>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">1</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Our service specialists will analyze your project requirements</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">2</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">We'll prepare a detailed quote with pricing and timeline</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">3</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Expect to hear from us within <strong>24-48 hours</strong></p>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #f59e0b; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">4</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">We'll schedule a consultation call to discuss your project</p>
                                    </div>
                                </div>
                            </div>

                            ${quoteData.projectDetails ? `
                            <!-- Your Project Details -->
                            <div style="background: #fffbeb; padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Your Project Details</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${quoteData.projectDetails}</p>
                            </div>
                            ` : ''}

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Need Immediate Assistance?</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>WhatsApp:</strong> <a href="https://wa.me/256706564628" style="color: #25D366; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Have questions or want to discuss your project in more detail? Feel free to reach out anytime!
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/services" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    ??? Explore Our Services
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Professional Services & Solutions
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated confirmation email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("? Service quote confirmation sent to customer:", quoteData.customerEmail);
        } catch (error) {
            console.error("? Error sending customer quote confirmation:", error);
            throw error;
        }
    }

    /**
     * Send password reset verification code email
     */
    async sendPasswordResetCode(userEmail, userName, verificationCode) {
        if (!this.isConfigured) {
            console.log("? Email service not configured, skipping password reset email");
            return;
        }

        try {
            const mailOptions = {
                from: '"SAP Technologies Security" <saptechnologies256@gmail.com>',
                to: userEmail,
                subject: "?? Password Reset Code - SAP Technologies",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Password Reset Request</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">Hello, ${userName}</p>
                            </div>

                            <!-- Message -->
                            <div style="background: linear-gradient(135deg, #ef444415 0%, #dc262615 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #ef4444; text-align: center;">
                                <h2 style="color: #ef4444; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Password Reset Requested</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    We received a request to reset your password. Use the verification code below to complete the process.
                                </p>
                            </div>

                            <!-- Verification Code Box -->
                            <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 3px dashed #f59e0b; border-radius: 12px; padding: 35px; text-align: center; margin: 30px 0;">
                                <p style="margin: 0 0 15px 0; color: #92400e; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">
                                    YOUR VERIFICATION CODE
                                </p>
                                <div style="font-size: 42px; font-weight: 800; color: #dc2626; letter-spacing: 10px; font-family: 'Courier New', monospace; text-shadow: 2px 2px 4px rgba(0,0,0,0.1);">
                                    ${verificationCode}
                                </div>
                                <div style="margin-top: 20px; padding: 12px; background: white; border-radius: 8px;">
                                    <p style="margin: 0; color: #f59e0b; font-size: 14px; font-weight: 600;">
                                        ?? Expires in 10 minutes
                                    </p>
                                </div>
                            </div>

                            <!-- Instructions -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? How to Use This Code</h2>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">1</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Go to the password reset page</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">2</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Enter the 6-digit verification code above</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 15px;">
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">3</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Create your new secure password</p>
                                    </div>
                                </div>
                                <div>
                                    <div style="display: flex; align-items: flex-start;">
                                        <span style="background: #ef4444; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">4</span>
                                        <p style="margin: 0; padding-top: 4px; color: #4a5568; line-height: 1.6;">Log in with your new password</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Security Warning -->
                            <div style="background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #dc2626;">
                                <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">?? Security Notice</h3>
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #991b1b; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">This code expires in 10 minutes</p>
                                </div>
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #991b1b; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">Never share this code with anyone</p>
                                </div>
                                <div style="margin-bottom: 8px; display: flex; align-items: flex-start;">
                                    <span style="color: #991b1b; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">Our team will NEVER ask for this code</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="color: #991b1b; font-size: 16px; margin-right: 8px;">�</span>
                                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">If you didn't request this, ignore this email</p>
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">??? Security Concerns?</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px; line-height: 1.6;">
                                    If you suspect unauthorized access to your account, contact our security team immediately:
                                </p>
                                <p style="color: #2d3748; margin: 12px 0 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies Security Team
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Protecting Your Account
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated security email. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Password reset code sent to:", userEmail);
        } catch (error) {
            console.error("? Error sending password reset code:", error);
            throw error;
        }
    }

    /**
     * Send password change confirmation email
     */
    async sendPasswordChangeConfirmation(userEmail, userName) {
        if (!this.isConfigured) {
            console.log("? Email service not configured, skipping confirmation email");
            return;
        }

        try {
            const mailOptions = {
                from: '"SAP Technologies Security" <saptechnologies256@gmail.com>',
                to: userEmail,
                subject: "? Password Changed Successfully - SAP Technologies",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    <span style="font-size: 35px;">??</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">Password Changed Successfully!</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">Hello, ${userName}</p>
                            </div>

                            <!-- Success Message -->
                            <div style="background: linear-gradient(135deg, #10b98115 0%, #05966915 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #10b981; text-align: center;">
                                <h2 style="color: #10b981; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">Your Password Has Been Updated!</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px;">
                                    Your password was successfully changed. You can now log in to your account using your new password.
                                </p>
                            </div>

                            <!-- Success Box -->
                            <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                <p style="margin: 0 0 15px 0; color: #065f46; font-size: 18px; font-weight: 600;">
                                    ?? Password Update Confirmed
                                </p>
                                <p style="margin: 0; color: #047857; font-size: 14px;">
                                    <strong>Changed on:</strong><br>
                                    ${new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' })}
                                </p>
                            </div>

                            <!-- Security Alert -->
                            <div style="background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%); padding: 20px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #dc2626;">
                                <h3 style="color: #991b1b; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">??? Didn't Make This Change?</h3>
                                <p style="margin: 0 0 15px 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                                    If you didn't change your password, someone else may have access to your account. Please contact our support team immediately:
                                </p>
                                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                                    <strong>Emergency Contact:</strong> <a href="tel:+256706564628" style="color: #dc2626; font-weight: 600; text-decoration: none;">+256 706 564 628</a>
                                </p>
                            </div>

                            <!-- Security Tips -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">?? Security Best Practices</h2>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Use a unique password for your SAP Technologies account</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Never share your password with anyone</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Use a combination of letters, numbers, and special characters</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Change your password regularly (every 90 days)</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="color: #10b981; font-size: 18px; margin-right: 10px;">?</span>
                                    <p style="margin: 0; color: #4a5568; line-height: 1.6;">Be cautious of phishing emails and suspicious links</p>
                                </div>
                            </div>

                            <!-- What's Next -->
                            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Next Steps</h2>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">1</span>
                                    <p style="margin: 0; padding-top: 4px; color: #1e40af; line-height: 1.6;">Log in using your new password</p>
                                </div>
                                <div style="margin-bottom: 12px; display: flex; align-items: flex-start;">
                                    <span style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">2</span>
                                    <p style="margin: 0; padding-top: 4px; color: #1e40af; line-height: 1.6;">Update your password manager if you use one</p>
                                </div>
                                <div style="display: flex; align-items: flex-start;">
                                    <span style="background: #3b82f6; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin-right: 12px; flex-shrink: 0;">3</span>
                                    <p style="margin: 0; padding-top: 4px; color: #1e40af; line-height: 1.6;">Review your account activity for any suspicious behavior</p>
                                </div>
                            </div>

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">?? Need Help?</h2>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Phone:</strong> <a href="tel:+256706564628" style="color: #3b82f6; text-decoration: none;">+256 706 564 628</a>
                                </p>
                                <p style="color: #2d3748; margin: 8px 0; font-size: 15px;">
                                    <strong>Email:</strong> <a href="mailto:saptechnologies256@gmail.com" style="color: #3b82f6; text-decoration: none;">saptechnologies256@gmail.com</a>
                                </p>
                                <p style="color: #718096; margin-top: 15px; font-size: 14px; line-height: 1.6;">
                                    Our security team is here to help protect your account.
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="https://www.sap-technologies.com/login" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    ?? Log In to Your Account
                                </a>
                            </div>

                            <!-- Footer -->
                            <div style="margin-top: 35px; padding-top: 25px; border-top: 2px solid #e2e8f0; text-align: center;">
                                <p style="color: #2d3748; margin: 5px 0; font-size: 14px; font-weight: 600;">
                                    SAP Technologies Security Team
                                </p>
                                <p style="color: #718096; margin: 5px 0; font-size: 13px;">
                                    Keeping Your Account Safe
                                </p>
                                <p style="color: #cbd5e0; margin: 15px 0 5px 0; font-size: 12px;">
                                    This is an automated security notification. Please do not reply directly to this message.
                                </p>
                            </div>
                        </div>
                    </div>
                `
            };

            await this.sendEmail(mailOptions);
            console.log("? Password change confirmation sent to:", userEmail);
        } catch (error) {
            console.error("? Error sending password change confirmation:", error);
            throw error;
        }
    }
}

module.exports = new EmailService();

