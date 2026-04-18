const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const { checkImpossibleTravel } = require('../utils/geoUtils');

// @route   GET /api/track/user/history
// @desc    Get tracking history for the current user
router.get('/user/history', auth, async (req, res) => {
    try {
        const history = await Tracking.find({ handler: req.user.userId })
            .populate('product', 'name productId batchNumber')
            .sort({ timestamp: -1 })
            .limit(10);

        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/track/:id
// @desc    Add tracking update (Admin, Distributor, Pharmacy only)
router.post('/:id', auth, authorize('Admin', 'Distributor', 'Pharmacy'), async (req, res) => {
    const { status, location, notes, latitude, longitude } = req.body;
    const productId = req.params.id;

    try {
        const product = await Product.findOne({ productId });

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Business rule: Reject if already received at pharmacy (unless Admin)
        if (product.currentStatus === 'Received at Pharmacy' && req.user.role !== 'Admin') {
            return res.status(400).json({
                message: 'Product has already been received at pharmacy. No further updates allowed.'
            });
        }

        // Prevent distributors from updating more than once (Admin bypasses this)
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

        // Geolocation: Check for impossible travel
        let geoVerified = true;
        if (latitude && longitude) {
            const lastEvent = await Tracking.findOne({ product: product._id })
                .sort({ timestamp: -1 });

            if (lastEvent && lastEvent.latitude && lastEvent.longitude) {
                const travelCheck = checkImpossibleTravel(
                    { latitude: lastEvent.latitude, longitude: lastEvent.longitude, timestamp: lastEvent.timestamp },
                    { latitude, longitude, timestamp: new Date() }
                );

                if (travelCheck.impossible) {
                    geoVerified = false;
                    console.log(`[GEO ANOMALY] Product ${productId}: ${travelCheck.distance}km in ${travelCheck.speed}km/h`);
                }
            }
        }

        // Create new tracking event
        const trackingEvent = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: trackingLocation,
            status,
            notes,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            geoVerified
        });

        await trackingEvent.save();

        // Update product current status
        product.currentStatus = status;
        product.currentLocation = trackingLocation;
        product.currentHandler = req.user.userId;
        await product.save();

        res.json({ ...trackingEvent.toObject(), geoVerified });
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
