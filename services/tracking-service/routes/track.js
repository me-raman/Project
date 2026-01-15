const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const User = require('../models/User');

// @route   POST /api/track/:id
// @desc    Add tracking update (Distributor, Pharmacy only)
router.post('/:id', auth, authorize('Distributor', 'Pharmacy'), async (req, res) => {
    const { status, location, notes } = req.body;
    const productId = req.params.id;

    try {
        const product = await Product.findOne({ productId });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Business rule: Reject if already received at pharmacy
        if (product.currentStatus === 'Received at Pharmacy') {
            return res.status(400).json({
                message: 'Product has already been received at pharmacy. No further updates allowed.'
            });
        }

        // Prevent distributors from updating more than once
        if (req.user.role === 'Distributor') {
            const existingUpdate = await Tracking.findOne({
                product: product._id,
                handler: req.user.userId
            });

            if (existingUpdate) {
                return res.status(400).json({
                    message: 'Distributor has already updated tracking for this product.'
                });
            }
        }

        const user = await User.findById(req.user.userId);
        const trackingLocation = location || user?.location || 'Unknown';

        // Create new tracking event
        const trackingEvent = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: trackingLocation,
            status,
            notes
        });

        await trackingEvent.save();

        // Update product current status
        product.currentStatus = status;
        product.currentLocation = trackingLocation;
        product.currentHandler = req.user.userId;
        await product.save();

        res.json(trackingEvent);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/track/:id
// @desc    Get tracking history for a product
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.id });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const history = await Tracking.find({ product: product._id })
            .populate('handler', 'companyName')
            .sort({ timestamp: -1 });

        res.json({ productId: req.params.id, history });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
