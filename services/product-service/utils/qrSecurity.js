const crypto = require('crypto');

const QR_SECRET = process.env.JWT_SECRET || 'pharmatrace-default-secret';

/**
 * Sign a productId using HMAC-SHA256
 * Returns: "productId.signature"
 */
function signProductId(productId) {
    const signature = crypto
        .createHmac('sha256', QR_SECRET)
        .update(productId)
        .digest('hex')
        .substring(0, 16); // Use first 16 chars for shorter QR codes
    return `${productId}.${signature}`;
}

/**
 * Verify a signed QR payload
 * Input: "productId.signature"
 * Returns: { valid: boolean, productId: string }
 */
function verifySignedPayload(payload) {
    if (!payload || !payload.includes('.')) {
        // Could be a plain productId (backward compatible)
        return { valid: false, productId: payload, isPlainId: true };
    }

    // The signature is always the last 16 chars after the last dot
    const lastDotIndex = payload.lastIndexOf('.');
    const productId = payload.substring(0, lastDotIndex);
    const signature = payload.substring(lastDotIndex + 1);

    // If the "signature" part is too long, this might be a productId with dots
    if (signature.length !== 16) {
        return { valid: false, productId: payload, isPlainId: true };
    }

    const expectedSignature = crypto
        .createHmac('sha256', QR_SECRET)
        .update(productId)
        .digest('hex')
        .substring(0, 16);

    return {
        valid: signature === expectedSignature,
        productId,
        isPlainId: false
    };
}

module.exports = { signProductId, verifySignedPayload };
