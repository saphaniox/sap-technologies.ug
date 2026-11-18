const {
  fs,
  path,
  collectRecipients,
  emailTemplateContext
} = require("./shared");
module.exports = {
  async prepareAttachments(attachments = []) {
    return Promise.all(attachments.map(async attachment => {
      if (attachment.content || !attachment.path) return attachment;
      const content = await fs.promises.readFile(attachment.path);
      return {
        ...attachment,
        content
      };
    }));
  },
  mailjetAttachments(attachments = []) {
    return attachments.map(attachment => {
      const content = Buffer.isBuffer(attachment.content) ? attachment.content : Buffer.from(attachment.content || "");
      return {
        ContentType: attachment.contentType || "application/octet-stream",
        Filename: attachment.filename || (attachment.path ? path.basename(attachment.path) : "attachment"),
        Base64Content: content.toString("base64"),
        ...(attachment.cid ? {
          ContentID: attachment.cid
        } : {})
      };
    });
  },
  async sendWithMailjet(emailOptions, prepared) {
    const message = {
      From: this.parseAddress(this.mailjet.fromEmail, emailOptions.fromName || this.fromName),
      To: this.mailjetRecipients(emailOptions.to),
      Subject: emailOptions.subject,
      TextPart: prepared.text,
      HTMLPart: prepared.html,
      ReplyTo: this.parseAddress(emailOptions.replyTo || this.replyToEmail),
      Headers: prepared.headers,
      CustomID: String(emailOptions.category || "transactional").slice(0, 255)
    };
    const cc = this.mailjetRecipients(emailOptions.cc);
    const bcc = this.mailjetRecipients(emailOptions.bcc);
    if (cc.length) message.Cc = cc;
    if (bcc.length) message.Bcc = bcc;
    const regularAttachments = prepared.attachments.filter(attachment => !attachment.cid && attachment.contentDisposition !== "inline");
    const inlineAttachments = prepared.attachments.filter(attachment => attachment.cid || attachment.contentDisposition === "inline");
    if (regularAttachments.length) message.Attachments = this.mailjetAttachments(regularAttachments);
    if (inlineAttachments.length) message.InlinedAttachments = this.mailjetAttachments(inlineAttachments);
    const payload = {
      Messages: [message],
      AdvanceErrorHandling: true,
      ...(this.mailjet.sandboxMode ? {
        SandboxMode: true
      } : {})
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.mailjet.timeoutMs);
    try {
      const response = await fetch(this.mailjet.apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.mailjet.apiKey}:${this.mailjet.apiSecret}`).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const responseText = await response.text();
      let responseBody = {};
      try {
        responseBody = responseText ? JSON.parse(responseText) : {};
      } catch {
        responseBody = {
          ErrorMessage: responseText.slice(0, 500)
        };
      }
      const result = responseBody.Messages?.[0];
      if (!response.ok || result?.Status !== "success") {
        const details = result?.Errors?.map(error => error.ErrorMessage).filter(Boolean).join("; ") || responseBody.ErrorMessage || `HTTP ${response.status}`;
        throw new Error(`Mailjet rejected the message: ${details}`);
      }
      return {
        provider: "mailjet",
        messageId: result.To?.[0]?.MessageID || result.MessageID
      };
    } finally {
      clearTimeout(timeout);
    }
  },
  async sendWithSmtp(emailOptions, prepared) {
    const envelopeRecipients = collectRecipients(emailOptions.to, emailOptions.cc, emailOptions.bcc);
    const authenticatedSender = this.smtpSenderEmail || process.env.GMAIL_USER || process.env.SMTP_USER || this.fromEmail;
    const info = await this.smtpTransporter.sendMail({
      from: this.formatAddress(authenticatedSender, emailOptions.fromName || this.fromName),
      envelope: {
        from: authenticatedSender,
        to: envelopeRecipients
      },
      to: emailOptions.to,
      cc: emailOptions.cc,
      bcc: emailOptions.bcc,
      replyTo: emailOptions.replyTo || this.replyToEmail,
      subject: emailOptions.subject,
      html: prepared.html,
      text: prepared.text,
      attachments: prepared.attachments,
      headers: prepared.headers
    });
    return {
      provider: "gmail-smtp",
      messageId: info.messageId
    };
  },
  async resolveEmailOptions(emailOptions = {}) {
    const resolved = {
      ...emailOptions
    };
    if (typeof resolved.html === "function") {
      resolved.html = await emailTemplateContext.run({
        category: resolved.category || ""
      }, () => resolved.html(resolved));
    }
    if (typeof resolved.text === "function") {
      resolved.text = await resolved.text(resolved.html);
    }
    return resolved;
  },
  async sendEmail(emailOptions) {
    await this.loadRuntimeConfig(true);
    const resolvedEmailOptions = await this.resolveEmailOptions(emailOptions);
    if (!this.isConfigured) {
      throw new Error("Email service is not configured. Add Mailjet API credentials and/or Gmail SMTP credentials.");
    }
    const attachments = await this.prepareAttachments(resolvedEmailOptions.attachments || []);
    const html = resolvedEmailOptions.html;
    const text = resolvedEmailOptions.text || this.htmlToText(html);
    const headers = {
      "X-Entity-Ref-ID": `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      ...(resolvedEmailOptions.headers || {})
    };
    const prepared = {
      attachments,
      html,
      text,
      headers
    };
    const providerMode = await this.getProviderMode(true, {
      skipRuntimeLoad: true
    });
    const providerChain = this.resolveProviderChain(providerMode);
    if (!providerChain.length) {
      throw new Error(`Email provider mode "${providerMode}" is not available. Configure the selected provider or switch back to auto.`);
    }
    const errors = [];
    for (let index = 0; index < providerChain.length; index += 1) {
      const provider = providerChain[index];
      try {
        if (provider === "mailjet") return await this.sendWithMailjet(resolvedEmailOptions, prepared);
        if (provider === "gmail-smtp") return await this.sendWithSmtp(resolvedEmailOptions, prepared);
      } catch (error) {
        errors.push(error);
        const nextProvider = providerChain[index + 1];
        if (nextProvider) {
          console.warn(`${this.providerDisplayName(provider)} delivery failed; trying ${this.providerDisplayName(nextProvider)}: ${error.message}`);
        }
      }
    }
    if (errors.length === 1) throw errors[0];
    throw new AggregateError(errors, `${providerChain.map(provider => this.providerDisplayName(provider)).join(" and ")} delivery failed.`);
  },
  async deliver(emailOptions) {
    try {
      const result = await this.sendEmail(emailOptions);
      console.log(`Email sent via ${result.provider}: ${emailOptions.subject} -> ${emailOptions.to}`);
      return true;
    } catch (error) {
      console.error(`Email failed: ${emailOptions.subject} -> ${emailOptions.to}: ${error.message}`);
      throw error;
    }
  }
};
