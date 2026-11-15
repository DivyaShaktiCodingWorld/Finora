# Finora - Personal Finance & Expense Management

Finora is a modern personal finance and expense tracking web application built with a decoupled React frontend and Express + MongoDB backend.

---

## Features

### 1. Authentication & Security (Implemented by DivyaShakti)
- Secure user registration and login with bcrypt password hashing (cost factor 12).
- Dual JWT session architecture (short-lived access tokens + long-lived refresh tokens) stored in HTTP-only cookies.
- Refresh token rotation with cryptographic SHA-256 hash validation in the database.
- Double-submit CSRF cookie & header validation with timing-safe comparison on state-modifying requests.
- Rate limiting on authentication routes to mitigate brute-force attempts.
- Protected client-side routing and automatic session refreshment via Axios interceptors.

### 2. Expense Management (Implemented on `feature-vishal`)
- **Full CRUD Operations**:
  - **Create Expense**: Add new expenses with title, amount, category, date, payment method, and optional notes.
  - **Read / View Expenses**: View all tracked expenses with rich metadata, formatted currency, and category indicators.
  - **Update / Edit Expense**: Seamless modal-based editing pre-filled with existing details.
  - **Delete Expense**: Permanent deletion with a safe confirmation dialog.
- **Analytics & Summary Metrics**:
  - Overall total spending and transaction count.
  - Current month's spending calculation.
  - Top spending category detection.
  - Visual category breakdown with percentage progress bars.
- **Search, Filter & Sort**:
  - Live text search across titles and notes.
  - Category filtering (`Food & Dining`, `Transportation`, `Housing & Rent`, `Utilities`, `Entertainment`, `Shopping`, `Healthcare`, `Education`, `Investments`, `Bills`, etc.).
  - Multi-criteria sorting (Newest first, Oldest first, Highest amount, Lowest amount).
- **Matching Design System**:
  - Built with Tailwind CSS v4, Lucide icons, and Framer Motion animations.
  - Custom Finora dark emerald theme with responsive cards, modal backdrops, and notifications.

---

## Tech Stack

- **Frontend (`/client`)**: React 19, Vite, Tailwind CSS v4, Zustand, React Router v7, Framer Motion, Lucide Icons, Axios.
- **Backend (`/server`)**: Node.js, Express (ES Modules), MongoDB & Mongoose, Zod, JSONWebToken, Helmet, Cookie-Parser, Express-Rate-Limit.

---

## Getting Started

### 1. Backend Setup
```bash
cd server
npm install
npm run dev # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev # Starts client on http://localhost:5173
```

---

## API Endpoints

### Authentication (`/api/auth`)
- `GET /api/auth/csrf` – Get CSRF token
- `POST /api/auth/register` – Register a new user
- `POST /api/auth/login` – Sign in and obtain cookies
- `POST /api/auth/refresh` – Rotate and refresh access token
- `POST /api/auth/logout` – Clear session cookies and invalidate token
- `GET /api/auth/me` – Retrieve current authenticated user profile

### Expenses (`/api/expenses`)
- `GET /api/expenses` – Retrieve user's expenses (supports `category`, `search`, `sortBy`, `startDate`, `endDate`)
- `GET /api/expenses/summary` – Summary metrics & category breakdown
- `GET /api/expenses/:id` – Retrieve a specific expense by ID
- `POST /api/expenses` – Create a new expense (requires CSRF token)
- `PUT /api/expenses/:id` – Update an existing expense (requires CSRF token)
- `DELETE /api/expenses/:id` – Delete an expense (requires CSRF token)
