const express = require('express');
const router = express.Router();
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');

/**
 * Reputation Scoring System
 * 
 * Base Score: 100
 * 
 * Deductions:
 *   - Impossible travel anomaly:    -10
 *   - Geo clone detected:           -15
 *   - Handoff disputed:             -10
 *   - Lab test FAIL:                -25
 *   - Batch recalled:               -20
 *   - Consumer counterfeit reports: -5
 * 
 * Bonuses:
 *   - Clean handoff:                +1 (max +5/month)
 *   - Lab test PASS:                +2
 *   - Months without incident:      +3
 * 
 * Consequences:
 *   >80:  Normal operations
 *   50-80: Higher random audit rate (20%)
 *   25-50: Batches require admin approval
 *   <25:  Account suspended
 */

// Scoring constants
const SCORING = {
    BASE: 100,
    DEDUCTIONS: {
        IMPOSSIBLE_TRAVEL: -10,
        GEO_CLONE: -15,
        HANDOFF_DISPUTED: -10,
        LAB_TEST_FAIL: -25,
        BATCH_RECALLED: -20,
        COUNTERFEIT_REPORT: -5,
        EXPIRED_IN_TRANSIT: -5
    },
    BONUSES: {
        CLEAN_HANDOFF: 1,  // max 5/month
        LAB_TEST_PASS: 2,
        CLEAN_MONTH: 3
    }
};

// @route   GET /api/auth/admin/reputation
// @desc    All users with reputation scores (Admin only)
router.get('/reputation', adminAuth, async (req, res) => {
    try {
        const users = await User.find({
            role: { $in: ['Manufacturer', 'Distributor', 'Pharmacy'] }
        })
            .select('companyName role location reputationScore totalAnomalies totalDisputes totalHandoffs lastReputationUpdate')
            .sort({ reputationScore: 1 });  // Lowest scores first

        // Add risk tier
        const usersWithTier = users.map(u => {
            const user = u.toObject();
            if (user.reputationScore > 80) user.tier = 'TRUSTED';
            else if (user.reputationScore > 50) user.tier = 'MONITORED';
            else if (user.reputationScore > 25) user.tier = 'RESTRICTED';
            else user.tier = 'SUSPENDED';
            return user;
        });

        const stats = {
            total: usersWithTier.length,
            trusted: usersWithTier.filter(u => u.tier === 'TRUSTED').length,
            monitored: usersWithTier.filter(u => u.tier === 'MONITORED').length,
            restricted: usersWithTier.filter(u => u.tier === 'RESTRICTED').length,
            suspended: usersWithTier.filter(u => u.tier === 'SUSPENDED').length
        };

        res.json({ stats, users: usersWithTier });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/auth/admin/reputation/:userId
// @desc    Detailed reputation for a user (Admin only)
router.get('/reputation/:userId', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Determine tier and consequences
        let tier, consequences;
        if (user.reputationScore > 80) {
            tier = 'TRUSTED';
            consequences = 'Normal operations. 5% audit rate.';
        } else if (user.reputationScore > 50) {
            tier = 'MONITORED';
            consequences = 'Elevated monitoring. 20% audit rate.';
        } else if (user.reputationScore > 25) {
            tier = 'RESTRICTED';
            consequences = 'All batches require admin approval before QR generation.';
        } else {
            tier = 'SUSPENDED';
            consequences = 'Account suspended. Cannot create products or track.';
        }

        res.json({
            user: {
                id: user._id,
                companyName: user.companyName,
                role: user.role,
                location: user.location,
                reputationScore: user.reputationScore,
                totalAnomalies: user.totalAnomalies,
                totalDisputes: user.totalDisputes,
                totalHandoffs: user.totalHandoffs,
                lastReputationUpdate: user.lastReputationUpdate
            },
            tier,
            consequences,
            scoringRules: SCORING,
            history: user.reputationHistory || []
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/admin/reputation/recalculate
// @desc    Force recalculate all reputation scores (Admin only)
router.post('/reputation/recalculate', adminAuth, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const db = mongoose.connection.db;

        // Get all supply chain users
        const users = await User.find({
            role: { $in: ['Manufacturer', 'Distributor', 'Pharmacy'] }
        });

        const results = [];

        for (const user of users) {
            let score = SCORING.BASE;
            const reasons = [];

            // Count anomalies from audit logs
            const auditLogs = await db.collection('auditlogs').find({
                actor: user._id,
                action: { $in: ['GEO_ANOMALY_DETECTED', 'LAB_TEST_FAILED', 'RECALLED'] }
            }).toArray();

            for (const log of auditLogs) {
                if (log.action === 'GEO_ANOMALY_DETECTED') {
                    score += SCORING.DEDUCTIONS.GEO_CLONE;
                    reasons.push(`Geo anomaly: ${SCORING.DEDUCTIONS.GEO_CLONE}`);
                }
                if (log.action === 'LAB_TEST_FAILED') {
                    score += SCORING.DEDUCTIONS.LAB_TEST_FAIL;
                    reasons.push(`Lab test fail: ${SCORING.DEDUCTIONS.LAB_TEST_FAIL}`);
                }
                if (log.action === 'RECALLED') {
                    score += SCORING.DEDUCTIONS.BATCH_RECALLED;
                    reasons.push(`Batch recalled: ${SCORING.DEDUCTIONS.BATCH_RECALLED}`);
                }
            }

            // Count disputes from handoffs
            const disputes = await db.collection('handoffs').countDocuments({
                sender: user._id,
                status: 'DISPUTED'
            });
            if (disputes > 0) {
                score += SCORING.DEDUCTIONS.HANDOFF_DISPUTED * disputes;
                reasons.push(`${disputes} handoff disputes: ${SCORING.DEDUCTIONS.HANDOFF_DISPUTED * disputes}`);
            }

            // Count clean handoffs (bonus)
            const cleanHandoffs = await db.collection('handoffs').countDocuments({
                sender: user._id,
                status: 'CONFIRMED'
            });
            const handoffBonus = Math.min(cleanHandoffs * SCORING.BONUSES.CLEAN_HANDOFF, 5);
            if (handoffBonus > 0) {
                score += handoffBonus;
                reasons.push(`${cleanHandoffs} clean handoffs: +${handoffBonus}`);
            }

            // Count lab test passes (bonus)
            const labPasses = await db.collection('labtests').countDocuments({
                batchNumber: { $in: await db.collection('products').distinct('batchNumber', { manufacturer: user._id }) },
                result: 'PASS'
            });
            const labBonus = labPasses * SCORING.BONUSES.LAB_TEST_PASS;
            if (labBonus > 0) {
                score += labBonus;
                reasons.push(`${labPasses} lab test passes: +${labBonus}`);
            }

            // Clamp score between 0 and 100
            score = Math.max(0, Math.min(100, score));

            const oldScore = user.reputationScore;

            // Update user
            user.reputationScore = score;
            user.totalDisputes = disputes;
            user.totalHandoffs = cleanHandoffs + disputes;
            user.lastReputationUpdate = new Date();

            // Add history entry if score changed
            if (oldScore !== score) {
                user.reputationHistory.push({
                    score,
                    reason: `Recalculated: ${reasons.join('; ')}`,
                    delta: score - oldScore,
                    timestamp: new Date()
                });
            }

            await user.save();

            results.push({
                companyName: user.companyName,
                role: user.role,
                oldScore,
                newScore: score,
                delta: score - oldScore,
                reasons
            });
        }

        res.json({
            message: `Recalculated reputation for ${results.length} users`,
            results
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Helper: Apply a reputation delta to a user
// Can be called from other services via internal API
// @route   POST /api/auth/admin/reputation/adjust
// @desc    Adjust a user's reputation (internal use)
router.post('/reputation/adjust', adminAuth, async (req, res) => {
    const { userId, delta, reason } = req.body;

    if (!userId || delta === undefined || !reason) {
        return res.status(400).json({ message: 'Required: userId, delta, reason' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const oldScore = user.reputationScore;
        user.reputationScore = Math.max(0, Math.min(100, oldScore + delta));

        user.reputationHistory.push({
            score: user.reputationScore,
            reason,
            delta,
            timestamp: new Date()
        });

        if (delta < 0) user.totalAnomalies = (user.totalAnomalies || 0) + 1;
        user.lastReputationUpdate = new Date();

        await user.save();

        res.json({
            message: `Reputation adjusted for ${user.companyName}`,
            oldScore,
            newScore: user.reputationScore,
            delta
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
