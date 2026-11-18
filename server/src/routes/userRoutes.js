const express = require("express");
const userController = require("../controllers/userController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const { validateProfileUpdate, validatePasswordChange } = require("../middleware/validation");
const { profileUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");
const { requireInitialAdminSetup } = require("../middleware/initialAdminSetup");

const router = express.Router();

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
