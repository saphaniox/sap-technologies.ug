/**
 * Humanized error message mapper
 * Converts technical errors into friendly, conversational messages
 */

const errorMap = {
  // Network errors
  'ERR_NETWORK': "We're having trouble reaching the server. Check your internet and try again.",
  'ECONNREFUSED': "The server isn't responding right now. Please try again in a moment.",
  'ENOTFOUND': "Network issue — we can't reach the service. Is your internet working?",
  'TIMEOUT': "The request took too long. Try again?",
  
  // Authentication errors
  'Unauthorized': "Your session expired. Please log in again.",
  'Authentication required': "You need to log in to do that.",
  '401': "You're not logged in. Please sign in first.",
  '403': "You don't have permission to do that.",
  
  // Validation errors
  'Invalid input': "That doesn't look right. Please check and try again.",
  'Required field': "Please fill in all required fields.",
  'Invalid email': "That email address doesn't look quite right.",
  'Password too short': "Your password needs to be a bit longer for security.",
  
  // File upload errors
  'File too large': "That file is too big. Please use a smaller one.",
  'Invalid file type': "That file type isn't supported. Try a different format.",
  'No file selected': "Please choose a file first.",
  
  // Server errors
  '500': "Something went wrong on our end. We're looking into it.",
  '503': "We're temporarily down for maintenance. Back soon!",
  '502': "There's a temporary issue. Please try again in a moment.",
  
  // Database/data errors
  'Duplicate entry': "That already exists. Try something different.",
  'Not found': "We couldn't find that. It might have been deleted.",
  'Data validation failed': "There's an issue with the information. Please check it.",
};

/**
 * Convert technical error to human-friendly message
 * @param {Error|string} error - The error object or message
 * @param {string} context - Optional context (e.g., "saving profile", "uploading image")
 * @returns {string} Friendly error message
 */
export function humanizeError(error, context = '') {
  let message = typeof error === 'string' ? error : error?.message || 'Something happened';
  
  // Check if we have a mapped friendly message
  for (const [key, friendlyMsg] of Object.entries(errorMap)) {
    if (message.includes(key) || message.toLowerCase().includes(key.toLowerCase())) {
      return friendlyMsg;
    }
  }
  
  // Default fallback messages by context
  if (context === 'auth') return "There was a problem with login. Please try again.";
  if (context === 'upload') return "We had trouble uploading that. Please try again.";
  if (context === 'save') return "Couldn't save that. Please try again.";
  if (context === 'delete') return "Couldn't delete that. Please try again.";
  if (context === 'load') return "We had trouble loading that. Please refresh the page.";
  
  // Last resort: use a generic friendly message
  return "Oops, something didn't work as expected. Please try again.";
}

/**
 * Format error for display in UI
 * @param {Error|string} error
 * @param {string} title - Optional title for the alert
 * @param {string} context - Optional context
 * @returns {object} { title, message } for use in alerts
 */
export function formatErrorForDisplay(error, title = '', context = '') {
  const message = humanizeError(error, context);
  const defaultTitle = {
    auth: "Oops!",
    upload: "Upload failed",
    save: "Couldn't save",
    delete: "Couldn't delete",
    load: "Loading issue"
  }[context] || "Something went wrong";
  
  return {
    title: title || defaultTitle,
    message
  };
}

/**
 * Log error details (for debugging) without exposing to user
 * @param {Error|string} error
 * @param {string} context - Where the error occurred
 */
export function logError(error, context = '') {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, error);
  }
}
