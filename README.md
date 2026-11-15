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
- **Time Period Filtering**:
  - Quick presets: `This Month` (default), `Last Month`, `Last 7 Days`, `This Year`, `All Time`.
  - `Select Month` with previous/next arrows and a month/year jump picker.
  - `Custom Dates` with any start and end date.
  - Dashboard summary, list, and reports all follow the active period.
- **Search, Filter & Sort**:
  - Live text search across titles and notes.
  - Category filtering (`Food & Dining`, `Transportation`, `Housing & Rent`, `Utilities`, `Entertainment`, `Shopping`, `Healthcare`, `Education`, `Personal Care`, `Travel`, `Investments`, `Bills`, `Other`).
  - Multi-criteria sorting (Newest first, Oldest first, Highest amount, Lowest amount, Title A to Z).
- **Matching Design System**:
  - Built with Tailwind CSS v4, Lucide icons, and Framer Motion animations.
  - Custom Finora dark emerald theme with responsive cards, modal backdrops, and notifications.

### 3. Report Generation (PDF & CSV) (Implemented by DivyaShakti)

- **One-click download** from the dashboard (`Download PDF` / `Download CSV`) with loading states.
- **Respects the active view**: the report uses the selected time period, category filter, search text, and sort order.
- **PDF Report** (branded, multi-page, with page numbers on every page):
  - Header with account name, email, applied filters, transactions included, and generation time.
  - 8 summary cards: Total Spent, Transactions, Avg per Transaction, Daily Average, Highest Expense, Lowest Expense, Top Category, Peak Spending Day.
  - **Category Breakdown** with transaction count, amount, average, and share bars.
  - **Payment Method Breakdown** with the same metrics.
  - **Monthly Breakdown** (shown automatically when the range spans more than one month).
  - **Top Expenses** list.
  - **Transaction Details** table with date, title/notes, category, payment method, and amount.
- **CSV Report** (opens cleanly in Excel / Google Sheets):
  - Report information, summary metrics, breakdown sections, and full transaction details in one file.
  - UTF-8 BOM so special characters display correctly.
  - **CSV injection protection**: cells starting with `=`, `+`, `-`, or `@` are escaped so spreadsheets never run them as formulas.
- **Smart file names**: e.g. `finora-expenses_2026-11-01_to_2026-11-30.pdf`.
- **Safety limits & validation**:
  - Maximum **10,000 transactions** per report, with a clear message asking for a shorter range if exceeded.
  - Zod validation for dates (`YYYY-MM-DD`), category, search length, sort option, and start/end date order.
  - Reports are generated only from the logged-in user's own data.
  - Amounts are calculated in cents internally to avoid floating-point errors (reports are formatted in USD).

---

## Tech Stack

- **Frontend (`/client`)**: React 19, Vite, Tailwind CSS v4, Zustand, React Router v7, Framer Motion, Lucide Icons, Axios.
- **Backend (`/server`)**: Node.js, Express (ES Modules), MongoDB & Mongoose, Zod, JSONWebToken, Helmet, Cookie-Parser, Express-Rate-Limit, PDFKit.

---

## Project Structure

```
Finora/
├── client/
│   └── src/
│       ├── components/expenses/   # List, Modal, Filters, Summary, TimePeriodBar,
│       │                          # CategoryBreakdown, DeleteConfirmModal, ReportExport
│       ├── components/layout/     # AuthLayout
│       ├── components/routing/    # ProtectedRoute
│       ├── components/ui/         # Alert, FormField, PasswordStrength
│       ├── lib/                   # api.js, expenseConstants.js, downloadFile.js
│       ├── pages/                 # Login, Register, Dashboard
│       ├── services/              # authService, expenseService, reportService
│       └── store/                 # authStore (Zustand)
└── server/
    └── src/
        ├── config/                # db.js
        ├── controllers/           # auth, expense, report
        ├── middleware/            # auth, csrf, error handling
        ├── models/                # User, Expense
        ├── routes/                # auth, expense, report
        ├── utils/                 # tokens, reportData, csvReport, pdfReport
        └── server.js
```

---

## Getting Started

### 1. Backend Setup

```bash
cd server
npm install
npm run dev # Starts server on http://localhost:5000
```

Create `server/.env`:

```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_long_random_secret
REFRESH_TOKEN_SECRET=your_other_long_random_secret
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev # Starts client on http://localhost:5173
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
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
- `GET /api/expenses/summary` – Summary metrics & category breakdown (supports `startDate`, `endDate`)
- `GET /api/expenses/:id` – Retrieve a specific expense by ID
- `POST /api/expenses` – Create a new expense (requires CSRF token)
- `PUT /api/expenses/:id` – Update an existing expense (requires CSRF token)
- `DELETE /api/expenses/:id` – Delete an expense (requires CSRF token)

### Reports (`/api/reports`)

- `GET /api/reports/pdf` – Download the PDF expense report (requires login)
- `GET /api/reports/csv` – Download the CSV expense report (requires login)
- Both support `category`, `search`, `sortBy` (`date_desc`, `date_asc`, `amount_desc`, `amount_asc`, `title_asc`), `startDate`, `endDate`, and `periodName`.
