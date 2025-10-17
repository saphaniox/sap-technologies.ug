/**
 * Certificate Controller
 * 
 * Manages digital certificate generation, verification, and delivery
 * for award winners, finalists, and participants.
 * 
 * Features:
 * - Certificate generation (winner, finalist, participation types)
 * - PDF certificate creation with QR codes
 * - Certificate verification via unique IDs
 * - Email delivery of certificates
 * - Certificate revocation system
 * - Verification tracking and analytics
 * - Batch certificate generation
 * - Certificate download endpoints
 * 
 * Certificate Types:
 * - Winner certificates (gold design)
 * - Finalist certificates (silver design)
 * - Participation certificates (bronze design)
 * 
 * Verification System:
 * - Unique certificate IDs
 * - QR code verification URLs
 * - Public verification endpoint
 * - Verification count tracking
 * 
 * @module controllers/certificateController
 */

const certificateService = require('../services/certificateService');
const { Nomination, AwardCategory } = require('../models/Award');

/**
 * Generate certificate for a nomination
 */
exports.generateCertificate = async (req, res) => {
    try {
        const { nominationId } = req.params;

        // Get nomination with category details
        const nomination = await Nomination.findById(nominationId).populate('category');
        
        if (!nomination) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        // Check if nomination is eligible for certificate
        if (!['winner', 'finalist', 'approved'].includes(nomination.status)) {
            return res.status(400).json({ 
                message: 'Certificate can only be generated for winners, finalists, or approved participants' 
            });
        }

        // Generate certificate ID if not already exists
        if (!nomination.certificateId) {
            nomination.certificateId = certificateService.generateCertificateId(
                nomination._id.toString(),
                nomination.status
            );
        }

        const certificateData = {
            nomineeName: nomination.nomineeName,
            categoryName: nomination.category.name,
            awardYear: '2025',
            issueDate: new Date(),
            certificateId: nomination.certificateId
        };

        let certificateResult;

        // Generate appropriate certificate based on status
        if (nomination.status === 'winner') {
            certificateResult = await certificateService.generateWinnerCertificate(certificateData);
        } else if (nomination.status === 'finalist') {
            certificateResult = await certificateService.generateFinalistCertificate(certificateData);
        } else {
            certificateResult = await certificateService.generateParticipationCertificate(certificateData);
        }

        // Save certificate info to nomination
        const filename = certificateResult.filepath.split('\\').pop();
        nomination.certificateFile = filename;
        nomination.certificateUrl = certificateResult.url;
        nomination.certificateCloudinaryId = certificateResult.cloudinaryId;
        await nomination.save();

        res.json({
            message: 'Certificate generated successfully',
            certificateId: nomination.certificateId,
            filename: filename,
            downloadUrl: certificateResult.url, // Use Cloudinary URL if available
            storage: certificateResult.storage,
            localPath: `server/uploads/certificates/${filename}`,
            cloudinaryUrl: certificateResult.storage === 'cloudinary' ? certificateResult.url : null
        });

    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({ 
            message: 'Error generating certificate',
            error: error.message 
        });
    }
};

/**
 * Download certificate
 */
exports.downloadCertificate = async (req, res) => {
    try {
        const { filename } = req.params;

        const pdfBuffer = await certificateService.getCertificate(filename);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error downloading certificate:', error);
        res.status(404).json({ 
            message: 'Certificate not found',
            error: error.message 
        });
    }
};

/**
 * Get certificate info for a nomination
 */
exports.getCertificateInfo = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const nomination = await Nomination.findById(nominationId).populate('category');
        
        if (!nomination) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        if (!nomination.certificateFile) {
            return res.status(404).json({ 
                message: 'No certificate generated for this nomination' 
            });
        }

        res.json({
            certificateId: nomination.certificateId,
            filename: nomination.certificateFile,
            nomineeName: nomination.nomineeName,
            categoryName: nomination.category.name,
            status: nomination.status,
            downloadUrl: `/api/certificates/download/${nomination.certificateFile}`
        });

    } catch (error) {
        console.error('Error getting certificate info:', error);
        res.status(500).json({ 
            message: 'Error getting certificate info',
            error: error.message 
        });
    }
};

/**
 * Regenerate certificate (admin only)
 */
exports.regenerateCertificate = async (req, res) => {
    try {
        const { nominationId } = req.params;

        const nomination = await Nomination.findById(nominationId).populate('category');
        
        if (!nomination) {
            return res.status(404).json({ message: 'Nomination not found' });
        }

        // Delete old certificate if exists
        if (nomination.certificateFile) {
            try {
                await certificateService.deleteCertificate(nomination.certificateFile);
            } catch (error) {
                console.log('Old certificate not found, proceeding with regeneration');
            }
        }

        // Generate new certificate
        const certificateData = {
            nomineeName: nomination.nomineeName,
            categoryName: nomination.category.name,
            awardYear: '2025',
            issueDate: new Date(),
            certificateId: nomination.certificateId || certificateService.generateCertificateId(
                nomination._id.toString(),
                nomination.status
            )
        };

        let certificatePath;

        if (nomination.status === 'winner') {
            certificatePath = await certificateService.generateWinnerCertificate(certificateData);
        } else if (nomination.status === 'finalist') {
            certificatePath = await certificateService.generateFinalistCertificate(certificateData);
        } else {
            certificatePath = await certificateService.generateParticipationCertificate(certificateData);
        }

        const filename = certificatePath.split('\\').pop();
        nomination.certificateFile = filename;
        nomination.certificateId = certificateData.certificateId;
        await nomination.save();

        res.json({
            message: 'Certificate regenerated successfully',
            certificateId: nomination.certificateId,
            filename: filename,
            downloadUrl: `/api/certificates/download/${filename}`
        });

    } catch (error) {
        console.error('Error regenerating certificate:', error);
        res.status(500).json({ 
            message: 'Error regenerating certificate',
            error: error.message 
        });
    }
};

/**
 * Bulk generate certificates for all winners/finalists (admin only)
 */
exports.bulkGenerateCertificates = async (req, res) => {
    try {
        const { status } = req.query; // winner, finalist, or approved

        const query = status ? { status } : { status: { $in: ['winner', 'finalist', 'approved'] } };
        
        const nominations = await Nomination.find(query).populate('category');

        if (nominations.length === 0) {
            return res.status(404).json({ message: 'No nominations found for certificate generation' });
        }

        const results = {
            success: [],
            failed: []
        };

        for (const nomination of nominations) {
            try {
                if (!nomination.certificateId) {
                    nomination.certificateId = certificateService.generateCertificateId(
                        nomination._id.toString(),
                        nomination.status
                    );
                }

                const certificateData = {
                    nomineeName: nomination.nomineeName,
                    categoryName: nomination.category.name,
                    awardYear: '2025',
                    issueDate: new Date(),
                    certificateId: nomination.certificateId
                };

                let certificatePath;

                if (nomination.status === 'winner') {
                    certificatePath = await certificateService.generateWinnerCertificate(certificateData);
                } else if (nomination.status === 'finalist') {
                    certificatePath = await certificateService.generateFinalistCertificate(certificateData);
                } else {
                    certificatePath = await certificateService.generateParticipationCertificate(certificateData);
                }

                const filename = certificatePath.split('\\').pop();
                nomination.certificateFile = filename;
                await nomination.save();

                results.success.push({
                    nominationId: nomination._id,
                    nomineeName: nomination.nomineeName,
                    certificateFile: filename
                });

            } catch (error) {
                results.failed.push({
                    nominationId: nomination._id,
                    nomineeName: nomination.nomineeName,
                    error: error.message
                });
            }
        }

        res.json({
            message: 'Bulk certificate generation completed',
            total: nominations.length,
            successful: results.success.length,
            failed: results.failed.length,
            results
        });

    } catch (error) {
        console.error('Error in bulk certificate generation:', error);
        res.status(500).json({ 
            message: 'Error in bulk certificate generation',
            error: error.message 
        });
    }
};

/**
 * Verify certificate by ID (Public endpoint)
 */
exports.verifyCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        console.log(`🔍 Certificate verification request: ${certificateId}`);

        const result = await certificateService.verifyCertificate(certificateId);

        if (!result.valid) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            valid: true,
            message: 'Certificate verified successfully',
            certificate: result.certificate
        });

    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error verifying certificate',
            error: error.message 
        });
    }
};

/**
 * Upload signature image for certificates
 */
exports.uploadSignature = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                message: 'No signature image file provided' 
            });
        }

        // Delete existing signature if it exists
        await certificateService.deleteExistingSignature();

        // Save new signature info
        const signatureInfo = {
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            uploadedAt: new Date(),
            uploadedBy: req.user._id
        };

        await certificateService.saveSignatureInfo(signatureInfo);

        res.json({ 
            message: 'Signature uploaded successfully',
            signature: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size
            }
        });

    } catch (error) {
        console.error('Error uploading signature:', error);
        res.status(500).json({ 
            message: 'Error uploading signature',
            error: error.message 
        });
    }
};

/**
 * Get current signature information
 */
exports.getCurrentSignature = async (req, res) => {
    try {
        const signatureInfo = await certificateService.getCurrentSignature();
        
        if (!signatureInfo) {
            return res.status(404).json({ 
                message: 'No signature currently configured' 
            });
        }

        res.json({ 
            signature: signatureInfo
        });

    } catch (error) {
        console.error('Error getting current signature:', error);
        res.status(500).json({ 
            message: 'Error retrieving signature information',
            error: error.message 
        });
    }
};

/**
 * Delete current signature
 */
exports.deleteSignature = async (req, res) => {
    try {
        await certificateService.deleteExistingSignature();
        
        res.json({ 
            message: 'Signature deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting signature:', error);
        res.status(500).json({ 
            message: 'Error deleting signature',
            error: error.message 
        });
    }
};
