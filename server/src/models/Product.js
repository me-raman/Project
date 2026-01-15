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

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);
