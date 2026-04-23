const mongoose = require('mongoose');

/**
 * Handoff — Dual-Confirmation Transfer Record
 * 
 * Every batch transfer requires TWO steps:
 * 1. Sender initiates shipment (status: SHIPPED)
 * 2. Receiver confirms receipt (status: CONFIRMED)
 * 
 * If receiver disputes, status becomes DISPUTED.
 * If not confirmed within 72 hours, status becomes EXPIRED.
 */
const HandoffSchema = new mongoose.Schema({
    // Batch-level fields (primary)
    batchNumber: { type: String },
    batchName: { type: String },
    unitCount: { type: Number },
    // Legacy per-product fields (kept for backward compat)
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productId: { type: String }, // Denormalized for quick lookup
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiverRole: { type: String }, // Expected receiver role
    status: {
        type: String,
        enum: ['SHIPPED', 'CONFIRMED', 'DISPUTED', 'EXPIRED'],
        default: 'SHIPPED'
    },
    shippedAt: { type: Date, default: Date.now },
    confirmedAt: { type: Date },
    // Sender GPS at time of shipment
    senderLatitude: { type: Number },
    senderLongitude: { type: Number },
    // Receiver GPS at time of confirmation
    receiverLatitude: { type: Number },
    receiverLongitude: { type: Number },
    // Dispute fields
    disputeReason: { type: String },
    disputedAt: { type: Date },
    // Auto-expiry
    expiresAt: { type: Date } // 72 hours from shippedAt
});

// Indexes
HandoffSchema.index({ productId: 1, status: 1 });
HandoffSchema.index({ batchNumber: 1, status: 1 });
HandoffSchema.index({ sender: 1, status: 1 });
HandoffSchema.index({ receiver: 1, status: 1 });
HandoffSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL for auto-cleanup (optional)

module.exports = mongoose.model('Handoff', HandoffSchema);
