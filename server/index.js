const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

// Import configuration and validate
const { config, validateConfig } = require('./src/config');
validateConfig();

const app = express();

// Import rate limiters
const { apiLimiter, authLimiter, otpLimiter } = require('./src/middleware/rateLimiter');

// CORS Configuration - restrict to frontend URL in production
const corsOptions = {
    origin: config.isProduction
        ? [config.frontendUrl]
        : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Health check endpoint (for Render/monitoring)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.nodeEnv
    });
});

// Routes with specific rate limiters
const authRoutes = require('./src/routes/auth');
app.use('/api/auth/send-otp', otpLimiter);
app.use('/api/auth/login-otp', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);

app.use('/api/product', require('./src/routes/product'));
app.use('/api/track', require('./src/routes/track'));

// Handle 404 for API routes to force JSON response
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API Endpoint not found' });
});

// Base route
app.get('/', (req, res) => {
    res.json({
        name: 'PharmaTrace API',
        version: '1.0.0',
        status: 'running',
        docs: '/health'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        message: config.isProduction ? 'Internal server error' : err.message
    });
});

// Connect to MongoDB
mongoose.connect(config.mongoUri)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(config.port, () => {
            console.log(`Server running on port ${config.port}`);
            console.log(`Environment: ${config.nodeEnv}`);
            console.log(`CORS allowed origin: ${config.frontendUrl}`);
        });
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
    });
});
