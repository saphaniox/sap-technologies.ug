// List of disposable/temporary email domains
const DISPOSABLE_DOMAINS = [
    'mailinator.com', '10minutemail.com', 'guerrillamail.com', 'yopmail.com', 'tempmail.com',
    'trashmail.com', 'fakeinbox.com', 'getnada.com', 'sharklasers.com', 'maildrop.cc',
    'dispostable.com', 'mailnesia.com', 'spamgourmet.com', 'throwawaymail.com', 'mintemail.com',
    'mailcatch.com', 'spambog.com', 'mailnull.com', 'mytemp.email', 'moakt.com', 'emailondeck.com'
];

// Common domain typos and their corrections
const DOMAIN_TYPOS = {
    'gamil.com': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmial.com': 'gmail.com',
    'hotnail.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'yaho.com': 'yahoo.com',
    'yahho.com': 'yahoo.com',
    'outlok.com': 'outlook.com',
    'icloud.con': 'icloud.com',
    'icloud.co': 'icloud.com',
    'gmaill.com': 'gmail.com',
    'gmail.co': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmail.om': 'gmail.com',
    'yahoo.co': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
    'hotmail.co': 'hotmail.com',
    'hotmail.con': 'hotmail.com',
    'outlook.co': 'outlook.com',
    'outlook.con': 'outlook.com',
};

// Trusted domains for business/edu validation
const TRUSTED_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    '.edu', '.ac.ug', '.ac.ke', '.ac.za', '.ac.uk', '.edu.gh', '.edu.ng',
    'protonmail.com', 'zoho.com', 'aol.com', 'mail.com', 'gmx.com',
    'pm.me', 'yandex.com', 'fastmail.com', 'tutanota.com', 'hey.com',
    'students.com', 'alumni.com', 'posteo.net', 'hushmail.com', 'inbox.lv'
];
function validateEmail(email) {
    const result = {
        isValid: true,
        originalEmail: email,
        correctedEmail: null,
        reasons: [],
        suggestions: []
    };
    // ...existing code...

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

// Express middleware for advanced email validation (module-level)
function emailValidationMiddleware(req, res, next) {
    const email = req.body.voterEmail || req.body.nominatorEmail || req.body.email || req.query.email;
    if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
    }
    try {
        const result = validateEmail(email);
        if (!result.isValid) {
            return res.status(400).json({
                error: 'Invalid email address.',
                reasons: result.reasons,
                suggestions: result.suggestions
            });
        }
        // attach normalized/corrected email if provided
        if (result.correctedEmail) req.correctedEmail = result.correctedEmail;
        next();
    } catch (err) {
        next(err);
    }
}

module.exports = {
    validateEmail,
    emailValidationMiddleware,
    isTrustedDomain,
    DISPOSABLE_DOMAINS,
    DOMAIN_TYPOS,
    TRUSTED_DOMAINS
};
