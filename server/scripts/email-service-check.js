const assert = require("node:assert/strict");

process.env.NODE_ENV = "production";
process.env.CLIENT_URL = "https://saptechug.com";
process.env.EMAIL_FROM_NAME = "SAPTech Uganda";
process.env.EMAIL_FROM_ADDRESS = "info@saptechug.com";
process.env.EMAIL_REPLY_TO = "support@saptechug.com";
process.env.MAILJET_API_KEY = "test-mailjet-key";
process.env.MAILJET_SECRET_KEY = "test-mailjet-secret";
process.env.MAILJET_FROM_EMAIL = "info@saptechug.com";
process.env.GMAIL_USER = "fallback@gmail.com";
process.env.GMAIL_PASS = "test-app-password";

const { EmailService } = require("../src/services/emailService");

async function run() {
  const service = new EmailService();
  let mailjetPayload;
  let smtpCalls = 0;

  service.smtpTransporter.sendMail = async () => {
    smtpCalls += 1;
    return { messageId: "smtp-test-id" };
  };

  const originalFetch = global.fetch;
  global.fetch = async (_url, options) => {
    mailjetPayload = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        Messages: [{ Status: "success", To: [{ MessageID: 12345 }] }]
      })
    };
  };

  try {
    const html = service.buildEmail({
      title: "A helpful update",
      greeting: "Hello Sarah",
      intro: "Here is the latest information from our team.",
      cta: { label: "View details", href: "https://saptechug.com/account" }
    });

    assert.match(html, /SAPTech Uganda logo/);
    assert.match(html, /Hello Sarah,/);
    assert.match(html, /Warm regards/);

    const primaryResult = await service.sendEmail({
      to: "Sarah <sarah@example.com>",
      subject: "Primary provider check",
      category: "provider_check",
      html,
      attachments: [{
        filename: "hello.txt",
        contentType: "text/plain",
        content: Buffer.from("hello")
      }]
    });

    assert.equal(primaryResult.provider, "mailjet");
    assert.equal(smtpCalls, 0);
    assert.equal(mailjetPayload.Messages[0].From.Email, "info@saptechug.com");
    assert.equal(mailjetPayload.Messages[0].To[0].Email, "sarah@example.com");
    assert.equal(mailjetPayload.Messages[0].To[0].Name, "Sarah");
    assert.equal(mailjetPayload.Messages[0].Attachments[0].Base64Content, "aGVsbG8=");
    assert.match(mailjetPayload.Messages[0].TextPart, /View details \(https:\/\/saptechug\.com\/account\)/);

    global.fetch = async () => {
      throw new Error("simulated Mailjet outage");
    };

    const fallbackResult = await service.sendEmail({
      to: "sarah@example.com",
      subject: "Fallback provider check",
      html
    });

    assert.equal(fallbackResult.provider, "gmail-smtp");
    assert.equal(smtpCalls, 1);

    service.setRuntimeProviderMode("gmail");
    const forcedGmailResult = await service.sendEmail({
      to: "sarah@example.com",
      subject: "Forced Gmail provider check",
      html
    });

    assert.equal(forcedGmailResult.provider, "gmail-smtp");
    assert.equal(smtpCalls, 2);

    global.fetch = async (_url, options) => {
      mailjetPayload = JSON.parse(options.body);
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          Messages: [{ Status: "success", To: [{ MessageID: 67890 }] }]
        })
      };
    };

    service.setRuntimeProviderMode("mailjet");
    const forcedMailjetResult = await service.sendEmail({
      to: "sarah@example.com",
      subject: "Forced Mailjet provider check",
      html
    });

    assert.equal(forcedMailjetResult.provider, "mailjet");
    assert.equal(mailjetPayload.Messages[0].Subject, "Forced Mailjet provider check");
    console.log("Email provider, fallback, forced mode, branding, attachment, and plain-text checks passed.");
  } finally {
    global.fetch = originalFetch;
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
