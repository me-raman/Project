const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// SECURITY: Enforce JWT_SECRET presence
if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    console.error('Please create a .env file with JWT_SECRET=<your-secret-key>');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/product', require('./src/routes/product'));
app.use('/api/track', require('./src/routes/track'));

// Handle 404 for API routes to force JSON response
app.use('/api', (req, res) => {
    res.status(404).json({ message: 'API Endpoint not found' });
});

// Base route
app.get('/', (req, res) => {
    res.send('PharmaTrace API Running');
});

// Connect to MongoDB
const MONGO_URI = 'mongodb://localhost:27017/pharmatrace';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected');
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });
