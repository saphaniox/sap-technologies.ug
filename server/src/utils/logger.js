/**
 * Application Logger Utility
 * 
 * Centralized logging solution using Winston for structured logging.
 * Provides different log levels and outputs to files and console.
 * 
 * Log Levels (in order of severity):
 * - error: Error messages
 * - warn: Warning messages
 * - info: Informational messages
 * - http: HTTP requests
 * - debug: Debug messages (only in development)
 * 
 * In production, only logs warn and error levels to reduce noise.
 * In development, logs all levels including debug.
 * 
 * @module utils/logger
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Determine log level based on environment
const level = () => {
    const env = process.env.NODE_ENV || 'development';
    const isDevelopment = env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

// Define log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (colorized and simplified)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0 && meta.stack) {
            msg += `\n${meta.stack}`;
        }
        return msg;
    })
);

// Define which transports to use
const transports = [
    // Console output
    new winston.transports.Console({
        format: consoleFormat,
        level: level()
    }),
    
    // Error logs file
    new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    }),
    
    // Combined logs file (warn and above)
    new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        level: 'warn',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5
    })
];

// Create the logger
const logger = winston.createLogger({
    level: level(),
    levels: winston.config.npm.levels,
    format: logFormat,
    transports,
    exitOnError: false
});

// Add debug file transport only in development
if (process.env.NODE_ENV === 'development') {
    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'debug.log'),
        level: 'debug',
        format: logFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 2
    }));
}

// Create a stream object for Morgan HTTP logger
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    }
};

// Helper methods for common logging patterns
logger.logError = (context, error, additionalInfo = {}) => {
    logger.error(`[${context}] ${error.message}`, {
        error: error.message,
        stack: error.stack,
        ...additionalInfo
    });
};

logger.logWarning = (context, message, data = {}) => {
    logger.warn(`[${context}] ${message}`, data);
};

logger.logInfo = (context, message, data = {}) => {
    logger.info(`[${context}] ${message}`, data);
};

logger.logDebug = (context, message, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
        logger.debug(`[${context}] ${message}`, data);
    }
};

module.exports = logger;
