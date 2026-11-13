# Backend Architecture & Implementation Details

## 1. Overview

The backend for **Vergo POS** is an Express 5 REST API built with Node.js and MongoDB (via Mongoose). It encapsulates all business logic for:
- User authentication for Admins and Cashiers (Sellers)
- Inventory management with multi-size stock quantities
- Safe order placement with inventory validation and atomic decrementing
- Daily sales aggregation, archiving, and reset routines

---

## 2. Server Architecture (`server/server.js`)

The entry script `server.js` sets up:
1. **Environment Config**: Uses `dotenv` to parse `PORT`, `MONGO_URI`, and `JWT_SECRET`.
2. **CORS Whitelist**:
   ```javascript
   const allowedOrigins = [
     'http://localhost:5173',
     'http://localhost:4173',
     process.env.FRONTEND_URL,
   ].filter(Boolean);
   ```
   Requests originating without an `Origin` header (such as Postman or backend CLI scripts) are permitted.
3. **JSON Body Parser**: Handled natively by `express.json()`.
4. **Database Connection**: `mongoose.connect(MONGO_URI)` connects to MongoDB Atlas or local MongoDB before starting the HTTP listener.

---

## 3. Router Breakdown

### A. Admin Authentication (`server/routes/adminRoutes.js`)
- `POST /api/admin/setup`: Initial provisioning route. Hashes password using `bcrypt.hash(password, 10)` and creates an Admin user.
- `POST /api/admin/login`: Verifies username and bcrypt-hashed password. Signs a 24-hour JWT token with `{ adminId, username }`.

### B. Seller Authentication (`server/routes/sellerRoutes.js`)
- `POST /api/seller/setup`: Initial setup for cashier/seller accounts.
- `POST /api/seller/login`: Authenticates seller and returns a 24-hour JWT token with `{ sellerId, username }`.

### C. Inventory Management (`server/routes/itemRoutes.js`)
- Standard sizes supported: `['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']`.
- `GET /api/items` (Public):
  - Fetches all inventory items sorted by `createdAt: -1`.
  - Uses `.lean()` for performance and serializes size maps.
  - Normalizes legacy records (where stock was a single number) into a standard size object `{ XS: 0, S: 0, ... }`.
- `POST /api/items` (Protected: `auth` middleware):
  - Validates `name`, `price`, and `category`.
  - Sanitizes the incoming `stock` dictionary against the supported size array, defaulting missing sizes to `0`.
- `PUT /api/items/:id` (Protected: `auth` middleware):
  - Updates name, price, category, and replaces the full `stock` object.
- `PUT /api/items/:id/stock` (Protected: `auth` middleware):
  - Legacy endpoint to update scalar stock.
- `DELETE /api/items/:id` (Protected: `auth` middleware):
  - Deletes the specified item by MongoDB ObjectId.

### D. Sales & Billing (`server/routes/saleRoutes.js`)
- `POST /api/sales` (Public):
  - Core transaction endpoint called when completing a sale.
  - Idempotency check: checks if an order with `orderNumber` already exists to avoid double-charging.
  - **Stock Pre-check**: Loops through each item in the order. If size-specific stock is tracked, validates that `item.stock[size] >= quantity`. Returns HTTP 400 with a detailed error message if any item is out of stock.
  - **Sale Creation**: Saves a new `Sale` document with customer details, item snapshots, subtotal, discount, and total.
  - **Stock Decrement**: Uses atomic `$inc` updates:
    ```javascript
    await Item.findByIdAndUpdate(itemId, {
      $inc: { [`stock.${size}`]: -saleItem.quantity }
    });
    ```
- `GET /api/sales` (Protected: `auth` middleware):
  - Retrieves all active sales sorted descending by date.
- `GET /api/sales/reports` (Protected: `auth` middleware):
  - Retrieves archived `DailyReport` entries.
- `DELETE /api/sales/reset` (Protected: `auth` middleware):
  - Aggregates all current active sales (`totalRevenue`, `totalOrders`, `totalDiscounts`, itemized list).
  - Persists a new `DailyReport` document.
  - Calls `Sale.deleteMany({})` to clear the active register.

---

## 4. Middleware & Protection (`server/middleware/auth.js`)

Protected endpoints require the JWT token passed in the `x-auth-token` HTTP header:
```javascript
const token = req.header('x-auth-token');
if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.admin = decoded;
next();
```

---

## 5. Setup & Seeding Scripts

Two standalone seeding scripts are provided in `server/`:
1. `node createAdmin.js`:
   - Connects to MongoDB, hashes the default admin password (`Vergo@2024`), and saves the document if it doesn't already exist.
2. `node createSeller.js`:
   - Seeds a seller account with default password (`Vergo@POS2024`).

