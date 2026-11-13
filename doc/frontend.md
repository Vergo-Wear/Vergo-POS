# Frontend Architecture & Implementation Details

## 1. Overview

The frontend is a single-page application (SPA) built using **React 19** and bundled with **Vite 7**. It uses **React Router DOM v7** for client-side navigation between cashier and administrator views.

The design language uses modern dark-themed aesthetics with high-contrast neon accents (such as `#00ffa3` green and `#ff4757` coral red) suitable for retail counter environments.

---

## 2. Routing Configuration (`src/main.jsx`)

The routing table defines four main views:

| Path | Component | Purpose | Access Control |
|---|---|---|---|
| `/` | `App.jsx` | Cashier POS Register & Billing Terminal | Requires `sellerToken` in `localStorage` |
| `/seller-login` | `SellerLogin.jsx` | Cashier login screen | Public |
| `/login` | `Login.jsx` | Administrator login screen | Public |
| `/admin` | `AdminDashboard.jsx` | Inventory & Sales Management Dashboard | Requires `adminToken` in `localStorage` |

---

## 3. Key Components & Pages

### A. Cashier Register View (`src/App.jsx`)
The core interface used at checkout:
- **Session Check**: On mount, verifies `sellerToken` exists in `localStorage`. If absent, redirects to `/seller-login`.
- **Catalog Grid**: Fetches products from `GET /api/items`. Displays cards with live size badges and stock numbers.
- **Search & Filter**: Real-time filtering by product name or category string.
- **Cart Management**:
  - Distinguishes cart items by a composite key: `${item._id}-${size}`.
  - Enforces quantity ceiling matching `sizeStock`.
  - Increments, decrements, and removes line items.
- **Pricing & Discounts**:
  - Dynamically calculates subtotal.
  - Supports percentage discounts with instant recalculation of total payable.
- **Billing & Receipts**:
  - Generates unique order identifier: `VRG-XXXX-XXXX`.
  - Sends order payload to `POST /api/sales`.
  - Re-fetches catalog to ensure local stock matches backend quantities.
  - Renders an on-screen printable receipt modal (`window.print()`).
  - Prepares an automated `mailto:` link populated with an itemized ASCII receipt.

### B. Admin Dashboard (`src/pages/AdminDashboard.jsx`)
Comprehensive management back-office:
- **Inventory Metrics**:
  - Total items count.
  - Total inventory stock count (sum across all sizes).
  - Total inventory monetary valuation (`price * totalStock`).
- **Live Sales Metrics**:
  - Total revenue of active sales.
  - Total order count and average order value.
- **Product CRUD**:
  - Form to create products with individual inputs for sizes: `XS`, `S`, `M`, `L`, `XL`, `2XL`, `3XL`, `4XL`.
  - In-place modal/form to edit prices, categories, and size-specific stock.
  - Delete item with confirmation.
- **Sales Transactions Log**:
  - Searchable table of active sales by Order ID, Customer Name, or Email.
- **Daily Closeout & Reports Modal**:
  - "Reset & Archive Sales" button triggering a safety confirmation prompt.
  - Modal displaying historical `DailyReport` archives with breakdown of orders and totals.

### C. Reusable UI Components
- **`ItemCard.jsx`**:
  - Renders product name, category, and price.
  - Displays stock tags for each available size. If stock <= 3, displays a low-stock alert pill.
  - Clicking `+` pops up an interactive size picker dropdown.
- **`CartItem.jsx`**:
  - Displays selected size badge, unit price, quantity increment/decrement buttons, and line total.
  - Disables increment button when cart quantity equals warehouse stock limit.
- **`AdminLayout.jsx`**:
  - Standardized shell containing admin header, brand logo, and logout handler.

---

## 4. State & Communication Architecture

```mermaid
graph TD
    subgraph POS State ["App.jsx State"]
        cart[cart Array]
        items[items Catalog]
        discount[discount %]
        saleData[Active Receipt Data]
    end

    subgraph User Actions
        SelectSize["ItemCard: Select Size"] -->|onAdd(item, size)| cart
        AdjustQty["CartItem: + / -"] -->|onUpdateQuantity(cartKey, qty)| cart
        ApplyDiscount["Input Discount"] --> discount
        Checkout["Click Proceed to Bill"] -->|POST /api/sales| ServerAPI["Backend API"]
    end

    ServerAPI -->|Updated Stock| items
```

---

## 5. Styling & Print Styles (`src/index.css`)

- Pure CSS utilizing CSS variables for theme consistency:
  - `--bg-primary`, `--bg-secondary`, `--bg-card`
  - `--accent-green: #00ffa3`
  - `--accent-hover: #00d285`
  - `--text-primary`, `--text-secondary`
- Responsive grids (`grid-template-columns: repeat(auto-fill, minmax(...))`).
- `@media print` rules tailored for thermal or standard receipt printers:
  - Hides navigation bars, buttons, and background elements.
  - Centers the receipt voucher and sets black text on white background.

