const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const requireCoords = require('../middleware/requireCoords');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { signProductId, verifySignedPayload } = require('../utils/qrSecurity');
const { calculateDistance } = require('../utils/geoUtils');

// @route   POST /api/product
// @desc    Create a new product (Manufacturer only)
router.post('/', auth, authorize('Manufacturer'), requireCoords(), async (req, res) => {
    const { productId, name, batchNumber, serialNumber, mfgDate, expDate, latitude, longitude } = req.body;

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
            currentLocation: location,
            manufacturerLatitude: latitude || undefined,
            manufacturerLongitude: longitude || undefined,
            manufacturerGeoTimestamp: (latitude && longitude) ? new Date() : undefined
        });

        const product = await newProduct.save();

        // Create initial tracking event
        const initialTrack = new Tracking({
            product: product._id,
            handler: req.user.userId,
            location: location,
            status: 'Manufactured',
            notes: 'Product created and registered in the system.',
            latitude: latitude || undefined,
            longitude: longitude || undefined
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
router.post('/batch', auth, authorize('Manufacturer'), requireCoords(), async (req, res) => {
    const { name, batchNumber, mfgDate, expDate, count, latitude, longitude } = req.body;
    const quantity = parseInt(count) || 1;

    // Validate expiry date is after manufacture date
    if (mfgDate && expDate && new Date(expDate) <= new Date(mfgDate)) {
        return res.status(400).json({ message: 'Expiry date must be after the manufacturing date' });
    }

    try {
        const manufacturer = await User.findById(req.user.userId);
        const location = manufacturer?.location || 'Unknown Location';
        const geoTimestamp = (latitude && longitude) ? new Date() : undefined;

        // QUANTITY LOCK: Check if batch already exists and is locked
        const existingBatch = await Product.findOne({
            manufacturer: req.user.userId,
            name: name,
            batchNumber: batchNumber
        });

        if (existingBatch) {
            if (existingBatch.quantityLocked) {
                // Log the attempt
                await AuditLog.create({
                    entityType: 'Batch',
                    entityId: batchNumber,
                    action: 'QUANTITY_LOCK_ENFORCED',
                    actor: req.user.userId,
                    actorRole: req.user.role,
                    metadata: { attemptedQuantity: quantity },
                    severity: 'warning'
                });
                return res.status(400).json({
                    message: `Batch '${batchNumber}' quantity is LOCKED at ${existingBatch.declaredQuantity} units. Cannot generate more.`
                });
            }
            return res.status(400).json({
                message: `Batch '${batchNumber}' for product '${name}' already exists.`
            });
        }

        // RANDOM AUDIT: 5% chance of flagging batch for audit
        const shouldAudit = Math.random() < 0.05;
        const auditStatus = shouldAudit ? 'PENDING_AUDIT' : 'CLEAR';
        const auditFlaggedAt = shouldAudit ? new Date() : undefined;

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
                manufacturerLatitude: latitude || undefined,
                manufacturerLongitude: longitude || undefined,
                manufacturerGeoTimestamp: geoTimestamp,
                // Quantity lock fields
                declaredQuantity: quantity,
                quantityLocked: true,
                // Audit fields
                auditStatus,
                auditFlaggedAt,
                _id: new mongoose.Types.ObjectId()
            };

            products.push(newProduct);

            trackings.push({
                product: newProduct._id,
                handler: req.user.userId,
                location: location,
                status: 'Manufactured',
                notes: 'Unit created in batch.',
                latitude: latitude || undefined,
                longitude: longitude || undefined
            });
        }

        const savedProducts = await Product.insertMany(products);
        await Tracking.insertMany(trackings);

        // AUDIT LOG: Record batch creation
        await AuditLog.create({
            entityType: 'Batch',
            entityId: batchNumber,
            action: 'BATCH_CREATED',
            actor: req.user.userId,
            actorRole: req.user.role,
            newValue: {
                name,
                batchNumber,
                declaredQuantity: quantity,
                auditStatus,
                mfgDate,
                expDate
            },
            metadata: { latitude, longitude },
            severity: 'info'
        });

        // If audit flagged, also log that
        if (shouldAudit) {
            await AuditLog.create({
                entityType: 'Batch',
                entityId: batchNumber,
                action: 'AUDIT_FLAGGED',
                actor: null,
                actorRole: 'System',
                newValue: { reason: 'Random audit selection (5% probability)' },
                severity: 'warning'
            });
            console.log(`[Audit] Batch ${batchNumber} flagged for random audit`);
        }

        res.json({
            message: `Successfully generated ${quantity} units`,
            auditStatus,
            quantityLocked: true,
            declaredQuantity: quantity,
            products: savedProducts.map(p => ({
                productId: p.productId,
                batchNumber: p.batchNumber,
                qrPayload: signProductId(p.productId)
            }))
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

// @route   POST /api/product/verify/:id
// @desc    Verify a product (scan-count lock + signature check + geo-anomaly + audit check)
router.post('/verify/:id', async (req, res) => {
    const rawPayload = req.params.id;
    const { userId, role, latitude, longitude } = req.body;

    try {
        // Step 1: Check if this is a signed QR payload
        const sigCheck = verifySignedPayload(decodeURIComponent(rawPayload));
        let productId;
        let signatureValid = null;

        if (sigCheck.isPlainId) {
            // Plain product ID entered manually — allow but note no signature
            productId = decodeURIComponent(rawPayload);
            signatureValid = null; // Not applicable
        } else {
            productId = sigCheck.productId;
            signatureValid = sigCheck.valid;

            if (!sigCheck.valid) {
                return res.status(400).json({
                    message: 'Invalid QR code signature. This QR code may be tampered or counterfeit.',
                    warning: 'INVALID_SIGNATURE'
                });
            }
        }

        // Step 2: Find the product
        const product = await Product.findOne({
            productId: { $regex: new RegExp(`^${productId}$`, 'i') }
        }).populate('manufacturer', 'companyName location');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Step 2.5: AUDIT CHECK — Block consumer verification if pending audit
        if (product.auditStatus === 'PENDING_AUDIT') {
            return res.status(403).json({
                message: 'This product is currently under audit review and cannot be verified.',
                warning: 'PENDING_AUDIT',
                auditStatus: product.auditStatus
            });
        }

        // Step 2.6: AUDIT FAILED — warn consumer
        if (product.auditStatus === 'AUDIT_FAILED') {
            return res.status(400).json({
                message: 'This product batch has FAILED an audit. Do not consume this product.',
                warning: 'AUDIT_FAILED',
                auditStatus: product.auditStatus
            });
        }

        // Step 3: Check recall status
        if (product.isRecalled) {
            const history = await Tracking.find({ product: product._id })
                .populate('handler', 'companyName')
                .sort({ timestamp: -1 });

            return res.json({
                product,
                history,
                warning: 'PRODUCT_RECALLED',
                message: `This product has been recalled: ${product.recallReason || 'No reason provided'}`
            });
        }

        // Step 4: Increment scan count
        product.scanCount = (product.scanCount || 0) + 1;

        // Step 5: Check lock status
        let warning = null;
        const scannerIdentity = userId || req.ip || 'anonymous';
        const isSupplyChainRole = role && ['Manufacturer', 'Distributor', 'Admin'].includes(role);

        if (product.isLocked && !isSupplyChainRole) {
            // Product already locked by someone else
            if (product.lockedBy !== scannerIdentity) {
                warning = 'POTENTIAL_COUNTERFEIT';
            }
        } else if (!product.isLocked && !isSupplyChainRole) {
            // First consumer scan — lock it
            product.isLocked = true;
            product.lockedBy = scannerIdentity;
            product.lockedAt = new Date();
        }

        // Step 5.5: CONSUMER SCAN GEO-ANOMALY DETECTION
        let geoAnomalyWarning = null;
        if (latitude && longitude && !isSupplyChainRole) {
            // Check 1: Distance from pharmacy (product should be AT the pharmacy)
            const pharmacyEvent = await Tracking.findOne({
                product: product._id,
                status: 'Received at Pharmacy'
            }).populate('handler', 'registeredLatitude registeredLongitude');

            if (pharmacyEvent && pharmacyEvent.latitude && pharmacyEvent.longitude) {
                const distFromPharmacy = calculateDistance(
                    latitude, longitude,
                    pharmacyEvent.latitude, pharmacyEvent.longitude
                );
                if (distFromPharmacy > 50) { // >50 km from pharmacy
                    geoAnomalyWarning = 'GEO_CLONE_DETECTED';
                    product.geoAnomalyCount = (product.geoAnomalyCount || 0) + 1;
                    console.log(`[GEO ANOMALY] Consumer scan ${distFromPharmacy}km from pharmacy for ${productId}`);
                }
            }

            // Check 2: Previous consumer scan from different city
            if (product.lastScanLatitude && product.lastScanLongitude) {
                const distFromLastScan = calculateDistance(
                    latitude, longitude,
                    product.lastScanLatitude, product.lastScanLongitude
                );
                if (distFromLastScan > 50) { // Two consumer scans >50km apart
                    geoAnomalyWarning = 'GEO_CLONE_DETECTED';
                    product.geoAnomalyCount = (product.geoAnomalyCount || 0) + 1;
                    console.log(`[GEO ANOMALY] Consumer scans ${distFromLastScan}km apart for ${productId}`);
                }
            }

            // Update last scan location
            product.lastScanLatitude = latitude;
            product.lastScanLongitude = longitude;
            product.lastScanTimestamp = new Date();

            // Log geo anomaly if detected
            if (geoAnomalyWarning) {
                await AuditLog.create({
                    entityType: 'Product',
                    entityId: productId,
                    action: 'GEO_ANOMALY_DETECTED',
                    newValue: { latitude, longitude, scannerIdentity },
                    previousValue: {
                        lastScanLatitude: product.lastScanLatitude,
                        lastScanLongitude: product.lastScanLongitude
                    },
                    severity: 'critical'
                });
            }
        }

        // Use the most severe warning
        if (geoAnomalyWarning && !warning) {
            warning = geoAnomalyWarning;
        } else if (geoAnomalyWarning && warning === 'POTENTIAL_COUNTERFEIT') {
            warning = 'GEO_CLONE_DETECTED'; // Geo clone is more specific
        }

        await product.save();

        // Step 6: Get tracking history
        const history = await Tracking.find({ product: product._id })
            .populate('handler', 'companyName')
            .sort({ timestamp: -1 });

        res.json({
            product,
            history,
            signatureValid,
            warning,
            scanCount: product.scanCount,
            geoAnomalyCount: product.geoAnomalyCount,
            auditStatus: product.auditStatus
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/product/admin/recall
// @desc    Recall all products in a batch (Admin only)
router.post('/admin/recall', auth, authorize('Admin'), async (req, res) => {
    const { batchNumber, reason } = req.body;

    if (!batchNumber) {
        return res.status(400).json({ message: 'Batch number is required' });
    }

    try {
        const products = await Product.find({ batchNumber });

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products found for this batch' });
        }

        // Update all products in the batch
        await Product.updateMany(
            { batchNumber },
            {
                isRecalled: true,
                recallReason: reason || 'No reason provided',
                recalledAt: new Date(),
                recalledBy: req.user.userId,
                currentStatus: 'Recalled'
            }
        );

        // Create tracking events for each
        const trackingEvents = products.map(p => ({
            product: p._id,
            handler: req.user.userId,
            location: 'System',
            status: 'Recalled',
            notes: `Batch recalled: ${reason || 'No reason provided'}`
        }));

        await Tracking.insertMany(trackingEvents);

        // AUDIT LOG: Record recall
        await AuditLog.create({
            entityType: 'Batch',
            entityId: batchNumber,
            action: 'RECALLED',
            actor: req.user.userId,
            actorRole: req.user.role,
            newValue: { reason: reason || 'No reason provided', recalledCount: products.length },
            severity: 'critical'
        });

        res.json({
            message: `Successfully recalled ${products.length} products in batch ${batchNumber}`,
            recalledCount: products.length
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/anomalies
// @desc    Detect anomalies across products (Admin only)
router.get('/admin/anomalies', auth, authorize('Admin'), async (req, res) => {
    try {
        const anomalies = [];

        // 1. Products scanned multiple times (potential counterfeiting)
        const multiScanned = await Product.find({ scanCount: { $gt: 1 }, isLocked: true })
            .populate('manufacturer', 'companyName')
            .sort({ scanCount: -1 })
            .limit(50);

        multiScanned.forEach(p => {
            anomalies.push({
                type: 'DUPLICATE_SCAN',
                severity: p.scanCount > 5 ? 'critical' : 'warning',
                productId: p.productId,
                productName: p.name,
                batchNumber: p.batchNumber,
                details: `Scanned ${p.scanCount} times after being locked. First locked by ${p.lockedBy || 'unknown'}.`,
                timestamp: p.lockedAt || p.createdAt
            });
        });

        // 2. Tracking events with failed geo verification (impossible travel)
        const geoAnomalies = await Tracking.find({ geoVerified: false, latitude: { $exists: true } })
            .populate('product', 'productId name batchNumber')
            .populate('handler', 'companyName')
            .sort({ timestamp: -1 })
            .limit(50);

        geoAnomalies.forEach(t => {
            anomalies.push({
                type: 'IMPOSSIBLE_TRAVEL',
                severity: 'critical',
                productId: t.product?.productId,
                productName: t.product?.name,
                batchNumber: t.product?.batchNumber,
                details: `Tracking event from ${t.handler?.companyName || 'unknown'} at (${t.latitude}, ${t.longitude}) failed geo verification.`,
                timestamp: t.timestamp
            });
        });

        // 3. Products in transit past expiry
        const expiredInTransit = await Product.find({
            currentStatus: { $in: ['In Transit', 'Manufactured'] },
            expDate: { $lt: new Date() },
            isRecalled: { $ne: true }
        }).populate('manufacturer', 'companyName').limit(50);

        expiredInTransit.forEach(p => {
            anomalies.push({
                type: 'EXPIRED_IN_TRANSIT',
                severity: 'warning',
                productId: p.productId,
                productName: p.name,
                batchNumber: p.batchNumber,
                details: `Product expired on ${new Date(p.expDate).toLocaleDateString()} but status is still '${p.currentStatus}'.`,
                timestamp: p.expDate
            });
        });

        // Sort by severity then timestamp
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        anomalies.sort((a, b) => (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2));

        res.json({
            total: anomalies.length,
            anomalies
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
