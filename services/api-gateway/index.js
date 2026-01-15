const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');

// Load from ../../.env only if it exists (local dev)
dotenv.config({ path: '../../.env' });

const app = express();
// Render requires binding to process.env.PORT
const PORT = process.env.PORT || process.env.GATEWAY_PORT || 3000;

// Service URLs
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';
const TRACKING_SERVICE = process.env.TRACKING_SERVICE_URL || 'http://localhost:3003';

// CORS
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};
app.use(cors(corsOptions));

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

// Simple logging middleware
app.use((req, res, next) => {
    console.log(`[Gateway] ${req.method} ${req.url}`);
    next();
});

// Health check for gateway
app.get('/health', (req, res) => {
    res.json({
        service: 'api-gateway',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            auth: AUTH_SERVICE,
            product: PRODUCT_SERVICE,
            tracking: TRACKING_SERVICE
        }
    });
});

// Proxy configuration
const proxyOptions = {
    changeOrigin: true,
    timeout: 30000,
    proxyTimeout: 30000,
    onProxyReq: (proxyReq, req, res) => {
        // Log proxied requests
        console.log(`[Gateway] Proxying ${req.method} ${req.url} to service`);
    }
};

// Route to Auth Service
// We use the full path so it's preserved
app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE,
    ...proxyOptions,
    // By default, /api/auth/foo becomes /foo at the target if we bind to /api/auth
    // So we prepend it back
    pathRewrite: { '^/': '/api/auth/' }
}));

// Route to Product Service
app.use('/api/product', createProxyMiddleware({
    target: PRODUCT_SERVICE,
    ...proxyOptions,
    pathRewrite: { '^/': '/api/product/' }
}));

// Route to Tracking Service
app.use('/api/track', createProxyMiddleware({
    target: TRACKING_SERVICE,
    ...proxyOptions,
    pathRewrite: { '^/': '/api/track/' }
}));

// Base route
app.get('/', (req, res) => {
    res.json({
        name: 'PharmaTrace API Gateway',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            product: '/api/product',
            track: '/api/track'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`[API Gateway] Running on port ${PORT}`);
    console.log(`[API Gateway] Proxying to:`);
    console.log(`  - Auth:     ${AUTH_SERVICE}`);
    console.log(`  - Product:  ${PRODUCT_SERVICE}`);
    console.log(`  - Tracking: ${TRACKING_SERVICE}`);
});

module.exports = app;
