const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const User = require('./models/User');

const ADMIN_EMAIL = 'admin@pharmatrace.com';
const ADMIN_PASSWORD = 'admin123';

async function seedAdmin() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' PharmaTrace — Admin Recovery Script');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (!process.env.MONGODB_URI) {
        console.error('FATAL: MONGODB_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,
            tlsAllowInvalidCertificates: true
        });
        console.log('[Recovery] Connected to MongoDB');

        // Check if admin exists
        let admin = await User.findOne({ email: ADMIN_EMAIL });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        if (admin) {
            console.log(`[Recovery] Admin user (${ADMIN_EMAIL}) already exists. Resetting password...`);
            admin.password = hashedPassword;
            admin.role = 'Admin'; // Ensure role is correct
            await admin.save();
            console.log('[Recovery] ✓ Password reset successfully');
        } else {
            console.log(`[Recovery] Creating new admin user: ${ADMIN_EMAIL}`);
            admin = new User({
                username: 'Administrator',
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: 'Admin',
                companyName: 'PharmaTrace HQ',
                licenceNumber: 'ADMIN-INTERNAL',
                location: 'Global Operations',
                licenceStatus: 'Verified'
            });
            await admin.save();
            console.log('[Recovery] ✓ Admin user created successfully');
        }

        console.log('');
        console.log('Credentials:');
        console.log(`- Email:    ${ADMIN_EMAIL}`);
        console.log(`- Password: ${ADMIN_PASSWORD}`);
        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        process.exit(0);
    } catch (err) {
        console.error('[Recovery] Error:', err.message);
        process.exit(1);
    }
}

seedAdmin();
