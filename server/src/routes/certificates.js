const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Public routes (no authentication required)
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/download/:filename', certificateController.downloadCertificate);

// Public routes (with authentication)
router.get('/info/:nominationId', authMiddleware, certificateController.getCertificateInfo);

// Admin routes
router.post('/generate/:nominationId', authMiddleware, adminMiddleware, certificateController.generateCertificate);
router.post('/regenerate/:nominationId', authMiddleware, adminMiddleware, certificateController.regenerateCertificate);
router.post('/bulk-generate', authMiddleware, adminMiddleware, certificateController.bulkGenerateCertificates);

module.exports = router;
