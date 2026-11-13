# REST API Reference

All requests and responses use JSON (`Content-Type: application/json`).

Protected endpoints require the `x-auth-token` HTTP header containing a valid JWT.

---

## 1. Authentication Endpoints

### 1.1 Admin Setup
- **Endpoint**: `POST /api/admin/setup`
- **Access**: Public (Initial setup only)
- **Description**: Creates the first admin user.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "StrongPassword123"
  }
  ```
- **Responses**:
  - `201 Created`: `{ "message": "Admin user created successfully." }`
  - `400 Bad Request`: `{ "message": "Admin user already exists." }`
  - `500 Server Error`: `{ "message": "Server error", "error": "..." }`

### 1.2 Admin Login
- **Endpoint**: `POST /api/admin/login`
- **Access**: Public
- **Description**: Authenticates administrator credentials and returns a JWT token.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "StrongPassword123"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "username": "admin"
    }
    ```
  - `401 Unauthorized`: `{ "message": "Invalid credentials." }`

### 1.3 Seller Setup
- **Endpoint**: `POST /api/seller/setup`
- **Access**: Public
- **Description**: Creates a seller/cashier account.
- **Request Body**:
  ```json
  {
    "username": "seller",
    "password": "SellerPassword123"
  }
  ```
- **Responses**:
  - `201 Created`: `{ "message": "Seller created successfully." }`
  - `400 Bad Request`: `{ "message": "Seller already exists." }`

### 1.4 Seller Login
- **Endpoint**: `POST /api/seller/login`
- **Access**: Public
- **Description**: Authenticates cashier credentials and returns a JWT token.
- **Request Body**:
  ```json
  {
    "username": "seller",
    "password": "SellerPassword123"
  }
  ```
- **Responses**:
  - `200 OK`:
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "username": "seller"
    }
    ```
  - `401 Unauthorized`: `{ "message": "Invalid credentials." }`

---

## 2. Inventory Items Endpoints

### 2.1 Get All Items
- **Endpoint**: `GET /api/items`
- **Access**: Public (Used by POS and Admin)
- **Description**: Returns all items sorted descending by creation date, with normalized stock size maps.
- **Response**: `200 OK`
  ```json
  [
    {
      "_id": "64fa1b2e4f1a2c0012345678",
      "name": "Classic Oversized Tee",
      "price": 2500,
      "category": "T-Shirts",
      "stock": {
        "XS": 5,
        "S": 10,
        "M": 15,
        "L": 12,
        "XL": 8,
        "2XL": 4,
        "3XL": 0,
        "4XL": 0
      },
      "createdAt": "2026-03-01T10:00:00.000Z",
      "updatedAt": "2026-03-01T10:00:00.000Z"
    }
  ]
  ```

### 2.2 Create Item
- **Endpoint**: `POST /api/items`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Request Body**:
  ```json
  {
    "name": "Heavyweight Hoodie",
    "price": 5500,
    "category": "Hoodies",
    "stock": {
      "S": 5,
      "M": 10,
      "L": 10,
      "XL": 5
    }
  }
  ```
- **Responses**:
  - `201 Created`: Returns newly created item document.
  - `400 Bad Request`: `{ "message": "Please provide name, price, and category." }`
  - `401 Unauthorized`: `{ "message": "No token, authorization denied" }`

### 2.3 Update Item
- **Endpoint**: `PUT /api/items/:id`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Request Body**:
  ```json
  {
    "name": "Heavyweight Hoodie (Updated)",
    "price": 5800,
    "category": "Hoodies",
    "stock": {
      "XS": 0,
      "S": 8,
      "M": 12,
      "L": 10,
      "XL": 6,
      "2XL": 2,
      "3XL": 0,
      "4XL": 0
    }
  }
  ```
- **Responses**:
  - `200 OK`: Returns updated item document.
  - `404 Not Found`: `{ "message": "Item not found." }`

### 2.4 Update Item Stock (Legacy)
- **Endpoint**: `PUT /api/items/:id/stock`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Request Body**: `{ "stock": 25 }`
- **Responses**:
  - `200 OK`: Returns updated item.

### 2.5 Delete Item
- **Endpoint**: `DELETE /api/items/:id`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Responses**:
  - `200 OK`: `{ "message": "Item deleted." }`
  - `404 Not Found`: `{ "message": "Item not found." }`

---

## 3. Sales & Reports Endpoints

### 3.1 Record New Sale
- **Endpoint**: `POST /api/sales`
- **Access**: Public (Called during checkout)
- **Request Body**:
  ```json
  {
    "items": [
      {
        "id": "64fa1b2e4f1a2c0012345678",
        "name": "Classic Oversized Tee",
        "size": "M",
        "price": 2500,
        "quantity": 2
      }
    ],
    "subtotalAmount": 5000,
    "discountAmount": 500,
    "totalAmount": 4500,
    "customerEmail": "customer@example.com",
    "customerName": "Kamal Perera",
    "orderNumber": "VRG-4819-2819"
  }
  ```
- **Responses**:
  - `201 Created`: Returns created `Sale` document.
  - `200 OK`: Returns existing sale if `orderNumber` duplicate detected.
  - `400 Bad Request`: If requested quantity exceeds size inventory or required fields are missing.
    ```json
    {
      "message": "Insufficient stock for \"Classic Oversized Tee\" in size M. Available: 1, Requested: 2"
    }
    ```

### 3.2 Get Active Sales
- **Endpoint**: `GET /api/sales`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Response**: `200 OK`: Array of active sales documents.

### 3.3 Get Daily Reports Archive
- **Endpoint**: `GET /api/sales/reports`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Response**: `200 OK`: Array of archived daily reports sorted by date descending.

### 3.4 Reset & Archive Daily Sales
- **Endpoint**: `DELETE /api/sales/reset`
- **Access**: Private (Admin Only)
- **Headers**: `x-auth-token: <JWT>`
- **Responses**:
  - `200 OK`:
    ```json
    {
      "message": "Sales archived and reset successfully.",
      "report": {
        "_id": "651a2b3c4d5e6f7a8b9c0d1e",
        "reportDate": "2026-03-01T21:00:00.000Z",
        "totalRevenue": 45000,
        "totalOrders": 12,
        "totalDiscounts": 3200,
        "sales": [ ... ]
      }
    }
    ```
  - `400 Bad Request`: `{ "message": "No active sales to reset." }`

