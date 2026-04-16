const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const Handoff = require('../models/Handoff');
const User = require('../models/User');
const { checkImpossibleTravel } = require('../utils/geoUtils');

// @route   POST /api/track/ship/:productId
// @desc    Sender initiates shipment (Step 1 of dual-confirmation)
router.post('/ship/:productId', auth, authorize('Manufacturer', 'Distributor', 'Admin'), async (req, res) => {
    const { productId } = req.params;
    const { receiverId, notes, latitude, longitude } = req.body;

    try {
        // Receiver is REQUIRED for dual-confirmation
        if (!receiverId) {
            return res.status(400).json({
                message: 'receiverId is required. You must specify who you are shipping to.'
            });
        }

        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found.' });
        }

        // Validate receiver role makes sense in supply chain
        const senderRole = req.user.role;
        const validReceiverRoles = {
            'Manufacturer': ['Distributor'],
            'Distributor': ['Distributor', 'Pharmacy'],
            'Admin': ['Manufacturer', 'Distributor', 'Pharmacy']
        };
        if (!validReceiverRoles[senderRole]?.includes(receiver.role)) {
            return res.status(400).json({
                message: `A ${senderRole} cannot ship to a ${receiver.role}. Valid receivers: ${validReceiverRoles[senderRole]?.join(', ')}`
            });
        }

        // Cannot ship to yourself
        if (receiverId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot ship to yourself.' });
        }

        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if there's already a pending handoff for this product
        const pendingHandoff = await Handoff.findOne({
            productId,
            status: 'SHIPPED'
        });
        if (pendingHandoff) {
            return res.status(400).json({
                message: 'This product already has a pending shipment. Wait for confirmation or dispute first.'
            });
        }

        // Check if product is in a state that allows shipping
        if (product.currentStatus === 'Received at Pharmacy') {
            return res.status(400).json({
                message: 'Product has already been received at pharmacy. Cannot ship again.'
            });
        }

        if (product.isRecalled) {
            return res.status(400).json({ message: 'Cannot ship a recalled product.' });
        }

        const sender = await User.findById(req.user.userId);

        // Create handoff record with designated receiver
        const handoff = new Handoff({
            product: product._id,
            productId: product.productId,
            sender: req.user.userId,
            senderRole: req.user.role,
            receiver: receiverId,
            receiverRole: receiver.role,
            status: 'SHIPPED',
            shippedAt: new Date(),
            senderLatitude: latitude || undefined,
            senderLongitude: longitude || undefined,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) // 72 hours
        });

        await handoff.save();

        // Create tracking event
        const trackingEvent = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: sender?.location || 'Unknown',
            status: 'Shipped',
            notes: notes || `Shipped by ${sender?.companyName || 'Unknown'} → ${receiver.companyName}. Awaiting confirmation.`,
            latitude: latitude || undefined,
            longitude: longitude || undefined
        });
        await trackingEvent.save();

        // Update product status
        product.currentStatus = 'Pending Confirmation';
        product.currentLocation = `In transit: ${sender?.companyName || 'Unknown'} → ${receiver.companyName}`;
        await product.save();

        res.json({
            message: `Shipment initiated to ${receiver.companyName}. Awaiting their confirmation.`,
            handoff: {
                id: handoff._id,
                productId: handoff.productId,
                status: handoff.status,
                receiver: receiver.companyName,
                shippedAt: handoff.shippedAt,
                expiresAt: handoff.expiresAt
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


// @route   POST /api/track/confirm/:productId
// @desc    Receiver confirms receipt (Step 2 of dual-confirmation)
router.post('/confirm/:productId', auth, authorize('Distributor', 'Pharmacy', 'Admin'), async (req, res) => {
    const { productId } = req.params;
    const { notes, latitude, longitude } = req.body;

    try {
        // Find the pending handoff
        const handoff = await Handoff.findOne({
            productId,
            status: 'SHIPPED'
        }).populate('sender', 'companyName location');

        if (!handoff) {
            return res.status(404).json({
                message: 'No pending shipment found for this product.'
            });
        }

        // Prevent sender from confirming their own shipment
        if (handoff.sender._id.toString() === req.user.userId) {
            return res.status(400).json({
                message: 'Sender cannot confirm their own shipment. A different party must confirm.'
            });
        }

        // Only the designated receiver can confirm
        if (handoff.receiver && handoff.receiver.toString() !== req.user.userId) {
            return res.status(403).json({
                message: 'Only the designated receiver can confirm this shipment.'
            });
        }

        const receiver = await User.findById(req.user.userId);
        const product = await Product.findOne({ productId });

        // Impossible travel check between ship and confirm locations
        let geoVerified = true;
        if (latitude && longitude && handoff.senderLatitude && handoff.senderLongitude) {
            const travelCheck = checkImpossibleTravel(
                { latitude: handoff.senderLatitude, longitude: handoff.senderLongitude, timestamp: handoff.shippedAt },
                { latitude, longitude, timestamp: new Date() }
            );
            if (travelCheck.impossible) {
                geoVerified = false;
                console.log(`[GEO ANOMALY] Handoff for ${productId}: ${travelCheck.distance}km at ${travelCheck.speed}km/h`);
            }
        }

        // Update handoff
        handoff.status = 'CONFIRMED';
        handoff.confirmedAt = new Date();
        handoff.receiverLatitude = latitude || undefined;
        handoff.receiverLongitude = longitude || undefined;
        await handoff.save();

        // Create tracking event
        const isPharmacy = req.user.role === 'Pharmacy';
        const newStatus = isPharmacy ? 'Received at Pharmacy' : 'In Transit';

        const trackingEvent = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: receiver?.location || 'Unknown',
            status: newStatus,
            notes: notes || `Confirmed receipt by ${receiver?.companyName || 'Unknown'}`,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            geoVerified
        });
        await trackingEvent.save();

        // Update product
        product.currentStatus = newStatus;
        product.currentLocation = receiver?.location || 'Unknown';
        product.currentHandler = req.user.userId;
        await product.save();

        res.json({
            message: `Receipt confirmed. Product status: ${newStatus}`,
            handoff: {
                id: handoff._id,
                productId: handoff.productId,
                status: 'CONFIRMED',
                sender: handoff.sender.companyName,
                confirmedAt: handoff.confirmedAt,
                geoVerified
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/track/dispute/:productId
// @desc    Receiver disputes a shipment (wrong product, damaged, suspicious)
router.post('/dispute/:productId', auth, authorize('Distributor', 'Pharmacy', 'Admin'), async (req, res) => {
    const { productId } = req.params;
    const { reason, notes, latitude, longitude } = req.body;

    try {
        const handoff = await Handoff.findOne({
            productId,
            status: 'SHIPPED'
        }).populate('sender', 'companyName');

        if (!handoff) {
            return res.status(404).json({
                message: 'No pending shipment found for this product to dispute.'
            });
        }

        if (!reason) {
            return res.status(400).json({ message: 'Dispute reason is required.' });
        }

        const receiver = await User.findById(req.user.userId);
        const product = await Product.findOne({ productId });

        // Update handoff status
        handoff.status = 'DISPUTED';
        handoff.disputeReason = reason;
        handoff.disputedAt = new Date();
        handoff.receiver = req.user.userId;
        handoff.receiverRole = req.user.role;
        handoff.receiverLatitude = latitude || undefined;
        handoff.receiverLongitude = longitude || undefined;
        await handoff.save();

        // Create tracking event
        const trackingEvent = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: receiver?.location || 'Unknown',
            status: 'Handoff Disputed',
            notes: `DISPUTED by ${receiver?.companyName || 'Unknown'}: ${reason}`,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            geoVerified: false // Disputed handoffs are flagged
        });
        await trackingEvent.save();

        // Update product status
        product.currentStatus = 'Handoff Disputed';
        await product.save();

        res.json({
            message: `Shipment disputed. Sender: ${handoff.sender.companyName}`,
            handoff: {
                id: handoff._id,
                productId: handoff.productId,
                status: 'DISPUTED',
                sender: handoff.sender.companyName,
                disputeReason: reason,
                disputedAt: handoff.disputedAt
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/track/pending
// @desc    Get pending handoffs designated for the current user
router.get('/pending', auth, async (req, res) => {
    try {
        // Only show handoffs where the current user is the designated receiver
        const pendingHandoffs = await Handoff.find({
            receiver: req.user.userId,
            status: 'SHIPPED'
        })
            .populate('sender', 'companyName location role')
            .populate('product', 'name productId batchNumber')
            .sort({ shippedAt: -1 });

        res.json({
            totalPending: pendingHandoffs.length,
            handoffs: pendingHandoffs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/track/handoff-history/:productId
// @desc    Full handoff chain for a product
router.get('/handoff-history/:productId', auth, async (req, res) => {
    try {
        const handoffs = await Handoff.find({ productId: req.params.productId })
            .populate('sender', 'companyName location role')
            .populate('receiver', 'companyName location role')
            .sort({ shippedAt: 1 }); // Chronological order

        res.json({
            productId: req.params.productId,
            totalHandoffs: handoffs.length,
            handoffs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
