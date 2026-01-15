const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const app = express();
const PORT = process.env.PRODUCT_SERVICE_PORT || 3002;

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

// Health check
app.get('/health', (req, res) => {
    res.json({ service: 'product-service', status: 'healthy', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/product', require('./routes/product'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Product endpoint not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    family: 4,
    tlsAllowInvalidCertificates: true
})
    .then(() => {
        console.log('[Product Service] MongoDB Connected');
        app.listen(PORT, () => {
            console.log(`[Product Service] Running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('[Product Service] MongoDB Error:', err);
        process.exit(1);
    });

module.exports = app;
