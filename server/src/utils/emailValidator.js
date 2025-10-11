/**
 * Email Validation Utility
 * 
 * Advanced email validation to prevent fake/disposable emails from voting
 * Features:
 * - Disposable email detection
 * - Common domain typo correction
 * - Format validation
 * - Suspicious pattern detection
 */

// List of known disposable/temporary email domains
const DISPOSABLE_DOMAINS = [
    // Popular temporary email services
    'mailinator.com', 'guerrillamail.com', 'temp-mail.org', 'throwaway.email',
    '10minutemail.com', 'tempmail.com', 'getnada.com', 'maildrop.cc',
    'yopmail.com', 'fakeinbox.com', 'trashmail.com', 'sharklasers.com',
    'guerrillamail.info', 'guerrillamail.biz', 'guerrillamail.de',
    'grr.la', 'guerrillamail.net', 'spam4.me', 'mailnesia.com',
    'tempinbox.com', 'throwawaymail.com', 'mt2015.com', 'mytemp.email',
    'mohmal.com', 'emailondeck.com', 'mintemail.com', 'spambox.us',
    'mailcatch.com', 'throwam.com', 'bccto.me', 'harakirimail.com',
    'tempsky.com', 'burnermail.io', 'discard.email', 'fakemail.net',
    'tmpeml.info', 'tempm.com', 'temp.emeraldwebmail.com',
    
    // Additional common temporary domains
    '33mail.com', 'anonbox.net', 'anonymbox.com', 'deadaddress.com',
    'despam.it', 'devnullmail.com', 'dispostable.com', 'dropmail.me',
    'e4ward.com', 'emailsensei.com', 'emailxfer.com', 'emeil.in',
    'emeil.ir', 'emlhub.com', 'ezloko.com', 'fast-mail.fr',
    'filzmail.com', 'getairmail.com', 'getonemail.com', 'gishpuppy.com',
    'guerrillamailblock.com', 'imgof.com', 'jetable.com', 'mailexpire.com',
    'mailin8r.com', 'mailmoat.com', 'mailmetrash.com', 'mailnator.com',
    'mailsac.com', 'mailtothis.com', 'mailzilla.com', 'meltmail.com',
    'messagebeamer.de', 'mintemail.com', 'moburl.com', 'mytempemail.com',
    'nepwk.com', 'nervmich.net', 'nervtmich.net', 'netmails.com',
    'odnorazovoe.ru', 'oneoffemail.com', 'poofy.org', 'proxymail.eu',
    'put2.net', 'rcpt.at', 'recode.me', 'rmqkr.net',
    'safetymail.info', 'send-email.org', 'sharklasers.com', 'shieldemail.com',
    'spamarrest.com', 'spambog.com', 'spambox.info', 'spamcannon.com',
    'spamcannon.net', 'spamcero.com', 'spamcorptastic.com', 'spamfree24.com',
    'spamgourmet.com', 'spamhole.com', 'spamify.com', 'spaml.de',
    'spammotel.com', 'spamobox.com', 'spamslicer.com', 'spamthis.co.uk',
    'speed.1s.fr', 'superstachel.de', 'teewars.org', 'teleworm.com',
    'tempalias.com', 'tempemail.biz', 'tempemail.co.za', 'tempemail.net',
    'tempemailaddress.com', 'tempmaildemo.com', 'tempr.email', 'tilien.com',
    'trash-mail.com', 'trash-mail.de', 'trashmail.at', 'trashmail.de',
    'trashmail.me', 'trashmail.net', 'trashmailgenerator.com', 'trialmail.de',
    'uroid.com', 'wegwerfadresse.de', 'wegwerfemail.de', 'wegwerfemailadresse.com',
    'wegwerfmail.com', 'wegwerfmail.de', 'wegwerfmail.info', 'wegwerfmail.net',
    'wegwerfmail.org', 'wetrainbayarea.com', 'wh4f.org', 'whyspam.me',
    'willhackforfood.biz', 'xoxy.net', 'yopmail.fr', 'you-spam.com',
    'zehnminuten.de', 'zetmail.com', 'zippymail.info'
];

// Common email domain typos and their corrections
const DOMAIN_TYPOS = {
    // Gmail variations
    'gmial.com': 'gmail.com',
    'gmai.com': 'gmail.com',
    'gmil.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gmailo.com': 'gmail.com',
    'gmailcom': 'gmail.com',
    'gnail.com': 'gmail.com',
    'gmal.com': 'gmail.com',
    
    // Yahoo variations
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahoomail.com': 'yahoo.com',
    'yhoo.com': 'yahoo.com',
    'yaoo.com': 'yahoo.com',
    
    // Outlook/Hotmail variations
    'outlok.com': 'outlook.com',
    'outook.com': 'outlook.com',
    'outloook.com': 'outlook.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'hotmaill.com': 'hotmail.com',
    'hotmal.com': 'hotmail.com',
    
    // Other common services
    'iclod.com': 'icloud.com',
    'icoud.com': 'icloud.com',
    'iclould.com': 'icloud.com',
    'aol.co': 'aol.com',
    'aoll.com': 'aol.com',
    'protonmai.com': 'protonmail.com',
    'protonmial.com': 'protonmail.com'
};

// Trusted/legitimate email domains
const TRUSTED_DOMAINS = [
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'aol.com', 'protonmail.com', 'mail.com', 'zoho.com', 'gmx.com',
    'yandex.com', 'fastmail.com', 'tutanota.com', 'cock.li',
    
    // Educational domains
    '.edu', '.ac.uk', '.edu.au', '.edu.ng', '.ac.za', '.edu.in',
    
    // Corporate/Business
    'microsoft.com', 'apple.com', 'amazon.com', 'google.com',
    'facebook.com', 'twitter.com', 'linkedin.com'
];

/**
 * Validate email and detect fake/disposable addresses
 * @param {string} email - Email address to validate
 * @returns {Object} - Validation result with isValid, correctedEmail, and reasons
 */
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

/**
 * Express middleware for email validation
 */
function emailValidationMiddleware(req, res, next) {
    const email = req.body.voterEmail || req.body.email;
    
    if (!email) {
        return res.status(400).json({
            status: 'error',
            message: 'Email is required'
        });
    }

    const validation = validateEmail(email);
    
    if (!validation.isValid) {
        return res.status(400).json({
            status: 'error',
            message: 'Invalid email address',
            details: {
                reasons: validation.reasons,
                suggestions: validation.suggestions
            }
        });
    }

    // If there's a corrected email, suggest it but allow the original
    if (validation.correctedEmail) {
        req.emailSuggestion = validation.correctedEmail;
    }

    // Normalize email in request
    req.body.voterEmail = validation.originalEmail.toLowerCase().trim();
    if (req.body.email) {
        req.body.email = req.body.email.toLowerCase().trim();
    }

    next();
}

/**
 * Check if email is from a trusted domain
 * @param {string} email - Email to check
 * @returns {boolean}
 */
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
