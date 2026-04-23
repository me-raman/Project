const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const requireCoords = require('../middleware/requireCoords');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const Handoff = require('../models/Handoff');
const User = require('../models/User');
const { checkImpossibleTravel } = require('../utils/geoUtils');

// @route   POST /api/track/ship/:productId
// @desc    Sender initiates shipment (Step 1 of dual-confirmation)
router.post('/ship/:productId', auth, authorize('Manufacturer', 'Distributor', 'Admin'), requireCoords(), async (req, res) => {
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
            'Manufacturer': ['Distributor', 'Pharmacy'],
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
router.post('/confirm/:productId', auth, authorize('Distributor', 'Pharmacy', 'Admin'), requireCoords(), async (req, res) => {
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

// @route   POST /api/track/ship-batch
// @desc    Ship an entire batch to a receiver (single handoff for the whole batch)
router.post('/ship-batch', auth, authorize('Manufacturer', 'Distributor', 'Admin'), requireCoords(), async (req, res) => {
    const { batchNumber, receiverId, notes, latitude, longitude } = req.body;

    try {
        if (!batchNumber || !receiverId) {
            return res.status(400).json({ message: 'batchNumber and receiverId are required.' });
        }

        // Validate receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ message: 'Receiver not found.' });
        }

        // Validate receiver role
        const senderRole = req.user.role;
        const validReceiverRoles = {
            'Manufacturer': ['Distributor', 'Pharmacy'],
            'Distributor': ['Distributor', 'Pharmacy'],
            'Admin': ['Manufacturer', 'Distributor', 'Pharmacy']
        };
        if (!validReceiverRoles[senderRole]?.includes(receiver.role)) {
            return res.status(400).json({
                message: `A ${senderRole} cannot ship to a ${receiver.role}.`
            });
        }

        if (receiverId === req.user.userId) {
            return res.status(400).json({ message: 'Cannot ship to yourself.' });
        }

        // Check if this batch already has a pending shipment
        const existingHandoff = await Handoff.findOne({
            batchNumber,
            status: 'SHIPPED'
        });
        if (existingHandoff) {
            return res.status(400).json({
                message: 'This batch already has a pending shipment. Wait for confirmation or dispute first.'
            });
        }

        // Get all products in this batch
        // Manufacturers query by ownership; Distributors query by current possession
        const productQuery = req.user.role === 'Manufacturer'
            ? { batchNumber, manufacturer: req.user.userId }
            : { batchNumber, currentHandler: req.user.userId, currentStatus: 'In Transit' };
        const products = await Product.find(productQuery);
        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this batch.' });
        }

        const sender = await User.findById(req.user.userId);
        const batchName = products[0].name;

        // Create ONE handoff record for the entire batch
        const handoff = new Handoff({
            batchNumber,
            batchName,
            unitCount: products.length,
            product: products[0]._id, // Reference first product for backward compat
            productId: products[0].productId,
            sender: req.user.userId,
            senderRole: req.user.role,
            receiver: receiverId,
            receiverRole: receiver.role,
            status: 'SHIPPED',
            shippedAt: new Date(),
            senderLatitude: latitude || undefined,
            senderLongitude: longitude || undefined,
            expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000)
        });

        await handoff.save();

        // Update ALL products in the batch (use found product IDs for safety)
        const productIds = products.map(p => p._id);
        await Product.updateMany(
            { _id: { $in: productIds } },
            {
                currentStatus: 'Pending Confirmation',
                currentLocation: `In transit: ${sender?.companyName || 'Unknown'} → ${receiver.companyName}`
            }
        );

        // Create one tracking event per product
        const trackingEvents = products.map(p => ({
            product: p._id,
            handler: req.user.userId,
            location: sender?.location || 'Unknown',
            status: 'Shipped',
            notes: notes || `Batch ${batchNumber} shipped by ${sender?.companyName || 'Unknown'} → ${receiver.companyName}`,
            latitude: latitude || undefined,
            longitude: longitude || undefined
        }));
        await Tracking.insertMany(trackingEvents);

        res.json({
            message: `Batch ${batchNumber} (${products.length} units) shipped to ${receiver.companyName}. Awaiting confirmation.`,
            handoff: {
                id: handoff._id,
                batchNumber,
                batchName,
                unitCount: products.length,
                status: 'SHIPPED',
                receiver: receiver.companyName,
                shippedAt: handoff.shippedAt
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/track/confirm-batch/:batchNumber
// @desc    Receiver confirms receipt of an entire batch
router.post('/confirm-batch/:batchNumber', auth, authorize('Distributor', 'Pharmacy', 'Admin'), requireCoords(), async (req, res) => {
    const { batchNumber } = req.params;
    const { notes, latitude, longitude } = req.body;

    try {
        const handoff = await Handoff.findOne({
            batchNumber,
            status: 'SHIPPED'
        }).populate('sender', 'companyName location');

        if (!handoff) {
            return res.status(404).json({ message: 'No pending shipment found for this batch.' });
        }

        // Only the designated receiver can confirm
        if (handoff.receiver.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Only the designated receiver can confirm this shipment.' });
        }

        const receiver = await User.findById(req.user.userId);
        const isPharmacy = req.user.role === 'Pharmacy';
        const newStatus = isPharmacy ? 'Received at Pharmacy' : 'In Transit';

        // Update handoff
        handoff.status = 'CONFIRMED';
        handoff.confirmedAt = new Date();
        handoff.receiverLatitude = latitude || undefined;
        handoff.receiverLongitude = longitude || undefined;
        await handoff.save();

        // Get all products in the batch and update them
        const products = await Product.find({ batchNumber });

        await Product.updateMany(
            { batchNumber },
            {
                currentStatus: newStatus,
                currentLocation: receiver?.location || 'Unknown',
                currentHandler: req.user.userId
            }
        );

        // Create tracking events for all products
        const trackingEvents = products.map(p => ({
            product: p._id,
            handler: req.user.userId,
            location: receiver?.location || 'Unknown',
            status: newStatus,
            notes: notes || `Batch ${batchNumber} confirmed by ${receiver?.companyName || 'Unknown'}`,
            latitude: latitude || undefined,
            longitude: longitude || undefined
        }));
        await Tracking.insertMany(trackingEvents);

        res.json({
            message: `Batch ${batchNumber} (${products.length} units) confirmed. Status: ${newStatus}`,
            handoff: {
                id: handoff._id,
                batchNumber,
                status: 'CONFIRMED',
                confirmedAt: handoff.confirmedAt
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/track/dispute-batch/:batchNumber
// @desc    Receiver disputes an entire batch shipment
router.post('/dispute-batch/:batchNumber', auth, authorize('Distributor', 'Pharmacy', 'Admin'), async (req, res) => {
    const { batchNumber } = req.params;
    const { reason, latitude, longitude } = req.body;

    try {
        const handoff = await Handoff.findOne({
            batchNumber,
            status: 'SHIPPED'
        }).populate('sender', 'companyName');

        if (!handoff) {
            return res.status(404).json({ message: 'No pending shipment found for this batch.' });
        }

        if (!reason) {
            return res.status(400).json({ message: 'Dispute reason is required.' });
        }

        const receiver = await User.findById(req.user.userId);

        // Update handoff
        handoff.status = 'DISPUTED';
        handoff.disputeReason = reason;
        handoff.disputedAt = new Date();
        handoff.receiverLatitude = latitude || undefined;
        handoff.receiverLongitude = longitude || undefined;
        await handoff.save();

        // Update all products in batch
        const products = await Product.find({ batchNumber });
        await Product.updateMany(
            { batchNumber },
            { currentStatus: 'Handoff Disputed' }
        );

        // Create tracking events
        const trackingEvents = products.map(p => ({
            product: p._id,
            handler: req.user.userId,
            location: receiver?.location || 'Unknown',
            status: 'Handoff Disputed',
            notes: `Batch ${batchNumber} DISPUTED by ${receiver?.companyName || 'Unknown'}: ${reason}`,
            latitude: latitude || undefined,
            longitude: longitude || undefined,
            geoVerified: false
        }));
        await Tracking.insertMany(trackingEvents);

        res.json({
            message: `Batch ${batchNumber} disputed.`,
            handoff: {
                id: handoff._id,
                batchNumber,
                status: 'DISPUTED',
                disputeReason: reason
            }
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

// @route   GET /api/track/my-inventory
// @desc    Get batches the distributor currently holds (received but not yet shipped onward)
router.get('/my-inventory', auth, authorize('Distributor'), async (req, res) => {
    try {
        // Step 1: Batches I received (confirmed handoffs where I am receiver)
        const received = await Handoff.find({
            receiver: req.user.userId,
            status: 'CONFIRMED'
        })
            .populate('sender', 'companyName location role')
            .populate('product', 'name productId batchNumber')
            .sort({ confirmedAt: -1 });

        // Step 2: Batches I already shipped onward (as sender)
        const forwarded = await Handoff.find({
            sender: req.user.userId,
            status: { $in: ['SHIPPED', 'CONFIRMED'] }
        });
        const forwardedBatches = new Set(forwarded.map(h => h.batchNumber));

        // Step 3: Inventory = received - forwarded
        const inventory = received.filter(h => !forwardedBatches.has(h.batchNumber));

        res.json({
            totalInventory: inventory.length,
            inventory
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/track/my-activity
// @desc    Get batch-level activity history for the current user (as sender or receiver)
router.get('/my-activity', auth, async (req, res) => {
    try {
        const userId = req.user.userId;

        // All handoffs where user was sender or receiver, regardless of status
        const activity = await Handoff.find({
            $or: [
                { sender: userId },
                { receiver: userId }
            ]
        })
            .populate('sender', 'companyName location role')
            .populate('receiver', 'companyName location role')
            .sort({ shippedAt: -1 })
            .limit(20);

        // Enrich each handoff with the user's role in it
        const enriched = activity.map(h => {
            const obj = h.toObject();
            obj.userRole = h.sender?._id?.toString() === userId ? 'sender' : 'receiver';
            return obj;
        });

        res.json(enriched);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

