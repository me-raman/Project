const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batchNumber: { type: String, required: true },
    serialNumber: { type: String, required: true },
    mfgDate: { type: Date, required: true },
    expDate: { type: Date, required: true },
    currentStatus: { type: String, default: 'Manufactured' },
    currentLocation: { type: String },
    currentHandler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    // Manufacturer GPS coordinates at time of batch registration
    manufacturerLatitude: { type: Number },
    manufacturerLongitude: { type: Number },
    manufacturerGeoTimestamp: { type: Date },
    // Anti-counterfeiting: Scan-Count Lock
    scanCount: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: String },
    lockedAt: { type: Date },
    // Product Recall
    isRecalled: { type: Boolean, default: false },
    recallReason: { type: String },
    recalledAt: { type: Date },
    recalledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Batch Audit Trail
    auditStatus: {
        type: String,
        enum: ['CLEAR', 'PENDING_AUDIT', 'AUDIT_PASSED', 'AUDIT_FAILED'],
        default: 'CLEAR'
    },
    auditFlaggedAt: { type: Date },
    auditResolvedAt: { type: Date },
    auditResolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Declared Quantity Locks
    declaredQuantity: { type: Number },
    quantityLocked: { type: Boolean, default: false },
    // Consumer Scan Geo-Anomaly Detection
    lastScanLatitude: { type: Number },
    lastScanLongitude: { type: Number },
    lastScanTimestamp: { type: Date },
    lastScanLocation: { type: String },
    geoAnomalyCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Product', ProductSchema);
