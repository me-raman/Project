const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: ['Admin', 'Manufacturer', 'Distributor', 'Pharmacy', 'Retailer', 'Customer'],
        required: true
    },
    companyName: { type: String, required: true },
    licenceNumber: { type: String, required: true },
    location: { type: String, required: true },
    licenceStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
    },
    // Registered geo-coordinates (for reconciliation checks)
    registeredLatitude: { type: Number },
    registeredLongitude: { type: Number },
    registeredAddress: { type: String },
    // Reputation Scoring
    reputationScore: { type: Number, default: 100, min: 0, max: 100 },
    reputationHistory: [{
        score: Number,
        reason: String,
        delta: Number,
        timestamp: { type: Date, default: Date.now }
    }],
    totalAnomalies: { type: Number, default: 0 },
    totalDisputes: { type: Number, default: 0 },
    totalHandoffs: { type: Number, default: 0 },
    lastReputationUpdate: { type: Date }
});

module.exports = mongoose.model('User', UserSchema);
