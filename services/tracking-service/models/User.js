const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    companyName: { type: String },
    location: { type: String },
    role: { type: String }
});

module.exports = mongoose.model('User', UserSchema);
