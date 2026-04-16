/**
 * PharmaTrace — Clean Slate Migration
 * 
 * Drops old trackings and products collections to prepare
 * for the new 7-layer anti-counterfeiting system.
 * User accounts are preserved.
 * 
 * Usage: node scripts/migrate-clean-slate.js
 */

const path = require('path');
const projectRoot = path.join(__dirname, '..');

// Load mongoose from auth-service (where it's installed)
const mongoose = require(path.join(projectRoot, 'services', 'auth-service', 'node_modules', 'mongoose'));
const dotenv = require(path.join(projectRoot, 'services', 'auth-service', 'node_modules', 'dotenv'));

dotenv.config({ path: path.join(projectRoot, '.env') });

async function migrate() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(' PharmaTrace — Clean Slate Migration');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    if (!process.env.MONGODB_URI) {
        console.error('FATAL: MONGODB_URI not set in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            family: 4,
            tlsAllowInvalidCertificates: true
        });
        console.log('[Migration] Connected to MongoDB');

        const db = mongoose.connection.db;

        // List existing collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('[Migration] Existing collections:', collectionNames.join(', '));

        // Drop trackings collection
        if (collectionNames.includes('trackings')) {
            await db.dropCollection('trackings');
            console.log('[Migration] ✓ Dropped "trackings" collection');
        } else {
            console.log('[Migration] ○ "trackings" collection does not exist — skipping');
        }

        // Drop products collection
        if (collectionNames.includes('products')) {
            await db.dropCollection('products');
            console.log('[Migration] ✓ Dropped "products" collection');
        } else {
            console.log('[Migration] ○ "products" collection does not exist — skipping');
        }

        // Drop otps collection (expired OTPs)
        if (collectionNames.includes('otps')) {
            await db.dropCollection('otps');
            console.log('[Migration] ✓ Dropped "otps" collection');
        } else {
            console.log('[Migration] ○ "otps" collection does not exist — skipping');
        }

        // Verify users collection is intact
        if (collectionNames.includes('users')) {
            const userCount = await db.collection('users').countDocuments();
            console.log(`[Migration] ✓ Users collection preserved: ${userCount} users`);
        }

        console.log('');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(' Migration complete — clean slate ready');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (err) {
        console.error('[Migration] Error:', err.message);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('[Migration] Disconnected from MongoDB');
    }
}

migrate();
