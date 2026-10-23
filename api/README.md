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

5. **Run Automated Test Suite (32 Verification Tests)**:
   ```bash
   npm test
   ```

6. **Start Development Server**:
   ```bash
   npm run dev
   ```

The server will start at `http://localhost:4040`.

---

## 🔐 User Roles & Sample Credentials

When you run `npm run seed`, the following sample users and teams are pre-populated:

| Role | Email | Password | Permissions Scope & Team |
|---|---|---|---|
| **Admin** | `admin@odishacrm.com` | `AdminPass123!` | Full system access, CRM configuration, user management, global reports |
| **Sales Manager (Team 1)** | `manager@odishacrm.com` | `ManagerPass123!` | Access Team 1 leads/deals, reassign within Team 1, Team 1 performance |
| **Sales Manager (Team 2)** | `manager2@odishacrm.com` | `ManagerPass123!` | Access Team 2 leads/deals, reassign within Team 2, Team 2 performance |
| **Sales Executive (Team 1)** | `executive1@odishacrm.com` | `ExecutivePass123!` | Access strictly assigned leads, customers, deals, and activities |
| **Sales Executive (Team 1)** | `executive2@odishacrm.com` | `ExecutivePass123!` | Access strictly assigned leads, customers, deals, and activities |
| **Sales Executive (Team 2)** | `executive3@odishacrm.com` | `ExecutivePass123!` | Access strictly assigned leads, customers, deals, and activities |

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
- **Access**: Admin & Sales Manager (Sales Executives permitted for their own leads only if `allowExecutiveLeadReassignment` is enabled in CRM config)
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
- **Description**: Update deal stage/details.
  - `lostReason` required when marking stage as `Lost`.
  - `expectedClosingDate` (if provided) must be today or a future date.
  - Closed deals (`Won` / `Lost`) cannot be modified by Sales Executives. Reopening back to an active pipeline stage by Manager/Admin requires a mandatory non-empty `reopenReason` and logs an audit record.
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

### ⚙️ 9. CRM Configuration & Settings (`/api/v1/config`)

#### `GET http://localhost:4040/api/v1/config`
- **Description**: Retrieve current CRM configuration (company name, currency, timezone, lead sources, deal stages, default probabilities).
- **Access**: Authenticated

#### `PUT http://localhost:4040/api/v1/config` (or `PATCH`)
- **Description**: Update system CRM configuration.
- **Access**: Admin only
- **Request Body**:
  ```json
  {
    "companyName": "Odisha CRM Solutions",
    "currency": "USD",
    "timezone": "UTC",
    "allowExecutiveLeadReassignment": false
  }
  ```

---

## ⚡ Database Optimization & Indexing

The Mongoose models include compound and field-level indexes for query performance:
- `User`: `{ email: 1 }`, `{ role: 1 }`, `{ isActive: 1 }`, `{ manager: 1 }`
- `Lead`: `{ status: 1 }`, `{ priority: 1 }`, `{ source: 1 }`, `{ assignedTo: 1 }`, `{ assignedTo: 1, status: 1 }`
- `Customer`: `{ email: 1 }`, `{ assignedTo: 1 }`, `{ originalLead: 1 }`
- `Deal`: `{ stage: 1 }`, `{ assignedTo: 1 }`, `{ customer: 1 }`, `{ value: 1 }`, `{ expectedClosingDate: 1 }`
- `Activity`: `{ assignedTo: 1 }`, `{ status: 1 }`, `{ dueDate: 1 }`, `{ entityType: 1, entityId: 1 }`
- `Timeline`: `{ entityType: 1, entityId: 1 }`, `{ timestamp: -1 }`
- `CrmConfig`: `{ isDefault: 1 }`

---

## ⚖️ Business Logic Enforcements

1. **Strict Qualified Lead Conversion & Full Atomicity**:
   - Only leads in `qualified` status can be converted. Leads in `new`, `contacted`, `lost`, or `unqualified` status are blocked with a clear 400 error.
   - Converts atomically into `Customer` and optional `Deal`. On MongoDB replica sets, transactions are utilized. On standalone MongoDB instances without replica sets, an automatic compensating rollback engine cleans up any created records if a failure occurs at any stage, preventing partial conversions.
   - `customerAddress` is supported and persisted into the created `Customer`.
2. **Lead Status & Assignment Integrity & Dynamic Config Enforcement**:
   - Status cannot be directly set to `converted` via `PUT /leads/:id` or `PATCH /leads/:id/status`. Conversion must go through `POST /leads/:id/convert`.
   - Converted leads cannot have their status modified or be reassigned.
   - Direct lead reassignment via `PUT /leads/:id` is blocked. Reassignment is strictly handled via `PATCH /leads/:id/assign`.
   - The system dynamically checks `allowExecutiveLeadReassignment` from `CrmConfig`. By default, this is `false`, restricting reassignment to Admin and Sales Manager. When an Admin enables this flag, Sales Executives can reassign their own leads.
   - Leads can only be assigned to users with the `Sales Executive` role.
3. **Sales Manager Team Scope**:
   - Sales Managers are strictly scoped to their team's records (their own and their assigned executives).
   - Managers can only assign or reassign leads and deals to executives within their own team.
   - Dashboard team performance metrics reflect only team executives when viewed by a Sales Manager.
4. **Related-Entity Ownership Scoping on Create**:
   - Creating a Deal verifies document ownership of the linked `Customer` (and linked `Lead` if provided). An executive cannot create a deal on a customer assigned to another executive/team.
   - Creating an Activity verifies document ownership of the target entity (`Lead`, `Customer`, or `Deal`).
   - Creating a Customer referencing an `originalLead` verifies that the requesting user owns that lead.
5. **Deal Business Validation & Stage Integrity**:
   - `expectedClosingDate` is verified as a valid date and must be today or in the future for both deal creation and deal updates.
   - Closed `Won` or `Lost` deals cannot be moved back to active stages by `Sales Executive` under any circumstances.
   - When a Sales Manager or Admin reopens a closed deal, a non-empty `reopenReason` is required and recorded in the audit trail.
   - Updating deal stage to `Lost` requires providing a valid non-empty `lostReason`.
6. **Timeline Audit Trail Integrity & Scoped Security**:
   - Completing a follow-up activity automatically writes `Follow-up Completed` to the timeline.
   - Creating a customer directly writes `Customer Created` to the audit log.
   - Reopening a closed deal writes `Deal Stage Changed` with the manager's role, name, and reopen justification.
   - The timeline GET endpoint verifies document ownership so executives cannot view audit history of records outside their permissions.
7. **Dynamic Overdue Tracking & Dashboard Count Parity**:
   - Activities with `status: 'Pending'` whose `dueDate` is earlier than `now()` automatically return `isOverdue: true` and `status: 'Overdue'`.
   - Filtering activities with `?status=Overdue` or `?status=Pending` works accurately and returns the expected subsets.
   - Dashboard `activities.pending` strictly counts active pending activities (`dueDate >= now`), matching `GET /activities?status=Pending`. Overdue items are counted exclusively under `activities.overdue`.
8. **E.164 Phone Format Validation**:
   - Phone numbers on Users, Leads, and Customers are validated in both Mongoose schemas and Zod validators against standard E.164 format (10 to 15 digits, optional leading `+`).
9. **Role Escalation Protection**:
   - Public registration (`POST /api/v1/auth/register`) is strictly locked to `Sales Executive`. Administrative and Manager accounts can only be provisioned by authenticated Admins.
   - Swagger OpenAPI specification accurately advertises only `Sales Executive` for public registration.

