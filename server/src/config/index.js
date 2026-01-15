/**
 * Centralized Configuration Module
 * Loads and validates environment variables for production deployment
 */

const config = {
    // Server
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',

    // Database
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/pharmatrace',

    // Authentication
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiry: process.env.JWT_EXPIRY || '5d',

    // CORS
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

    // Rate Limiting
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window

    // OTP Config
    otpExpiry: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5, // 5 minutes

    // Feature Flags
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production'
};

/**
 * Validate required environment variables
 */
const validateConfig = () => {
    const required = ['JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    if (config.isProduction && !process.env.MONGODB_URI) {
        console.warn('WARNING: Using local MongoDB in production mode');
    }

    if (config.isProduction && !process.env.FRONTEND_URL) {
        console.warn('WARNING: FRONTEND_URL not set, CORS may block requests');
    }
};

module.exports = { config, validateConfig };
