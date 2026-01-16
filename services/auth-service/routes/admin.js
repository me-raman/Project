const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');

// @route   GET /api/auth/admin/users
// @desc    Get all users (Admin only)
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find()
            .select('-password')
            .sort({ role: 1, companyName: 1 });

        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/admin/stats
// @desc    Get system statistics (Admin only)
router.get('/stats', adminAuth, async (req, res) => {
    try {
        // Count users by role
        const userStats = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const totalUsers = await User.countDocuments();

        // Format user stats
        const usersByRole = {};
        userStats.forEach(stat => {
            usersByRole[stat._id] = stat.count;
        });

        res.json({
            totalUsers,
            usersByRole,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/auth/admin/users/:id
// @desc    Update user (Admin only)
router.put('/users/:id', adminAuth, async (req, res) => {
    const { role, companyName, location } = req.body;

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from demoting themselves
        if (user._id.toString() === req.user.userId && role !== 'Admin') {
            return res.status(400).json({ message: 'Cannot change your own admin role' });
        }

        // Update fields
        if (role) user.role = role;
        if (companyName) user.companyName = companyName;
        if (location) user.location = location;

        await user.save();

        res.json({ message: 'User updated successfully', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/auth/admin/users/:id
// @desc    Delete user (Admin only)
router.delete('/users/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
