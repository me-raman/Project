const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const User = require('../models/User');

// @route   POST /api/product
// @desc    Create a new product (Manufacturer only)
router.post('/', auth, authorize('Manufacturer'), async (req, res) => {
    const { productId, name, batchNumber, serialNumber, mfgDate, expDate } = req.body;

    try {
        const existingProduct = await Product.findOne({ productId });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product ID already exists' });
        }

        const manufacturer = await User.findById(req.user.userId);
        const location = manufacturer?.location || 'Unknown';

        const newProduct = new Product({
            productId,
            name,
            manufacturer: req.user.userId,
            batchNumber,
            serialNumber,
            mfgDate,
            expDate,
            currentHandler: req.user.userId,
            currentLocation: location
        });

        const product = await newProduct.save();

        // Create initial tracking event
        const initialTrack = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: location,
            status: 'Manufactured',
            notes: 'Product created and registered in the system.'
        });

        await initialTrack.save();

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/batches
// @desc    Get all batches (Admin only) grouped by batchNumber
router.get('/admin/batches', auth, authorize('Admin'), async (req, res) => {
    try {
        const batches = await Product.aggregate([
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$batchNumber',
                    name: { $first: '$name' },
                    batchNumber: { $first: '$batchNumber' },
                    manufacturer: { $first: '$manufacturer' },
                    currentStatus: { $first: '$currentStatus' },
                    createdAt: { $first: '$createdAt' },
                    unitCount: { $sum: 1 }
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'manufacturer',
                    foreignField: '_id',
                    as: 'manufacturerInfo'
                }
            },
            {
                $addFields: {
                    manufacturerName: { $arrayElemAt: ['$manufacturerInfo.companyName', 0] }
                }
            },
            { $project: { manufacturerInfo: 0 } }
        ]);

        res.json(batches);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/stats
// @desc    Get product statistics (Admin only)
router.get('/admin/stats', auth, authorize('Admin'), async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments();
        const statusCounts = await Product.aggregate([
            { $group: { _id: '$currentStatus', count: { $sum: 1 } } }
        ]);

        const byStatus = {};
        statusCounts.forEach(s => { byStatus[s._id] = s.count; });

        const totalBatches = await Product.distinct('batchNumber');

        res.json({
            totalProducts,
            totalBatches: totalBatches.length,
            byStatus
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/batch/:batchNumber
// @desc    Get all units in a specific batch (Admin only)
router.get('/admin/batch/:batchNumber', auth, authorize('Admin'), async (req, res) => {
    try {
        const products = await Product.find({ batchNumber: req.params.batchNumber })
            .populate('manufacturer', 'companyName location')
            .sort({ createdAt: -1 });

        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/:id
// @desc    Get product by Product ID (Public)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            productId: { $regex: new RegExp(`^${req.params.id}$`, 'i') }
        }).populate('manufacturer', 'companyName location');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const history = await Tracking.find({ product: product._id })
            .populate('handler', 'companyName')
            .sort({ timestamp: -1 });

        res.json({ product, history });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/product/batch
// @desc    Create multiple products (Batch Generation) - Manufacturer only
router.post('/batch', auth, authorize('Manufacturer'), async (req, res) => {
    const { name, batchNumber, mfgDate, expDate, count } = req.body;
    const quantity = parseInt(count) || 1;

    // Validate expiry date is after manufacture date
    if (mfgDate && expDate && new Date(expDate) <= new Date(mfgDate)) {
        return res.status(400).json({ message: 'Expiry date must be after the manufacturing date' });
    }

    try {
        const manufacturer = await User.findById(req.user.userId);
        const location = manufacturer?.location || 'Unknown Location';

        // Check if batch already exists
        const existingBatch = await Product.findOne({
            manufacturer: req.user.userId,
            name: name,
            batchNumber: batchNumber
        });

        if (existingBatch) {
            return res.status(400).json({
                message: `Batch '${batchNumber}' for product '${name}' already exists.`
            });
        }

        const products = [];
        const trackings = [];

        for (let i = 0; i < quantity; i++) {
            // Use timestamp + counter for guaranteed uniqueness
            const timestamp = Date.now();
            const productId = `PROD-${batchNumber}-${timestamp}-${i}`;
            const serialNumber = `SN-${timestamp}-${i}`;

            const newProduct = {
                productId,
                name,
                manufacturer: req.user.userId,
                batchNumber,
                serialNumber,
                mfgDate,
                expDate,
                currentHandler: req.user.userId,
                currentLocation: location,
                _id: new mongoose.Types.ObjectId()
            };

            products.push(newProduct);

            trackings.push({
                product: newProduct._id,
                handler: req.user.userId,
                location: location,
                status: 'Manufactured',
                notes: 'Unit created in batch.'
            });
        }

        const savedProducts = await Product.insertMany(products);
        await Tracking.insertMany(trackings);

        res.json({
            message: `Successfully generated ${quantity} units`,
            products: savedProducts.map(p => ({ productId: p.productId, batchNumber: p.batchNumber }))
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error: ' + err.message });
    }
});

// @route   GET /api/product/manufacturer/recent
// @desc    Get recent batches for the current manufacturer (grouped by batchNumber)
router.get('/manufacturer/recent', auth, authorize('Manufacturer'), async (req, res) => {
    try {
        const manufacturerId = new mongoose.Types.ObjectId(req.user.userId);
        const batches = await Product.aggregate([
            { $match: { manufacturer: manufacturerId } },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: '$batchNumber',
                    name: { $first: '$name' },
                    batchNumber: { $first: '$batchNumber' },
                    currentStatus: { $first: '$currentStatus' },
                    createdAt: { $first: '$createdAt' },
                    unitCount: { $sum: 1 }
                }
            },
            { $sort: { createdAt: -1 } },
            { $limit: 10 }
        ]);

        res.json(batches);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
