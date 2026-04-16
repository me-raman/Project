const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    companyName: { type: String },
    location: { type: String },
    role: { type: String },
    registeredLatitude: { type: Number },
    registeredLongitude: { type: Number },
    reputationScore: { type: Number, default: 100 }
});

module.exports = mongoose.model('User', UserSchema);
