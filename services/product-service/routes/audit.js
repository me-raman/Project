const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// @route   GET /api/product/admin/audit-queue
// @desc    Get batches flagged for random audit (Admin only)
router.get('/audit-queue', auth, authorize('Admin'), async (req, res) => {
    try {
        const pendingAudits = await Product.aggregate([
            { $match: { auditStatus: 'PENDING_AUDIT' } },
            {
                $group: {
                    _id: '$batchNumber',
                    name: { $first: '$name' },
                    batchNumber: { $first: '$batchNumber' },
                    manufacturer: { $first: '$manufacturer' },
                    unitCount: { $sum: 1 },
                    auditFlaggedAt: { $first: '$auditFlaggedAt' },
                    createdAt: { $first: '$createdAt' }
                }
            },
            { $sort: { auditFlaggedAt: -1 } },
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

        res.json({
            totalPending: pendingAudits.length,
            batches: pendingAudits
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/product/admin/audit/:batchNumber/verify
// @desc    Pass or fail a batch audit (Admin only)
router.post('/audit/:batchNumber/verify', auth, authorize('Admin'), async (req, res) => {
    const { batchNumber } = req.params;
    const { result, notes } = req.body; // result: 'AUDIT_PASSED' or 'AUDIT_FAILED'

    if (!['AUDIT_PASSED', 'AUDIT_FAILED'].includes(result)) {
        return res.status(400).json({ message: 'Result must be AUDIT_PASSED or AUDIT_FAILED' });
    }

    try {
        const products = await Product.find({ batchNumber, auditStatus: 'PENDING_AUDIT' });

        if (products.length === 0) {
            return res.status(404).json({ message: 'No products pending audit for this batch' });
        }

        // Update all products in the batch
        await Product.updateMany(
            { batchNumber, auditStatus: 'PENDING_AUDIT' },
            {
                auditStatus: result,
                auditResolvedAt: new Date(),
                auditResolvedBy: req.user.userId
            }
        );

        // If audit failed, also recall the batch
        if (result === 'AUDIT_FAILED') {
            await Product.updateMany(
                { batchNumber },
                {
                    isRecalled: true,
                    recallReason: `Batch audit failed: ${notes || 'No reason provided'}`,
                    recalledAt: new Date(),
                    recalledBy: req.user.userId,
                    currentStatus: 'Recalled'
                }
            );
        }

        // Log the audit resolution
        await AuditLog.create({
            entityType: 'Batch',
            entityId: batchNumber,
            action: result,
            actor: req.user.userId,
            actorRole: req.user.role,
            newValue: { result, notes },
            severity: result === 'AUDIT_FAILED' ? 'critical' : 'info'
        });

        res.json({
            message: `Batch ${batchNumber} audit: ${result}`,
            affectedProducts: products.length,
            result
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/audit-log/:batchNumber
// @desc    Get full immutable audit trail for a batch (Admin only)
router.get('/audit-log/:batchNumber', auth, authorize('Admin'), async (req, res) => {
    try {
        const logs = await AuditLog.find({
            entityType: { $in: ['Batch', 'Product'] },
            entityId: { $regex: req.params.batchNumber }
        })
            .populate('actor', 'companyName role')
            .sort({ timestamp: -1 });

        res.json({
            batchNumber: req.params.batchNumber,
            totalEntries: logs.length,
            logs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
