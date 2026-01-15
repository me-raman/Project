const { body, validationResult } = require('express-validator');

/**
 * Validation middleware for product batch creation
 */
const validateBatch = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ max: 200 }).withMessage('Product name too long'),
    body('batchNumber')
        .trim()
        .notEmpty().withMessage('Batch number is required')
        .isLength({ max: 50 }).withMessage('Batch number too long'),
    body('mfgDate')
        .notEmpty().withMessage('Manufacturing date is required')
        .isISO8601().withMessage('Invalid manufacturing date format'),
    body('expDate')
        .notEmpty().withMessage('Expiry date is required')
        .isISO8601().withMessage('Invalid expiry date format'),
    body('count')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be between 1 and 1000')
];

/**
 * Validation middleware for tracking updates
 */
const validateTrackingUpdate = [
    body('status')
        .trim()
        .notEmpty().withMessage('Status is required')
        .isIn(['In Transit', 'Stored', 'Received at Pharmacy'])
        .withMessage('Invalid status value'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Notes too long')
];

/**
 * Validation middleware for OTP requests
 */
const validatePhone = [
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required')
        .matches(/^[0-9]{10,15}$/).withMessage('Invalid phone number format')
];

const validateOtp = [
    body('phoneNumber')
        .trim()
        .notEmpty().withMessage('Phone number is required'),
    body('otp')
        .trim()
        .notEmpty().withMessage('OTP is required')
        .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

/**
 * Middleware to check validation results
 * Use after validation arrays
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
        });
    }
    next();
};

module.exports = {
    validateBatch,
    validateTrackingUpdate,
    validatePhone,
    validateOtp,
    handleValidationErrors
};
