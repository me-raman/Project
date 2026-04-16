const mongoose = require('mongoose');

/**
 * AuditLog — Immutable event log for PharmaTrace
 * 
 * Every significant action in the system is logged here.
 * This collection is APPEND-ONLY — no update or delete operations.
 */
const AuditLogSchema = new mongoose.Schema({
    entityType: {
        type: String,
        enum: ['Product', 'Batch', 'User', 'Tracking', 'Handoff', 'LabTest'],
        required: true
    },
    entityId: { type: String, required: true },
    action: {
        type: String,
        required: true
        // Actions: BATCH_CREATED, PRODUCT_CREATED, STATUS_CHANGED, RECALLED,
        // AUDIT_FLAGGED, AUDIT_PASSED, AUDIT_FAILED, HANDOFF_SHIPPED,
        // HANDOFF_CONFIRMED, HANDOFF_DISPUTED, LAB_TEST_SUBMITTED,
        // LAB_TEST_FAILED, QUANTITY_LOCK_ENFORCED, GEO_ANOMALY_DETECTED,
        // REPUTATION_UPDATED, RECONCILIATION_FLAGGED
    },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorRole: { type: String },
    previousValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    metadata: { type: mongoose.Schema.Types.Mixed }, // GPS, IP, extra context
    severity: {
        type: String,
        enum: ['info', 'warning', 'critical'],
        default: 'info'
    },
    timestamp: { type: Date, default: Date.now, immutable: true }
});

// Index for fast lookups
AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
