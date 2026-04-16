const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true, index: true }, // Indexed for fast lookups
    name: { type: String, required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batchNumber: { type: String, required: true },
    serialNumber: { type: String, required: true },
    mfgDate: { type: Date, required: true },
    expDate: { type: Date, required: true },

    // Current status for quick efficient querying
    currentStatus: { type: String, default: 'Manufactured' },
    currentLocation: { type: String },
    currentHandler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    createdAt: { type: Date, default: Date.now },
    // Anti-counterfeiting: Scan-Count Lock
    scanCount: { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
    lockedBy: { type: String },
    lockedAt: { type: Date },
    // Product Recall
    isRecalled: { type: Boolean, default: false },
    recallReason: { type: String },
    recalledAt: { type: Date },
    recalledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Product', ProductSchema);
