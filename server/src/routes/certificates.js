const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { signatureUpload } = require('../config/fileUpload');

// Public routes (no authentication required)
router.get('/verify/:certificateId', certificateController.verifyCertificate);
router.get('/download/:filename', certificateController.downloadCertificate);

// Public routes (with authentication)
router.get('/info/:nominationId', authMiddleware, certificateController.getCertificateInfo);

// Admin routes
router.get('/all', authMiddleware, adminMiddleware, certificateController.getAllCertificates);
router.post('/generate/:nominationId', authMiddleware, adminMiddleware, certificateController.generateCertificate);
router.post('/regenerate/:nominationId', authMiddleware, adminMiddleware, certificateController.regenerateCertificate);
router.delete('/delete/:nominationId', authMiddleware, adminMiddleware, certificateController.deleteCertificate);
router.post('/bulk-generate', authMiddleware, adminMiddleware, certificateController.bulkGenerateCertificates);

// Signature management routes (admin only)
router.post('/signature/upload', authMiddleware, adminMiddleware, signatureUpload.single('signature'), certificateController.uploadSignature);
router.get('/signature/current', authMiddleware, adminMiddleware, certificateController.getCurrentSignature);
router.get('/signature/status', authMiddleware, adminMiddleware, certificateController.checkSignatureStatus);
router.delete('/signature/current', authMiddleware, adminMiddleware, certificateController.deleteSignature);

module.exports = router;
