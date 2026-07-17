const express = require("express");
const crypto = require("crypto");
const userController = require("../controllers/userController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { validateProfileUpdate, validatePasswordChange } = require("../middleware/validation");
const { profileUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");
const { User } = require("../models");

const router = express.Router();

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

// Initial setup only: requires ADMIN_SETUP_TOKEN and no existing admin account.
router.post("/create-admin", requireInitialAdminSetup, userController.createAdminAccount);

// User account management routes (all protected)
router.use(authMiddleware); // All routes below require authentication

router.get("/profile", userController.getProfile);
router.put("/profile", validateProfileUpdate, userController.updateProfile);
router.put("/email", userController.updateEmail);
router.put("/password", validatePasswordChange, userController.updatePassword);
router.post("/profile-pic", profileUpload.single("profilePic"), compressionPresets.profile, userController.uploadProfilePicture);
router.delete("/account", userController.deleteAccount);
router.get("/activity", userController.getActivity);

// Admin promotion routes are protected. Self-promotion only works during first-admin setup.
router.post("/make-me-admin", requireInitialAdminSetup, userController.promoteSelfToAdmin);
router.post("/promote-admin", adminMiddleware, userController.promoteToAdmin);

module.exports = router;
