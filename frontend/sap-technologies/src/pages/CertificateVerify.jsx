import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from '../utils/helmet.jsx';
import apiService from '../services/api';
import '../styles/CertificateVerify.css';

const CertificateVerify = () => {
    const { certificateId } = useParams();
    const [loading, setLoading] = useState(true);
    const [certificate, setCertificate] = useState(null);
    const [error, setError] = useState(null);
    const [isValid, setIsValid] = useState(false);

    useEffect(() => {
        verifyCertificate();
    }, [certificateId]);

    const verifyCertificate = async () => {
        setLoading(true);
        setError(null);
        
        try {
            console.log(`🔍 Verifying certificate: ${certificateId}`);
            const response = await apiService.verifyCertificate(certificateId);
            
            if (response.success && response.valid) {
                setCertificate(response.certificate);
                setIsValid(true);
                console.log('✅ Certificate verified successfully');
            } else {
                setError(response.message || 'Certificate not found or invalid');
                setIsValid(false);
                console.log('❌ Certificate invalid');
            }
        } catch (err) {
            console.error('❌ Verification error:', err);
            setError(err.response?.data?.message || 'Failed to verify certificate. Please try again.');
            setIsValid(false);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (certificate && certificate.filename) {
            const downloadUrl = `${apiService.baseURL}/certificates/download/${certificate.filename}`;
            window.open(downloadUrl, '_blank');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getTypeLabel = (type) => {
        const labels = {
            winner: 'Winner',
            finalist: 'Finalist',
            participation: 'Participation'
        };
        return labels[type] || type;
    };

    const getTypeBadgeClass = (type) => {
        const classes = {
            winner: 'badge-winner',
            finalist: 'badge-finalist',
            participation: 'badge-participation'
        };
        return classes[type] || '';
    };

    // Meta tags for social media and Google previews
    const metaTitle = certificate 
        ? `Certificate Verification - ${certificate.recipientName}` 
        : 'Certificate Verification - SAP Technologies';
    
    const metaDescription = certificate 
        ? `${certificate.recipientName} - ${getTypeLabel(certificate.type)} Certificate for ${certificate.categoryName} (${certificate.awardYear})`
        : 'Verify SAP Technologies certificate authenticity';
    
    const metaUrl = `https://sap-technologies.com/verify/${certificateId}`;

    if (loading) {
        return (
            <div className="certificate-verify-container">
                <Helmet>
                    <title>Verifying Certificate... - SAP Technologies</title>
                    <meta name="description" content="Verifying certificate authenticity" />
                </Helmet>
                <div className="verify-loading">
                    <div className="loading-spinner"></div>
                    <p>Verifying certificate...</p>
                </div>
            </div>
        );
    }

    if (error || !isValid) {
        return (
            <div className="certificate-verify-container">
                <Helmet>
                    <title>Invalid Certificate - SAP Technologies</title>
                    <meta name="description" content="Certificate verification failed" />
                    <meta property="og:title" content="Invalid Certificate" />
                    <meta property="og:description" content="This certificate could not be verified" />
                    <meta property="og:url" content={metaUrl} />
                    <meta property="og:type" content="website" />
                    <meta name="twitter:card" content="summary" />
                    <meta name="twitter:title" content="Invalid Certificate" />
                    <meta name="twitter:description" content="This certificate could not be verified" />
                </Helmet>
                <div className="verify-error">
                    <div className="error-icon">✗</div>
                    <h1>Invalid Certificate</h1>
                    <p className="error-message">{error}</p>
                    <div className="error-details">
                        <p><strong>Certificate ID:</strong> {certificateId}</p>
                        <p>This certificate may have been revoked, expired, or does not exist.</p>
                    </div>
                    <div className="error-actions">
                        <button onClick={verifyCertificate} className="btn-retry">
                            Try Again
                        </button>
                        <a href="/" className="btn-home">
                            Return Home
                        </a>
                    </div>
                    <div className="contact-info">
                        <p>For assistance, please contact us at:</p>
                        <a href="mailto:support@sap-technologies.com">support@sap-technologies.com</a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="certificate-verify-container">
            <Helmet>
                <title>{metaTitle}</title>
                <meta name="description" content={metaDescription} />
                
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={metaUrl} />
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:site_name" content="SAP Technologies" />
                
                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={metaUrl} />
                <meta name="twitter:title" content={metaTitle} />
                <meta name="twitter:description" content={metaDescription} />
                
                {/* Additional SEO */}
                <meta name="robots" content="index, follow" />
                <link rel="canonical" href={metaUrl} />
            </Helmet>

            <div className="verify-success">
                <div className="success-header">
                    <div className="success-icon">✓</div>
                    <h1>Valid Certificate</h1>
                    <p className="success-subtitle">This certificate has been verified as authentic</p>
                </div>

                <div className="certificate-card">
                    <div className="certificate-header">
                        <h2>{certificate.recipientName}</h2>
                        <span className={`certificate-badge ${getTypeBadgeClass(certificate.type)}`}>
                            {getTypeLabel(certificate.type)}
                        </span>
                    </div>

                    <div className="certificate-details">
                        <div className="detail-row">
                            <span className="detail-label">Award Category:</span>
                            <span className="detail-value">{certificate.categoryName}</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Certificate ID:</span>
                            <span className="detail-value certificate-id">{certificate.certificateId}</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Issue Date:</span>
                            <span className="detail-value">{formatDate(certificate.issueDate)}</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Award Year:</span>
                            <span className="detail-value">{certificate.awardYear}</span>
                        </div>

                        {certificate.recipientEmail && (
                            <div className="detail-row">
                                <span className="detail-label">Recipient Email:</span>
                                <span className="detail-value">{certificate.recipientEmail}</span>
                            </div>
                        )}
                    </div>

                    <div className="verification-stats">
                        <div className="stat-item">
                            <span className="stat-icon">👁️</span>
                            <div className="stat-content">
                                <span className="stat-value">{certificate.verificationCount || 0}</span>
                                <span className="stat-label">Times Verified</span>
                            </div>
                        </div>
                        
                        {certificate.lastVerifiedAt && (
                            <div className="stat-item">
                                <span className="stat-icon">🕐</span>
                                <div className="stat-content">
                                    <span className="stat-value">{formatDate(certificate.lastVerifiedAt)}</span>
                                    <span className="stat-label">Last Verified</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="certificate-actions">
                        <button onClick={handleDownload} className="btn-download">
                            <span className="btn-icon">⬇</span>
                            Download Certificate
                        </button>
                        <a href="/" className="btn-secondary">
                            Return Home
                        </a>
                    </div>
                </div>

                <div className="verification-footer">
                    <p className="footer-text">
                        This certificate was issued by <strong>SAP Technologies</strong> and has been verified as authentic.
                    </p>
                    <p className="footer-security">
                        🔒 Secured and verified through blockchain-backed authentication
                    </p>
                </div>
            </div>
        </div>
    );
};

export default CertificateVerify;
