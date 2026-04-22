const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
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
                licenceStatus: user.licenceStatus,
                createdAt: user.createdAt
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
                licenceStatus: user.licenceStatus,
                createdAt: user.createdAt
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

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset link
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        // Always return the same message to prevent email enumeration
        const successMsg = 'If an account with that email exists, a password reset link has been sent.';

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            // Don't reveal whether the email exists
            return res.json({ message: successMsg });
        }

        // Generate a cryptographically secure reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save hashed token and expiry (1 hour) to user record
        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        // Build the reset URL
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

        // In development (or when SMTP is not configured), log the link to console
        console.log(`\n========== PASSWORD RESET LINK ==========`);
        console.log(`  User:    ${user.email}`);
        console.log(`  Link:    ${resetUrl}`);
        console.log(`  Expires: 1 hour`);
        console.log(`==========================================\n`);

        // If SMTP is configured, also send a real email
        if (process.env.SMTP_HOST) {
            try {
                const nodemailer = require('nodemailer');
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                await transporter.sendMail({
                    from: process.env.SMTP_FROM || '"PharmaTrace" <noreply@pharmatrace.com>',
                    to: user.email,
                    subject: 'PharmaTrace — Password Reset',
                    html: `
                        <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
                            <h2 style="color: #1a1a1a;">Reset your password</h2>
                            <p style="color: #555;">You requested a password reset for your PharmaTrace account.</p>
                            <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">
                                Reset Password
                            </a>
                            <p style="color: #888; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                        </div>
                    `,
                });
                console.log(`[Auth] Password reset email sent to ${user.email}`);
            } catch (emailErr) {
                console.error('[Auth] Failed to send reset email:', emailErr.message);
                // Don't fail the request — the token is still saved and logged to console
            }
        }

        res.json({ message: successMsg });
    } catch (err) {
        console.error('[Forgot Password Error]', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using a valid token
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters' });
        }

        // Hash the incoming token and look up the user
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        // Hash new password and clear the reset fields
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        console.log(`[Auth] Password reset successful for ${user.email}`);
        res.json({ message: 'Password has been reset successfully. You can now sign in.' });
    } catch (err) {
        console.error('[Reset Password Error]', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
