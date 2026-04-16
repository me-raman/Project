const mongoose = require('mongoose');

/**
 * LabTest — Physical verification of medicine
 * 
 * The ultimate check: does this tablet actually contain
 * the declared active ingredient at the correct dosage?
 * No digital manipulation can bypass this.
 */
const LabTestSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    productId: { type: String, required: true },
    batchNumber: { type: String, required: true },
    testedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    testType: {
        type: String,
        enum: ['IDENTITY', 'CONCENTRATION', 'PURITY', 'FULL_PANEL'],
        required: true
    },
    result: {
        type: String,
        enum: ['PASS', 'FAIL', 'INCONCLUSIVE'],
        required: true
    },
    // What the product should contain vs what was found
    activeIngredientDeclared: { type: String },
    activeIngredientFound: { type: String },
    concentrationDeclared: { type: Number },  // mg
    concentrationFound: { type: Number },     // mg
    contaminantsFound: [{ type: String }],
    // Lab information
    labName: { type: String, required: true },
    labCertificationId: { type: String },
    notes: { type: String },
    reportUrl: { type: String },
    // Timestamps
    testedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

// Indexes
LabTestSchema.index({ productId: 1 });
LabTestSchema.index({ batchNumber: 1 });
LabTestSchema.index({ result: 1 });
LabTestSchema.index({ testedAt: -1 });

module.exports = mongoose.model('LabTest', LabTestSchema);
