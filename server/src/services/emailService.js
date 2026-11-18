const {
  normalizeProviderMode,
  firstEnv
} = require("./email/shared");
const methodGroups = [require("./email/configuration"), require("./email/providers"), require("./email/rendering"), require("./email/newsletter"), require("./email/layout"), require("./email/delivery"), require("./email/contacts"), require("./email/accounts"), require("./email/commerce"), require("./email/awards"), require("./email/careers"), require("./email/certificates"), require("./email/security")];
class EmailService {
  constructor() {
    this.brand = {};
    this.fromName = "";
    this.fromEmail = "";
    this.replyToEmail = "";
    this.notifyEmail = "";
    this.careersEmail = "";
    this.smtpSenderEmail = "";
    this.provider = "none";
    this.providers = [];
    this.isConfigured = false;
    this.mailjet = null;
    this.smtpTransporter = null;
    this.smtpConfigKey = "";
    this.runtimeConfigKey = "";
    this.defaultProviderMode = normalizeProviderMode(firstEnv("EMAIL_PROVIDER_MODE", "EMAIL_PROVIDER", "MAIL_PROVIDER", "MAILER_PROVIDER"));
    this.providerModeCache = null;
    this.providerModeCacheMs = Number(process.env.EMAIL_PROVIDER_CACHE_MS || 15000);
    this.emailConfigCache = null;
    this.emailConfigCacheMs = Number(process.env.EMAIL_CONFIG_CACHE_MS || 15000);
    const initialConfig = this.getEnvRuntimeConfig();
    this.applyRuntimeConfig(initialConfig);
    this.runtimeConfigKey = JSON.stringify(initialConfig);
    this.loadRuntimeConfigWhenDatabaseConnects();
  }
}
// Keep one service instance and the existing public method contract.
for (const methods of methodGroups) {
  for (const [name, method] of Object.entries(methods)) {
    Object.defineProperty(EmailService.prototype, name, {
      value: method,
      writable: true,
      configurable: true
    });
  }
}
module.exports = new EmailService();
module.exports.EmailService = EmailService;
