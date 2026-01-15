const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
    phoneNumber: { type: String, required: true, unique: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 } // Auto-delete after 5 mins
});

module.exports = mongoose.model('Otp', OtpSchema);
