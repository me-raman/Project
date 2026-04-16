const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const Tracking = require('../models/Tracking');
const User = require('../models/User');
const { calculateDistance } = require('../utils/geoUtils');

/**
 * Batch to Shipment Reconciliation
 * Three checks:
 *   1. Transit time plausibility (distance vs time)
 *   2. Route plausibility (expected geographic path)
 *   3. Scan sequence integrity (timestamps in order)
 */

// @route   GET /api/track/reconcile/:productId
// @desc    Run all 3 reconciliation checks for a product (Admin only)
router.get('/reconcile/:productId', auth, authorize('Admin'), async (req, res) => {
    try {
        const product = await Product.findOne({ productId: req.params.productId })
            .populate('manufacturer', 'companyName location registeredLatitude registeredLongitude');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const events = await Tracking.find({ product: product._id })
            .populate('handler', 'companyName location role registeredLatitude registeredLongitude')
            .sort({ timestamp: 1 }); // Chronological

        const flags = [];

        // CHECK 1: Transit Time Plausibility
        for (let i = 1; i < events.length; i++) {
            const prev = events[i - 1];
            const curr = events[i];

            if (prev.latitude && prev.longitude && curr.latitude && curr.longitude) {
                const distance = calculateDistance(
                    prev.latitude, prev.longitude,
                    curr.latitude, curr.longitude
                );

                const timeDiffHours = (new Date(curr.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);

                if (timeDiffHours > 0) {
                    const speed = distance / timeDiffHours;

                    // Transport-mode-aware thresholds
                    const threshold = distance >= 500 ? 900 : 120; // Air vs road
                    const transportMode = distance >= 500 ? 'air' : 'road';

                    if (speed > threshold) {
                        flags.push({
                            check: 'TRANSIT_TIME',
                            severity: 'critical',
                            from: prev.handler?.companyName || 'Unknown',
                            to: curr.handler?.companyName || 'Unknown',
                            distance: Math.round(distance),
                            timeDiffHours: Math.round(timeDiffHours * 100) / 100,
                            impliedSpeed: Math.round(speed),
                            threshold,
                            transportMode,
                            message: `${Math.round(distance)}km in ${Math.round(timeDiffHours * 60)}min = ${Math.round(speed)}km/h (${transportMode} threshold: ${threshold}km/h)`
                        });
                    }
                }
            }
        }

        // CHECK 2: Route Plausibility
        // Verify events follow a geographic path that makes sense
        if (events.length >= 3) {
            for (let i = 1; i < events.length - 1; i++) {
                const prev = events[i - 1];
                const curr = events[i];
                const next = events[i + 1];

                if (prev.latitude && curr.latitude && next.latitude) {
                    // Direct distances
                    const directDist = calculateDistance(
                        prev.latitude, prev.longitude,
                        next.latitude, next.longitude
                    );
                    // Via the intermediate point
                    const viaDist = calculateDistance(
                        prev.latitude, prev.longitude,
                        curr.latitude, curr.longitude
                    ) + calculateDistance(
                        curr.latitude, curr.longitude,
                        next.latitude, next.longitude
                    );

                    // If going via the intermediate is >3x the direct distance,
                    // the intermediate is far off the expected route
                    if (viaDist > directDist * 3 && directDist > 100) {
                        flags.push({
                            check: 'ROUTE_DEVIATION',
                            severity: 'warning',
                            handler: curr.handler?.companyName || 'Unknown',
                            location: curr.location,
                            message: `Route deviation: detour via ${curr.handler?.companyName || 'Unknown'} adds ${Math.round(viaDist - directDist)}km (${Math.round(viaDist / directDist * 100)}% of direct route)`
                        });
                    }
                }
            }
        }

        // CHECK 3: Scan Sequence Integrity
        const expectedOrder = ['Manufactured', 'Shipped', 'In Transit', 'Pending Confirmation', 'Received at Pharmacy'];
        let lastTimestamp = null;

        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            // Check for timestamp anomalies (should always increase)
            if (lastTimestamp && new Date(event.timestamp) < new Date(lastTimestamp)) {
                flags.push({
                    check: 'SEQUENCE_VIOLATION',
                    severity: 'critical',
                    event: event.status,
                    handler: event.handler?.companyName || 'Unknown',
                    timestamp: event.timestamp,
                    previousTimestamp: lastTimestamp,
                    message: `Event "${event.status}" has earlier timestamp than previous event. Possible replay attack or clock manipulation.`
                });
            }

            lastTimestamp = event.timestamp;
        }

        // Check for status sequence violations
        if (events.length >= 2) {
            const firstEvent = events[0];
            if (firstEvent.status !== 'Manufactured') {
                flags.push({
                    check: 'SEQUENCE_VIOLATION',
                    severity: 'warning',
                    message: `First event is "${firstEvent.status}" instead of "Manufactured". Supply chain start is anomalous.`
                });
            }
        }

        res.json({
            productId: req.params.productId,
            productName: product.name,
            batchNumber: product.batchNumber,
            totalEvents: events.length,
            totalFlags: flags.length,
            isClean: flags.length === 0,
            flags,
            events: events.map(e => ({
                status: e.status,
                handler: e.handler?.companyName,
                handlerRole: e.handler?.role,
                location: e.location,
                latitude: e.latitude,
                longitude: e.longitude,
                timestamp: e.timestamp,
                geoVerified: e.geoVerified
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/track/admin/reconciliation-report
// @desc    Run reconciliation for all products with recent activity (Admin only)
router.get('/admin/reconciliation-report', auth, authorize('Admin'), async (req, res) => {
    try {
        // Get products with tracking events in the last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const recentProducts = await Tracking.aggregate([
            { $match: { timestamp: { $gte: thirtyDaysAgo } } },
            { $group: { _id: '$product' } },
            { $limit: 100 }
        ]);

        const productIds = recentProducts.map(p => p._id);
        const products = await Product.find({ _id: { $in: productIds } })
            .select('productId name batchNumber currentStatus');

        const report = [];

        for (const product of products) {
            const events = await Tracking.find({ product: product._id })
                .sort({ timestamp: 1 });

            let flagCount = 0;

            // Quick sequence check
            let lastTs = null;
            for (const event of events) {
                if (lastTs && new Date(event.timestamp) < new Date(lastTs)) {
                    flagCount++;
                }
                lastTs = event.timestamp;
            }

            // Quick transit check
            for (let i = 1; i < events.length; i++) {
                if (events[i - 1].latitude && events[i].latitude) {
                    const dist = calculateDistance(
                        events[i - 1].latitude, events[i - 1].longitude,
                        events[i].latitude, events[i].longitude
                    );
                    const hours = (new Date(events[i].timestamp) - new Date(events[i - 1].timestamp)) / (1000 * 60 * 60);
                    if (hours > 0) {
                        const threshold = dist >= 500 ? 900 : 120;
                        if (dist / hours > threshold) flagCount++;
                    }
                }
            }

            report.push({
                productId: product.productId,
                name: product.name,
                batchNumber: product.batchNumber,
                currentStatus: product.currentStatus,
                eventCount: events.length,
                flagCount,
                isClean: flagCount === 0
            });
        }

        // Sort: flagged products first
        report.sort((a, b) => b.flagCount - a.flagCount);

        res.json({
            totalChecked: report.length,
            totalFlagged: report.filter(r => !r.isClean).length,
            report
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
