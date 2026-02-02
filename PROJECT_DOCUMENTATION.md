# PharmaTrace - Complete Project Documentation

> **Pharmaceutical Supply Chain Tracking System**  
> A full-stack microservices application for tracking medicine authenticity from manufacturer to pharmacy.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Architecture](#-architecture)
3. [Technology Stack](#-technology-stack)
4. [Database Schema](#-database-schema)
5. [Backend Services](#-backend-services)
6. [Frontend Application](#-frontend-application)
7. [Data Flow & Automations](#-data-flow--automations)
8. [Authentication System](#-authentication-system)
9. [API Reference](#-api-reference)
10. [Deployment](#-deployment)
11. [Local Development](#-local-development)

---

## 🎯 Project Overview

**PharmaTrace** is a pharmaceutical supply chain tracking system that enables:

- **Manufacturers** to register medicine batches and generate QR codes
- **Distributors** to scan, verify, and update product transit status
- **Pharmacies** to confirm product receipt
- **Customers** to scan QR codes and verify medicine authenticity

### Key Features
- ✅ OTP-based passwordless authentication
- ✅ Role-based access control (Admin, Manufacturer, Distributor, Pharmacy, Retailer, Customer)
- ✅ QR code generation for product tracking
- ✅ Real-time supply chain visibility
- ✅ Counterfeit detection through verification history
- ✅ Admin dashboard for user management

---

## 🏗 Architecture

### Microservices Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│                   React + Vite (Port 5173)                       │
│              Deployed: Vercel (pharmatrace-zeta.vercel.app)      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│                       (Port 3000)                                │
│        Deployed: Render (pharmatrace-gateway.onrender.com)       │
│                                                                  │
│  • Request routing & proxying                                    │
│  • Rate limiting (100 req/15 min)                                │
│  • Service warm-up (prevents cold starts)                        │
│  • CORS configuration                                            │
└───────┬───────────────────┬───────────────────┬─────────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  AUTH SERVICE │   │PRODUCT SERVICE│   │TRACKING SERVICE│
│   (Port 3001) │   │  (Port 3002)  │   │   (Port 3003) │
│               │   │               │   │                │
│ • Registration│   │ • Create      │   │ • Add tracking │
│ • OTP Login   │   │   products    │   │   updates      │
│ • JWT tokens  │   │ • Batch gen   │   │ • View history │
│ • Admin CRUD  │   │ • Get product │   │ • User history │
└───────┬───────┘   └───────┬───────┘   └───────┬────────┘
        │                   │                   │
        └───────────────────┴───────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB ATLAS                                 │
│                 Database: pharmatrace                            │
│                                                                  │
│  Collections: users, otps, products, trackings                   │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
Project/
├── .env                          # Environment variables
├── start-microservices.sh        # Local startup script
├── render.yaml                   # Render deployment config
│
├── services/
│   ├── api-gateway/              # Request routing & proxying
│   │   └── index.js
│   │
│   ├── auth-service/             # Authentication & user management
│   │   ├── index.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   └── Otp.js
│   │   ├── routes/
│   │   │   ├── auth.js           # Login, register, OTP
│   │   │   └── admin.js          # User CRUD (Admin only)
│   │   └── middleware/
│   │       ├── auth.js           # JWT verification
│   │       └── adminAuth.js      # Admin role check
│   │
│   ├── product-service/          # Product management
│   │   ├── index.js
│   │   ├── models/
│   │   │   ├── Product.js
│   │   │   ├── Tracking.js
│   │   │   └── User.js
│   │   ├── routes/
│   │   │   └── product.js
│   │   └── middleware/
│   │       ├── auth.js
│   │       └── authorize.js      # Role-based authorization
│   │
│   └── tracking-service/         # Supply chain tracking
│       ├── index.js
│       ├── models/
│       │   ├── Product.js
│       │   ├── Tracking.js
│       │   └── User.js
│       ├── routes/
│       │   └── track.js
│       └── middleware/
│           ├── auth.js
│           └── authorize.js
│
├── client/                       # React frontend
│   ├── src/
│   │   ├── App.jsx               # Main app with routing
│   │   ├── main.jsx              # Entry point
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Navbar & Footer
│   │   │   ├── Login.jsx         # OTP-based login
│   │   │   ├── SignUp.jsx        # User registration
│   │   │   ├── ManufacturerDashboard.jsx
│   │   │   ├── DistributorDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── Scanner.jsx       # QR code scanner
│   │   │   ├── ProductCard.jsx
│   │   │   ├── Timeline.jsx
│   │   │   └── ui/               # Reusable UI components
│   │   └── pages/
│   │       ├── Home.jsx          # Public homepage with search
│   │       └── ProductDetails.jsx
│   ├── vite.config.js
│   └── vercel.json               # Vercel deployment config
│
└── server/                       # Legacy/utility scripts
    ├── seed.js                   # Database seeding
    └── fetch_users.js            # Debug utilities
```

---

## 💻 Technology Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js** | Web framework |
| **MongoDB Atlas** | Cloud database |
| **Mongoose** | ODM for MongoDB |
| **JWT** | Authentication tokens |
| **bcryptjs** | Password hashing (unused - OTP auth) |
| **express-rate-limit** | API rate limiting |
| **http-proxy-middleware** | API gateway proxying |
| **cors** | Cross-origin resource sharing |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI library |
| **Vite** | Build tool & dev server |
| **react-qr-code** | QR code generation |
| **html5-qrcode** | QR code scanning |
| **Lucide React** | Icon library |

### Deployment
| Platform | Service |
|----------|---------|
| **Render** | Backend microservices |
| **Vercel** | Frontend hosting |
| **MongoDB Atlas** | Cloud database |

---

## 📊 Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  username: String,              // Unique
  password: String,              // Optional (OTP-based auth)
  role: String,                  // 'Admin' | 'Manufacturer' | 'Distributor' | 'Pharmacy' | 'Retailer' | 'Customer'
  companyName: String,           // Required
  location: String,              // Required
  phoneNumber: String            // Required, Unique (used for OTP login)
}
```

### OTPs Collection (Auto-expiring)

```javascript
{
  _id: ObjectId,
  phoneNumber: String,           // Unique
  otp: String,                   // 6-digit code
  createdAt: Date                // Auto-delete after 5 minutes (TTL index)
}
```

### Products Collection

```javascript
{
  _id: ObjectId,
  productId: String,             // Unique, indexed (e.g., "PROD-BATCH-001-1705123456789-0")
  name: String,                  // Product name (e.g., "Amoxicillin 500mg")
  manufacturer: ObjectId,        // Reference to User (Manufacturer)
  batchNumber: String,           // Batch identifier
  serialNumber: String,          // Unique per unit
  mfgDate: Date,                 // Manufacturing date
  expDate: Date,                 // Expiry date
  currentStatus: String,         // 'Manufactured' | 'In Transit' | 'Received at Pharmacy'
  currentLocation: String,       // Last known location
  currentHandler: ObjectId,      // Reference to current handler User
  createdAt: Date
}
```

### Trackings Collection

```javascript
{
  _id: ObjectId,
  product: ObjectId,             // Reference to Product
  handler: ObjectId,             // Reference to User who made update
  location: String,              // Location at time of update
  status: String,                // Status update
  timestamp: Date,               // Default: now
  notes: String                  // Optional notes
}
```

---

## ⚙️ Backend Services

### 1. API Gateway (Port 3000)

**Purpose**: Central entry point that routes requests to appropriate microservices.

**Key Features**:
- Proxies `/api/auth/*` → Auth Service
- Proxies `/api/product/*` → Product Service
- Proxies `/api/track/*` → Tracking Service
- Rate limiting: 100 requests per 15 minutes
- Service warm-up on every request (prevents Render cold starts)
- CORS configuration for frontend

**Health Check**: `GET /health`

---

### 2. Auth Service (Port 3001)

**Purpose**: Handle user authentication and administration.

#### Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/check-phone` | ❌ | Check if phone number exists |
| `POST` | `/api/auth/send-otp` | ❌ | Send OTP to registered phone |
| `POST` | `/api/auth/login-otp` | ❌ | Verify OTP and get JWT token |
| `GET` | `/api/auth/verify` | ✅ | Verify token, get user data |
| `GET` | `/api/auth/admin/users` | Admin | Get all users |
| `GET` | `/api/auth/admin/stats` | Admin | Get user statistics |
| `PUT` | `/api/auth/admin/users/:id` | Admin | Update user |
| `DELETE` | `/api/auth/admin/users/:id` | Admin | Delete user |

**Rate Limiting**:
- Auth endpoints: 10 requests per 15 minutes
- OTP endpoints: 5 requests per hour

---

### 3. Product Service (Port 3002)

**Purpose**: Manage product registration and batch creation.

#### Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/product` | ✅ | Manufacturer | Create single product |
| `POST` | `/api/product/batch` | ✅ | Manufacturer | Create batch of products |
| `GET` | `/api/product/:id` | ❌ | Public | Get product by ID with history |
| `GET` | `/api/product/manufacturer/recent` | ✅ | Manufacturer | Get recent products |

**Automations**:
- When a product is created, an initial tracking event is automatically generated with status "Manufactured"
- Product IDs are auto-generated: `PROD-{batchNumber}-{timestamp}-{index}`
- Serial numbers are auto-generated: `SN-{timestamp}-{index}`

---

### 4. Tracking Service (Port 3003)

**Purpose**: Record and retrieve supply chain tracking events.

#### Endpoints

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| `POST` | `/api/track/:id` | ✅ | Distributor, Pharmacy | Add tracking update |
| `GET` | `/api/track/:id` | ❌ | Public | Get tracking history |
| `GET` | `/api/track/user/history` | ✅ | Any | Get user's tracking history |

**Business Rules**:
1. **End of Chain**: Once status is "Received at Pharmacy", no further updates allowed
2. **One Update Per Distributor**: A distributor can only update a product once
3. **Auto-Location**: If no location provided, uses handler's registered location

---

## 🖥 Frontend Application

### Component Structure

```
App.jsx                          # Main app, manages view state
│
├── Layout.jsx                   # Navbar (with login modal trigger) & Footer
│   └── Navbar
│       ├── Login.jsx            # OTP-based login modal
│       └── SignUp.jsx           # Registration modal
│
├── Home.jsx                     # Public homepage
│   ├── Hero section
│   ├── QR Scanner               # For product search
│   └── Features section
│
├── ProductDetails.jsx           # Product verification result
│   ├── ProductCard.jsx          # Product info display
│   └── Timeline.jsx             # Tracking history
│
└── Dashboards (role-based)
    ├── ManufacturerDashboard.jsx
    │   ├── Batch creation form
    │   ├── QR code grid display
    │   └── Recent products list
    │
    ├── DistributorDashboard.jsx
    │   ├── Product search/scan
    │   ├── Product verification
    │   ├── Status update form
    │   └── Recent activity list
    │
    └── AdminDashboard.jsx
        ├── Statistics cards
        ├── Users table
        ├── Edit user modal
        └── Delete confirmation
```

### User Roles & Dashboards

| Role | Dashboard | Capabilities |
|------|-----------|--------------|
| **Admin** | AdminDashboard | View stats, manage all users (CRUD) |
| **Manufacturer** | ManufacturerDashboard | Create products, generate QR codes, view recent batches |
| **Distributor** | DistributorDashboard | Scan QR, verify products, update status to "In Transit" |
| **Pharmacy** | DistributorDashboard | Scan QR, verify products, update status to "Received at Pharmacy" |
| **Customer** | None (Public view) | Scan QR codes to verify authenticity |

---

## 🔄 Data Flow & Automations

### 1. User Registration Flow

```
User fills form → POST /api/auth/register
                        │
                        ▼
              ┌─────────────────────┐
              │  Check phone exists │
              │    (must be unique) │
              └────────┬────────────┘
                       │
                       ▼
              ┌─────────────────────┐
              │   Create User doc   │
              └────────┬────────────┘
                       │
                       ▼
              ┌─────────────────────┐
              │  Generate JWT token │
              │  (5-day expiry)     │
              └────────┬────────────┘
                       │
                       ▼
              Return: { token, role, name, userId }
```

### 2. OTP Authentication Flow

```
User enters phone → POST /api/auth/check-phone
                          │
                          ▼
                ┌───────────────────┐
                │ Phone registered? │
                └────────┬──────────┘
                         │
            ┌────────────┴────────────┐
            │ Yes                     │ No
            ▼                         ▼
  POST /api/auth/send-otp      Show "Account not found"
            │
            ▼
  ┌──────────────────────────┐
  │ Generate 6-digit OTP     │
  │ Store in otps collection │
  │ (auto-expires in 5 min)  │
  └────────────┬─────────────┘
               │
               ▼
  Return OTP in response      ← DEV MODE: OTP shown in UI
  (In production: send SMS)
               │
               ▼
  User enters OTP → POST /api/auth/login-otp
                          │
                          ▼
                ┌─────────────────────┐
                │  Verify OTP match   │
                │  Delete OTP record  │
                │  Generate JWT       │
                └────────┬────────────┘
                         │
                         ▼
  Store in localStorage: { token, userRole, userName, userId }
```

### 3. Product Creation Flow (Batch)

```
Manufacturer fills form → POST /api/product/batch
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ Validate: batch doesn't │
                    │ already exist for this  │
                    │ product + manufacturer  │
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ For each unit (1-1000): │
                    │   • Generate productId  │
                    │   • Generate serialNum  │
                    │   • Create Product doc  │
                    │   • Create Tracking doc │
                    │     (status: Manufactured)
                    └───────────┬─────────────┘
                                │
                                ▼
                    ┌─────────────────────────┐
                    │ Bulk insert products    │
                    │ Bulk insert trackings   │
                    └───────────┬─────────────┘
                                │
                                ▼
              Return: { products: [{ productId, batchNumber }...] }
                                │
                                ▼
              Frontend generates QR codes for each productId
```

### 4. Product Tracking Update Flow

```
Distributor/Pharmacy scans QR → GET /api/product/:id
                                      │
                                      ▼
                      ┌────────────────────────────┐
                      │ Validate:                  │
                      │  • Product exists          │
                      │  • Not already at pharmacy │
                      │  • User hasn't updated yet │
                      └───────────┬────────────────┘
                                  │
                                  ▼
                      ┌────────────────────────────┐
                      │ Display product details    │
                      │ and tracking history       │
                      └───────────┬────────────────┘
                                  │
                                  ▼
  User selects status → POST /api/track/:id
                              │
                              ▼
              ┌────────────────────────────────┐
              │ Create Tracking record with:   │
              │   • product reference          │
              │   • handler (current user)     │
              │   • status ('In Transit' or    │
              │     'Received at Pharmacy')    │
              │   • location                   │
              │   • notes                      │
              │   • timestamp                  │
              └────────────┬───────────────────┘
                           │
                           ▼
              ┌────────────────────────────────┐
              │ Update Product document:       │
              │   • currentStatus = status     │
              │   • currentLocation = location │
              │   • currentHandler = userId    │
              └────────────────────────────────┘
```

### 5. Customer Verification Flow

```
Customer scans QR → GET /api/product/:id
                          │
                          ▼
            ┌──────────────────────────────┐
            │ Check: Has product reached   │
            │ status "Received at Pharmacy"? │
            └──────────────┬───────────────┘
                           │
          ┌────────────────┴────────────────┐
          │ No                              │ Yes
          ▼                                 ▼
  Show: "Product in          Display full verification:
  supply chain (not yet        • Product details
  at pharmacy)"                • Manufacturer info
                               • Full tracking timeline
                               • Authenticity confirmed
```

---

## 🔐 Authentication System

### JWT Token Structure

```javascript
{
  userId: ObjectId,      // User's MongoDB ID
  role: String,          // User's role
  name: String           // Company name
}
// Expiry: 5 days
```

### Middleware Flow

```
Request with x-auth-token header
           │
           ▼
    ┌─────────────────┐
    │  auth.js        │
    │  middleware     │
    │                 │
    │  • Verify JWT   │
    │  • Extract user │
    │    payload      │
    │  • Attach to    │
    │    req.user     │
    └────────┬────────┘
             │
             ▼ (for admin routes)
    ┌─────────────────┐
    │  adminAuth.js   │
    │  middleware     │
    │                 │
    │  • Check role   │
    │    === 'Admin'  │
    └────────┬────────┘
             │
             ▼ (for role-specific routes)
    ┌─────────────────┐
    │  authorize.js   │
    │  middleware     │
    │                 │
    │  • Check role   │
    │    in allowed   │
    │    roles list   │
    └─────────────────┘
```

### LocalStorage Keys (Frontend)

| Key | Value | Purpose |
|-----|-------|---------|
| `token` | JWT string | API authentication |
| `userRole` | String | Role-based dashboard routing |
| `userName` | String | Display in UI |
| `userId` | ObjectId | User identification |

---

## 📖 API Reference

### Base URLs

| Environment | URL |
|-------------|-----|
| Production Gateway | `https://pharmatrace-gateway.onrender.com` |
| Auth Service | `https://pharmatrace-auth.onrender.com` |
| Product Service | `https://pharmatrace-product.onrender.com` |
| Tracking Service | `https://pharmatrace-tracking.onrender.com` |
| Local Development | `http://localhost:3000` (Gateway) |

### Error Responses

All errors return JSON:
```javascript
{
  "message": "Error description"
}
```

### Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Bad Request / Business rule violation |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

---

## 🚀 Deployment

### Render Configuration (render.yaml)

The project deploys 4 services on Render:

1. **pharmatrace-gateway** (API Gateway)
2. **pharmatrace-auth** (Auth Service)
3. **pharmatrace-product** (Product Service)
4. **pharmatrace-tracking** (Tracking Service)

All services:
- Use Node.js runtime
- Deploy from `main` branch
- Have `/health` health checks
- Share environment variables (JWT_SECRET, MONGODB_URI, FRONTEND_URL)

### Vercel Configuration (vercel.json)

The frontend:
- Deploys to Vercel automatically
- Rewrites `/api/*` requests to the API Gateway
- Handles SPA routing

### Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=<64-character-hex-string>
JWT_EXPIRY=5d

# CORS
FRONTEND_URL=https://pharmatrace-zeta.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# OTP (for future SMS integration)
OTP_EXPIRY_MINUTES=5

# Microservices URLs (auto-configured on Render)
AUTH_SERVICE_URL=https://pharmatrace-auth.onrender.com
PRODUCT_SERVICE_URL=https://pharmatrace-product.onrender.com
TRACKING_SERVICE_URL=https://pharmatrace-tracking.onrender.com
```

---

## 🛠 Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas connection)

### Starting All Services

```bash
# From project root
chmod +x start-microservices.sh
./start-microservices.sh
```

This script:
1. Checks for `.env` file
2. Installs dependencies if needed
3. Starts all 4 microservices in background
4. Displays running status
5. Handles cleanup on Ctrl+C

### Starting Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Service Ports

| Service | Local Port | Endpoint |
|---------|------------|----------|
| API Gateway | 3000 | http://localhost:3000 |
| Auth Service | 3001 | http://localhost:3001 |
| Product Service | 3002 | http://localhost:3002 |
| Tracking Service | 3003 | http://localhost:3003 |
| Frontend | 5173 | http://localhost:5173 |

### Health Checks

```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

---

## 📝 Notes

### Development Mode Features

1. **OTP Display**: In development, OTPs are returned in the API response and displayed in the login modal. In production, integrate with SMS service (Twilio, etc.).

2. **Service Warm-up**: The API Gateway makes health check requests to all services on every request to prevent cold start delays on Render's free tier.

3. **Console Logging**: All services log requests for debugging. Consider adding proper logging (Winston, etc.) for production.

### Security Considerations

1. **JWT Secret**: Use a strong, randomly generated secret in production
2. **Rate Limiting**: Already implemented but adjust limits based on usage
3. **CORS**: Strictly configured for the frontend URL
4. **MongoDB TLS**: Currently bypasses certificate validation; fix for production

### Scaling Recommendations

1. Add Redis for session management and rate limiting across instances
2. Implement proper SMS gateway for OTP delivery
3. Add request tracing (correlation IDs) across services
4. Consider message queues for async operations
5. Add database indexes for frequently queried fields

---

*Documentation generated: January 2026*
