const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String },
    role: {
        type: String,
        enum: ['Manufacturer', 'Distributor', 'Pharmacy', 'Retailer', 'Customer'],
        required: true
    },
    companyName: { type: String, required: true },
    location: { type: String, required: true },
    phoneNumber: { type: String, required: true, unique: true }
});

module.exports = mongoose.model('User', UserSchema);
