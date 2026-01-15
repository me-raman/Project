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
            const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString();
            const productId = `PROD-${batchNumber}-${randomSuffix}`;
            const serialNumber = `SN-${Date.now()}-${i}`;

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
// @desc    Get recent products for the current manufacturer
router.get('/manufacturer/recent', auth, authorize('Manufacturer'), async (req, res) => {
    try {
        const products = await Product.find({ manufacturer: req.user.userId })
            .sort({ createdAt: -1 })
            .limit(10);

        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
