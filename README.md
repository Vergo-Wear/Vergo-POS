# Vergo Wear - Point of Sale (POS) & Inventory System

<p align="center">
  <img src="public/logo white.png" alt="Vergo Wear Logo" width="220" />
</p>

<p align="center">
  A modern, high-performance Point-of-Sale (POS) and inventory control solution developed for <strong>Vergo Wear</strong> retail stores.
</p>

<p align="center">
  <a href="https://vergo-pos.vercel.app/" target="_blank">
    <img src="https://img.shields.io/badge/Live%20Demo-vergo--pos.vercel.app-00ffa3?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.2.0-61dafb?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-7.3.1-646CFF?style=flat-square&logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express_5-339933?style=flat-square&logo=node.js" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas_/_Mongoose-47A248?style=flat-square&logo=mongodb" alt="MongoDB" />
  <img src="https://img.shields.io/badge/License-Proprietary-red?style=flat-square" alt="License" />
</p>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Project Structure](#-project-structure)
- [Detailed Documentation](#-detailed-documentation)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Initial User Seeding](#3-initial-user-seeding)
- [Usage Guide](#-usage-guide)
  - [Cashier Checkout](#cashier-checkout)
  - [Admin Dashboard](#admin-dashboard)
- [Security Considerations](#-security-considerations)
- [Deployment](#-deployment)
- [License](#-license)

---

## 🌟 Overview

**Vergo POS** is tailored specifically for clothing and apparel retail. Unlike generic point-of-sale systems, it natively models garment size matrices (`XS`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`, `4XL`), displays live inventory counts, enforces per-size stock ceilings at checkout, prints itemized physical receipts, sends digital invoices to customers via email, and gives store owners deep visibility into stock valuation and daily financial performance.

---

## ✨ Key Features

### 🛒 Checkout Terminal (Seller POS)
- **Visual Catalog & Instant Search**: Filter items rapidly by product name or apparel category.
- **Garment Sizing Picker**: Interactive size picker with remaining stock counts and low-stock visual cues.
- **Real-Time Stock Guardrails**: Quantities cannot exceed live available inventory; prevents overselling.
- **Flexible Discounts**: Real-time percentage discount calculation with immediate balance adjustments.
- **Thermal & Paper Receipts**: Clean, print-ready receipt view formatted for thermal or desktop printers (`window.print()`).
- **Digital Invoicing**: Automated `mailto:` invoice generation pre-filled with customer itemized orders.

### 🛡️ Administrative Portal
- **Apparel Inventory Control**: Add, modify, replenish, and delete products with per-size stock matrices.
- **Stock Valuation Metrics**: Live calculation of total items, total inventory units, total warehouse value in LKR, and active period revenue.
- **Sales Audit Log**: Real-time table of transactions searchable by Order ID, Customer Name, or Email.
- **End-of-Day Financial Closeout**: One-click daily register reset that archives sales into immutable `DailyReport` documents and resets active counters for the next trading day.

---

## 🏗️ Architecture & Tech Stack

```
Frontend (React 19 + Vite) ──▶ Express 5 REST API ──▶ MongoDB (Mongoose ODM)
        │                                 │
  Local Storage                     JWT Auth & Bcrypt
(Seller/Admin Tokens)              Atomic Stock Decrement
```

- **Frontend**: React 19, Vite 7, React Router DOM v7, Lucide Icons, Custom Responsive CSS.
- **Backend**: Node.js, Express 5, Mongoose 9, Bcrypt, JSON Web Tokens (JWT), CORS, Dotenv.
- **Database**: MongoDB (Atlas Cloud Cluster or local database).

---

## 📂 Project Structure

```text
Vergo-POS/
├── doc/                     # 📚 Detailed technical documentation
│   ├── architecture.md      # System design, data flow diagrams & directory layout
│   ├── backend.md           # Express server, routers, and atomic stock logic
│   ├── frontend.md          # React components, state flow, and print styles
│   ├── api.md               # REST API reference and JSON schemas
│   ├── database.md          # MongoDB schemas, ER diagram, and data lifecycle
│   ├── functionality.md     # Business rules, cart limits, and closeouts
│   └── security.md          # Threat model, authentication, and hardening guide
├── public/                  # Static assets & brand logos
├── server/                  # Express REST backend
│   ├── middleware/auth.js   # JWT token authentication middleware
│   ├── models/              # Mongoose data schemas (Admin, Seller, Item, Sale, DailyReport)
│   ├── routes/              # Express API routers (admin, seller, items, sales)
│   ├── createAdmin.js       # Admin user creation script
│   ├── createSeller.js      # Cashier/Seller user creation script
│   └── server.js            # Express application entry point
├── src/                     # React frontend source
│   ├── components/          # Reusable components (ItemCard, CartItem, AdminLayout)
│   ├── pages/               # Views (Login, SellerLogin, AdminDashboard)
│   ├── App.jsx              # Main Cashier POS Terminal
│   └── index.css            # Dark neon theme & print styling
├── .env                     # Vite environment configuration
├── vercel.json              # Vercel deployment rewrite rules
└── package.json             # Frontend project config
```

---

## 📚 Detailed Documentation

Detailed engineering and operational manuals are available in the [`doc/`](./doc/) folder:

| Document | Description |
|---|---|
| [System Architecture](./doc/architecture.md) | High-level system design, tech stack overview, and end-to-end flow |
| [Backend Architecture](./doc/backend.md) | Express 5 structure, routing, middleware, and seeding scripts |
| [Frontend Architecture](./doc/frontend.md) | React 19 architecture, routing table, UI state, and styling |
| [REST API Reference](./doc/api.md) | Complete endpoints catalog, headers, request bodies, and responses |
| [Database & Schemas](./doc/database.md) | Mongoose models, apparel size map storage, and ER diagram |
| [Business Functionality](./doc/functionality.md) | Detailed walkthrough of POS cashier, billing, and admin workflows |
| [Security & Threat Model](./doc/security.md) | Authentication details, token security, and vulnerability mitigations |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local server or MongoDB Atlas cluster URI)
- Git

---

### 1. Backend Setup

1. Open a terminal and navigate to the `server/` directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables in `server/.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/vergo
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:5173
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # or: node server.js
   ```
   The backend should start on `http://localhost:5000`.

---

### 2. Frontend Setup

1. Open a new terminal in the root project directory (`Vergo-POS/`):
   ```bash
   npm install
   ```

2. Configure frontend environment variables in `.env`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

---

### 3. Initial User Seeding

Run the CLI seeding utilities from the `server/` directory to create initial user accounts:

- **Create Administrator**:
  ```bash
  cd server
  node createAdmin.js
  ```
  *(Default username: `admin` | Default password: `Vergo@2024`)*

- **Create Cashier / Seller**:
  ```bash
  node createSeller.js
  ```
  *(Default username: `seller` | Default password: `Vergo@POS2024`)*

> [!IMPORTANT]
> Make sure to change default credentials before deploying to a production environment.

---

## 💡 Usage Guide

### Cashier Checkout
1. Navigate to `http://localhost:5173/seller-login` and sign in with cashier credentials.
2. Select an apparel item from the grid.
3. Choose the desired size (`XS` - `4XL`) from the size picker dropdown.
4. Adjust item quantities or enter a discount percentage in the cart sidebar.
5. Enter optional customer details (Name, Email).
6. Click **Proceed to Bill** to review the itemized breakdown.
7. Click **Generate Bill & Record Sale**:
   - The order is logged in MongoDB.
   - Per-size stock levels are atomically decremented.
   - An on-screen printable receipt is generated.
   - An itemized customer email invoice opens if an email address was entered.

### Admin Dashboard
1. Navigate to `http://localhost:5173/login` and log in with admin credentials.
2. View real-time store metrics (Total Items, Stock Quantity, Inventory Value, Period Sales).
3. **Manage Products**: Add items with per-size stock counts or edit existing products.
4. **Audit Sales**: Review transactions in the active sales log.
5. **Daily Closeout**: Click **Reset Sales** to compile the day's earnings into the permanent **Daily Reports Archive**.

---

## 🔒 Security Considerations

- **Password Storage**: Passwords are saved as one-way salted hashes using `bcrypt` (10 rounds).
- **JWT Authentication**: Protected administrative routes require a signed bearer token (`x-auth-token`).
- **Inventory Concurrency**: Uses MongoDB `$inc` operators to prevent race conditions during simultaneous checkouts.
- See [`doc/security.md`](./doc/security.md) for full vulnerability analysis and production hardening guidelines.

---

## 🌐 Deployment

### Live Application
- **Production URL**: [https://vergo-pos.vercel.app/](https://vergo-pos.vercel.app/)

### Frontend (Vercel)
The repository includes `vercel.json` configured with SPA rewrites:
1. Connect the GitHub repository to [Vercel](https://vercel.com).
2. Set Environment Variable: `VITE_API_URL=https://your-backend-api.onrender.com`.
3. Deploy!

### Backend (Render / Railway / VPS)
1. Deploy the `server/` directory as a Node Web Service.
2. Configure build and start commands:
   - Build Command: `npm install`
   - Start Command: `node server.js`
3. Add Environment Variables:
   - `PORT=5000`
   - `MONGO_URI=<your-mongodb-atlas-uri>`
   - `JWT_SECRET=<strong-random-key>`
   - `FRONTEND_URL=https://your-frontend.vercel.app`

---

## 📄 License

This software is developed for **Vergo Wear**. All rights reserved.
