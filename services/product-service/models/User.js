const mongoose = require('mongoose');

// Minimal User schema for population
const UserSchema = new mongoose.Schema({
    username: { type: String },
    companyName: { type: String },
    location: { type: String },
    role: { type: String }
});

module.exports = mongoose.model('User', UserSchema);
