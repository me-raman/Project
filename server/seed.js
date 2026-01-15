const mongoose = require('mongoose');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Tracking = require('./src/models/Tracking');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://localhost:27017/pharmatrace';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected');

        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Tracking.deleteMany({});

        // 1. Create Users
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);

        const manufacturer = await User.create({
            username: 'pfizer_mfg',
            password,
            role: 'Manufacturer',
            companyName: 'Pfizer Inc.',
            location: 'New York, USA'
        });

        const distributor = await User.create({
            username: 'dhl_logistics',
            password,
            role: 'Distributor',
            companyName: 'DHL Supply Chain',
            location: 'Chicago Hub, IL'
        });

        const pharmacy = await User.create({
            username: 'cvs_pharmacy',
            password,
            role: 'Pharmacy',
            companyName: 'CVS Health',
            location: 'San Francisco, CA'
        });

        console.log('Users Created');

        // 2. Create Product
        const product = await Product.create({
            productId: 'PROD-123',
            name: 'Amoxicillin 500mg',
            manufacturer: manufacturer._id,
            batchNumber: 'BATCH-2024-X1',
            serialNumber: 'SN-99887766',
            mfgDate: new Date('2025-01-01'),
            expDate: new Date('2027-01-01'),
            currentStatus: 'Received at Pharmacy',
            currentLocation: pharmacy.location,
            currentHandler: pharmacy._id
        });

        console.log('Product Created: PROD-123');

        // 3. Create Tracking History

        // Event 1: Manufacturing
        await Tracking.create({
            product: product._id,
            handler: manufacturer._id,
            location: manufacturer.location,
            status: 'Manufactured',
            timestamp: new Date('2025-01-01T10:00:00'),
            notes: 'Batch created and quality controlled.'
        });

        // Event 2: Picked up by Distributor
        await Tracking.create({
            product: product._id,
            handler: distributor._id,
            location: manufacturer.location,
            status: 'In Transit',
            timestamp: new Date('2025-01-02T14:30:00'),
            notes: 'Picked up for delivery to Regional Hub.'
        });

        // Event 3: Arrived at Hub
        await Tracking.create({
            product: product._id,
            handler: distributor._id,
            location: distributor.location,
            status: 'Stored',
            timestamp: new Date('2025-01-03T09:15:00'),
            notes: 'Stored in temperature controlled facility.'
        });

        // Event 4: Delivered to Pharmacy
        await Tracking.create({
            product: product._id,
            handler: pharmacy._id,
            location: pharmacy.location,
            status: 'Received at Pharmacy',
            timestamp: new Date('2025-01-05T11:45:00'),
            notes: 'Received and verified. Ready for dispensing.'
        });

        console.log('Tracking History Created');
        console.log('Seed Complete. Test with Product ID: PROD-123');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
