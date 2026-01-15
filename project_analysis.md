# PharmaTrace Project Analysis

## 1. Project Overview
PharmaTrace is a MERN stack (MongoDB, Express, React, Node.js) application designed for pharmaceutical supply chain tracking. It allows manufacturers to register products and tracks them through distributors to pharmacies. The system emphasizes transparency and preventing counterfeit drugs.

**Core Tech Stack**:
- **Frontend**: React (Vite), TailwindCSS
- **Backend**: Node.js, Express
- **Database**: MongoDB (Local)
- **Authentication**: JWT & OTP-based (In-memory)

## 2. Architecture & Directory Structure

### Root Directory
- `start.sh`: **Main Startup Script**. It sets up the environment and launches all services.
- `setup_env.sh`: **Dependency Automation**. Downloads Node.js and MongoDB binaries locally into `./bin`, ensuring a portable environment without global installation requirements.
- `db_data/`: Local directory where MongoDB stores its data (created by `start.sh`).
- `bin/`: Contains local binaries for Node and Mongo.

### Backend (`/server`)
- **Entry Point**: `index.js`. Connects to MongoDB, starts the Express server on port 3000, and enables `cors`.
- **API Routes**:
  - `/api/auth`: Handles user registration and login.
  - `/api/product`: Handles product creation and public search.
  - `/api/track`: (Present in `index.js` but likely handles updating tracking status).
- **Models** (in `src/models`):
  - `User`: Accounts for Manufacturer, Distributor, Pharmacy, etc.
  - `Product`: Static product data (Name, Batch, Mfg Date).
  - `Tracking`: Events (Timestamp, Location, Handler, Status).

### Frontend (`/client`)
- **Structure**: React SPA with Vite.
- **Routing**: `App.jsx` handles simple conditional rendering logic (`view` state).
  - **Home**: Public landing page with Search/QR Scanner.
  - **ProductDetails**: Public view of product journey.
  - **Dashboards**: Separate components for signed-in users (Manufacturer, Distributor).
- **Styling**: TailwindCSS via `index.css`.

## 3. Database Schema & Data Logic

### Data Models
**1. User (`User.js`)**
- Roles: `Manufacturer`, `Distributor`, `Pharmacy`, `Retailer`, `Customer`.
- Identity: `username`, `companyName`, `password` (hashed).
- Data: `location`, `phoneNumber`.

**2. Product (`Product.js`)**
- Unique ID: `productId` (e.g., PROD-123).
- Origin: Links to `manufacturer` (User ID).
- State: `currentStatus`, `currentLocation`.
- Details: `batchNumber`, `expDate`.

**3. Tracking (`Tracking.js`)**
- The ledger of events. Each document is one event in the chain.
- Fields: `product` (Ref), `handler` (User Ref), `location`, `status`, `timestamp`.

### Data Automation Scripts

#### 1. Environment Setup (`setup_env.sh`)
This script automates `node` and `mongod` installation.
- Checks if `./bin` exists.
- Downloads `node-v22.12.0` and `mongodb-macos-7.0.4`.
- Unpacks them to `./bin`.
- *Significance*: Allows the project to run on a machine without pre-installed Node/Mongo.

#### 2. Server Startup (`start.sh`)
- Sets `PATH` to include the local `./bin`.
- Starts **MongoDB** as a background process (`--fork`), logging to `mongod.log`.
- Starts **Backend** (`npm install && node index.js`) in background.
- Starts **Frontend** (`npm install && npm run dev`) in background.
- Captures PIDs to kill all processes when the script is stopped.

#### 3. Database Seeding (`server/seed.js`)
A utility script to reset the database to a known state for demonstration.
- **Cleans DB**: Deletes all Users, Products, Tracking.
- **Creates Users**: 
  - `pfizer_mfg` (Manufacturer)
  - `dhl_logistics` (Distributor)
  - `cvs_pharmacy` (Pharmacy)
- **Creates Product**: `PROD-123` (Amoxicillin).
- **Creates Journey**: Simulated history:
  1. Manufactured -> 2. In Transit -> 3. Stored -> 4. Received at Pharmacy.
- *Usage*: Run `node server/seed.js` to reset data.

## 4. Key Workflows

### Authentication Flow (OTP)
1. User provides `phoneNumber`.
2. Backend generates 6-digit OTP, stores in **In-Memory Map**, and logs to console (Simulated SMS).
3. User enters OTP.
4. Backend verifies against Map. If valid -> returns JWT.

### Product Verification Flow (Public)
1. Backend publicly exposes `GET /api/product/:id`.
2. Frontend (`App.jsx`) fetches data.
3. **Logic Gate**: The frontend enforces that details are *only* shown if the product history contains the status **"Received at Pharmacy"**. If it is still "In Transit", the public user sees an error/restricted message.

## 5. Development Instructions
To work on this project:
1. **Start**: Run `bash start.sh` in the root.
2. **Logs**: Check `server/output.log` for backend errors, `mongod.log` for DB errors.
3. **Reset Data**: Run `node server/seed.js` to restore the demo product `PROD-123`.
4. **Access**:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`
