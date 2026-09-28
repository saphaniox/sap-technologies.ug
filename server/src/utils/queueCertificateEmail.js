const path = require("path");
const emailService = require("../services/emailService");

const queueCertificateEmail = (nomination, certificateResult, certificateData = {}) => {
  const recipientEmail = nomination?.nominatorEmail;
  const certificatePath = certificateResult?.filepath;

  if (!recipientEmail) {
    console.warn(`Certificate email skipped for ${nomination?.nomineeName || "nominee"}: no nominator email is available.`);
    return false;
  }

  if (!certificatePath) {
    console.warn(`Certificate email skipped for ${nomination?.nomineeName || "nominee"}: generated PDF path is missing.`);
    return false;
  }

  const categoryName = nomination.category?.name || certificateData.categoryName;
  const certificateEmail = {
    recipientEmail,
    recipientName: nomination.nominatorName,
    nominatorName: nomination.nominatorName,
    nomineeName: nomination.nomineeName,
    categoryName,
    certificateId: certificateData.certificateId || nomination.certificateId,
    certificateFile: path.basename(certificatePath),
    certificatePath,
    certificateUrl: certificateResult.url || nomination.certificateUrl,
    status: nomination.status,
    awardYear: certificateData.awardYear || "2025"
  };

  setImmediate(() => {
    emailService.sendCertificateEmail(certificateEmail).catch((error) => {
      console.error(`Certificate email failed for ${nomination.nomineeName}:`, error);
    });
  });

  return true;
};

module.exports = queueCertificateEmail;