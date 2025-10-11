const nodemailer = require("nodemailer");
const sgMail = require('@sendgrid/mail');

class EmailService {
    constructor() {
        // Check for SendGrid API key first (recommended for production)
        const sendgridKey = process.env.SENDGRID_API_KEY;
        
        // Set reply-to email (always use Gmail for replies)
        this.replyToEmail = process.env.GMAIL_USER || 'saptechnologies256@gmail.com';
        
        if (sendgridKey) {
            sgMail.setApiKey(sendgridKey);
            this.useSendGrid = true;
            this.isConfigured = true;
            this.fromEmail = process.env.SENDGRID_FROM_EMAIL || process.env.GMAIL_USER || 'saptechnologies256@gmail.com';
            this.notifyEmail = process.env.NOTIFY_EMAIL || this.fromEmail;
            console.log("✅ Email service configured with SendGrid");
            console.log("📧 From Email:", this.fromEmail);
            console.log("📧 Reply-To Email:", this.replyToEmail);
            console.log("📧 Notify Email:", this.notifyEmail);
            return;
        }
        
        // Fallback to SMTP for local development
        const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
        const emailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;
        
        if (emailUser && emailPass) {
            // Use port 465 with SSL for better compatibility with cloud hosting platforms
            const smtpPort = parseInt(process.env.SMTP_PORT || "465");
            const useSecure = smtpPort === 465;
            
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: smtpPort,
                secure: useSecure, // true for 465, false for other ports
                auth: {
                    user: emailUser,
                    pass: emailPass
                },
                tls: {
                    rejectUnauthorized: false // Allow self-signed certificates (needed for some production environments)
                },
                connectionTimeout: 10000, // 10 seconds
                greetingTimeout: 10000,
                socketTimeout: 10000
            });
            this.isConfigured = true;
            console.log("✅ Email service configured with SMTP:", emailUser);
            console.log("📧 SMTP Host:", process.env.SMTP_HOST || "smtp.gmail.com");
            console.log("📧 SMTP Port:", smtpPort, useSecure ? "(SSL)" : "(TLS)");
            console.log("📧 Reply-To Email:", this.replyToEmail);
            console.log("⚠️  Note: SMTP may be blocked on some hosting platforms. Consider using SendGrid instead.");
            
            // Test the connection (only in development)
            if (process.env.NODE_ENV !== 'production') {
                this.transporter.verify((error, success) => {
                    if (error) {
                        console.error("❌ SMTP connection test failed:", error.message);
                        console.warn("   💡 For production, use SendGrid: Set SENDGRID_API_KEY environment variable");
                    } else {
                        console.log("✅ SMTP connection verified - ready to send emails!");
                    }
                });
            } else {
                console.warn("⚠️  SMTP in production - may not work if port is blocked.");
                console.warn("   💡 Recommended: Add SENDGRID_API_KEY to environment variables");
            }
        } else {
            this.isConfigured = false;
            console.log("❌ Email service: No email credentials configured");
            console.log("   Expected: SENDGRID_API_KEY (recommended) or GMAIL_USER & GMAIL_PASS");
            console.log("   📚 Setup guide: https://docs.sendgrid.com/for-developers/sending-email/api-getting-started");
        }
    }

    /**
     * Universal email sender - handles both SendGrid and SMTP
     * @param {Object} emailOptions - { to, subject, html, replyTo (optional), from (optional) }
     */
    async sendEmail(emailOptions) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping email");
            return false;
        }

        try {
            if (this.useSendGrid) {
                // SendGrid API
                const msg = {
                    to: emailOptions.to,
                    from: emailOptions.from || this.fromEmail,
                    replyTo: emailOptions.replyTo || this.replyToEmail, // Always set reply-to
                    subject: emailOptions.subject,
                    html: emailOptions.html
                };
                
                await sgMail.send(msg);
                console.log(`✅ Email sent via SendGrid to: ${emailOptions.to}`);
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

                await this.transporter.sendMail(mailOptions);
                console.log(`✅ Email sent via SMTP to: ${emailOptions.to}`);
                return true;
            }
        } catch (error) {
            console.error(`❌ Error sending email to ${emailOptions.to}:`, error.message);
            if (error.response) {
                console.error("   Response:", error.response.body);
            }
            return false;
        }
    }

    async sendContactNotification(contactData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping notification");
            return;
        }
        
        try {
            // Prepare email content
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #3b82f6;">📞 New Contact Form Submission</h2>
                    <p><strong>Name:</strong> ${contactData.name}</p>
                    <p><strong>Email:</strong> ${contactData.email}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        ${contactData.message}
                    </div>
                    <hr style="margin: 30px 0;">
                    <div style="background: #f8fafc; padding: 20px; border-radius: 5px;">
                        <h3 style="color: #1f2937; margin: 0 0 10px 0;">📞 SAP Technologies Contact Information</h3>
                        <p style="margin: 5px 0;"><strong>Phone:</strong> +256706564628</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${this.fromEmail}</p>
                        <p style="margin: 5px 0;">Please respond to this inquiry promptly.</p>
                    </div>
                </div>
            `;
            
            if (this.useSendGrid) {
                // SendGrid API
                const msg = {
                    to: this.notifyEmail,
                    from: this.fromEmail,
                    replyTo: contactData.email,
                    subject: `New Contact from ${contactData.name}`,
                    html: emailHtml
                };
                
                await sgMail.send(msg);
                console.log("✅ Contact notification email sent via SendGrid to:", this.notifyEmail);
            } else {
                // SMTP (for local development)
                const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
                const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || emailUser;
            
                const mailOptions = {
                    from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                    replyTo: contactData.email,
                    to: notifyEmail,
                    subject: `New Contact from ${contactData.name}`,
                    html: emailHtml
                };

                await this.transporter.sendMail(mailOptions);
                console.log("✅ Contact notification email sent via SMTP to:", notifyEmail);
            }
        } catch (error) {
            console.error("❌ Error sending contact notification email:", error.message);
            console.error("   Error code:", error.code);
            console.error("   Error response:", error.response);
            console.error("   Full error:", error);
        }
    }

    async sendPartnershipNotification(partnershipData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping notification");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || emailUser;
            
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to saptechnologies256@gmail.com
                to: notifyEmail,
                subject: `New Partnership Request from ${partnershipData.companyName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">🤝 New Partnership Request</h2>
                        <p><strong>Company Name:</strong> ${partnershipData.companyName}</p>
                        <p><strong>Contact Person:</strong> ${partnershipData.contactPerson}</p>
                        <p><strong>Email:</strong> ${partnershipData.contactEmail}</p>
                        ${partnershipData.website ? `<p><strong>Website:</strong> <a href="${partnershipData.website}">${partnershipData.website}</a></p>` : ''}
                        <p><strong>Description:</strong></p>
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 5px; margin: 10px 0;">
                            ${partnershipData.description}
                        </div>
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #1f2937; margin: 0 0 10px 0;">📞 SAP Technologies Contact Information</h3>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${emailUser}</p>
                            <p style="margin: 5px 0;">Follow up on this partnership opportunity.</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Partnership notification email sent successfully to:", notifyEmail);
        } catch (error) {
            console.error("Error sending partnership notification email:", error);
        }
    }

    async sendNewsletterWelcome(subscriberData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping newsletter welcome");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to your Gmail
                to: subscriberData.email,
                subject: "Welcome to SAP Technologies Newsletter! 🚀",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">Welcome to SAP Technologies! 🎉</h2>
                        <p>Hi there!</p>
                        <p>Thank you for subscribing to our newsletter. We're excited to have you on board!</p>
                        <p>You'll receive updates about:</p>
                        <ul>
                            <li>🚀 Latest technology solutions</li>
                            <li>💡 Industry insights and tips</li>
                            <li>🎯 New services and products</li>
                            <li>📈 Success stories and case studies</li>
                        </ul>
                        <p>Stay tuned for amazing content!</p>
                        <p>Best regards,<br>The SAP Technologies Team</p>
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">📞 Contact Us</h4>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${emailUser}</p>
                        </div>
                        <p style="font-size: 12px; color: #666;">
                            If you no longer wish to receive these emails, you can unsubscribe at any time.
                        </p>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Newsletter welcome email sent to:", subscriberData.email);
        } catch (error) {
            console.error("Error sending newsletter welcome email:", error);
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
                subject: "Welcome to SAP-Technologies! Your account is ready 🎉",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">Welcome ${userData.name}! 🎉</h2>
                        <p>Your SAP Technologies account has been successfully created.</p>
                        <p><strong>Account Details:</strong></p>
                        <ul>
                            <li>Name: ${userData.name}</li>
                            <li>Email: ${userData.email}</li>
                            <li>Registration Date: ${new Date().toLocaleDateString()}</li>
                        </ul>
                        <p>You can now:</p>
                        <ul>
                            <li>✅ Access your personalized dashboard</li>
                            <li>✅ Submit partnership requests</li>
                            <li>✅ Connect with our team</li>
                            <li>✅ Receive priority support</li>
                        </ul>
                        <p>Thank you for choosing SAP Technologies!</p>
                        <p>Best regards,<br>The SAP Technologies Team</p>
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 15px; border-radius: 5px;">
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">📞 Need Help? Contact Us</h4>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${emailUser}</p>
                            <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">Our team is here to assist you!</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ User welcome email sent to:", userData.email);
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
                subject: `🚨 SAP Technologies Alert: ${alertData.type}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #ef4444;">🚨 System Alert</h2>
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
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">📞 SAP Technologies Contact</h4>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>Admin Email:</strong> ${notifyEmail}</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Admin alert email sent to:", notifyEmail);
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
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER || this.fromEmail;
            
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #3b82f6;">Thank you for reaching out! 📧</h2>
                    <p>Hi ${contactData.name},</p>
                    <p>We've received your message and wanted to let you know that we'll get back to you within 24 hours.</p>
                    
                    <div style="background: #f0f9ff; padding: 20px; border-radius: 5px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                        <h3 style="color: #1e40af; margin: 0 0 10px 0;">📝 Your Message Summary:</h3>
                        <p style="margin: 5px 0;"><strong>Name:</strong> ${contactData.name}</p>
                        <p style="margin: 5px 0;"><strong>Email:</strong> ${contactData.email}</p>
                        <p style="margin: 15px 0 5px 0;"><strong>Your Message:</strong></p>
                        <div style="background: white; padding: 15px; border-radius: 3px; font-style: italic;">
                            "${contactData.message}"
                        </div>
                    </div>
                    
                    <p>In the meantime, feel free to:</p>
                    <ul>
                        <li>🌐 Explore our services and solutions</li>
                        <li>📱 Follow us on social media</li>
                        <li>📞 Call us directly for urgent matters</li>
                    </ul>
                    
                    <p>Best regards,<br>The SAP Technologies Team</p>
                    
                    <hr style="margin: 30px 0;">
                    <div style="background: #f8fafc; padding: 20px; border-radius: 5px;">
                        <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Contact Information</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                            <div>
                                <p style="margin: 5px 0;"><strong>📞 Phone:</strong></p>
                                <p style="margin: 0; font-size: 18px; color: #3b82f6; font-weight: bold;">+256706564628</p>
                            </div>
                            <div>
                                <p style="margin: 5px 0;"><strong>📧 Email:</strong></p>
                                <p style="margin: 0; color: #3b82f6;">${emailUser}</p>
                            </div>
                        </div>
                        <p style="margin: 15px 0 5px 0; color: #16a34a; font-weight: bold;">⏰ We typically respond within 24 hours!</p>
                    </div>
                    
                    <div style="margin: 30px 0; padding: 15px; background: #fefce8; border-radius: 5px; border: 1px solid #facc15;">
                        <p style="margin: 0; font-size: 14px; color: #a16207;">
                            <strong>💡 Tip:</strong> Save our contact number <strong>+256706564628</strong> for quick access!
                        </p>
                    </div>
                </div>
            `;

            if (this.useSendGrid) {
                // SendGrid API
                const msg = {
                    to: contactData.email,
                    from: this.fromEmail,
                    replyTo: emailUser,
                    subject: "Thank you for contacting SAP Technologies! ✅",
                    html: emailHtml
                };
                
                await sgMail.send(msg);
                console.log("✅ Contact confirmation email sent via SendGrid to:", contactData.email);
            } else {
                // SMTP (for local development)
                const mailOptions = {
                    from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                    replyTo: emailUser,
                    to: contactData.email,
                    subject: "Thank you for contacting SAP Technologies! ✅",
                    html: emailHtml
                };

                await this.transporter.sendMail(mailOptions);
                console.log("✅ Contact confirmation email sent via SMTP to:", contactData.email);
            }
        } catch (error) {
            console.error("Error sending contact confirmation email:", error);
        }
    }

    async sendPartnershipConfirmation(partnershipData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping partnership confirmation");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const mailOptions = {
                from: '"SAP Technologies Partnerships" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to your Gmail
                to: partnershipData.contactEmail,
                subject: "Partnership Request Received - SAP Technologies 🤝",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">Thank you for your partnership interest! 🤝</h2>
                        <p>Hello ${partnershipData.contactPerson},</p>
                        <p>We've received your partnership request for <strong>${partnershipData.companyName}</strong> and are excited about the potential collaboration!</p>
                        
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 5px; border-left: 4px solid #22c55e; margin: 20px 0;">
                            <h3 style="color: #15803d; margin: 0 0 10px 0;">📋 Request Summary:</h3>
                            <p style="margin: 5px 0;"><strong>Company:</strong> ${partnershipData.companyName}</p>
                            <p style="margin: 5px 0;"><strong>Contact:</strong> ${partnershipData.contactPerson}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${partnershipData.contactEmail}</p>
                            ${partnershipData.website ? `<p style="margin: 5px 0;"><strong>Website:</strong> <a href="${partnershipData.website}">${partnershipData.website}</a></p>` : ''}
                        </div>
                        
                        <h3 style="color: #1f2937;">🚀 Next Steps:</h3>
                        <ol>
                            <li>Our partnerships team will review your request</li>
                            <li>We'll schedule a discovery call within 48 hours</li>
                            <li>We'll discuss potential collaboration opportunities</li>
                            <li>If aligned, we'll move forward with partnership agreements</li>
                        </ol>
                        
                        <p>Best regards,<br>The SAP Technologies Partnerships Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 5px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Direct Contact</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${emailUser}</p>
                            <p style="margin: 15px 0 0 0; color: #059669; font-weight: bold;">⏰ Partnership team response: Within 48 hours</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Partnership confirmation email sent to:", partnershipData.contactEmail);
        } catch (error) {
            console.error("Error sending partnership confirmation email:", error);
        }
    }

    async sendUserSignupNotification(userData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping user signup notification");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const mailOptions = {
                from: '"SAP Technologies" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to your Gmail for support
                to: userData.email,
                subject: "Welcome to SAP Technologies! Your account is ready 🎉",
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">Welcome to SAP Technologies! 🎉</h2>
                        <p>Hi ${userData.name},</p>
                        <p>Congratulations! Your SAP Technologies account has been successfully created and is ready to use.</p>
                        
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
                            <h3 style="color: #15803d; margin: 0 0 15px 0;">📝 Account Details</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${userData.name}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${userData.email}</p>
                            <p style="margin: 5px 0;"><strong>Account Created:</strong> ${new Date().toLocaleDateString()}</p>
                            <p style="margin: 15px 0 5px 0; color: #059669; font-weight: bold;">✅ Your account is now active and ready to use!</p>
                        </div>
                        
                        <h3 style="color: #1f2937;">🚀 What you can do now:</h3>
                        <ul style="color: #374151;">
                            <li>📊 Access your personalized dashboard</li>
                            <li>🤝 Submit partnership requests</li>
                            <li>📞 Connect directly with our team</li>
                            <li>🎯 Submit project inquiries</li>
                            <li>📧 Receive priority support and updates</li>
                            <li>📋 Manage your profile and preferences</li>
                        </ul>
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">🔒 Account Security</h4>
                            <p style="margin: 5px 0; color: #92400e;">Your password has been securely encrypted and stored. Please keep your login credentials safe.</p>
                            <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">If you forget your password, you can reset it anytime using the "Forgot Password" option.</p>
                        </div>
                        
                        <h3 style="color: #1f2937;">🎆 Next Steps:</h3>
                        <ol style="color: #374151;">
                            <li>Log in to your account using your email and password</li>
                            <li>Complete your profile information</li>
                            <li>Explore our services and solutions</li>
                            <li>Contact us for any assistance you need</li>
                        </ol>
                        
                        <p>We're excited to have you as part of the SAP Technologies community!</p>
                        <p>Best regards,<br>The SAP Technologies Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Need Help? Contact Us</h3>
                            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                                <div>
                                    <p style="margin: 5px 0;"><strong>📞 Phone:</strong></p>
                                    <p style="margin: 0; font-size: 18px; color: #3b82f6; font-weight: bold;">+256706564628</p>
                                </div>
                                <div>
                                    <p style="margin: 5px 0;"><strong>📧 Email Support:</strong></p>
                                    <p style="margin: 0; color: #3b82f6;">${emailUser}</p>
                                </div>
                            </div>
                            <p style="margin: 15px 0 0 0; color: #16a34a; font-weight: bold;">💬 Our team is here to help you succeed!</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ User signup notification sent to:", userData.email);
        } catch (error) {
            console.error("Error sending user signup notification:", error);
        }
    }

    async sendAdminUserSignupAlert(userData) {
        if (!this.isConfigured) {
            console.log("Email service not configured, skipping admin user signup alert");
            return;
        }
        
        try {
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            const notifyEmail = process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || emailUser;
            
            const mailOptions = {
                from: '"SAP Technologies System" <saptechnologies256@gmail.com>',
                replyTo: emailUser, // Replies go to saptechnologies256@gmail.com
                to: notifyEmail,
                subject: `🎆 New User Registration: ${userData.name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #3b82f6;">🎆 New User Registration Alert</h2>
                        <p>A new user has successfully registered on the SAP Technologies platform.</p>
                        
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📝 New User Details</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${userData.name}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${userData.email}</p>
                            <p style="margin: 5px 0;"><strong>Registration Date:</strong> ${new Date().toLocaleString()}</p>
                            <p style="margin: 5px 0;"><strong>User ID:</strong> ${userData.id || 'Generated after save'}</p>
                            <p style="margin: 15px 0 5px 0; color: #1d4ed8; font-weight: bold;">✅ Account Status: Active</p>
                        </div>
                        
                        <h3 style="color: #1f2937;">📊 Registration Summary:</h3>
                        <ul style="color: #374151;">
                            <li>✅ Email validation: Passed</li>
                            <li>🔒 Password: Securely encrypted</li>
                            <li>📧 Welcome email: Sent to user</li>
                            <li>📋 User profile: Created</li>
                            <li>📝 Activity log: Initialized</li>
                        </ul>
                        
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #22c55e; margin: 20px 0;">
                            <h4 style="color: #15803d; margin: 0 0 10px 0;">🚀 User Access Granted</h4>
                            <p style="margin: 5px 0; color: #15803d;">The user can now:</p>
                            <ul style="color: #15803d; margin: 10px 0;">
                                <li>Access their dashboard</li>
                                <li>Submit contact forms and partnership requests</li>
                                <li>Manage their profile</li>
                                <li>Receive notifications and updates</li>
                            </ul>
                        </div>
                        
                        <h3 style="color: #1f2937;">🔍 Admin Actions Available:</h3>
                        <ul style="color: #374151;">
                            <li>View user profile in admin dashboard</li>
                            <li>Monitor user activity and engagement</li>
                            <li>Send targeted communications</li>
                            <li>Manage user permissions if needed</li>
                        </ul>
                        
                        <p style="color: #374151;">You can review the user's profile and activity in the admin dashboard.</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 SAP Technologies Admin Contact</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Admin Email:</strong> ${notifyEmail}</p>
                            <p style="margin: 15px 0 0 0; color: #059669; font-size: 14px;">System notification - User registration successful</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Admin user signup alert sent to:", notifyEmail);
        } catch (error) {
            console.error("Error sending admin user signup alert:", error);
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
            const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
            
            const mailOptions = {
                from: '"SAPHANIOX Awards 2025" <saptechnologies256@gmail.com>',
                replyTo: emailUser,
                to: nominationData.nominatorEmail,
                subject: `🏆 Award Nomination Submitted Successfully - ${nominationData.nomineeName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #f59e0b;">🏆 Nomination Submitted Successfully!</h2>
                        <p>Dear ${nominationData.nominatorName},</p>
                        <p>Thank you for submitting a nomination for the <strong>SAPHANIOX Awards 2025</strong>!</p>
                        
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                            <h3 style="color: #92400e; margin: 0 0 15px 0;">🎯 Nomination Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Company:</strong> ${nominationData.nomineeCompany || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Country:</strong> ${nominationData.nomineeCountry}</p>
                            <p style="margin: 15px 0 5px 0; color: #d97706; font-weight: bold;">✅ Submission Status: Pending Review</p>
                        </div>
                        
                        <h3 style="color: #1f2937;">📋 What Happens Next?</h3>
                        <ol style="color: #374151;">
                            <li>Our awards team will review the nomination within 48 hours</li>
                            <li>You'll receive an email notification when the status is updated</li>
                            <li>If approved, the nomination will be published for public voting</li>
                            <li>Winners will be announced after the voting period ends</li>
                        </ol>
                        
                        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #22c55e; margin: 20px 0;">
                            <h4 style="color: #15803d; margin: 0 0 10px 0;">🎉 Thank You!</h4>
                            <p style="margin: 5px 0; color: #15803d;">Your nomination helps us recognize and celebrate excellence in technology and innovation.</p>
                        </div>
                        
                        <p>We'll keep you updated on the nomination status. Thank you for participating!</p>
                        <p>Best regards,<br>The SAPHANIOX Awards 2025 Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${emailUser}</p>
                            <p style="margin: 15px 0 0 0; color: #059669; font-size: 14px;">Questions? We're here to help!</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Nomination confirmation sent to:", nominationData.nominatorEmail);
        } catch (error) {
            console.error("Error sending nomination confirmation:", error);
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
                subject: `🏆 New Award Nomination: ${nominationData.nomineeName} - ${nominationData.categoryName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #f59e0b;">🏆 New Award Nomination Received</h2>
                        <p>A new nomination has been submitted for the SAPHANIOX Awards 2025.</p>
                        
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                            <h3 style="color: #92400e; margin: 0 0 15px 0;">👤 Nominee Information</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Title:</strong> ${nominationData.nomineeTitle || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Company:</strong> ${nominationData.nomineeCompany || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Country:</strong> ${nominationData.nomineeCountry}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                        </div>
                        
                        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                            <h3 style="color: #1e40af; margin: 0 0 15px 0;">📝 Nominator Information</h3>
                            <p style="margin: 5px 0;"><strong>Name:</strong> ${nominationData.nominatorName}</p>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${nominationData.nominatorEmail}</p>
                            <p style="margin: 5px 0;"><strong>Phone:</strong> ${nominationData.nominatorPhone || 'N/A'}</p>
                            <p style="margin: 5px 0;"><strong>Organization:</strong> ${nominationData.nominatorOrganization || 'N/A'}</p>
                        </div>
                        
                        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <h4 style="color: #1f2937; margin: 0 0 10px 0;">📄 Nomination Reason:</h4>
                            <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.nominationReason}</p>
                        </div>
                        
                        ${nominationData.achievements ? `
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">🏅 Achievements:</h4>
                                <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.achievements}</p>
                            </div>
                        ` : ''}
                        
                        ${nominationData.impactDescription ? `
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">💫 Impact Description:</h4>
                                <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.impactDescription}</p>
                            </div>
                        ` : ''}
                        
                        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0;">⚡ Action Required</h4>
                            <p style="margin: 5px 0; color: #92400e;">Please review this nomination in the admin dashboard and update its status:</p>
                            <ul style="color: #92400e; margin: 10px 0;">
                                <li><strong>Approve</strong> - Nomination will be published for voting</li>
                                <li><strong>Reject</strong> - Nomination will not be published</li>
                            </ul>
                        </div>
                        
                        <p style="color: #374151;"><strong>Submitted:</strong> ${new Date(nominationData.createdAt).toLocaleString()}</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 SAPHANIOX Awards 2025 Admin Contact</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Admin Email:</strong> ${notifyEmail}</p>
                            <p style="margin: 15px 0 0 0; color: #059669; font-size: 14px;">Review and manage nominations in the admin dashboard</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Admin nomination alert sent to:", notifyEmail);
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
                    icon: '✅',
                    title: 'Nomination Approved!',
                    message: 'Great news! Your nomination has been approved and is now published for public voting.'
                },
                rejected: {
                    color: '#ef4444',
                    bgColor: '#fef2f2',
                    icon: '❌',
                    title: 'Nomination Not Approved',
                    message: 'Thank you for your submission. Unfortunately, this nomination was not approved at this time.'
                },
                winner: {
                    color: '#f59e0b',
                    bgColor: '#fffbeb',
                    icon: '🏆',
                    title: 'Congratulations - Winner Announced!',
                    message: 'Exciting news! This nomination has been selected as a WINNER! Congratulations to the nominee!'
                },
                finalist: {
                    color: '#8b5cf6',
                    bgColor: '#faf5ff',
                    icon: '🥈',
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
                            <h3 style="color: ${config.color}; margin: 0 0 15px 0;">🎯 Nomination Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${config.color}; font-weight: bold; text-transform: uppercase;">${nominationData.status}</span></p>
                            <p style="margin: 15px 0 5px 0;"><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        ${nominationData.adminNotes ? `
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                                <h4 style="color: #1f2937; margin: 0 0 10px 0;">📝 Admin Notes:</h4>
                                <p style="color: #374151; line-height: 1.6; margin: 0;">${nominationData.adminNotes}</p>
                            </div>
                        ` : ''}
                        
                        ${nominationData.status === 'approved' ? `
                            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #22c55e; margin: 20px 0;">
                                <h4 style="color: #15803d; margin: 0 0 10px 0;">🎉 What's Next?</h4>
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
                                <h3 style="color: #92400e; margin: 0 0 15px 0;">🎊 Congratulations! 🎊</h3>
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
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Questions? Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${emailUser}</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log(`✅ Status update (${nominationData.status}) sent to:`, nominationData.nominatorEmail);
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
                subject: `ℹ️ Nomination Removed: ${nominationData.nomineeName}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #6b7280;">ℹ️ Nomination Removed</h2>
                        <p>Dear ${nominationData.nominatorName},</p>
                        <p>We want to inform you that a nomination you submitted has been removed from the SAPHANIOX Awards 2025.</p>
                        
                        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; border-left: 4px solid #6b7280; margin: 20px 0;">
                            <h3 style="color: #374151; margin: 0 0 15px 0;">📋 Nomination Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${nominationData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${nominationData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Removed</p>
                            <p style="margin: 15px 0 5px 0;"><strong>Removed On:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        
                        ${nominationData.adminNotes ? `
                            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; border: 1px solid #f59e0b; margin: 20px 0;">
                                <h4 style="color: #92400e; margin: 0 0 10px 0;">📝 Reason for Removal:</h4>
                                <p style="color: #92400e; line-height: 1.6; margin: 0;">${nominationData.adminNotes}</p>
                            </div>
                        ` : ''}
                        
                        <p>If you have questions about this decision, please feel free to contact us.</p>
                        <p>Thank you for your interest in the SAPHANIOX Awards 2025.</p>
                        <p>Best regards,<br>The SAPHANIOX Awards 2025 Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${emailUser}</p>
                        </div>
                    </div>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Deletion notification sent to:", nominationData.nominatorEmail);
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
                    icon: '🏆',
                    title: 'Congratulations - Certificate of Achievement!',
                    message: `You are a WINNER! Congratulations on your outstanding achievement in the ${certificateData.categoryName}!`
                },
                finalist: {
                    color: '#8b5cf6',
                    icon: '🥈',
                    title: 'Congratulations - Certificate of Excellence!',
                    message: `You have been recognized as a FINALIST in the ${certificateData.categoryName}! An exceptional achievement!`
                },
                approved: {
                    color: '#2563eb',
                    icon: '⭐',
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
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📜 Certificate Details</h3>
                            <p style="margin: 5px 0;"><strong>Nominee:</strong> ${certificateData.nomineeName}</p>
                            <p style="margin: 5px 0;"><strong>Category:</strong> ${certificateData.categoryName}</p>
                            <p style="margin: 5px 0;"><strong>Certificate ID:</strong> ${certificateData.certificateId}</p>
                            <p style="margin: 5px 0;"><strong>Year:</strong> SAPHANIOX Awards 2025</p>
                        </div>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>📎 Certificate Attached</strong><br>
                                Your official certificate is attached to this email as a PDF. You can download, print, and share it on your professional profiles.
                            </p>
                        </div>
                        
                        <p>This certificate recognizes your excellence and contribution to innovation and technology in our community.</p>
                        <p>Once again, congratulations on this well-deserved recognition!</p>
                        
                        <p>Best regards,<br>The SAPHANIOX Awards 2025 Team</p>
                        
                        <hr style="margin: 30px 0;">
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
                            <h3 style="color: #1f2937; margin: 0 0 15px 0;">📞 Contact Us</h3>
                            <p style="margin: 5px 0;"><strong>📞 Phone:</strong> +256706564628</p>
                            <p style="margin: 5px 0;"><strong>📧 Email:</strong> ${emailUser}</p>
                            <p style="margin: 5px 0;"><strong>🌐 Website:</strong> www.sap-technologies.com</p>
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
            console.log("✅ Certificate email sent to:", certificateData.recipientEmail);
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
                subject: `🔔 New Product Inquiry - ${inquiryData.productName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                                    <span style="font-size: 35px;">📬</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Product Inquiry</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">A customer is interested in your product</p>
                            </div>

                            <!-- Product Info -->
                            <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #667eea;">
                                <h2 style="color: #667eea; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📦 Product Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Product:</strong> ${inquiryData.productName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Category:</strong> ${inquiryData.productCategory}
                                </p>
                            </div>

                            <!-- Customer Info -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">👤 Customer Information</h2>
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
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💬 Customer Message</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            ` : ''}

                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="mailto:${inquiryData.customerEmail}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;">
                                    ✉️ Reply to Customer
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
            console.log("✅ Product inquiry notification sent to admin");
        } catch (error) {
            console.error("❌ Error sending admin inquiry notification:", error);
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
                subject: `✅ We Received Your Inquiry - ${inquiryData.productName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    <span style="font-size: 35px;">✅</span>
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
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📋 What Happens Next?</h2>
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
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💬 Your Message</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${inquiryData.message}</p>
                            </div>
                            ` : ''}

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📞 Need Immediate Assistance?</h2>
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
                                <a href="http://sap-technologies.com/products" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                                    🛍️ Explore More Products
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
            console.log("✅ Product inquiry confirmation sent to customer:", inquiryData.customerEmail);
        } catch (error) {
            console.error("❌ Error sending customer inquiry confirmation:", error);
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
                subject: `💼 New Service Quote Request - ${quoteData.serviceName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    <span style="font-size: 35px;">💼</span>
                                </div>
                                <h1 style="color: #2d3748; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">New Service Quote Request</h1>
                                <p style="color: #718096; margin: 0; font-size: 16px;">A potential client wants a quote</p>
                            </div>

                            <!-- Service Info -->
                            <div style="background: linear-gradient(135deg, #f59e0b15 0%, #d9770615 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">🛠️ Service Details</h2>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Service:</strong> ${quoteData.serviceName}
                                </p>
                                <p style="margin: 8px 0; color: #2d3748; font-size: 15px;">
                                    <strong>Category:</strong> ${quoteData.serviceCategory}
                                </p>
                            </div>

                            <!-- Customer Info -->
                            <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">👤 Customer Information</h2>
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
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📋 Project Information</h2>
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
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💬 Project Details</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${quoteData.projectDetails}</p>
                            </div>
                            ` : ''}

                            <!-- Action Button -->
                            <div style="text-align: center; margin-top: 35px;">
                                <a href="mailto:${quoteData.customerEmail}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    ✉️ Send Quote to Customer
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
            console.log("✅ Service quote notification sent to admin");
        } catch (error) {
            console.error("❌ Error sending admin quote notification:", error);
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
                subject: `✅ Quote Request Received - ${quoteData.serviceName}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; border-radius: 15px;">
                        <div style="background: white; padding: 35px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 35px;">
                                <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); width: 70px; height: 70px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    <span style="font-size: 35px;">✅</span>
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
                                <h2 style="color: #2d3748; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">📋 What Happens Next?</h2>
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
                                <h2 style="color: #f59e0b; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">💼 Your Project Details</h2>
                                <p style="color: #2d3748; line-height: 1.8; margin: 0; font-size: 15px; white-space: pre-wrap;">${quoteData.projectDetails}</p>
                            </div>
                            ` : ''}

                            <!-- Contact Info -->
                            <div style="background: linear-gradient(135deg, #3b82f615 0%, #2563eb15 100%); padding: 25px; border-radius: 10px; margin-bottom: 30px;">
                                <h2 style="color: #3b82f6; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">📞 Need Immediate Assistance?</h2>
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
                                <a href="http://sap-technologies.com/services" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 30px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);">
                                    🛠️ Explore Our Services
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
            console.log("✅ Service quote confirmation sent to customer:", quoteData.customerEmail);
        } catch (error) {
            console.error("❌ Error sending customer quote confirmation:", error);
            throw error;
        }
    }

    /**
     * Send password reset verification code email
     */
    async sendPasswordResetCode(userEmail, userName, verificationCode) {
        if (!this.isConfigured) {
            console.log("❌ Email service not configured, skipping password reset email");
            return;
        }

        try {
            const mailOptions = {
                from: '"SAP Technologies - No Reply" <noreply@sap-technologies.com>',
                replyTo: process.env.GMAIL_USER || process.env.SMTP_USER,
                to: userEmail,
                subject: "Password Reset Verification Code",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Password Reset</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #1a237e 0%, #3949ab 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">🔐 Password Reset</h1>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">SAP Technologies</p>
                            </div>

                            <!-- Content -->
                            <div style="padding: 40px 30px;">
                                <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                                    Hi <strong>${userName}</strong>,
                                </p>

                                <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                    We received a request to reset your password. Use the verification code below to complete the password reset process:
                                </p>

                                <!-- Verification Code Box -->
                                <div style="background: linear-gradient(135deg, #e0f2fe 0%, #dbeafe 100%); border: 2px dashed #3b82f6; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                                    <p style="margin: 0 0 10px 0; color: #1e40af; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                                        Your Verification Code
                                    </p>
                                    <div style="font-size: 36px; font-weight: 800; color: #1a237e; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                        ${verificationCode}
                                    </div>
                                    <p style="margin: 15px 0 0 0; color: #3b82f6; font-size: 13px;">
                                        ⏱️ Valid for 10 minutes
                                    </p>
                                </div>

                                <!-- Instructions -->
                                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                        <strong>⚠️ Security Notice:</strong><br>
                                        • This code expires in 10 minutes<br>
                                        • Never share this code with anyone<br>
                                        • If you didn't request this reset, please ignore this email
                                    </p>
                                </div>

                                <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                    If you have any concerns about your account security, please contact our support team immediately.
                                </p>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                                    This is an automated message from SAP Technologies
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                    Kampala, Uganda | +256706564628<br>
                                    <a href="mailto:${process.env.GMAIL_USER || process.env.SMTP_USER}" style="color: #3b82f6; text-decoration: none;">${process.env.GMAIL_USER || process.env.SMTP_USER}</a>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Password reset code sent to:", userEmail);
        } catch (error) {
            console.error("❌ Error sending password reset code:", error);
            throw error;
        }
    }

    /**
     * Send password change confirmation email
     */
    async sendPasswordChangeConfirmation(userEmail, userName) {
        if (!this.isConfigured) {
            console.log("❌ Email service not configured, skipping confirmation email");
            return;
        }

        try {
            const mailOptions = {
                from: '"SAP Technologies - No Reply" <noreply@sap-technologies.com>',
                replyTo: process.env.GMAIL_USER || process.env.SMTP_USER,
                to: userEmail,
                subject: "Password Changed Successfully",
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Password Changed</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                        <div style="max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                            <!-- Header -->
                            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                                <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
                                <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Password Changed</h1>
                                <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">SAP Technologies</p>
                            </div>

                            <!-- Content -->
                            <div style="padding: 40px 30px;">
                                <p style="margin: 0 0 20px 0; color: #1f2937; font-size: 16px; line-height: 1.6;">
                                    Hi <strong>${userName}</strong>,
                                </p>

                                <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                                    Your password has been changed successfully. You can now log in to your account using your new password.
                                </p>

                                <!-- Success Box -->
                                <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border: 2px solid #10b981; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0;">
                                    <p style="margin: 0; color: #065f46; font-size: 16px; font-weight: 600;">
                                        🎉 Your password has been updated
                                    </p>
                                    <p style="margin: 10px 0 0 0; color: #047857; font-size: 14px;">
                                        Changed on: ${new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                                    </p>
                                </div>

                                <!-- Security Alert -->
                                <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; border-radius: 8px; margin: 30px 0;">
                                    <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">
                                        <strong>🛡️ Didn't make this change?</strong><br>
                                        If you didn't change your password, please contact our support team immediately at 
                                        <a href="tel:+256706564628" style="color: #dc2626; font-weight: 600;">+256706564628</a> 
                                        to secure your account.
                                    </p>
                                </div>

                                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px; margin: 30px 0;">
                                    <p style="margin: 0 0 10px 0; color: #0c4a6e; font-size: 14px; font-weight: 600;">
                                        🔐 Security Tips:
                                    </p>
                                    <ul style="margin: 0; padding-left: 20px; color: #0369a1; font-size: 13px; line-height: 1.8;">
                                        <li>Use a unique password for your SAP Technologies account</li>
                                        <li>Never share your password with anyone</li>
                                        <li>Enable two-factor authentication for extra security</li>
                                        <li>Change your password regularly</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Footer -->
                            <div style="background: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
                                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 13px; text-align: center;">
                                    This is an automated security notification from SAP Technologies
                                </p>
                                <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                                    Kampala, Uganda | +256706564628<br>
                                    <a href="mailto:${process.env.GMAIL_USER || process.env.SMTP_USER}" style="color: #3b82f6; text-decoration: none;">${process.env.GMAIL_USER || process.env.SMTP_USER}</a>
                                </p>
                            </div>
                        </div>
                    </body>
                    </html>
                `
            };

            await this.transporter.sendMail(mailOptions);
            console.log("✅ Password change confirmation sent to:", userEmail);
        } catch (error) {
            console.error("❌ Error sending password change confirmation:", error);
            throw error;
        }
    }
}

module.exports = new EmailService();
