# Budget & Expense Tagging System

> Software Engineering Documentation  
> Repository: Rahul2245/Budget-and-Expense-TaggingDB  
> Architecture: Three-Tier · REST API · MVC  
> Stack: React · Node.js · Express · MySQL  
> Version: 1.0 — March 2026

## 01. What is Budget & Expense Tagging?

The **Budget & Expense Tagging System** is a full-stack personal finance management web application that enables users to track income and expenditures, set financial goals, allocate budgets across categories, and gain visual insight into spending patterns — all through a unified, responsive dashboard.

The system implements a clean **three-tier architecture**: a React-based SPA as the presentation layer, an Express.js RESTful API as the application layer, and a MySQL relational database as the persistence layer. Docker Compose orchestrates the entire runtime environment for consistent local and production deployment.

At its core, the application solves a key problem in personal finance: fragmented data. Users can tag each transaction with categories and custom labels, then visualize aggregated data through interactive Recharts-powered charts — giving a 360° view of financial health.

### Core Functional Goals
- User authentication & session management
- Multi-account transaction CRUD
- Category & tag-based expense classification
- Budget limit setting & monitoring
- Savings goal tracking
- Real-time analytics dashboard (income, expenses, net)
- Interactive charts — line, pie, bar

### Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, React Router, Axios, Recharts, Vite, Tailwind CSS |
| Backend | Node.js, Express.js, REST API, JWT / Middleware Auth, Async/Await |
| Data & DevOps | MySQL, SQL Schema, Docker Compose, npm, Git |

## 02. High-Level System Architecture

The system follows a **classic three-tier architecture** with a clear separation between presentation, business logic, and data. All tiers are containerised via Docker Compose and communicate exclusively through well-defined HTTP/REST interfaces, making each tier independently replaceable and testable.

### Architectural Pattern
- MVC on the backend — models map to MySQL tables, controllers handle routes, views are served by React
- SPA + REST — decoupled frontend calls stateless API endpoints
- Service-per-resource — each business domain (budgets, tags, accounts) has an isolated route module
- Middleware pipeline — auth, validation, and error handling as composable Express middleware

### Request Lifecycle
1. User interacts with React UI component
2. Axios issues HTTP request with JWT Bearer token
3. Express router matches URL and method
4. Auth middleware verifies token
5. Controller delegates to service function
6. Service executes parameterised SQL via mysql2
7. MySQL returns rows; service maps to JS objects
8. Controller sends JSON response (200/4xx/5xx)
9. Axios response interceptor handles errors globally
10. React state updates → UI re-renders

## 03. Client Layer

The client is a **React Single-Page Application** bootstrapped with Vite, which provides near-instant HMR during development and optimised production builds. The entire UI lives inside the `budget_frontend/` directory and communicates exclusively via Axios HTTP calls to the backend API.

### Directory Structure
```text
budget_frontend/
├── src/
│   ├── components/         # Reusable UI atoms & molecules
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TransactionForm.jsx
│   │   ├── BudgetCard.jsx
│   │   └── GoalProgress.jsx
│   ├── pages/              # Route-level page components
│   │   ├── Dashboard.jsx   # Analytics overview
│   │   ├── Transactions.jsx
│   │   ├── Budgets.jsx
│   │   ├── Goals.jsx
│   │   ├── Accounts.jsx
│   │   └── Login.jsx / Register.jsx
│   ├── api/                # Axios instance + service modules
│   │   └── axiosConfig.js
│   ├── context/            # React Context for global auth state
│   │   └── AuthContext.jsx
│   ├── App.jsx             # Router & layout wrapper
│   └── main.jsx            # Vite entry point
├── index.html
├── vite.config.js
└── package.json
```

### Key Modules

#### React Router v6
Client-side routing with protected routes. Auth guard wraps all private pages — unauthenticated users are redirected to `/login`. Navigation is managed without full page reloads.

#### Recharts Dashboard
Financial data rendered as interactive Recharts components. The dashboard shows Line Chart (spending over time), Pie Chart (category breakdown), and Bar Chart (budget vs actual per month).

#### Auth Context
Global React Context stores the authenticated user object and JWT token in memory. Login/logout functions trigger API calls and update context, propagating auth state to all child components.

### Pages & Component Map

| Route | Component | Description | Charts Used |
|---|---|---|---|
| `/login` | `Login.jsx` | Credential form, POST `/auth/login` | — |
| `/register` | `Register.jsx` | New user creation form | — |
| `/dashboard` | `Dashboard.jsx` | Analytics overview — income, expenses, savings KPIs | Line, Pie, Bar |
| `/transactions` | `Transactions.jsx` | Full transaction list with filter, add, edit, delete | — |
| `/budgets` | `Budgets.jsx` | Budget allocation per category with usage bar | Bar |
| `/goals` | `Goals.jsx` | Savings goals with progress ring | Radial |
| `/accounts` | `Accounts.jsx` | Multi-account balance summary | Pie |
| `/savings` | `Savings.jsx` | Savings account tracking | Line |

## 04. Communication Layer

All client-server communication is performed over **HTTP/HTTPS** using **Axios** as the HTTP client. A single Axios instance is configured with a base URL (from the `.env` file), request interceptors that automatically inject the JWT Bearer token, and response interceptors that centralise error handling (401 → auto-logout, 5xx → toast error).

### Axios Instance Configuration
```js
// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  // e.g. http://localhost:5000/api
  headers: {
    'Content-Type': 'application/json'
  }
});

// ── Request Interceptor ──
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token)
    config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response Interceptor ──
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401)
      redirectToLogin();
    return Promise.reject(err);
  }
);

export default api;
```

### Communication Protocols
- REST over HTTP 1.1 — all API calls use standard HTTP verbs mapped to CRUD semantics
- JSON as the sole data interchange format for both requests and responses
- JWT Bearer auth — the server returns a signed JWT after login, and Axios attaches it as `Authorization: Bearer <token>` on subsequent calls
- Environment config — `.env` defines `VITE_API_URL` (frontend) and `DB_*` vars (backend), passed into containers at runtime

### Request / Response Contract

| Attribute | Request | Response (Success) | Response (Error) |
|---|---|---|---|
| Format | JSON body | JSON | JSON |
| Auth Header | `Authorization: Bearer <jwt>` | — | — |
| Content-Type | `application/json` | `application/json` | `application/json` |
| Success Envelope | — | `{ data: [...], message: "" }` | — |
| Error Envelope | — | — | `{ error: "msg", code: 4xx }` |

## 05. API Calling Layer (RESTful API)

The backend exposes **10+ RESTful endpoints** organised by resource. Each endpoint is handled by an Express.js route file backed by a controller. The middleware pipeline enforces authentication before any protected route handler executes. All database interactions are asynchronous, using `async/await` with `mysql2/promise`.

### Middleware Pipeline
Request In → CORS Middleware → `express.json()` → Auth Middleware → Route Controller → Error Handler → Response Out

### API Endpoint Reference

#### Authentication
- `POST /api/auth/register` — Register new user; hashes password, returns JWT
- `POST /api/auth/login` — Authenticate credentials; returns JWT token
- `GET /api/auth/me` — Return current authenticated user profile

#### Transactions
- `GET /api/transactions` — Fetch all transactions for authenticated user (supports filter: date, category, account)
- `POST /api/transactions` — Create new transaction: amount, type (income/expense), category_id, account_id, tags[]
- `PUT /api/transactions/:id` — Update an existing transaction by ID
- `DELETE /api/transactions/:id` — Delete a transaction by ID

#### Budgets
- `GET /api/budgets` — List all budgets for user with current spending totals
- `POST /api/budgets` — Create budget: category_id, limit_amount, period (monthly/weekly)
- `PUT /api/budgets/:id` — Update budget limit or period
- `DELETE /api/budgets/:id` — Remove a budget allocation

#### Goals, Accounts, Categories & Tags
- `GET /api/goals` — Retrieve all financial goals with progress percentage
- `POST /api/goals` — Create financial goal: name, target_amount, deadline
- `GET /api/accounts` — List all user accounts (checking, savings, credit)
- `POST /api/accounts` — Create new account with type and initial balance
- `GET /api/categories` — Retrieve default & user-defined categories
- `GET /api/tags` — Retrieve all tags for the authenticated user
- `POST /api/tags` — Create a new custom tag
- `GET /api/analytics/summary` — Aggregated income, expense, savings totals for dashboard KPIs
- `GET /api/savings` — List savings accounts and deposits

## 06. Microservices (Service Layer)

While the application is deployed as a single monolithic Node.js process, it is **architecturally structured as microservices** — each business domain is implemented as an isolated route module with its own controller, service function set, and data access logic. This makes it straightforward to extract any module into an independent service in the future.

Each service lives inside `budget_backend_2/routes/` and `budget_backend_2/controllers/`. Services communicate only through function calls (no inter-service HTTP) and share a single MySQL connection pool.

### Auth Service
**Responsibility:** User registration, login, JWT issuance and verification.
- Hashes passwords with bcrypt
- Signs JWT with secret from `.env`
- Exports `verifyToken` middleware for all protected routes
- Stores user records in `users` table

### Transaction Service
**Responsibility:** Full CRUD for financial transactions — the core domain entity.
- Creates, retrieves, updates, deletes transactions
- Links transactions to accounts, categories, and tags (M:N via junction table)
- Supports filtering by date range, category, account, amount
- Distinguishes income vs. expense type for aggregation

### Budget Service
**Responsibility:** Define spending limits per category and period; compute usage.
- Stores budget limits per category (monthly/weekly)
- Aggregates actual spending from transactions table on the fly
- Returns budget utilisation % for dashboard progress bars
- Alerts when approaching or exceeding limits

### Goals Service
**Responsibility:** Manage long-term savings goals and track progress.
- CRUD for goal records (name, target amount, deadline)
- Computes progress by summing linked deposits
- Returns % complete and projected completion date

### Account Service
**Responsibility:** Manage multiple financial accounts (checking, savings, credit).
- CRUD for account records with type and balance
- Balance is updated on each transaction create/delete
- Supports multi-account split transactions

### Category & Tag Service
**Responsibility:** Taxonomy management for tagging and categorising expenses.
- Seed default categories (Food, Transport, Entertainment…)
- Allow user-created custom categories and free-form tags
- Tags linked to transactions via M:N junction table
- Power category-level budget grouping and pie chart breakdown

### Analytics Service
**Responsibility:** Produce aggregated financial summaries for the dashboard.
- Total income, total expenses, net savings for any date range
- Monthly trend arrays (for Line Chart)
- Per-category spending breakdown (for Pie Chart)
- Budget vs actual comparison (for Bar Chart)

### Savings Account Service
**Responsibility:** Track dedicated savings accounts and deposit history.
- Separate from general accounts — dedicated savings tracking
- Records individual deposits with dates
- Feeds data into goal progress calculations

### Service Interaction Diagram
- Request from Route Controller → Transaction Service
- Transaction Service coordinates with:
  - Account Service (update balance)
  - Category/Tag Service (resolve IDs, attach tags)
- Analytics Service reads aggregated views
- All services persist through MySQL DB

## 07. Data & Storage Layer

All persistent state is stored in a **MySQL 8 relational database**. The schema is designed around the central `transactions` entity, with supporting tables for users, accounts, categories, tags, budgets, goals, and savings. A junction table implements the many-to-many relationship between transactions and tags.

The Node.js backend connects using `mysql2/promise` with a connection pool, ensuring efficient connection reuse across concurrent requests. The pool configuration is loaded from environment variables.

### Entity-Relationship Overview
- `users` 1→N `accounts` 1→N `transactions`
- `users` 1→N `budgets`
- `users` 1→N `goals`
- `users` 1→N `savings_accounts`
- `users` 1→N `categories`
- `transactions` N↔M `tags` via `transaction_tags`

### Database Schema

#### `users`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `name` | VARCHAR(100) NOT NULL |
| `email` | VARCHAR(150) UNIQUE NOT NULL |
| `password_hash` | VARCHAR(255) NOT NULL |
| `created_at` | TIMESTAMP DEFAULT NOW() |

#### `accounts`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `user_id` | INT FK → users.id |
| `name` | VARCHAR(100) |
| `type` | ENUM('checking','savings','credit') |
| `balance` | DECIMAL(15,2) DEFAULT 0 |

#### `categories`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `user_id` | INT FK (nullable = default) |
| `name` | VARCHAR(80) NOT NULL |
| `icon` | VARCHAR(20) |

#### `tags`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `user_id` | INT FK → users.id |
| `name` | VARCHAR(50) NOT NULL |

#### `transactions`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `user_id` | INT FK → users.id |
| `account_id` | INT FK → accounts.id |
| `category_id` | INT FK → categories.id |
| `amount` | DECIMAL(12,2) NOT NULL |
| `type` | ENUM('income','expense') |
| `description` | TEXT |
| `transaction_date` | DATE NOT NULL |
| `created_at` | TIMESTAMP DEFAULT NOW() |

#### `transaction_tags` (junction)
| Column | Type |
|---|---|
| `transaction_id` | INT FK → transactions.id |
| `tag_id` | INT FK → tags.id |
|  | PRIMARY KEY (transaction_id, tag_id) |

#### `budgets`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `user_id` | INT FK → users.id |
| `category_id` | INT FK → categories.id |
| `limit_amount` | DECIMAL(12,2) |
| `period` | ENUM('monthly','weekly') |

#### `goals`
| Column | Type |
|---|---|
| `id` | INT AUTO_INCREMENT PK |
| `user_id` | INT FK → users.id |
| `name` | VARCHAR(100) |
| `target_amount` | DECIMAL(12,2) |
| `current_amount` | DECIMAL(12,2) DEFAULT 0 |
| `deadline` | DATE |

### Connection Pool Configuration
```js
// budget_backend_2/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // from .env / docker-compose
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

## 08. Security Design

### Password Security
Passwords are hashed using bcrypt with a configurable salt rounds factor before storage. Plaintext passwords are never persisted or logged.

### JWT Authentication
Stateless authentication via signed JSON Web Tokens. The server never stores sessions — each request carries a self-contained token verified against the secret on every protected endpoint.

### SQL Injection Prevention
All SQL statements use parameterised queries via `mysql2` placeholders (`?`), completely preventing SQL injection attacks regardless of user input.

### CORS Policy
Express CORS middleware restricts cross-origin requests to the known frontend origin, preventing unauthorised third-party sites from calling the API.

### Env Secrets
All sensitive configuration (DB credentials, JWT secret, API ports) is stored in the `.env` file and injected at runtime. Secrets are never committed to source code.

### Input Validation
Controller-level validation rejects malformed or incomplete request bodies before they reach the service layer, providing a first line of defence against invalid data.

## 09. Deployment Architecture

The project uses Docker Compose to orchestrate three containers — frontend, backend, and MySQL database — on a shared internal network. This ensures consistent environments across developer machines and production servers, eliminating "works on my machine" issues.

### Container: db
MySQL 8 official image. Data persisted in a named Docker volume. Initialised by schema migration script on first start.

### Container: backend
Node.js 18 + Express server. Listens on port 5000. Waits for DB health before starting. Reads all config from env vars.

### Container: frontend
Vite dev server (development) or Nginx serving static build (production). Calls backend via Docker internal DNS name.

### docker-compose layout
```yaml
version: '3.8'
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - db_data:/var/lib/mysql
    ports: ["3306:3306"]

  backend:
    build: ./budget_backend_2
    environment:
      DB_HOST: db
      DB_USER: ${DB_USER}
      DB_PASSWORD: ${DB_PASSWORD}
      DB_NAME: ${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
    ports: ["5000:5000"]
    depends_on: [db]

  frontend:
    build: ./budget_frontend
    environment:
      VITE_API_URL: http://backend:5000/api
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  db_data:
```

## 10. Non-Functional Requirements

- MySQL connection pooling (limit: 10) ensures efficient resource usage under concurrent load. Async/await throughout the stack avoids blocking the Node.js event loop. Recharts renders charts client-side, offloading rendering from the server.
- Tailwind CSS utility classes ensure the UI adapts gracefully from mobile (375px) to large desktop (1440px+). The dashboard reflows into single-column layout on small screens.
- Service-per-resource structure makes each domain independently modifiable. Centralised Axios config means API base URL changes in one place. Environment-driven configuration separates code from infrastructure.
- Three-tier architecture allows horizontal scaling of any tier independently. The stateless JWT auth model means multiple backend instances can run without shared session storage. MySQL can be replaced with a managed RDS instance without code changes.
- Centralised Express error handler prevents unhandled promise rejections from crashing the server. Docker’s `depends_on` ensures startup ordering is respected. DB volume persistence survives container restarts.
- Service functions are decoupled from route handlers, making unit testing straightforward — services can be called with mock DB pools. React components are functional, enabling shallow rendering tests with Vitest/Jest.
