# Security Architecture & Best Practices

## 1. Overview

This document analyzes the security controls, authentication mechanisms, potential vulnerabilities, and hardening recommendations for **Vergo POS**.

---

## 2. Authentication & Authorization Controls

### 2.1 Cryptographic Password Storage
- Passwords for `Admin` and `Seller` accounts are hashed using `bcrypt` with a salt factor of 10 (`bcrypt.genSalt(10)`).
- Plaintext passwords are never stored in the database.

### 2.2 Token-Based Access Control
- JWTs (`jsonwebtoken`) are issued upon successful login to `/api/admin/login` or `/api/seller/login`.
- Tokens have an expiration duration of 24 hours (`expiresIn: '24h'`).
- The payload contains user identity:
  - Admin: `{ adminId: admin._id, username: admin.username }`
  - Seller: `{ sellerId: seller._id, username: seller.username }`

### 2.3 Route Protection (`auth.js`)
Protected backend routes verify the presence of the `x-auth-token` header:
- `POST /api/items` (Create Item)
- `PUT /api/items/:id` (Update Item)
- `DELETE /api/items/:id` (Delete Item)
- `GET /api/sales` (Read active sales)
- `GET /api/sales/reports` (Read historical financial reports)
- `DELETE /api/sales/reset` (Archive and purge sales)

---

## 3. Network & CORS Policy

CORS is managed via `server/server.js`:
```javascript
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);
```
- Restricts cross-origin browser requests in production to the specified frontend origin.
- Requests without origin (CLI tools, server-to-server) are permitted.

---

## 4. Threat Model & Hardening Recommendations

### 4.1 Setup Endpoints Exposure (Critical)
- **Current State**: `/api/admin/setup` and `/api/seller/setup` are open public endpoints. While they verify whether a user with the specified username already exists, an unauthorized caller could register additional unexpected usernames if the collection is open.
- **Recommendation**: Disable or remove `/api/admin/setup` and `/api/seller/setup` in production, and instead provision users exclusively via secure administrative CLI scripts (`createAdmin.js` / `createSeller.js`).

### 4.2 Role Separation in Middleware (Medium)
- **Current State**: `auth.js` checks only for a valid token signed with `JWT_SECRET` and attaches `req.admin = decoded`. Because both Seller and Admin tokens are signed with the same secret, any valid JWT allows access to admin item/sales endpoints if sent by a malicious user.
- **Recommendation**: Separate secrets (e.g. `JWT_ADMIN_SECRET`, `JWT_SELLER_SECRET`) or check `decoded.role === 'admin'` inside the authentication middleware.

### 4.3 Environment Variable & Secret Management (Critical)
- **Current State**: `server/.env` contains sensitive database connection strings and hardcoded JWT secrets.
- **Recommendation**:
  - Never commit `.env` files to source control (ensure `.gitignore` contains `**/.env`).
  - Use strong, cryptographically generated secrets in production (`openssl rand -hex 64`).
  - Use cloud secret management (Render Environment Variables, AWS Secrets Manager, Doppler, or HashiCorp Vault).

### 4.4 Stock Checkout Protection (Medium)
- **Current State**: `/api/sales` is public so POS terminals can submit sales without bearer tokens.
- **Recommendation**: Require cashier authentication (`sellerToken`) on `POST /api/sales` to ensure only logged-in terminals can record transactions.
- **Inventory Concurrency**: Utilize MongoDB multi-document transactions (`session.withTransaction`) to guarantee that all items in an order are checked and decremented atomically, rolling back if any single line item fails.

### 4.5 Rate Limiting & Input Sanitization
- Incorporate `express-rate-limit` on login routes to prevent brute-force credential stuffing.
- Use libraries like `zod` or `joi` for strict payload schema validation on item creation and billing routes.

