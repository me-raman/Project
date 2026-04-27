const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: '../../.env' });

const app = express();
// Render requires binding to process.env.PORT
const PORT = process.env.PORT || process.env.AUTH_SERVICE_PORT || 3001;

// Validate required env vars
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET not set');
    process.exit(1);
}

// CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: 'Too many attempts, try again later' }
});

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Too many OTP requests, try again in an hour' }
});

// Models
const User = require('./models/User');
const Otp = require('./models/Otp');

// Root route (for Render dashboard)
app.get('/', (req, res) => {
    res.json({ service: 'auth-service', status: 'running' });
});

// Health check
app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth/admin', require('./routes/admin'));
app.use('/api/auth/admin', require('./routes/reputation'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Auth endpoint not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    family: 4, // Force IPv4
    tlsAllowInvalidCertificates: true // Bypass SSL certificate verification issue
})
    .then(async () => {
        console.log('[Auth Service] MongoDB Connected');
        
        // Sync indexes: Automatically drops indexes removed from the schema
        try {
            console.log('[Maintenance] Syncing database indexes...');
            const User = require('./models/User');
            
            // Drop specific obsolete phoneNumber index if it exists
            const db = mongoose.connection.db;
            const collections = await db.listCollections({ name: 'users' }).toArray();
            if (collections.length > 0) {
                const indexes = await db.collection('users').indexes();
                const obsoleteIndex = indexes.find(idx => idx.key && idx.key.phoneNumber);
                if (obsoleteIndex) {
                    console.log(`[Maintenance] Dropping legacy index: ${obsoleteIndex.name}`);
                    await db.collection('users').dropIndex(obsoleteIndex.name);
                }
            }
            
            // General sync for everything else
            await User.syncIndexes();
            console.log('[Maintenance] Database indexes synchronized successfully');
        } catch (err) {
            console.error('[Maintenance] Index sync warning:', err.message);
            // Non-fatal error, service can still start
        }

        app.listen(PORT, () => {
            console.log(`[Auth Service] Running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('[Auth Service] MongoDB Error:', err);
        process.exit(1);
    });

module.exports = app;
