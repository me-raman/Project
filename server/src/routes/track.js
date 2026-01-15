const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { validateTrackingUpdate, handleValidationErrors } = require('../middleware/validate');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const User = require('../models/User');

// @route   POST /api/track/:id
// @desc    Add tracking update
// @access  Private (Distributor, Pharmacy only)
router.post('/:id', auth, authorize('Distributor', 'Pharmacy'), validateTrackingUpdate, handleValidationErrors, async (req, res) => {
    const { status, location, notes } = req.body;
    const productId = req.params.id;
    console.log(`[TRACK DEBUG] Request received for Product ID: ${productId}`);

    try {
        const product = await Product.findOne({ productId });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // BUSINESS RULE: Reject updates if product already received at pharmacy
        if (product.currentStatus === 'Received at Pharmacy') {
            return res.status(400).json({
                message: 'Product has already been received at pharmacy. No further updates allowed.'
            });
        }

        // Prevent Distributors from updating more than once
        if (req.user.role === 'Distributor') {
            const existingUpdate = await Tracking.findOne({
                product: product._id,
                handler: req.user.userId
            });

            if (existingUpdate) {
                return res.status(400).json({
                    message: 'Distributor has already updated tracking for this product. Duplicate updates are not allowed.'
                });
            }
        }

        // Create new tracking event
        const trackingEvent = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: location || (await User.findById(req.user.userId)).location,
            status,
            notes
        });

        await trackingEvent.save();

        // Update product current status
        product.currentStatus = status;
        product.currentLocation = trackingEvent.location;
        product.currentHandler = req.user.userId;
        await product.save();

        res.json(trackingEvent);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
