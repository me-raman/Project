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
            name: user.companyName,
            email: user.email,
            location: user.location,
            licenceNumber: user.licenceNumber,
            licenceStatus: user.licenceStatus,
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/update-password
// @desc    Update user password
router.post('/update-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, role, companyName, licenceNumber, location, email, password } = req.body;

    try {
        // Check if user already exists (by email OR username)
        let user = await User.findOne({ 
            $or: [
                { email }, 
                { username: username || email }
            ] 
        });
        
        if (user) {
            const isEmailMatch = user.email === email;
            return res.status(400).json({ 
                message: isEmailMatch ? 'User with this email already exists' : 'This username is already taken' 
            });
        }

        user = new User({
            username: username || companyName,
            email,
            password,
            role,
            companyName,
            licenceNumber,
            location: location || 'Not Specified',
            licenceStatus: 'pending' // New users start as pending
        });

        // Hash password if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        const payload = { userId: user.id, role: user.role, name: user.companyName };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token, 
                role: user.role, 
                name: user.companyName, 
                userId: user.id,
                licenceNumber: user.licenceNumber,
                licenceStatus: user.licenceStatus
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});



// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = { userId: user.id, role: user.role, name: user.companyName };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5d' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token, 
                role: user.role, 
                name: user.companyName, 
                userId: user.id,
                licenceNumber: user.licenceNumber,
                licenceStatus: user.licenceStatus
            });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});



// @route   GET /api/auth/users-by-role/:role
// @desc    List all users with a given role (for receiver picker in ship flow)
router.get('/users-by-role/:role', auth, async (req, res) => {
    try {
        const { role } = req.params;
        const validRoles = ['Distributor', 'Pharmacy', 'Manufacturer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }
        const users = await User.find({ role })
            .select('_id companyName location role')
            .sort({ companyName: 1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
