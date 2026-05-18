const express = require("express");
const userController = require("../controllers/userController");
const { authMiddleware } = require("../middleware/auth");
const { validateProfileUpdate, validatePasswordChange } = require("../middleware/validation");
const { profileUpload } = require("../config/fileUpload");
const { compressionPresets } = require("../middleware/imageCompression");

const router = express.Router();

// Public admin creation route (for initial setup)
router.post("/create-admin", userController.createAdminAccount);

// User account management routes (all protected)
router.use(authMiddleware); // All routes below require authentication

router.get("/profile", userController.getProfile);
router.put("/profile", validateProfileUpdate, userController.updateProfile);
router.put("/email", userController.updateEmail);
router.put("/password", validatePasswordChange, userController.updatePassword);
router.post("/profile-pic", profileUpload.single("profilePic"), compressionPresets.profile, userController.uploadProfilePicture);
router.delete("/account", userController.deleteAccount);
router.get("/activity", userController.getActivity);

// Admin promotion routes (temporary for initial setup)
router.post("/make-me-admin", userController.promoteSelfToAdmin);
router.post("/promote-admin", userController.promoteToAdmin);

module.exports = router;
