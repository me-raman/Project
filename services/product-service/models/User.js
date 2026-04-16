const mongoose = require('mongoose');

// Minimal User schema for population
const UserSchema = new mongoose.Schema({
    username: { type: String },
    companyName: { type: String },
    location: { type: String },
    role: { type: String },
    registeredLatitude: { type: Number },
    registeredLongitude: { type: Number },
    reputationScore: { type: Number, default: 100 }
});

module.exports = mongoose.model('User', UserSchema);
