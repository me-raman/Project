const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const Product = require('../models/Product');
const LabTest = require('../models/LabTest');
const AuditLog = require('../models/AuditLog');

// @route   POST /api/product/lab-test
// @desc    Submit a lab test result (Admin or Pharmacy only)
router.post('/lab-test', auth, authorize('Admin', 'Pharmacy'), async (req, res) => {
    const {
        productId, batchNumber, testType, result,
        activeIngredientDeclared, activeIngredientFound,
        concentrationDeclared, concentrationFound,
        contaminantsFound, labName, labCertificationId,
        notes, reportUrl
    } = req.body;

    if (!productId || !batchNumber || !testType || !result || !labName) {
        return res.status(400).json({
            message: 'Required fields: productId, batchNumber, testType, result, labName'
        });
    }

    try {
        const product = await Product.findOne({ productId });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const labTest = new LabTest({
            product: product._id,
            productId,
            batchNumber,
            testedBy: req.user.userId,
            testType,
            result,
            activeIngredientDeclared,
            activeIngredientFound,
            concentrationDeclared,
            concentrationFound,
            contaminantsFound: contaminantsFound || [],
            labName,
            labCertificationId,
            notes,
            reportUrl
        });

        await labTest.save();

        // AUDIT LOG: Record lab test submission
        await AuditLog.create({
            entityType: 'LabTest',
            entityId: productId,
            action: 'LAB_TEST_SUBMITTED',
            actor: req.user.userId,
            actorRole: req.user.role,
            newValue: { testType, result, labName, batchNumber },
            severity: result === 'FAIL' ? 'critical' : 'info'
        });

        // If FAIL — auto-flag the entire batch
        if (result === 'FAIL') {
            await Product.updateMany(
                { batchNumber },
                {
                    auditStatus: 'AUDIT_FAILED',
                    auditResolvedAt: new Date(),
                    auditResolvedBy: req.user.userId
                }
            );

            await AuditLog.create({
                entityType: 'Batch',
                entityId: batchNumber,
                action: 'LAB_TEST_FAILED',
                actor: req.user.userId,
                actorRole: req.user.role,
                newValue: {
                    labName,
                    testType,
                    activeIngredientDeclared,
                    activeIngredientFound,
                    concentrationDeclared,
                    concentrationFound,
                    contaminantsFound
                },
                severity: 'critical'
            });

            console.log(`[LAB TEST FAIL] Batch ${batchNumber} flagged — tested by ${labName}`);
        }

        res.json({
            message: `Lab test submitted: ${result}`,
            labTest: {
                id: labTest._id,
                productId,
                batchNumber,
                testType,
                result,
                labName,
                testedAt: labTest.testedAt
            },
            batchFlagged: result === 'FAIL'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/lab-test/:productId
// @desc    Get lab results for a product (Public)
router.get('/lab-test/:productId', async (req, res) => {
    try {
        const labTests = await LabTest.find({ productId: req.params.productId })
            .populate('testedBy', 'companyName')
            .sort({ testedAt: -1 });

        res.json({
            productId: req.params.productId,
            totalTests: labTests.length,
            latestResult: labTests.length > 0 ? labTests[0].result : 'NOT_TESTED',
            labTests
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/lab-tests
// @desc    All lab test reports (Admin only)
router.get('/admin/lab-tests', auth, authorize('Admin'), async (req, res) => {
    try {
        const labTests = await LabTest.find()
            .populate('testedBy', 'companyName role')
            .sort({ testedAt: -1 })
            .limit(100);

        const stats = await LabTest.aggregate([
            { $group: { _id: '$result', count: { $sum: 1 } } }
        ]);

        const resultCounts = {};
        stats.forEach(s => { resultCounts[s._id] = s.count; });

        res.json({
            totalTests: labTests.length,
            resultCounts,
            labTests
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/product/admin/lab-tests/failures
// @desc    Only failed lab tests (Admin only)
router.get('/admin/lab-tests/failures', auth, authorize('Admin'), async (req, res) => {
    try {
        const failures = await LabTest.find({ result: 'FAIL' })
            .populate('testedBy', 'companyName role')
            .sort({ testedAt: -1 });

        res.json({
            totalFailures: failures.length,
            failures
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
