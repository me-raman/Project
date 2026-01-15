# Client Project Structure

This document walks through the files in your `client` folder, categorizing them by importance and explaining their role.

## 🚨 Very Important (Core)
These files are the backbone of your application. You will edit these frequently.

- **`src/main.jsx`**: The application's entry point. It mounts your React app into the DOM.
- **`src/App.jsx`**: The main component. Typically handles **Routing configuration** (defining which page shows for which URL) and global layout structure.
- **`src/index.css`**: Global styles. If you are using Tailwind CSS, the directives are here. This controls the look and feel of your app globally.
- **`index.html`**: The HTML shell. It's where your React app "lives". You usually don't touch this unless adding global fonts or meta tags.

## 🧩 Important (UI & Logic)
This is where your actual feature code lives.

### Pages (`src/pages/`)
- **`Home.jsx`**: The landing page of your application.
- **`ProductDetails.jsx`**: The page showing details for a specific item (likely the tracking view).

### Components (`src/components/`)
- **`Layout.jsx`**: A wrapper component that likely provides the header, footer, and common structure for all pages.
- **`ProductCard.jsx`**: A reusable component to display product summaries.
- **`Timeline.jsx`**: A component to visualize the "Trace" part of "Track and Trace", showing history steps.

## ⚙️ Important (Configuration)
- **`package.json`**: Defines your project's identity, scripts (like `npm run dev`), and **dependencies**.
- **`vite.config.js`**: Configuration for the Vite build tool. Handles plugins, ports, and aliases.

## ℹ️ Less Important / Auxiliary
Files you rarely need to touch directly or are for development only.

- **`src/mockData.js`**: likely contains fake data for testing. You will eventually replace this with real API calls.
- **`eslint.config.js`**: Configuration for the code linter (ESLint). It helps catch errors but doesn't affect how the app runs.
- **`.gitignore`**: Tells Git which files to ignore (like `node_modules`).
- **`package-lock.json`**: Generated automatically to lock dependency versions. **Do not edit this manually.**
- **`README.md`**: Project documentation.

## 📁 Directories
- **`public/`**: Static assets (images, icons) that don't need processing by Vite.
- **`node_modules/`**: Where library code lives. **Never touch this.**

---

# Backend Project Structure

This document walks through the files in your `server` (backend) folder.

## 🚨 Very Important (Core)
- **`index.js`**: The entry point of your server. It sets up Express, connects to the database, and starts the server listening on a port.
- **`seed.js`**: A script to populate your database with initial data. Very useful for testing and setup.

## 🗃️ Models (`src/models/`)
Defines the structure (schema) of your data in the database (likely MongoDB/Mongoose).
- **`Product.js`**: Defines what a "Product" looks like (name, batch ID, etc.).
- **`Tracking.js`**: Defines a "Tracking" event (location, status, timestamp) linked to a product.
- **`User.js`**: Defines user accounts for authentication.

## 🛣️ Routes (`src/routes/`)
Defines the API endpoints (URLs) your frontend will call.
- **`auth.js`**: Handles login and registration (`POST /api/auth/login`, etc.).
- **`product.js`**: generic product CRUD operations (Create, Read, Update, Delete).
- **`track.js`**: Endpoints to get or add tracking updates.

## 🛡️ Middleware (`src/middleware/`)
- **`auth.js`**: Likely checks if a user is logged in (verifies JWT tokens) before allowing access to protected routes.
