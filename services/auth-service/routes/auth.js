const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Otp = require('../models/Otp');
const auth = require('../middleware/auth');

// @route   GET /api/auth/verify
// @desc    Verify token and return user data
router.get('/verify', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({
            userId: user.id,
            role: user.role,
            name: user.companyName
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, role, companyName, location, phoneNumber } = req.body;

    try {
        let user = await User.findOne({ phoneNumber });
        if (user) {
            return res.status(400).json({ message: 'User with this phone number already exists' });
        }

        user = new User({
            username: username || companyName,
            role,
            companyName,
            location: location || 'Not Specified',
            phoneNumber
        });

        await user.save();

        const payload = { userId: user.id, role: user.role, name: user.companyName };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role, name: user.companyName, userId: user.id });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/check-phone
router.post('/check-phone', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const user = await User.findOne({ phoneNumber });
        return res.json({ exists: !!user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.findOneAndUpdate(
            { phoneNumber },
            { phoneNumber, otp, createdAt: new Date() },
            { upsert: true, new: true }
        );

        console.log(`\n================================`);
        console.log(`[SMS SIMULATION] To: ${phoneNumber}`);
        console.log(`[SMS SIMULATION] OTP: ${otp}`);
        console.log(`================================\n`);

        // DEV MODE: Return OTP in response for display in notification
        res.json({ message: 'OTP sent successfully', otp: otp });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login-otp
router.post('/login-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;

    try {
        const storedOtp = await Otp.findOne({ phoneNumber });

        if (!storedOtp) {
            return res.status(400).json({ message: 'OTP expired or not requested' });
        }

        if (storedOtp.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        await Otp.deleteOne({ phoneNumber });

        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        const payload = { userId: user.id, role: user.role, name: user.companyName };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role, name: user.companyName, userId: user.id });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
