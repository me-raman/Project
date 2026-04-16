const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    batchNumber: { type: String },
    currentStatus: { type: String, default: 'Manufactured' },
    currentLocation: { type: String },
    currentHandler: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isRecalled: { type: Boolean, default: false },
    auditStatus: { type: String, default: 'CLEAR' }
});

module.exports = mongoose.model('Product', ProductSchema);
