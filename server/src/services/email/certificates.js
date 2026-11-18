const {
  cleanString,
  path,
  fs,
  normalizeText,
  normalizeStatus
} = require("./shared");
module.exports = {
  async sendCertificateEmail(certificateData) {
    const recipientEmail = certificateData.recipientEmail || certificateData.email || certificateData.nominatorEmail;
    const recipientName = certificateData.recipientName || certificateData.nominatorName || certificateData.name || "there";
    const nomineeName = certificateData.nomineeName || recipientName;
    const awardYear = cleanString(certificateData.awardYear, String(new Date().getFullYear()));
    const awardsName = this.brand.awardsName.replace(/\b20\d{2}\b/, awardYear);
    const certificateFile = certificateData.certificateFile || certificateData.filename;
    const certificatePath = certificateData.certificatePath || (certificateFile ? path.join(__dirname, "../../../uploads/certificates", certificateFile) : "");
    const attachments = [];
    if (certificatePath && fs.existsSync(certificatePath)) {
      attachments.push({
        filename: certificateFile || path.basename(certificatePath),
        path: certificatePath,
        contentType: "application/pdf"
      });
    }
    const introText = attachments.length ? `The certificate for ${nomineeName} is attached to this email. You can forward it to the recipient or keep it with your nomination records.` : `The certificate for ${nomineeName} could not be attached. Please contact the awards team for help accessing it.`;
    return this.deliver({
      to: recipientEmail,
      fromName: awardsName,
      subject: `Your ${awardsName} certificate for ${nomineeName}`,
      category: "certificate",
      attachments,
      html: () => this.buildEmail({
        brandName: awardsName,
        tone: "awards",
        title: "Certificate Ready",
        preheader: `The ${awardYear} certificate for ${nomineeName} is ready.`,
        greeting: `Hello ${normalizeText(recipientName, "there")}`,
        intro: introText,
        sections: [{
          title: "Certificate details",
          rows: [{
            label: "Award recipient",
            value: nomineeName
          }, {
            label: "Sent to",
            value: recipientEmail
          }, {
            label: "Category",
            value: certificateData.categoryName
          }, {
            label: "Certificate ID",
            value: certificateData.certificateId
          }, {
            label: "Recognition",
            value: normalizeStatus(certificateData.status)
          }, {
            label: "Award year",
            value: awardYear
          }, {
            label: "Attachment",
            value: attachments.length ? "PDF certificate attached" : "Certificate file was not available to attach"
          }]
        }, {
          title: "How to use it",
          list: ["Keep the certificate for your professional records.", "Share it on LinkedIn or your portfolio.", "Contact our team if any details need correction."]
        }],
        cta: certificateData.certificateUrl ? {
          label: "Open certificate",
          href: certificateData.certificateUrl
        } : {
          label: "Verify certificate",
          href: `${this.brand.websiteUrl}/verify/${certificateData.certificateId || ""}`
        },
        footerNote: "This certificate was prepared for the award recipient named above."
      })
    });
  }
};
