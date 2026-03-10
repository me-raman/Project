---
description: How to run PharmaTrace locally for development
---

# Running PharmaTrace Locally

## Prerequisites
- Node.js installed
- MongoDB Atlas credentials already configured in `.env`

## Steps

### 1. Start all backend microservices
// turbo
```bash
cd /Users/raman/Documents/Project && bash start-microservices.sh
```
This starts: Auth (3001), Product (3002), Tracking (3003), API Gateway (3000)

### 2. Start the frontend dev server (in a new terminal)
// turbo
```bash
cd /Users/raman/Documents/Project/client && npm run dev
```
This starts Vite at http://localhost:5173 with hot reload.

### 3. Open the app
Visit http://localhost:5173 in your browser.

## How It Works
- Frontend (Vite) runs on port 5173
- Vite proxy forwards `/api/*` requests to localhost:3000 (API Gateway)
- API Gateway proxies to individual microservices on ports 3001-3003
- `.env` (root) and `client/.env` are configured for local URLs
- Changes to frontend code are reflected instantly (hot reload)
- Changes to backend code require restarting the microservices

## Stopping Services
Press `Ctrl+C` in the terminal running `start-microservices.sh` to stop all backend services.
