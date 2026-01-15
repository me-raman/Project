const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 3001;

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

// Health check
app.get('/health', (req, res) => {
    res.json({ service: 'auth-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Auth endpoint not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    family: 4, // Force IPv4
    tlsAllowInvalidCertificates: true // Bypass SSL certificate verification issue
})
    .then(() => {
        console.log('[Auth Service] MongoDB Connected');
        app.listen(PORT, () => {
            console.log(`[Auth Service] Running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('[Auth Service] MongoDB Error:', err);
        process.exit(1);
    });

module.exports = app;
