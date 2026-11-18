const {
  firstEnv,
  normalizeProviderMode,
  cleanBrandTagline,
  DEFAULT_MAILJET_API_URL,
  mergeDefined,
  cleanNumber,
  cleanBoolean,
  EMAIL_PUBLIC_CONFIG_SETTING_KEY,
  pickPublicEmailConfig,
  cleanString,
  EMAIL_PROVIDER_SETTING_KEY,
  PROVIDER_DISPLAY_NAMES
} = require("./shared");
module.exports = {
  loadRuntimeConfigWhenDatabaseConnects() {
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState === 1) {
        this.loadRuntimeConfig(true).catch(error => {
          console.warn(`Email dashboard settings could not be applied: ${error.message}`);
        });
        return;
      }
      mongoose.connection.once("open", () => {
        this.loadRuntimeConfig(true).catch(error => {
          console.warn(`Email dashboard settings could not be applied after database connection: ${error.message}`);
        });
      });
    } catch {
      // Database-backed dashboard settings are optional; env config remains valid.
    }
  },
  getEnvRuntimeConfig() {
    const websiteUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://saptechug.com";
    const smtpUser = process.env.GMAIL_USER || process.env.SMTP_USER;
    const smtpFromEmail = process.env.SMTP_FROM_EMAIL || smtpUser || "";
    const contactEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_REPLY_TO || "info@saptechug.com";
    const careersEmail = firstEnv("CAREERS_EMAIL", "HR_EMAIL", "JOBS_EMAIL") || "careers@saptechug.com";
    const fromEmail = process.env.EMAIL_FROM_ADDRESS || contactEmail || smtpFromEmail;
    return {
      providerMode: normalizeProviderMode(firstEnv("EMAIL_PROVIDER_MODE", "EMAIL_PROVIDER", "MAIL_PROVIDER", "MAILER_PROVIDER")),
      brand: {
        name: process.env.EMAIL_FROM_NAME || process.env.BRAND_NAME || "SAPTech Uganda",
        awardsName: process.env.AWARDS_BRAND_NAME || "SAPTech Awards 2026",
        legalName: process.env.COMPANY_LEGAL_NAME || "SAPTech Uganda",
        websiteUrl,
        logoUrl: process.env.EMAIL_LOGO_URL || `${websiteUrl.replace(/\/$/, "")}/images/logo.png`,
        tagline: cleanBrandTagline(process.env.EMAIL_BRAND_TAGLINE),
        phone: process.env.COMPANY_PHONE || "+256 706 564 628",
        address: process.env.COMPANY_ADDRESS || "Ndejje, Kampala, Uganda",
        contactEmail,
        careersEmail
      },
      sender: {
        fromName: process.env.EMAIL_FROM_NAME || process.env.BRAND_NAME || "SAPTech Uganda",
        fromEmail,
        replyTo: process.env.EMAIL_REPLY_TO || contactEmail,
        notifyEmail: process.env.NOTIFY_EMAIL || process.env.ADMIN_EMAIL || contactEmail
      },
      mailjet: {
        apiUrl: process.env.MAILJET_API_URL || DEFAULT_MAILJET_API_URL,
        apiKey: firstEnv("MAILJET_API_KEY", "MAILJET_PUBLIC_KEY", "MAILJET_APIKEY_PUBLIC", "MJ_APIKEY_PUBLIC", "MJ_API_KEY_PUBLIC"),
        secretKey: firstEnv("MAILJET_SECRET_KEY", "MAILJET_API_SECRET", "MAILJET_PRIVATE_KEY", "MAILJET_APIKEY_PRIVATE", "MJ_APIKEY_PRIVATE", "MJ_API_KEY_PRIVATE"),
        fromEmail: firstEnv("MAILJET_FROM_EMAIL", "MAILJET_SENDER_EMAIL") || fromEmail,
        timeoutMs: Number(firstEnv("MAILJET_TIMEOUT_MS") || 15000),
        sandboxMode: String(firstEnv("MAILJET_SANDBOX_MODE", "MAILJET_SANDBOX") || "").toLowerCase() === "true"
      },
      gmail: {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || Number(process.env.SMTP_PORT || 587) === 465,
        rejectUnauthorized: String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || "false").toLowerCase() !== "false",
        user: smtpUser || "",
        pass: process.env.GMAIL_PASS || process.env.SMTP_PASS || "",
        fromEmail: smtpFromEmail || fromEmail,
        pool: process.env.SMTP_POOL !== "false",
        maxConnections: Number(process.env.SMTP_MAX_CONNECTIONS || 3),
        maxMessages: Number(process.env.SMTP_MAX_MESSAGES || 75),
        connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 30000),
        greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 30000),
        socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 45000)
      }
    };
  },
  mergeRuntimeConfig(base, override = {}) {
    const merged = {
      ...base,
      providerMode: normalizeProviderMode(override.providerMode || base.providerMode),
      brand: mergeDefined(base.brand, override.brand),
      sender: mergeDefined(base.sender, override.sender),
      mailjet: mergeDefined(base.mailjet, override.mailjet),
      gmail: mergeDefined(base.gmail, override.gmail)
    };
    merged.mailjet.timeoutMs = cleanNumber(merged.mailjet.timeoutMs, 15000);
    merged.mailjet.sandboxMode = cleanBoolean(merged.mailjet.sandboxMode, false);
    merged.gmail.port = cleanNumber(merged.gmail.port, 587);
    merged.gmail.secure = cleanBoolean(merged.gmail.secure, merged.gmail.port === 465);
    merged.gmail.rejectUnauthorized = cleanBoolean(merged.gmail.rejectUnauthorized, true);
    merged.gmail.pool = cleanBoolean(merged.gmail.pool, true);
    merged.gmail.maxConnections = cleanNumber(merged.gmail.maxConnections, 3);
    merged.gmail.maxMessages = cleanNumber(merged.gmail.maxMessages, 75);
    merged.gmail.connectionTimeout = cleanNumber(merged.gmail.connectionTimeout, 30000);
    merged.gmail.greetingTimeout = cleanNumber(merged.gmail.greetingTimeout, 30000);
    merged.gmail.socketTimeout = cleanNumber(merged.gmail.socketTimeout, 45000);
    return merged;
  },
  async getStoredRuntimeConfig() {
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState !== 1) return null;
      const AppSetting = require("../../models/AppSetting");
      const storedConfig = await AppSetting.getValue(EMAIL_PUBLIC_CONFIG_SETTING_KEY, null);
      if (!storedConfig) return null;
      const publicConfig = pickPublicEmailConfig(storedConfig);
      if (storedConfig?.brand?.tagline && publicConfig?.brand?.tagline !== storedConfig.brand.tagline) {
        await AppSetting.setValue(EMAIL_PUBLIC_CONFIG_SETTING_KEY, {
          ...storedConfig,
          brand: {
            ...storedConfig.brand,
            tagline: publicConfig.brand.tagline
          }
        }, null);
      }
      return publicConfig;
    } catch (error) {
      console.warn(`Email dashboard settings could not be loaded; using env fallback: ${error.message}`);
      return null;
    }
  },
  async loadRuntimeConfig(force = false) {
    const now = Date.now();
    if (!force && this.emailConfigCache && now - this.emailConfigCache.loadedAt < this.emailConfigCacheMs) {
      return this.emailConfigCache.config;
    }
    let config = this.getEnvRuntimeConfig();
    const storedConfig = await this.getStoredRuntimeConfig();
    if (storedConfig) config = this.mergeRuntimeConfig(config, storedConfig);
    const configKey = JSON.stringify(config);
    if (this.runtimeConfigKey !== configKey) {
      this.applyRuntimeConfig(config);
      this.runtimeConfigKey = configKey;
    }
    this.emailConfigCache = {
      config,
      loadedAt: now
    };
    return config;
  },
  invalidateConfigCache() {
    this.emailConfigCache = null;
    this.providerModeCache = null;
  },
  applyRuntimeConfig(config) {
    const websiteUrl = cleanString(config.brand?.websiteUrl, "https://saptechug.com");
    this.brand = {
      name: cleanString(config.brand?.name, "SAPTech Uganda"),
      awardsName: cleanString(config.brand?.awardsName, "SAPTech Awards 2026"),
      legalName: cleanString(config.brand?.legalName, "SAPTech Uganda"),
      websiteUrl,
      logoUrl: cleanString(config.brand?.logoUrl, `${websiteUrl.replace(/\/$/, "")}/images/logo.png`),
      tagline: cleanBrandTagline(config.brand?.tagline),
      phone: cleanString(config.brand?.phone, "+256 706 564 628"),
      address: cleanString(config.brand?.address, "Ndejje, Kampala, Uganda"),
      contactEmail: cleanString(config.brand?.contactEmail || config.sender?.replyTo, "info@saptechug.com"),
      careersEmail: cleanString(config.brand?.careersEmail, firstEnv("CAREERS_EMAIL", "HR_EMAIL", "JOBS_EMAIL") || "careers@saptechug.com")
    };
    this.fromName = cleanString(config.sender?.fromName, this.brand.name);
    this.fromEmail = cleanString(config.sender?.fromEmail, this.brand.contactEmail);
    this.replyToEmail = cleanString(config.sender?.replyTo, this.brand.contactEmail);
    this.notifyEmail = cleanString(config.sender?.notifyEmail, this.replyToEmail);
    this.careersEmail = this.brand.careersEmail;
    this.defaultProviderMode = normalizeProviderMode(config.providerMode || this.defaultProviderMode);
    this.providers = [];
    this.mailjet = null;
    this.smtpTransporter = null;
    this.transporter = null;
    this.smtpConfigKey = "";
    this.configureMailjet(config.mailjet || {});
    this.configureSmtpFallback(config.gmail || {});
    this.isConfigured = this.providers.length > 0;
    this.provider = this.providers[0] || "none";
  },
  async getProviderMode(force = false, options = {}) {
    if (!options.skipRuntimeLoad) {
      await this.loadRuntimeConfig(force);
    }
    const now = Date.now();
    if (!force && this.providerModeCache && now - this.providerModeCache.loadedAt < this.providerModeCacheMs) {
      return this.providerModeCache.mode;
    }
    let mode = this.defaultProviderMode;
    try {
      const mongoose = require("mongoose");
      if (mongoose.connection.readyState === 1) {
        const AppSetting = require("../../models/AppSetting");
        mode = normalizeProviderMode(await AppSetting.getValue(EMAIL_PROVIDER_SETTING_KEY, mode));
      }
    } catch (error) {
      console.warn(`Email provider setting could not be loaded; using ${mode}: ${error.message}`);
    }
    this.providerModeCache = {
      mode,
      loadedAt: now
    };
    return mode;
  },
  setRuntimeProviderMode(mode) {
    const normalizedMode = normalizeProviderMode(mode);
    this.providerModeCache = {
      mode: normalizedMode,
      loadedAt: Date.now()
    };
    return normalizedMode;
  },
  resolveProviderChain(mode = "auto") {
    const normalizedMode = normalizeProviderMode(mode);
    if (normalizedMode === "mailjet") {
      return this.mailjet ? ["mailjet"] : [];
    }
    if (normalizedMode === "gmail") {
      return this.smtpTransporter ? ["gmail-smtp"] : [];
    }
    return [...this.providers];
  },
  isProviderModeAvailable(mode) {
    return this.resolveProviderChain(mode).length > 0;
  },
  providerDisplayName(provider) {
    return PROVIDER_DISPLAY_NAMES[provider] || provider || "None";
  },
  async getDeliveryStatus(options = {}) {
    const force = Boolean(options.force);
    await this.loadRuntimeConfig(force);
    const mode = await this.getProviderMode(force, {
      skipRuntimeLoad: true
    });
    const chain = this.resolveProviderChain(mode);
    return {
      mode,
      canSend: chain.length > 0,
      activeProvider: chain[0] || "none",
      activeProviderLabel: this.providerDisplayName(chain[0]),
      deliveryChain: chain,
      deliveryChainLabel: chain.map(provider => this.providerDisplayName(provider)).join(" -> ") || "No provider configured",
      fallbackEnabled: mode === "auto" && chain.length > 1,
      configured: {
        mailjet: Boolean(this.mailjet),
        gmail: Boolean(this.smtpTransporter)
      },
      providers: {
        auto: {
          available: this.providers.length > 0,
          label: "Auto",
          description: "Use Mailjet first and fall back to Gmail SMTP when needed."
        },
        mailjet: {
          available: Boolean(this.mailjet),
          label: "Mailjet",
          description: "Force Mailjet API for outgoing messages."
        },
        gmail: {
          available: Boolean(this.smtpTransporter),
          label: "Gmail",
          description: "Force Gmail SMTP for outgoing messages."
        }
      },
      sender: {
        fromName: this.fromName,
        fromEmail: this.fromEmail,
        replyTo: this.replyToEmail,
        notifyEmail: this.notifyEmail,
        mailjetFromEmail: this.mailjet?.fromEmail || null,
        smtpFromEmail: this.smtpSenderEmail || null
      },
      brand: {
        name: this.brand.name,
        legalName: this.brand.legalName,
        awardsName: this.brand.awardsName,
        websiteUrl: this.brand.websiteUrl,
        logoUrl: this.brand.logoUrl,
        tagline: this.brand.tagline,
        phone: this.brand.phone,
        address: this.brand.address,
        contactEmail: this.brand.contactEmail,
        careersEmail: this.brand.careersEmail
      },
      sandboxMode: Boolean(this.mailjet?.sandboxMode)
    };
  }
};
