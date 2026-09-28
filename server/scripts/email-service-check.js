const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

process.env.NODE_ENV = "production";
process.env.CLIENT_URL = "https://saptechug.com";
process.env.EMAIL_FROM_NAME = "SAPTech Uganda";
process.env.EMAIL_FROM_ADDRESS = "info@saptechug.com";
process.env.EMAIL_REPLY_TO = "support@saptechug.com";
process.env.MAILJET_API_KEY = "test-mailjet-key";
process.env.MAILJET_SECRET_KEY = "test-mailjet-secret";
process.env.MAILJET_FROM_EMAIL = "info@saptechug.com";
process.env.EMAIL_UNSUBSCRIBE_SECRET = "test-newsletter-unsubscribe-secret";
process.env.API_PUBLIC_URL = "https://api.saptechug.com";
process.env.GMAIL_USER = "fallback@gmail.com";
process.env.GMAIL_PASS = "test-app-password";

const { EmailService } = require("../src/services/emailService");
const emailService = require("../src/services/emailService");
const { Newsletter } = require("../src/models");
const newsletterController = require("../src/controllers/newsletterController");
const queueCertificateEmail = require("../src/utils/queueCertificateEmail");

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
    assert.match(html, /Engineering and technology solutions for people and businesses\./);
    assert.doesNotMatch(html, /linear-gradient|Follow our WhatsApp Channel|Follow us on WhatsApp|Please do not share security codes/);

    const longReference = `REF-${"A".repeat(180)}`;
    const responsiveHtml = service.buildEmail({
      title: "Responsive email check",
      sections: [{
        title: "Long values",
        rows: [{ label: "Reference", value: longReference }],
        text: longReference
      }]
    });
    assert.ok(responsiveHtml.includes(longReference));
    assert.match(responsiveHtml, /max-width:680px/);
    assert.match(responsiveHtml, /table-layout:fixed/);
    assert.match(responsiveHtml, /overflow-wrap:anywhere/);
    assert.match(responsiveHtml, /@media only screen and \(max-width: 520px\)/);
    assert.match(responsiveHtml, /@media only screen and \(max-width: 360px\)/);

    const unsubscribeToken = service.createNewsletterUnsubscribeToken("Sarah@Example.com");
    assert.equal(service.verifyNewsletterUnsubscribeToken(unsubscribeToken), "sarah@example.com");
    assert.equal(service.verifyNewsletterUnsubscribeToken(`${unsubscribeToken}tampered`), null);

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

    const newsletterResult = await service.sendNewsletterWelcome({ email: "sarah@example.com" });
    assert.equal(newsletterResult, true);
    const newsletterMessage = mailjetPayload.Messages[0];
    assert.equal(newsletterMessage.Headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    assert.match(newsletterMessage.Headers["List-Unsubscribe"], /https:\/\/api\.saptechug\.com\/api\/newsletter\/unsubscribe\?token=/);
    assert.match(newsletterMessage.HTMLPart, /href="https:\/\/saptechug\.com\/unsubscribe\?token=/);
    assert.match(newsletterMessage.HTMLPart, />Unsubscribe<\/a>/);
    assert.match(newsletterMessage.TextPart, /Unsubscribe \(https:\/\/saptechug\.com\/unsubscribe\?token=/);

    const certificateDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "saptech-certificate-email-"));
    const certificatePath = path.join(certificateDirectory, "winner-certificate.pdf");
    try {
      await fs.writeFile(certificatePath, Buffer.from("fake-pdf-content"));
      assert.equal(await service.sendCertificateEmail({
        recipientEmail: "nominator@example.com",
        recipientName: "Nominator Name",
        nomineeName: "Award Recipient",
        categoryName: "Technology Leadership",
        certificateId: "SAP-2025-123",
        certificateFile: path.basename(certificatePath),
        certificatePath,
        certificateUrl: "https://saptechug.com/api/certificates/download/winner-certificate.pdf",
        status: "winner",
        awardYear: "2025"
      }), true);

      const certificateMessage = mailjetPayload.Messages[0];
      assert.equal(certificateMessage.To[0].Email, "nominator@example.com");
      assert.match(certificateMessage.Subject, /SAPTech Awards 2025 certificate for Award Recipient/);
      assert.equal(certificateMessage.Attachments[0].Filename, "winner-certificate.pdf");
      assert.equal(certificateMessage.Attachments[0].Base64Content, Buffer.from("fake-pdf-content").toString("base64"));
      assert.match(certificateMessage.HTMLPart, /Award recipient/);
      assert.match(certificateMessage.HTMLPart, /Sent to/);
      assert.match(certificateMessage.HTMLPart, /The certificate for Award Recipient is attached/);
      assert.match(certificateMessage.HTMLPart, /Award year[\s\S]*?2025/);

      const originalCertificateSender = emailService.sendCertificateEmail;
      let queuedCertificateEmail;
      emailService.sendCertificateEmail = async (data) => { queuedCertificateEmail = data; };
      try {
        assert.equal(queueCertificateEmail({
          nominatorEmail: "nominator@example.com",
          nominatorName: "Nominator Name",
          nomineeName: "Award Recipient",
          category: { name: "Technology Leadership" },
          certificateId: "SAP-2025-123",
          status: "winner"
        }, {
          filepath: certificatePath,
          url: "https://saptechug.com/api/certificates/download/winner-certificate.pdf"
        }, { awardYear: "2025" }), true);
        await new Promise((resolve) => setImmediate(resolve));
        assert.equal(queuedCertificateEmail.recipientEmail, "nominator@example.com");
        assert.equal(queuedCertificateEmail.recipientName, "Nominator Name");
        assert.equal(queuedCertificateEmail.nomineeName, "Award Recipient");
        assert.equal(queuedCertificateEmail.certificatePath, certificatePath);
        assert.equal(queuedCertificateEmail.awardYear, "2025");
      } finally {
        emailService.sendCertificateEmail = originalCertificateSender;
      }
    } finally {
      await fs.rm(certificateDirectory, { recursive: true, force: true });
    }

    const originalFindOne = Newsletter.findOne;
    const subscriber = {
      email: "sarah@example.com",
      isActive: true,
      save: async () => true
    };
    let confirmationCount = 0;
    Newsletter.findOne = async ({ email }) => email === subscriber.email ? subscriber : null;
    emailService.sendNewsletterUnsubscribeConfirmation = async () => { confirmationCount += 1; };
    const makeResponse = () => ({
      statusCode: 200,
      body: null,
      status(code) { this.statusCode = code; return this; },
      json(body) { this.body = body; return this; }
    });

    try {
      const manualResponse = makeResponse();
      await newsletterController.unsubscribe(
        { body: { token: unsubscribeToken }, query: {} },
        manualResponse,
        (error) => { throw error; }
      );
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(manualResponse.statusCode, 200);
      assert.equal(subscriber.isActive, false);
      assert.equal(confirmationCount, 1);

      subscriber.isActive = true;
      confirmationCount = 0;
      const oneClickResponse = makeResponse();
      await newsletterController.unsubscribe(
        { body: { "List-Unsubscribe": "One-Click" }, query: { token: unsubscribeToken } },
        oneClickResponse,
        (error) => { throw error; }
      );
      assert.equal(oneClickResponse.statusCode, 200);
      assert.equal(subscriber.isActive, false);
      assert.equal(confirmationCount, 0);

      let invalidTokenError;
      await newsletterController.unsubscribe(
        { body: { token: `${unsubscribeToken}tampered` }, query: {} },
        makeResponse(),
        (error) => { invalidTokenError = error; }
      );
      assert.ok(invalidTokenError);
      assert.equal(subscriber.isActive, false);
    } finally {
      Newsletter.findOne = originalFindOne;
    }

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
