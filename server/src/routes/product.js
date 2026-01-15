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
// @access  Private
router.post('/', auth, authorize('Manufacturer'), async (req, res) => {
    const { productId, name, batchNumber, serialNumber, mfgDate, expDate } = req.body;

    try {
        const newProduct = new Product({
            productId,
            name,
            manufacturer: req.user.userId,
            batchNumber,
            serialNumber,
            mfgDate,
            expDate,
            currentHandler: req.user.userId,
            currentLocation: (await User.findById(req.user.userId)).location
        });

        // Check if product with this ID already exists
        const existingProduct = await Product.findOne({ productId });
        if (existingProduct) {
            return res.status(400).json({ message: 'Product ID already exists' });
        }

        const product = await newProduct.save();

        // Create initial tracking event
        const initialTrack = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: newProduct.currentLocation,
            status: 'Manufactured',
            notes: 'Product created and registered in the system.'
        });

        await initialTrack.save();

        res.json(product);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/product/:id
// @desc    Get product by Product ID (e.g., PROD-123)
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findOne({
            productId: { $regex: new RegExp(`^${req.params.id}$`, 'i') }
        }).populate('manufacturer', 'companyName location');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get tracking history
        const history = await Tracking.find({ product: product._id })
            .populate('handler', 'companyName')
            .sort({ timestamp: -1 });

        res.json({ product, history });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});
const { validateBatch, handleValidationErrors } = require('../middleware/validate');

// @route   POST /api/product/batch
// @desc    Create multiple products (Batch Generation) - Manufacturer only
// @access  Private
router.post('/batch', auth, authorize('Manufacturer'), validateBatch, handleValidationErrors, async (req, res) => {
    const { name, batchNumber, mfgDate, expDate, count } = req.body;
    const quantity = parseInt(count) || 1;

    try {
        const products = [];
        const trackings = [];
        const manufacturer = await User.findById(req.user.userId);
        const location = manufacturer.location || 'Unknown Location';

        console.log(`[DEBUG] Checking duplicate for: Mfg: ${req.user.userId}, Name: '${name}', Batch: '${batchNumber}'`);

        // Check if batch already exists for this product name and manufacturer
        const existingBatch = await Product.findOne({
            manufacturer: req.user.userId,
            name: name,
            batchNumber: batchNumber
        });

        console.log(`[DEBUG] Existing Batch Found:`, existingBatch ? 'YES' : 'NO');

        if (existingBatch) {
            return res.status(400).json({
                message: `Batch '${batchNumber}' for product '${name}' already exists. Cannot generate duplicate bar codes.`
            });
        }

        for (let i = 0; i < quantity; i++) {
            // Generate unique Unit ID: PROD-{BATCH}-{RANDOM}
            // Use timestamp + random for high collision resistance in simple setup
            const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
            const productId = `PROD-${batchNumber}-${randomSuffix}`;
            const serialNumber = `SN-${Date.now()}-${i}`;

            // Create plain objects for insertMany, NOT Mongoose Documents
            // This avoids validation errors where required fields are checked before insertion
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
                _id: new mongoose.Types.ObjectId() // Generate ID manually to link tracking
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

        // Validate uniqueness before insert or rely on DB unique index to throw (might fail batch)
        // For simplicity in this project, we assume random collision is rare enough or we catch error.

        const savedProducts = await Product.insertMany(products);

        // Update trackings with actual saved IDs if needed, but they are already linked
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

module.exports = router;
