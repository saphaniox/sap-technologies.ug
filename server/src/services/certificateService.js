const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');
const fs = require('fs').promises;
const path = require('path');
const { Certificate } = require('../models');
const cloudinary = require('cloudinary').v2;
const { isCloudinaryConfigured } = require('../config/cloudinary');

class CertificateService {
    ensureCertificatesDirectory() {
        const fsSync = require('fs');
        if (!fsSync.existsSync(this.certificatesDir)) {
            fsSync.mkdirSync(this.certificatesDir, { recursive: true });
        }
    }

    ensureSignaturesDirectory() {
        const fsSync = require('fs');
        if (!fsSync.existsSync(this.signaturesDir)) {
            fsSync.mkdirSync(this.signaturesDir, { recursive: true });
        }
    }
    constructor() {
        this.certificatesDir = path.join(__dirname, '../../uploads/certificates');
        this.signaturesDir = path.join(__dirname, '../../uploads/signatures');
        this.useCloudinary = isCloudinaryConfigured();
        this.ensureCertificatesDirectory();
        this.ensureSignaturesDirectory();
    }

    async uploadToCloudinary(pdfBuffer, filename) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'sap-technologies/certificates',
                    resource_type: 'raw', // For PDFs
                    public_id: filename.replace('.pdf', ''),
                    format: 'pdf',
                    access_mode: 'public'
                },
                (error, result) => {
                    if (error) {
                        console.error('❌ Cloudinary upload error:', error);
                        reject(error);
                    } else {
                        console.log('☁️ Certificate uploaded to Cloudinary:', result.secure_url);
                        resolve(result);
                    }
                }
            );
            
            // Write buffer to stream
            uploadStream.end(pdfBuffer);
        });
    }

    async saveCertificate(pdfBytes, filename) {
        const filepath = path.join(this.certificatesDir, filename);
        
        // Always save locally as backup
        await fs.writeFile(filepath, pdfBytes);
        console.log('💾 Certificate saved locally:', filepath);
        
        // Upload to Cloudinary if configured
        if (this.useCloudinary) {
            try {
                const cloudinaryResult = await this.uploadToCloudinary(pdfBytes, filename);
                return {
                    filepath,
                    url: cloudinaryResult.secure_url,
                    cloudinaryId: cloudinaryResult.public_id,
                    storage: 'cloudinary'
                };
            } catch (error) {
                console.warn('⚠️ Cloudinary upload failed, using local storage:', error.message);
                return {
                    filepath,
                    url: `/api/certificates/download/${filename}`,
                    cloudinaryId: null,
                    storage: 'local'
                };
            }
        }
        
        return {
            filepath,
            url: `/api/certificates/download/${filename}`,
            cloudinaryId: null,
            storage: 'local'
        };
    }

    async generateWinnerCertificate(certificateData) {
        const {
            nomineeName,
            categoryName,
            awardYear = '2025',
            issueDate = new Date(),
            certificateId
        } = certificateData;

        try {
            // Create a new PDF document
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([842, 595]); // A4 landscape

            // Load fonts
            const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
            const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
            const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
            const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

            const { width, height } = page.getSize();

            // Draw decorative border (gold/amber color)
            const borderColor = rgb(0.96, 0.62, 0.07); // Gold color
            const borderWidth = 15;
            const innerBorderWidth = 3;

            // Outer border
            page.drawRectangle({
                x: 20,
                y: 20,
                width: width - 40,
                height: height - 40,
                borderColor: borderColor,
                borderWidth: borderWidth,
            });

            // Inner border
            page.drawRectangle({
                x: 40,
                y: 40,
                width: width - 80,
                height: height - 80,
                borderColor: borderColor,
                borderWidth: innerBorderWidth,
            });

            // Decorative corner elements
            this.drawCornerDecorations(page, width, height, borderColor);

            // Draw logo at top center
            const logoHeight = await this.drawLogo(pdfDoc, page, width, height);
            const headerYOffset = logoHeight > 0 ? logoHeight + 15 : 0;

            // Header - SAPHANIOX Awards logo/text
            page.drawText('SAPHANIOX AWARDS', {
                x: width / 2 - 180,
                y: height - 100 - headerYOffset,
                size: 40,
                font: timesRomanBold,
                color: rgb(0.96, 0.62, 0.07), // Gold
            });

            page.drawText('2025', {
                x: width / 2 - 30,
                y: height - 135 - headerYOffset,
                size: 28,
                font: helveticaBold,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Certificate of Achievement text
            page.drawText('CERTIFICATE OF ACHIEVEMENT', {
                x: width / 2 - 155,
                y: height - 180 - headerYOffset,
                size: 18,
                font: timesRoman,
                color: rgb(0.3, 0.3, 0.3),
            });

            // Divider line
            page.drawLine({
                start: { x: width / 2 - 200, y: height - 195 - headerYOffset },
                end: { x: width / 2 + 200, y: height - 195 - headerYOffset },
                thickness: 2,
                color: borderColor,
            });

            // "This is to certify that" text
            page.drawText('This is to certify that', {
                x: width / 2 - 100,
                y: height - 230 - headerYOffset,
                size: 15,
                font: timesRomanItalic,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Winner's name (large and prominent)
            const nameSize = 34;
            const nameWidth = timesRomanBold.widthOfTextAtSize(nomineeName, nameSize);
            page.drawText(nomineeName, {
                x: width / 2 - nameWidth / 2,
                y: height - 270 - headerYOffset,
                size: nameSize,
                font: timesRomanBold,
                color: rgb(0.1, 0.1, 0.5), // Deep blue
            });

            // Underline for name
            page.drawLine({
                start: { x: width / 2 - nameWidth / 2 - 10, y: height - 280 - headerYOffset },
                end: { x: width / 2 + nameWidth / 2 + 10, y: height - 280 - headerYOffset },
                thickness: 2,
                color: borderColor,
            });

            // Achievement text
            page.drawText('has been awarded the', {
                x: width / 2 - 80,
                y: height - 310 - headerYOffset,
                size: 14,
                font: timesRomanItalic,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Trophy symbol using asterisks
            page.drawText('* * * WINNER * * *', {
                x: width / 2 - 95,
                y: height - 338 - headerYOffset,
                size: 17,
                font: timesRomanBold,
                color: rgb(0.96, 0.62, 0.07),
            });

            // Category name
            const categoryText = `WINNER - ${categoryName}`;
            const categorySize = 20;
            const categoryWidth = timesRomanBold.widthOfTextAtSize(categoryText, categorySize);
            page.drawText(categoryText, {
                x: width / 2 - categoryWidth / 2,
                y: height - 370 - headerYOffset,
                size: categorySize,
                font: timesRomanBold,
                color: rgb(0.8, 0.1, 0.1), // Red
            });

            // Recognition text
            page.drawText('in recognition of outstanding excellence in engineering and technology', {
                x: width / 2 - 215,
                y: height - 400 - headerYOffset,
                size: 12,
                font: timesRomanItalic,
                color: rgb(0.3, 0.3, 0.3),
            });

            // Website and Powered by text (below recognition)
            page.drawText('Powered by SAP Technologies', {
                x: width / 2 - 85,
                y: height - 435 - headerYOffset,
                size: 9,
                font: timesRomanItalic,
                color: rgb(0.5, 0.5, 0.5),
            });

            page.drawText('www.sap-technologies.com', {
                x: width / 2 - 85,
                y: height - 455 - headerYOffset,
                size: 11,
                font: timesRoman,
                color: rgb(0.4, 0.4, 0.4),
            });

            // Date
            const formattedDate = issueDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            page.drawText(`Date: ${formattedDate}`, {
                x: 100,
                y: 145,
                size: 12,
                font: timesRoman,
                color: rgb(0.2, 0.2, 0.2),
            });

            // Certificate ID
            if (certificateId) {
                page.drawText(`Certificate ID: ${certificateId}`, {
                    x: 100,
                    y: 120,
                    size: 10,
                    font: timesRoman,
                    color: rgb(0.5, 0.5, 0.5),
                });
            }

            // Generate and embed QR code (bottom right corner)
            if (certificateId) {
                const verificationUrl = `https://www.sap-technologies.com/verify/${certificateId}`;
                await this.embedQRCode(pdfDoc, page, verificationUrl, width - 150, 60, 80);
                
                // Add "Scan to Verify" text below QR code
                page.drawText('Scan to Verify', {
                    x: width - 140,
                    y: 45,
                    size: 8,
                    font: timesRomanItalic,
                    color: rgb(0.4, 0.4, 0.4),
                });
            }

            // Signature area (right side)
            const signatureX = width - 250;
            const signatureY = 175;
            const signatureDrawn = await this.drawSignature(pdfDoc, page, signatureX, signatureY, 120, 40);

            // If signature image wasn't drawn, fall back to text signature
            if (!signatureDrawn) {
                // Signature line (right side)
                page.drawLine({
                    start: { x: width - 250, y: 165 },
                    end: { x: width - 100, y: 165 },
                    thickness: 1,
                    color: rgb(0.2, 0.2, 0.2),
                });

                page.drawText('Authorized Signature', {
                    x: width - 230,
                    y: 145,
                    size: 11,
                    font: timesRomanItalic,
                    color: rgb(0.3, 0.3, 0.3),
                });
            }

            page.drawText('SAPHANIOX Awards Committee', {
                x: width - 250,
                y: 125,
                size: 10,
                font: timesRoman,
                color: rgb(0.4, 0.4, 0.4),
            });

            // Save PDF
            const pdfBytes = await pdfDoc.save();
            const filename = `certificate_${certificateId || Date.now()}.pdf`;
            
            // Save certificate (Cloudinary + local backup)
            const saveResult = await this.saveCertificate(pdfBytes, filename);
            const filepath = saveResult.filepath;

            // Save certificate record to database
            if (certificateId) {
                await this.saveCertificateRecord({
                    certificateId,
                    recipientName: nomineeName,
                    recipientEmail: certificateData.recipientEmail || null,
                    categoryName,
                    type: 'winner',
                    awardYear,
                    issueDate,
                    filename,
                    url: saveResult.url,
                    cloudinaryId: saveResult.cloudinaryId,
                    storage: saveResult.storage
                });
            }

            console.log(`✅ Winner certificate generated: ${filename} (${saveResult.storage})`);
            return saveResult;

        } catch (error) {
            console.error('Error generating winner certificate:', error);
            throw error;
        }
    }

    async generateQRCode(data, size = 150) {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(data, {
                width: size,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                errorCorrectionLevel: 'H' // High error correction
            });
            
            // Convert data URL to buffer
            const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        } catch (error) {
            console.error('Error generating QR code:', error);
            throw error;
        }
    }

    async embedQRCode(pdfDoc, page, qrData, x, y, size = 80) {
        try {
            const qrBuffer = await this.generateQRCode(qrData, size * 2); // Generate at 2x for clarity
            const qrImage = await pdfDoc.embedPng(qrBuffer);
            
            page.drawImage(qrImage, {
                x: x,
                y: y,
                width: size,
                height: size,
            });
            
            return size;
        } catch (error) {
            console.error('Error embedding QR code:', error);
            return 0; // Return 0 if QR code fails (certificate still generates)
        }
    }

    async saveCertificateRecord(certData) {
        try {
            const verificationUrl = `https://www.sap-technologies.com/verify/${certData.certificateId}`;
            
            const certificate = new Certificate({
                ...certData,
                verificationUrl,
                status: 'active'
            });

            await certificate.save();
            console.log(`💾 Certificate record saved to database: ${certData.certificateId}`);
            return certificate;
        } catch (error) {
            // If duplicate, update existing record
            if (error.code === 11000) {
                console.log(`📝 Updating existing certificate record: ${certData.certificateId}`);
                const certificate = await Certificate.findOneAndUpdate(
                    { certificateId: certData.certificateId },
                    { ...certData, verificationUrl: `https://www.sap-technologies.com/verify/${certData.certificateId}` },
                    { new: true }
                );
                return certificate;
            }
            console.error('Error saving certificate record:', error);
            // Don't throw - certificate PDF is still generated
        }
    }

    async verifyCertificate(certificateId) {
        try {
            const certificate = await Certificate.findValidCertificate(certificateId);
            
            if (!certificate) {
                return {
                    valid: false,
                    message: 'Certificate not found or has been revoked'
                };
            }

            // Record verification
            await certificate.recordVerification();

            return {
                valid: true,
                certificate: {
                    certificateId: certificate.certificateId,
                    recipientName: certificate.recipientName,
                    categoryName: certificate.categoryName,
                    type: certificate.type,
                    awardYear: certificate.awardYear,
                    issueDate: certificate.issueDate,
                    filename: certificate.filename,
                    verificationCount: certificate.verificationCount,
                    lastVerifiedAt: certificate.lastVerifiedAt
                }
            };
        } catch (error) {
            console.error('Error verifying certificate:', error);
            throw error;
        }
    }

    async drawSignature(pdfDoc, page, x, y, width = 120, height = 40) {
        try {
            const signatureInfo = await this.getCurrentSignature();
            
            if (!signatureInfo) {
                console.warn('⚠️ No signature configured, using default text signature');
                return false;
            }

            let signatureImageBytes;

            // Check if signature is stored in Cloudinary
            if (signatureInfo.isCloudinary && signatureInfo.cloudinaryUrl) {
                console.log('📥 Fetching signature from Cloudinary:', signatureInfo.cloudinaryUrl);
                
                try {
                    const axios = require('axios');
                    const response = await axios.get(signatureInfo.cloudinaryUrl, {
                        responseType: 'arraybuffer'
                    });
                    
                    signatureImageBytes = Buffer.from(response.data);
                    console.log('✅ Signature fetched from Cloudinary successfully');
                } catch (fetchError) {
                    console.error('❌ Error fetching signature from Cloudinary:', fetchError.message);
                    return false;
                }
            } else {
                // Use local file
                const signaturePath = path.join(this.signaturesDir, signatureInfo.filename);
                
                // Check if signature file exists
                try {
                    await fs.access(signaturePath);
                    signatureImageBytes = await fs.readFile(signaturePath);
                    console.log('✅ Signature loaded from local storage');
                } catch (error) {
                    console.warn('⚠️ Signature file not found locally, using default text signature');
                    return false;
                }
            }
            
            // Embed image based on file type
            let signatureImage;
            const mimeType = signatureInfo.mimetype || '';
            
            if (mimeType.includes('png')) {
                signatureImage = await pdfDoc.embedPng(signatureImageBytes);
            } else if (mimeType.includes('jpg') || mimeType.includes('jpeg')) {
                signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
            } else {
                console.warn('⚠️ Unsupported signature image format, using default text signature');
                return false;
            }
            
            // Draw signature image
            page.drawImage(signatureImage, {
                x: x,
                y: y,
                width: width,
                height: height,
            });
            
            console.log('✅ Signature image embedded successfully in PDF');
            return true;
            
        } catch (error) {
            console.warn('⚠️ Error embedding signature image, using default text signature:', error.message);
            return false;
        }
    }

    async saveSignatureInfo(signatureInfo) {
        try {
            const signatureInfoPath = path.join(this.signaturesDir, 'signature-info.json');
            await fs.writeFile(signatureInfoPath, JSON.stringify(signatureInfo, null, 2));
            console.log('✅ Signature info saved successfully');
        } catch (error) {
            console.error('Error saving signature info:', error);
            throw error;
        }
    }

    async getCurrentSignature() {
        try {
            const signatureInfoPath = path.join(this.signaturesDir, 'signature-info.json');
            const signatureInfoData = await fs.readFile(signatureInfoPath, 'utf8');
            const signatureInfo = JSON.parse(signatureInfoData);
            
            // If it's a Cloudinary signature, we don't need to check local file
            if (signatureInfo && signatureInfo.isCloudinary) {
                console.log('✅ Cloudinary signature info loaded:', signatureInfo.cloudinaryUrl);
                return signatureInfo;
            }
            
            // Validate that the signature file actually exists and has valid size (for local files)
            if (signatureInfo && signatureInfo.filename) {
                const signatureFilePath = path.join(this.signaturesDir, signatureInfo.filename);
                try {
                    const stats = await fs.stat(signatureFilePath);
                    // Check if file exists and is larger than 1KB (corrupted files are usually very small)
                    if (stats.size < 1024) {
                        console.warn('⚠️ Signature file exists but appears corrupted (size:', stats.size, 'bytes). Minimum size: 1KB');
                        signatureInfo.isCorrupted = true;
                        signatureInfo.actualSize = stats.size;
                    }
                } catch (fileError) {
                    console.warn('⚠️ Signature info exists but local file is missing:', signatureInfo.filename);
                    return null; // File referenced in info doesn't exist
                }
            }
            
            return signatureInfo;
        } catch (error) {
            // File doesn't exist or can't be read
            return null;
        }
    }

    /**
     * Delete existing signature files and info
     */
    async deleteExistingSignature() {
        try {
            const signatureInfo = await this.getCurrentSignature();
            
            if (signatureInfo) {
                // Delete from Cloudinary if applicable
                if (signatureInfo.isCloudinary && signatureInfo.cloudinaryPublicId) {
                    try {
                        const cloudinary = require('cloudinary').v2;
                        await cloudinary.uploader.destroy(signatureInfo.cloudinaryPublicId);
                        console.log('🗑️ Deleted signature from Cloudinary:', signatureInfo.cloudinaryPublicId);
                    } catch (cloudError) {
                        console.warn('⚠️ Could not delete signature from Cloudinary:', cloudError.message);
                    }
                } else {
                    // Delete local signature image file
                    const signatureImagePath = path.join(this.signaturesDir, signatureInfo.filename);
                    try {
                        await fs.unlink(signatureImagePath);
                        console.log('🗑️ Deleted existing local signature image');
                    } catch (error) {
                        console.warn('⚠️ Could not delete local signature image:', error.message);
                    }
                }
            }

            // Delete signature info file
            const signatureInfoPath = path.join(this.signaturesDir, 'signature-info.json');
            try {
                await fs.unlink(signatureInfoPath);
                console.log('🗑️ Deleted signature info file');
            } catch (error) {
                // File doesn't exist, that's okay
            }

        } catch (error) {
            console.error('Error deleting existing signature:', error);
            // Don't throw - we want to continue with upload even if deletion fails
        }
    }
}

module.exports = new CertificateService();
