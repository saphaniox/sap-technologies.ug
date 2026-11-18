const {
  cleanString,
  crypto
} = require("./shared");
module.exports = {
  createNewsletterUnsubscribeToken(email) {
    const normalizedEmail = cleanString(email).toLowerCase();
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
    if (!normalizedEmail || !secret) {
      throw new Error("A recipient email and signing secret are required for newsletter unsubscribe links.");
    }
    const payload = Buffer.from(normalizedEmail).toString("base64url");
    const signature = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
  },
  verifyNewsletterUnsubscribeToken(token) {
    if (typeof token !== "string" || token.length > 2048) return null;
    const [payload, encodedSignature, extra] = token.split(".");
    const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || process.env.SESSION_SECRET;
    if (!payload || !encodedSignature || extra || !secret) return null;
    const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest();
    const suppliedSignature = Buffer.from(encodedSignature, "base64url");
    if (expectedSignature.length !== suppliedSignature.length || !crypto.timingSafeEqual(expectedSignature, suppliedSignature)) return null;
    const email = Buffer.from(payload, "base64url").toString("utf8").trim().toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
  },
  createNewsletterUnsubscribeLinks(email) {
    const token = this.createNewsletterUnsubscribeToken(email);
    const pageUrl = new URL("/unsubscribe", this.brand.websiteUrl);
    pageUrl.searchParams.set("token", token);
    let oneClickUrl = "";
    const apiPublicUrl = cleanString(process.env.API_PUBLIC_URL);
    if (apiPublicUrl) {
      const endpoint = new URL("/api/newsletter/unsubscribe", apiPublicUrl);
      endpoint.searchParams.set("token", token);
      oneClickUrl = endpoint.toString();
    }
    return {
      pageUrl: pageUrl.toString(),
      oneClickUrl
    };
  }
};
