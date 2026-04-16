# 💊 PharmaTrace — Pharmaceutical Supply Chain Tracking System

> A full-stack microservices application for tracking and verifying pharmaceutical products through the entire supply chain — from manufacturer to pharmacy — with built-in anti-counterfeiting, QR code verification, GPS tracking, and anomaly detection.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [User Roles](#user-roles)
- [Security Features](#security-features)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)

---

## Overview

**PharmaTrace** is a pharmaceutical Track-and-Trace system designed to combat counterfeit drugs in the supply chain. It enables manufacturers to register products with QR codes, distributors to log transfers, and end consumers to verify product authenticity by scanning the QR code at a pharmacy.

The system uses a **microservices architecture** with four independent backend services communicating through an API Gateway, and a React-based frontend for all user interactions.

---

## Key Features

| Feature | Description |
|---|---|
| 🔐 **OTP-Based Authentication** | Phone number login with 6-digit OTP (simulated SMS) |
| 📦 **Batch Product Registration** | Manufacturers create single or batch products with auto-generated IDs |
| 📱 **QR Code Generation & Scanning** | HMAC-signed QR codes with tamper detection |
| 🗺️ **GPS Location Tracking** | Silent geolocation capture at manufacturing and distribution stages |
| 🔒 **Scan-Count Lock** | First consumer scan locks the product; subsequent scans flag potential counterfeiting |
| 🚨 **Product Recall System** | Admins can recall entire batches with reason tracking |
| 🌍 **Impossible Travel Detection** | Haversine-formula-based anomaly detection (threshold: 900 km/h) |
| 📊 **Admin Dashboard** | Analytics, batch management, anomaly reports, and user management |
| 🏭 **Manufacturer Dashboard** | Product/batch creation, QR code generation, recent batch overview |
| 🚚 **Distributor Dashboard** | QR scan-based tracking updates with GPS |
| ✅ **Public Verification Portal** | Consumers can verify product authenticity and view the full supply chain timeline |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│                   http://localhost:5173                   │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │   Home   │  │  Dashboards  │  │  Product Details   │  │
│  │  (Public) │  │ Mfr/Dist/Adm│  │  (Verification)   │  │
│  └──────────┘  └──────────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │  /api/*  (Vite Proxy)
                       ▼
┌──────────────────────────────────────────────────────────┐
│              API GATEWAY (Express + http-proxy-middleware)│
│                   http://localhost:3000                    │
│                                                           │
│  • CORS policy           • Rate limiting (100 req/15min)  │
│  • Service warm-up       • Request logging                │
│  • Health monitoring      • Route-based proxying           │
└───────┬────────────────┬─────────────────┬───────────────┘
        │                │                 │
   /api/auth        /api/product       /api/track
        │                │                 │
        ▼                ▼                 ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Auth Service │ │Product Service│ │ Tracking Service │
│  Port: 3001  │ │  Port: 3002  │ │   Port: 3003     │
│              │ │              │ │                   │
│ • Register   │ │ • CRUD       │ │ • Add tracking    │
│ • OTP Login  │ │ • Batch gen  │ │ • Get history     │
│ • JWT verify │ │ • QR signing │ │ • Impossible      │
│ • Admin CRUD │ │ • Verify     │ │   travel detect   │
│              │ │ • Recall     │ │ • Geo verification│
│              │ │ • Anomalies  │ │                   │
└──────┬───────┘ └──────┬───────┘ └────────┬──────────┘
       │                │                  │
       └────────────────┼──────────────────┘
                        ▼
            ┌────────────────────┐
            │   MongoDB Atlas    │
            │   (Shared DB:      │
            │   pharmatrace)     │
            └────────────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **Vite 7** | Build tool & dev server |
| **Tailwind CSS 4** | Utility-first styling |
| **Lucide React** | Icon library |
| **html5-qrcode** | QR code scanning (camera-based) |
| **react-qr-code** | QR code generation |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | REST API framework (all services) |
| **Mongoose** | MongoDB ODM |
| **MongoDB Atlas** | Cloud database |
| **JSON Web Tokens (JWT)** | Authentication |
| **bcryptjs** | Password hashing |
| **http-proxy-middleware** | API Gateway proxying |
| **express-rate-limit** | Rate limiting |

### DevOps
| Technology | Purpose |
|---|---|
| **Render** | Production deployment (render.yaml blueprint) |
| **Vercel** | Frontend hosting |

---

## Project Structure

```
PharmaTrace/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── main.jsx                 # App entry point
│   │   ├── App.jsx                  # Root component, routing, state
│   │   ├── index.css                # Global styles + Tailwind
│   │   ├── App.css                  # App-specific styles
│   │   ├── mockData.js              # Sample data for testing
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page + role-based dashboard routing
│   │   │   └── ProductDetails.jsx   # Product verification results page
│   │   └── components/
│   │       ├── Layout.jsx           # Navbar + Footer
│   │       ├── Login.jsx            # OTP-based login modal
│   │       ├── SignUp.jsx           # Registration form
│   │       ├── Scanner.jsx          # QR code scanner (camera)
│   │       ├── ProductCard.jsx      # Product summary card
│   │       ├── Timeline.jsx         # Supply chain timeline visualization
│   │       ├── ManufacturerDashboard.jsx  # Product creation, batch gen, QR codes
│   │       ├── DistributorDashboard.jsx   # Scan & track product updates
│   │       ├── AdminDashboard.jsx         # Full admin panel (stats, recalls, users)
│   │       ├── layout/              # Layout sub-components
│   │       └── ui/                  # Reusable UI primitives (Button, Card, Badge)
│   ├── public/                      # Static assets
│   ├── vite.config.js               # Vite config with API proxy
│   └── package.json                 # Frontend dependencies
│
├── services/                        # Backend Microservices
│   ├── api-gateway/                 # API Gateway (Port 3000)
│   │   ├── index.js                 # Proxy routing, CORS, rate limiting
│   │   └── package.json
│   │
│   ├── auth-service/                # Authentication Service (Port 3001)
│   │   ├── index.js                 # Service entry point
│   │   ├── models/
│   │   │   ├── User.js              # User schema (roles, phone, company)
│   │   │   └── Otp.js               # OTP schema (auto-expires in 5 min)
│   │   ├── routes/
│   │   │   ├── auth.js              # Register, OTP send/verify, token verify
│   │   │   └── admin.js             # User CRUD (admin-only)
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification middleware
│   │   │   └── adminAuth.js         # Admin-only middleware
│   │   └── package.json
│   │
│   ├── product-service/             # Product Service (Port 3002)
│   │   ├── index.js                 # Service entry point
│   │   ├── models/
│   │   │   ├── Product.js           # Product schema (tracking, recall, GPS)
│   │   │   ├── Tracking.js          # Tracking event schema
│   │   │   └── User.js              # Shared user reference
│   │   ├── routes/
│   │   │   └── product.js           # Product CRUD, batch gen, verify, recall, anomalies
│   │   ├── utils/
│   │   │   └── qrSecurity.js        # HMAC-SHA256 QR code signing & verification
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   └── authorize.js         # Role-based authorization
│   │   └── package.json
│   │
│   └── tracking-service/           # Tracking Service (Port 3003)
│       ├── index.js                 # Service entry point
│       ├── models/
│       │   ├── Product.js           # Shared product reference
│       │   ├── Tracking.js          # Tracking event schema (geo-verified)
│       │   └── User.js              # Shared user reference
│       ├── routes/
│       │   └── track.js             # Add tracking updates, get history
│       ├── utils/
│       │   └── geoUtils.js          # Haversine distance + impossible travel detection
│       ├── middleware/
│       │   ├── auth.js              # JWT verification
│       │   └── authorize.js         # Role-based authorization
│       └── package.json
│
├── server/                          # Legacy monolithic backend (deprecated)
│   ├── index.js                     # Old entry point
│   ├── seed.js                      # Database seeding script
│   └── src/                         # Old routes, models, middleware
│
├── .env                             # Environment variables (root)
├── .gitignore                       # Git ignore rules
├── render.yaml                      # Render deployment blueprint
├── start-microservices.sh           # Script to start all services locally
└── README.md                        # This file
```

---

## Database Schema

### User
```
{
  username:    String (required, unique)
  password:    String (optional — OTP-based login)
  role:        Enum ['Admin', 'Manufacturer', 'Distributor', 'Pharmacy', 'Retailer', 'Customer']
  companyName: String (required)
  location:    String (required)
  phoneNumber: String (required, unique)
}
```

### Product
```
{
  productId:               String (required, unique, indexed)
  name:                    String (required)
  manufacturer:            ObjectId → User
  batchNumber:             String (required)
  serialNumber:            String (required)
  mfgDate:                 Date (required)
  expDate:                 Date (required)
  currentStatus:           String (default: 'Manufactured')
  currentLocation:         String
  currentHandler:          ObjectId → User
  manufacturerLatitude:    Number
  manufacturerLongitude:   Number
  manufacturerGeoTimestamp:Date
  scanCount:               Number (default: 0)
  isLocked:                Boolean (default: false)
  lockedBy:                String
  lockedAt:                Date
  isRecalled:              Boolean (default: false)
  recallReason:            String
  recalledAt:              Date
  recalledBy:              ObjectId → User
}
```

### Tracking
```
{
  product:     ObjectId → Product (required)
  handler:     ObjectId → User (required)
  location:    String (required)
  status:      String (required)
  timestamp:   Date (default: now)
  notes:       String
  latitude:    Number
  longitude:   Number
  geoVerified: Boolean (default: true)
}
```

### OTP
```
{
  phoneNumber: String (required, unique)
  otp:         String (required)
  createdAt:   Date (auto-expires after 5 minutes via TTL index)
}
```

---

## API Reference

### Auth Service (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register a new user |
| `POST` | `/api/auth/check-phone` | — | Check if phone number exists |
| `POST` | `/api/auth/send-otp` | — | Send OTP to phone number |
| `POST` | `/api/auth/login-otp` | — | Verify OTP and get JWT token |
| `GET`  | `/api/auth/verify` | JWT | Verify token and get user data |

### Admin Routes (`/api/auth/admin`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auth/admin/users` | Admin | Get all users |
| `GET` | `/api/auth/admin/stats` | Admin | Get system statistics |
| `PUT` | `/api/auth/admin/users/:id` | Admin | Update a user |
| `DELETE` | `/api/auth/admin/users/:id` | Admin | Delete a user |

### Product Service (`/api/product`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/product` | Manufacturer | Create a single product |
| `POST` | `/api/product/batch` | Manufacturer | Batch-create multiple products |
| `GET`  | `/api/product/:id` | — | Get product by ID (public) |
| `POST` | `/api/product/verify/:id` | — | Verify product (signature + scan lock) |
| `GET`  | `/api/product/manufacturer/recent` | Manufacturer | Get recent batches |
| `GET`  | `/api/product/admin/stats` | Admin | Product statistics |
| `GET`  | `/api/product/admin/batches` | Admin | All batches (grouped) |
| `GET`  | `/api/product/admin/batch/:batchNumber` | Admin | Units in a batch |
| `POST` | `/api/product/admin/recall` | Admin | Recall an entire batch |
| `GET`  | `/api/product/admin/anomalies` | Admin | Detect anomalies |

### Tracking Service (`/api/track`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/track/:id` | Distributor/Pharmacy/Admin | Add tracking update |
| `GET`  | `/api/track/:id` | — | Get tracking history |
| `GET`  | `/api/track/user/history` | JWT | Get current user's tracking history |

### Health Checks

| Endpoint | Service |
|----------|---------|
| `GET /health` | API Gateway + warm-up all services |
| `GET /health` | Auth Service (port 3001) |
| `GET /health` | Product Service (port 3002) |
| `GET /health` | Tracking Service (port 3003) |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Full control: user management, batch recalls, anomaly detection, stats |
| **Manufacturer** | Register products (single/batch), generate signed QR codes |
| **Distributor** | Scan QR codes and add tracking updates (one update per product) |
| **Pharmacy** | Receive products and update final tracking status |
| **Customer** | Verify product authenticity via public portal |

---

## Security Features

### 1. QR Code Signing (HMAC-SHA256)
- Each QR code payload is signed: `productId.signature`
- Signature = first 16 characters of `HMAC-SHA256(productId, JWT_SECRET)`
- On scan, the signature is verified server-side before returning product data
- Tampered/forged QR codes return `INVALID_SIGNATURE` warning

### 2. Scan-Count Lock (Anti-Counterfeiting)
- First consumer scan **locks** the product to that user
- Subsequent scans by different users return `POTENTIAL_COUNTERFEIT` warning
- Supply chain roles (Manufacturer, Distributor, Admin) bypass the lock

### 3. Impossible Travel Detection
- Uses the **Haversine formula** to calculate distance between GPS coordinates
- If calculated speed exceeds **900 km/h** (above commercial jet speed), the event is flagged
- Flagged events have `geoVerified: false` and appear in the Admin anomaly dashboard

### 4. Rate Limiting
- API Gateway: 100 requests per 15 minutes
- Auth endpoints: 10 login attempts per 15 minutes
- OTP requests: 5 per hour

### 5. JWT Authentication
- Tokens expire after 5 days
- Required `JWT_SECRET` environment variable (server won't start without it)

---

## Getting Started

### Prerequisites
- **Node.js** (v18+)
- **npm**
- **MongoDB Atlas** account (or local MongoDB)

### 1. Clone the repository
```bash
git clone <repository-url>
cd Project
```

### 2. Configure environment variables
Create a `.env` file in the project root (see [Environment Variables](#environment-variables)).

### 3. Start all backend microservices
```bash
bash start-microservices.sh
```
This starts:
- Auth Service — `http://localhost:3001`
- Product Service — `http://localhost:3002`
- Tracking Service — `http://localhost:3003`
- API Gateway — `http://localhost:3000`

### 4. Start the frontend (in a new terminal)
```bash
cd client
npm install
npm run dev
```
Frontend runs at `http://localhost:5173` with hot reload.

### 5. Open the app
Visit **http://localhost:5173** in your browser.

### Stopping services
Press `Ctrl+C` in the terminal running `start-microservices.sh`.

---

## Deployment

The project is configured for deployment on **Render** using the `render.yaml` blueprint:

| Service | Render Name | Type |
|---------|-------------|------|
| API Gateway | `pharmatrace-gateway` | Web Service |
| Auth Service | `pharmatrace-auth` | Web Service |
| Product Service | `pharmatrace-product` | Web Service |
| Tracking Service | `pharmatrace-tracking` | Web Service |
| Frontend | Deployed on **Vercel** | Static Site |

**Production URL**: `https://pharmatrace-zeta.vercel.app`

---

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key for JWT + QR signing | (64-char hex string) |
| `JWT_EXPIRY` | Token expiration | `5d` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:5173` |
| `GATEWAY_PORT` | API Gateway port | `3000` |
| `AUTH_SERVICE_PORT` | Auth service port | `3001` |
| `PRODUCT_SERVICE_PORT` | Product service port | `3002` |
| `TRACKING_SERVICE_PORT` | Tracking service port | `3003` |
| `AUTH_SERVICE_URL` | Auth service URL | `http://localhost:3001` |
| `PRODUCT_SERVICE_URL` | Product service URL | `http://localhost:3002` |
| `TRACKING_SERVICE_URL` | Tracking service URL | `http://localhost:3003` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `OTP_EXPIRY_MINUTES` | OTP auto-delete time | `5` |

---

## Supply Chain Flow

```
Manufacturer                Distributor              Pharmacy              Consumer
    │                           │                       │                     │
    │  1. Register product      │                       │                     │
    │  2. Generate signed QR    │                       │                     │
    │  3. GPS captured          │                       │                     │
    │──── Ship with QR ────────▶│                       │                     │
    │                           │  4. Scan QR           │                     │
    │                           │  5. Add tracking      │                     │
    │                           │  6. GPS captured      │                     │
    │                           │──── Ship ────────────▶│                     │
    │                           │                       │  7. Scan QR         │
    │                           │                       │  8. "Received at    │
    │                           │                       │      Pharmacy"      │
    │                           │                       │                     │
    │                           │                       │◀── Customer visits ─│
    │                           │                       │                     │
    │                           │                       │    9. Scan QR code  │
    │                           │                       │   10. View full     │
    │                           │                       │       timeline      │
    │                           │                       │   11. Product       │
    │                           │                       │       locked to     │
    │                           │                       │       consumer      │
```

---

*Built with ❤️ by Raman Kumar*
