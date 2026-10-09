# CRM Sales Management System API

Production-ready RESTful backend API for a complete **CRM Sales Management System** built with **Node.js, Express.js, MongoDB, and Mongoose**. The system manages the end-to-end sales lifecycle: **Lead Generation → Qualification → Atomic Customer Conversion → Deal Pipeline Management → Deal Closure**.

---

## 🌟 Key Features

- **Robust Role-Based Access Control (RBAC)**: Supports `Admin`, `Sales Manager`, and `Sales Executive` with strictly scoped resource access.
- **Lead Lifecycle Management**: Track leads by source, status (`new`, `contacted`, `qualified`, `unqualified`, `converted`, `lost`), priority (`low`, `medium`, `high`), and assigned sales representative.
- **Atomic Lead Conversion**: Safely convert qualified leads into `Customer` records and linked `Deal` contracts using MongoDB sessions/transactions.
- **Sales Deal Pipeline with Enforced Business Rules**:
  - Validation of stage transitions (`Qualification`, `Discovery`, `Proposal`, `Negotiation`, `Won`, `Lost`).
  - Lost deal reason requirement (`lostReason`).
  - Automatic calculation of expected revenue (`value * probability / 100`).
- **Activity & Follow-Up System**: Schedule calls, meetings, emails, and follow-ups with automatic dynamic overdue status tracking.
- **Audit History / Timeline**: Automatic logging of critical actions (lead status updates, reassignments, deal stage changes, lead conversions).
- **Sales Analytics & Dashboard APIs**:
  - Global overview metrics (Total leads, converted count, total revenue, expected revenue, conversion rate %).
  - Sales Pipeline stage metrics (count & deal value per stage).
  - Team performance breakdown for managers.
- **Advanced Querying**: Universal server-side pagination, text search, multi-field filtering, and date-range filtering.
- **Production-Grade Security**: JWT & HttpOnly cookie support, password hashing with bcrypt, Helmet security headers, rate limiting, and Zod input validation.
- **Interactive Documentation**: Embedded Swagger UI at `http://localhost:4040/api-docs` and a ready-to-import Postman collection (`CRM_Sales_Management_System.postman_collection.json`).

---

## 🏗️ Architecture & Project Structure

The project follows a clean **Layered Architecture** adhering to Separation of Concerns:

```
src/
├── config/             # Environment, Database, Swagger, and Constants (Enums)
├── controllers/        # Request handling and response formatting
├── middleware/         # Auth (JWT/Cookie), RBAC, Rate Limiting, Error Handling
├── models/             # Mongoose Schemas & Database Indexes
├── routes/             # Express API Route definitions
├── seeds/              # Database seed script for rapid testing
├── services/           # Reusable Business Logic, Transactions & Aggregations
├── utils/              # Standardized ApiError, ApiResponse, and Query helpers
└── validators/         # Zod Request Validation Schemas
app.js                  # Express App configuration & middleware pipeline
server.js               # Application entrypoint
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.x or higher
- **MongoDB**: v6.0 or higher running locally or via MongoDB Atlas

### Installation

1. **Navigate to Project Directory**:
   ```bash
   cd api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   NODE_ENV=development
   PORT=4040
   MONGODB_URI=mongodb://127.0.0.1:27017/crm_sales_db
   JWT_SECRET=super_secret_crm_jwt_token_key
   JWT_EXPIRES_IN=7d
   COOKIE_EXPIRES_IN_DAYS=7
   FRONTEND_URL=http://localhost:3000
   ```

4. **Seed Database with Sample Data**:
   ```bash
   npm run seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:4040`.

---

## 🔐 User Roles & Sample Credentials

When you run `npm run seed`, the following sample users are pre-populated:

| Role | Email | Password | Permissions Scope |
|---|---|---|---|
| **Admin** | `admin@odishacrm.com` | `AdminPass123!` | Full system access, user management, global reports |
| **Sales Manager** | `manager@odishacrm.com` | `ManagerPass123!` | Access team leads, reassign leads/deals, team performance |
| **Sales Executive** | `executive1@odishacrm.com` | `ExecutivePass123!` | Access strictly assigned leads, customers, deals, and activities |
| **Sales Executive** | `executive2@odishacrm.com` | `ExecutivePass123!` | Access strictly assigned leads, customers, deals, and activities |

---

## 📖 Complete API Endpoints Reference

### 🌐 System & Documentation
| Method | Full Endpoint URL | Description | Access |
|---|---|---|---|
| `GET` | `http://localhost:4040/health` | Health Check & System Status | Public |
| `GET` | `http://localhost:4040/api-docs` | Interactive Swagger UI Documentation | Public |

---

### 🔑 1. Authentication (`/api/v1/auth`)

#### `POST http://localhost:4040/api/v1/auth/register`
- **Description**: Register a new user account.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+919876543210",
    "password": "UserPass123!",
    "role": "Sales Executive"
  }
  ```

#### `POST http://localhost:4040/api/v1/auth/login`
- **Description**: Authenticate user and receive JWT access token & HttpOnly cookie.
- **Access**: Public
- **Request Body**:
  ```json
  {
    "email": "admin@odishacrm.com",
    "password": "AdminPass123!"
  }
  ```

#### `POST http://localhost:4040/api/v1/auth/logout`
- **Description**: Logout user and clear authentication token cookie.
- **Access**: Authenticated

#### `GET http://localhost:4040/api/v1/auth/me`
- **Description**: Retrieve current logged-in user profile.
- **Access**: Authenticated

#### `PATCH http://localhost:4040/api/v1/auth/change-password`
- **Description**: Update current user password.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "currentPassword": "AdminPass123!",
    "newPassword": "NewSecurePass123!"
  }
  ```

---

### 👤 2. User Management (`/api/v1/users`)

#### `GET http://localhost:4040/api/v1/users`
- **Description**: List all users with pagination, role filtering, and search.
- **Access**: Admin only
- **Query Params**: `page`, `limit`, `search`, `role`, `isActive`

#### `POST http://localhost:4040/api/v1/users`
- **Description**: Create a new user account.
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "name": "Jane Manager",
    "email": "jane@odishacrm.com",
    "phone": "+919876543219",
    "password": "ManagerPass123!",
    "role": "Sales Manager",
    "isActive": true
  }
  ```

#### `GET http://localhost:4040/api/v1/users/:id`
- **Description**: Get user details by ID.
- **Access**: Admin only

#### `PUT http://localhost:4040/api/v1/users/:id`
- **Description**: Update user details (name, phone, role).
- **Access**: Admin only

#### `PATCH http://localhost:4040/api/v1/users/:id/status`
- **Description**: Toggle active status (`isActive: true/false`).
- **Access**: Admin only

#### `DELETE http://localhost:4040/api/v1/users/:id`
- **Description**: Delete user account.
- **Access**: Admin only

---

### 🎯 3. Lead Management (`/api/v1/leads`)

#### `GET http://localhost:4040/api/v1/leads`
- **Description**: Get paginated list of leads.
- **Access**: Authenticated (Executive scope applied)
- **Query Params**: `page`, `limit`, `search`, `status`, `priority`, `source`, `assignedTo`, `isConverted`

#### `POST http://localhost:4040/api/v1/leads`
- **Description**: Create a new lead.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "name": "TechCorp Solutions",
    "email": "leads@techcorp.io",
    "phone": "+18005550199",
    "company": "TechCorp Inc.",
    "source": "website",
    "status": "new",
    "priority": "high",
    "description": "Interested in enterprise cloud CRM migration"
  }
  ```

#### `GET http://localhost:4040/api/v1/leads/:id`
- **Description**: Get lead details by ID.
- **Access**: Authenticated

#### `PUT http://localhost:4040/api/v1/leads/:id`
- **Description**: Update lead details.
- **Access**: Authenticated

#### `PATCH http://localhost:4040/api/v1/leads/:id/status`
- **Description**: Update lead status (`new`, `contacted`, `qualified`, `unqualified`, `converted`, `lost`).
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "status": "qualified"
  }
  ```

#### `PATCH http://localhost:4040/api/v1/leads/:id/assign`
- **Description**: Assign or reassign lead to a sales executive.
- **Access**: Admin & Sales Manager
- **Request Body**:
  ```json
  {
    "assignedTo": "65f1a2b3c4d5e6f7a8b9c0d1"
  }
  ```

#### `POST http://localhost:4040/api/v1/leads/:id/convert`
- **Description**: Atomically convert a lead to a Customer and optional linked Deal.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "customerAddress": "100 Industrial Parkway, Chicago IL",
    "createDeal": true,
    "dealName": "TechCorp Enterprise SaaS Contract",
    "dealValue": 35000,
    "dealProbability": 70,
    "expectedClosingDate": "2026-11-30"
  }
  ```

#### `DELETE http://localhost:4040/api/v1/leads/:id`
- **Description**: Delete lead.
- **Access**: Admin & Sales Manager

---

### 🏢 4. Customer Management (`/api/v1/customers`)

#### `GET http://localhost:4040/api/v1/customers`
- **Description**: Get paginated list of customers.
- **Access**: Authenticated
- **Query Params**: `page`, `limit`, `search`, `status`

#### `POST http://localhost:4040/api/v1/customers`
- **Description**: Create a new customer record.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "name": "Apex Logistics",
    "email": "sales@apexlogistics.com",
    "phone": "+18005550300",
    "company": "Apex Logistics Ltd",
    "address": "100 Industrial Parkway, Chicago IL",
    "status": "Active"
  }
  ```

#### `GET http://localhost:4040/api/v1/customers/:id`
- **Description**: Get customer by ID.
- **Access**: Authenticated

#### `PUT http://localhost:4040/api/v1/customers/:id`
- **Description**: Update customer details.
- **Access**: Authenticated

#### `DELETE http://localhost:4040/api/v1/customers/:id`
- **Description**: Delete customer record.
- **Access**: Admin & Sales Manager

---

### 💼 5. Deal Management (`/api/v1/deals`)

#### `GET http://localhost:4040/api/v1/deals`
- **Description**: Get paginated list of sales deals.
- **Access**: Authenticated
- **Query Params**: `page`, `limit`, `stage`, `minAmount`, `maxAmount`

#### `POST http://localhost:4040/api/v1/deals`
- **Description**: Create a new deal.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "name": "Apex ERP Expansion Deal",
    "customer": "65f1a2b3c4d5e6f7a8b9c0d2",
    "value": 50000,
    "probability": 80,
    "expectedClosingDate": "2026-12-15",
    "stage": "Negotiation",
    "description": "Annual contract expansion"
  }
  ```

#### `GET http://localhost:4040/api/v1/deals/:id`
- **Description**: Get deal details by ID.
- **Access**: Authenticated

#### `PUT http://localhost:4040/api/v1/deals/:id`
- **Description**: Update deal stage/details. (`lostReason` required if setting stage to `Lost`).
- **Access**: Authenticated

#### `DELETE http://localhost:4040/api/v1/deals/:id`
- **Description**: Delete deal.
- **Access**: Admin & Sales Manager

---

### 📅 6. Activity Management (`/api/v1/activities`)

#### `GET http://localhost:4040/api/v1/activities`
- **Description**: Get paginated list of activities with dynamic overdue calculation.
- **Access**: Authenticated
- **Query Params**: `page`, `limit`, `status`, `type`, `entityType`, `entityId`

#### `POST http://localhost:4040/api/v1/activities`
- **Description**: Schedule a new call, meeting, note, or follow-up.
- **Access**: Authenticated
- **Request Body**:
  ```json
  {
    "type": "Call",
    "title": "Initial Discovery Call",
    "description": "Discuss technical requirements",
    "dueDate": "2026-10-15T10:00:00Z",
    "entityType": "Lead",
    "entityId": "65f1a2b3c4d5e6f7a8b9c0d1"
  }
  ```

#### `GET http://localhost:4040/api/v1/activities/:id`
- **Description**: Get activity details by ID.
- **Access**: Authenticated

#### `PUT http://localhost:4040/api/v1/activities/:id`
- **Description**: Update activity details.
- **Access**: Authenticated

#### `PATCH http://localhost:4040/api/v1/activities/:id/complete`
- **Description**: Mark activity as completed (`status: Completed`).
- **Access**: Authenticated

#### `DELETE http://localhost:4040/api/v1/activities/:id`
- **Description**: Delete activity.
- **Access**: Admin & Sales Manager

---

### 🕒 7. Audit History / Timeline (`/api/v1/timeline`)

#### `GET http://localhost:4040/api/v1/timeline/:entityType/:entityId`
- **Description**: Retrieve chronological audit log entries for an entity (`Lead`, `Customer`, `Deal`, `User`).
- **Access**: Authenticated

---

### 📊 8. Dashboard & Analytics (`/api/v1/dashboard`)

#### `GET http://localhost:4040/api/v1/dashboard/overview`
- **Description**: Retrieve summary sales metrics (Lead totals, Converted %, Deal counts, Total revenue, Expected revenue, Activities stats).
- **Access**: Authenticated

#### `GET http://localhost:4040/api/v1/dashboard/pipeline`
- **Description**: Retrieve deal counts, total value, and expected revenue per pipeline stage.
- **Access**: Authenticated

#### `GET http://localhost:4040/api/v1/dashboard/team-performance`
- **Description**: Retrieve sales executive performance metrics (Leads, Customers, Won deals, Revenue, Win rate %).
- **Access**: Admin & Sales Manager

---

## ⚡ Database Optimization & Indexing

The Mongoose models include compound and field-level indexes for query performance:
- `User`: `{ email: 1 }`, `{ role: 1 }`, `{ isActive: 1 }`
- `Lead`: `{ status: 1 }`, `{ priority: 1 }`, `{ source: 1 }`, `{ assignedTo: 1 }`, `{ assignedTo: 1, status: 1 }`
- `Customer`: `{ email: 1 }`, `{ assignedTo: 1 }`, `{ originalLead: 1 }`
- `Deal`: `{ stage: 1 }`, `{ assignedTo: 1 }`, `{ customer: 1 }`, `{ value: 1 }`, `{ expectedClosingDate: 1 }`
- `Activity`: `{ assignedTo: 1 }`, `{ status: 1 }`, `{ dueDate: 1 }`, `{ entityType: 1, entityId: 1 }`
- `Timeline`: `{ entityType: 1, entityId: 1 }`, `{ timestamp: -1 }`

---

## ⚖️ Business Logic Enforcements

1. **Atomic Lead Conversion**: A lead can only be converted once. The backend executes a transaction session creating a `Customer` and `Deal`, marking the lead `Converted`, and appending audit history logs.
2. **Deal Stage Integrity**: Closed `Won` or `Lost` deals cannot be moved back to active stages by `Sales Executive` without Manager/Admin intervention.
3. **Lost Deal Reason**: Updating stage to `Lost` requires providing a valid `lostReason`.
4. **Dynamic Overdue Tracking**: Activities with `status: 'Pending'` whose `dueDate` is earlier than `now()` automatically reflect `isOverdue: true`.
