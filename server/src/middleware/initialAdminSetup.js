const crypto = require("crypto");
const { User } = require("../models");

const tokensMatch = (provided, expected) => {
  if (!provided || !expected) return false;

  const providedBuffer = Buffer.from(String(provided));
  const expectedBuffer = Buffer.from(String(expected));
  return providedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const requireInitialAdminSetup = async (req, res, next) => {
  try {
    const setupToken = process.env.ADMIN_SETUP_TOKEN;
    if (!setupToken || setupToken.length < 24) {
      return res.status(403).json({
        status: "error",
        message: "Admin setup is disabled. Configure a strong ADMIN_SETUP_TOKEN to use this endpoint."
      });
    }

    const existingAdmins = await User.countDocuments({ role: "admin" });
    if (existingAdmins > 0) {
      return res.status(403).json({
        status: "error",
        message: "Admin setup is already complete. Use an existing admin account."
      });
    }

    const providedToken = req.get("X-Admin-Setup-Token") || req.body?.setupToken || req.query?.setupToken;
    if (!tokensMatch(providedToken, setupToken)) {
      return res.status(403).json({
        status: "error",
        message: "Invalid admin setup token."
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireInitialAdminSetup };
