const {
  firstEnv,
  cleanString,
  DEFAULT_MAILJET_API_URL,
  cleanNumber,
  cleanBoolean,
  nodemailer,
  collectRecipients
} = require("./shared");
module.exports = {
  configureMailjet(config = {}) {
    const apiKey = firstEnv("MAILJET_API_KEY", "MAILJET_PUBLIC_KEY", "MAILJET_APIKEY_PUBLIC", "MJ_APIKEY_PUBLIC", "MJ_API_KEY_PUBLIC");
    const apiSecret = firstEnv("MAILJET_SECRET_KEY", "MAILJET_API_SECRET", "MAILJET_PRIVATE_KEY", "MAILJET_APIKEY_PRIVATE", "MJ_APIKEY_PRIVATE", "MJ_API_KEY_PRIVATE");
    if (!apiKey && !apiSecret) return;
    if (!apiKey || !apiSecret) {
      console.warn("Mailjet is partially configured. Both API key and secret key are required.");
      return;
    }
    this.mailjet = {
      apiKey,
      apiSecret,
      apiUrl: cleanString(config.apiUrl, process.env.MAILJET_API_URL || DEFAULT_MAILJET_API_URL),
      fromEmail: cleanString(config.fromEmail, firstEnv("MAILJET_FROM_EMAIL", "MAILJET_SENDER_EMAIL") || this.fromEmail),
      timeoutMs: cleanNumber(config.timeoutMs, Number(firstEnv("MAILJET_TIMEOUT_MS") || 15000)),
      sandboxMode: cleanBoolean(config.sandboxMode, String(firstEnv("MAILJET_SANDBOX_MODE", "MAILJET_SANDBOX") || "").toLowerCase() === "true")
    };
    this.providers.push("mailjet");
  },
  configureSmtpFallback(config = {}) {
    const emailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const emailPass = process.env.GMAIL_PASS || process.env.SMTP_PASS;
    if (!emailUser && !emailPass) return;
    if (!emailUser || !emailPass) {
      console.warn("Gmail SMTP fallback is partially configured. Both user and app password are required.");
      return;
    }
    const host = cleanString(config.host, process.env.SMTP_HOST || "smtp.gmail.com");
    const port = cleanNumber(config.port, Number(process.env.SMTP_PORT || 587));
    const secure = cleanBoolean(config.secure, String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || port === 465);
    this.smtpSenderEmail = cleanString(config.fromEmail, process.env.SMTP_FROM_EMAIL || emailUser);
    this.smtpTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      requireTLS: !secure,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      pool: cleanBoolean(config.pool, process.env.SMTP_POOL !== "false"),
      maxConnections: cleanNumber(config.maxConnections, Number(process.env.SMTP_MAX_CONNECTIONS || 3)),
      maxMessages: cleanNumber(config.maxMessages, Number(process.env.SMTP_MAX_MESSAGES || 75)),
      connectionTimeout: cleanNumber(config.connectionTimeout, Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 30000)),
      greetingTimeout: cleanNumber(config.greetingTimeout, Number(process.env.SMTP_GREETING_TIMEOUT_MS || 30000)),
      socketTimeout: cleanNumber(config.socketTimeout, Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 45000)),
      tls: {
        minVersion: "TLSv1.2",
        servername: host,
        rejectUnauthorized: cleanBoolean(config.rejectUnauthorized, String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || "false").toLowerCase() !== "false")
      }
    });

    // Kept as an alias for code that previously inspected the transporter.
    this.transporter = this.smtpTransporter;
    this.providers.push("gmail-smtp");
    if (process.env.NODE_ENV !== "production") {
      this.smtpTransporter.verify(error => {
        if (error) {
          console.warn(`Gmail SMTP fallback verification failed: ${error.message}`);
        } else {
          console.log("Gmail SMTP fallback connection verified.");
        }
      });
    }
  },
  extractEmail(address) {
    const match = String(address || "").match(/<([^>]+)>/);
    return (match ? match[1] : address || "").trim();
  },
  formatAddress(email = this.fromEmail, name = this.fromName) {
    const cleanEmail = this.extractEmail(email);
    if (!name) return cleanEmail;
    return `"${String(name).replace(/"/g, "")}" <${cleanEmail}>`;
  },
  parseAddress(address, fallbackName = "") {
    if (!address) return null;
    if (typeof address === "object") {
      const email = this.extractEmail(address.address || address.email || address.Email);
      const name = address.name || address.Name || fallbackName;
      return email ? {
        Email: email,
        ...(name ? {
          Name: String(name)
        } : {})
      } : null;
    }
    const value = String(address).trim();
    const email = this.extractEmail(value);
    const nameMatch = value.match(/^\s*"?([^"<]+?)"?\s*<[^>]+>\s*$/);
    const name = nameMatch?.[1]?.trim() || fallbackName;
    return email ? {
      Email: email,
      ...(name ? {
        Name: name
      } : {})
    } : null;
  },
  mailjetRecipients(addresses) {
    return collectRecipients(addresses).map(address => this.parseAddress(address)).filter(Boolean);
  }
};
