# Functional Requirements & Business Logic

## 1. Core Capabilities Overview

Vergo POS solves the operational challenges of an apparel boutique:
1. Fast product browsing and searching at the checkout counter.
2. Apparel sizing variants (XS to 4XL) with distinct stock counters per size.
3. Flexible shopping cart with automated inventory guardrails.
4. Promotional discounts with instant balance recalculation.
5. Receipt generation with thermal print support and email capability.
6. Centralized inventory control, live valuation, and daily financial closeout.

---

## 2. Retail Cashier Workflows

### 2.1 Product Selection & Size Picking
- The POS displays cards with all active items.
- For apparel with sizing, available sizes are displayed with live stock numbers.
- If a size has 3 or fewer items remaining, a low-stock indicator is highlighted.
- Cashier clicks `+` and selects the customer's desired size from the picker dropdown.

### 2.2 Cart Rules & Stock Limits
- Each unique item-and-size combination creates a separate line item:
  $$\text{CartKey} = \text{itemId} + \text{"-"} + \text{size}$$
- **Ceiling Enforcement**: The cashier cannot increment the quantity beyond the current available inventory of that size.
- When the cart hits the stock ceiling, further increments are disabled and a warning displays: `Max stock reached for size <SIZE> (<STOCK>)`.

### 2.3 Discount Management
- Supports percentage discount input (0% – 100%).
- Calculates:
  $$\text{DiscountAmount} = \frac{\text{CartTotal} \times \text{DiscountValue}}{100}$$
  $$\text{FinalTotal} = \max(\text{CartTotal} - \text{DiscountAmount}, 0)$$
- Client validates against negative discounts or values exceeding 100%.

### 2.4 Checkout, Receipts & Email Billing
1. Order ID generation follows the pattern `VRG-XXXX-XXXX` using pseudorandom digits and epoch timestamps.
2. The order is submitted to `POST /api/sales`.
3. If stock is insufficient (e.g. concurrent checkout by another cashier), backend rejects the request with HTTP 400 and an itemized failure message.
4. On success:
   - Receipt Modal appears with store branding, order ID, timestamp, and itemized table.
   - Cashier can click **Print Receipt** (`window.print()`).
   - If a customer email is supplied, a standard `mailto:` link automatically opens the system email client formatted with a store invoice.

---

## 3. Back-Office & Administrator Workflows

### 3.1 Inventory Management
- **Add Product**: Admins define product name, selling price in LKR, category, and initial stock quantities across all supported sizes (`XS` through `4XL`).
- **Edit Product**: Modify pricing, rename, change category, or replenish sizes individually.
- **Delete Product**: Permanently removes the item from the catalog.

### 3.2 Real-Time Metrics & Valuation
The Admin Dashboard calculates:
- Total Items: $\sum \text{Item}$
- Total Units in Stock: $\sum_{i \in \text{Items}} \sum_{s \in \text{Sizes}} \text{stock}(i, s)$
- Total Inventory Value: $\sum_{i \in \text{Items}} \left( \text{price}_i \times \sum_{s \in \text{Sizes}} \text{stock}(i, s) \right)$
- Active Revenue: $\sum_{s \in \text{Sales}} \text{totalAmount}_s$

### 3.3 Daily Sales Closeout & Archiving
- At end of day, admin clicks **Reset Sales**.
- A custom modal confirms the action to avoid accidental reset.
- The backend compiles all current sales into a `DailyReport` entry.
- Current sales are purged, returning active daily revenue to zero.
- Admins can open the **Daily Reports Archive** to audit past dates, total revenue, discount totals, and order histories.

