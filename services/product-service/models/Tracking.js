const mongoose = require('mongoose');

const TrackingSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    handler: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    notes: { type: String }
});

module.exports = mongoose.model('Tracking', TrackingSchema);
