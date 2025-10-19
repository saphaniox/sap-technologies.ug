function validateEmail(email) {
    const result = {
        isValid: true,
        originalEmail: email,
        correctedEmail: null,
        reasons: [],
        suggestions: []
    };

    if (!email || typeof email !== 'string') {
        result.isValid = false;
        result.reasons.push('Email is required');
        return result;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Basic format validation
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(normalizedEmail)) {
        result.isValid = false;
        result.reasons.push('Invalid email format');
        return result;
    }

    // Extract domain
    const [localPart, domain] = normalizedEmail.split('@');
    
    if (!domain) {
        result.isValid = false;
        result.reasons.push('Missing email domain');
        return result;
    }

    // Check for suspicious patterns
    if (localPart.length < 2) {
        result.isValid = false;
        result.reasons.push('Email username too short (suspicious)');
    }

    // Check for excessive dots or special characters (pattern abuse)
    const dotCount = (localPart.match(/\./g) || []).length;
    const specialCharCount = (localPart.match(/[!#$%&'*+/=?^_`{|}~-]/g) || []).length;
    
    if (dotCount > 3 || specialCharCount > 2) {
        result.reasons.push('Suspicious email pattern detected');
        result.isValid = false;
    }

    // Check for disposable email domains
    if (DISPOSABLE_DOMAINS.includes(domain)) {
        result.isValid = false;
        result.reasons.push('Disposable/temporary email addresses are not allowed');
        result.suggestions.push('Please use a permanent email address (Gmail, Yahoo, Outlook, etc.)');
        return result;
    }

    // Check for common typos and suggest corrections
    if (DOMAIN_TYPOS[domain]) {
        result.correctedEmail = `${localPart}@${DOMAIN_TYPOS[domain]}`;
        result.suggestions.push(`Did you mean ${result.correctedEmail}?`);
        result.reasons.push('Possible typo detected in email domain');
        // Don't invalidate, just suggest correction
    }

    // Check for suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.pw'];
    const hasSuspiciousTLD = suspiciousTLDs.some(tld => domain.endsWith(tld));
    
    if (hasSuspiciousTLD) {
        result.reasons.push('Email domain uses a high-risk TLD commonly associated with spam');
        result.isValid = false;
    }

    // Check domain has valid structure (at least one dot for TLD)
    if (!domain.includes('.')) {
        result.isValid = false;
        result.reasons.push('Invalid domain structure (missing TLD)');
    }

    // Check for consecutive dots
    if (normalizedEmail.includes('..')) {
        result.isValid = false;
        result.reasons.push('Invalid email format (consecutive dots)');
    }

    // Additional checks for obviously fake patterns
    const fakePatterns = [
        /test@test/i,
        /fake@/i,
        /spam@/i,
        /trash@/i,
        /noreply@/i,
        /nomail@/i,
        /example@/i,
        /admin@test/i,
        /user@test/i,
        /@example\./i,
        /@test\./i,
        /@localhost/i,
        /@127\.0\.0\.1/i,
        /123@123/i,
        /abc@abc/i
    ];

    for (const pattern of fakePatterns) {
        if (pattern.test(normalizedEmail)) {
            result.isValid = false;
            result.reasons.push('Email appears to be a test/fake address');
            result.suggestions.push('Please provide a real, active email address');
            break;
        }
    }

    return result;
}

function isTrustedDomain(email) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;
    
    return TRUSTED_DOMAINS.some(trusted => {
        if (trusted.startsWith('.')) {
            return domain.endsWith(trusted);
        }
        return domain === trusted;
    });
}

module.exports = {
    validateEmail,
    emailValidationMiddleware,
    isTrustedDomain,
    DISPOSABLE_DOMAINS,
    DOMAIN_TYPOS,
    TRUSTED_DOMAINS
};
