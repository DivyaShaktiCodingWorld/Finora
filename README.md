# Finora - Personal Finance & Expense Management

Finora is a modern personal finance and expense tracking web application built with a decoupled React frontend and Express + MongoDB backend.

---

## Features

### 1. Authentication & Security (Implemented by Divya Shakti)

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
  - Amounts are calculated in cents internally to avoid floating-point errors (reports are formatted in standard Indian Rupee ₹ INR).

### 4. Financial Insights & Visual Analytics

- **Dedicated Analytics Page (`/analytics`)**:
  - Accessible via the unified responsive left-side navbar across **Dashboard**, **Budget & Savings**, and **Analytics**.
  - Dynamic **Year Selector** (`<` / `>` controls and dropdown) to visualize year-by-year spending patterns.
  - Quick "+ Add Expense" trigger and live refresh button.
- **Month-wise Stacked Bar Chart**:
  - 12-month timeline (Jan to Dec) where each month is represented by a single vertical bar.
  - Each bar is stacked with distinct colored segments representing category expenditures in that month.
  - Interactive mouse tracking tooltip detailing the monthly total and itemized category breakdown (amounts and percentages).
  - Category legend with live toggle filtering and annual totals.
- **Category Donut / Pie Chart**:
  - Visual distribution of category expenditures with custom brand palette arcs.
  - Center readout highlighting annual total expenditure and transaction count.
  - Hovering any slice or category row dynamically reveals percentage shares, counts, and amounts.
- **Top Most Expense Visual Highlight**:
  - Hero visual card showcasing the **#1 single largest purchase** of the year (title, category badge, formatted amount, date, payment method, notes, and % share of the year's total).
  - **Top 5 Largest Transactions Leaderboard** with rank badges (#1 to #5).
- **Recent Transactions Feed**:
  - Displays the user's latest expense activity with rich category icons, dates, payment method badges, notes, and amounts.
  - Includes a direct **"View All Transactions"** navigation link to the Dashboard.

### 5. Dedicated Budget Planner, Fixed Commitments & Monthly Savings Tracker

- **Dedicated Budget & Savings Page (`/budget`)**:
  - Uncluttered, spacious financial hub accessible from top navigation switcher tabs (**Dashboard**, **Budget & Savings**, **Analytics**).
  - Streamlines the main Dashboard by hosting full budget configuration, interactive checklists, and savings history in a dedicated view.
- **Paycheck & Salary Cycle Tracking**:
  - Configure monthly salary / budget amount.
  - Cycle options:
    - **Standard Calendar Month** (1st to last day of the month).
    - **Salary Credit Day Cycle** (e.g., 25th to 24th of next month) with automated remaining days and cycle range calculations.
- **Fixed Recurring Commitments & Dues**:
  - **Ongoing Regular Commitments**: Tailored for non-installment recurring monthly obligations such as **House Rent**, **Kid's School Fees**, **Society Maintenance**, **Wi-Fi & Utility Bills**, and **Subscriptions** (no unnecessary installment countdowns).
  - **Loan / EMI Installments**: Finite commitments such as **Bike EMI**, **TV EMI**, and **Personal Loans** with total & remaining installment countdowns.
  - **Auto-Tenure Decrement & Celebratory Milestone**: Marking an installment paid decrements remaining count. Reaching 0 automatically moves the commitment to "Completed" and triggers a celebratory banner.
  - **Quick One-Click Presets**: Fast presets for House Rent, Kid's School Fees, Bike/Car EMI, TV EMI, and Wi-Fi bills.
- **Month-by-Month Savings Tracker & Historical Growth**:
  - Track monthly surplus / net savings over time with dynamic year switcher (`< 2026 >`).
  - **4 Top KPI Cards**: Total Annual Savings, Average Monthly Savings, Annual Savings Rate %, and Best Month for Savings.
  - **12-Month Detailed Ledger**: Audits each month's Salary, Fixed Dues, Daily Variable Expenses, Total Outflow, Net Savings (+/-), Savings Rate %, and dual-color progress bars.
  - Highlights positive savings in fresh emerald and overspent deficits in rose warning.
- **Interactive Check-off Checklist & Sidebar Widget**:
  - Interactive monthly checklist to check/uncheck fixed commitments as paid for the active cycle.
  - Compact **Upcoming Fixed Dues** widget directly on the Dashboard sidebar for quick one-click settlement.
- **Dynamic Real-Time Spendable Balance**:
  - **Planned Spendable Budget**: `Salary - Total Fixed Commitments`.
  - **Remaining Balance**: `Salary - Total Fixed Commitments - Daily Expenses Logged`.
  - **Safe Daily Spend Target**: `Remaining Balance / Days Left in Cycle` showing exactly how much can safely be spent per day to stay within budget.

### 6. Email Notification & PDF Delivery Workflow (Implemented By Divya Shakti)

- **Automated Financial Activity Notifications**:
  - Powered by a dedicated backend email service to dispatch real-time alerts for supported financial activities.
  - **End-to-End Execution Pipeline**:
    1. User triggers a supported financial action on the client.
    2. Backend processes and validates the requested operation.
    3. Email service dynamically compiles the notification payload and template.
    4. **Nodemailer** dispatches the message via the configured SMTP transport.
    5. Frontend surfaces real-time toast/status feedback reflecting delivery success or failure.
- **On-Demand PDF Report Email Delivery**:
  - Accessible directly from the **Report Export** section via an integrated **Send via Email** option.
  - Leverages the built-in report generation engine to compile the financial statement as a PDF and attach it directly to the outgoing email.
- **Server-Side Security & Error Handling**:
  - **Strict Credential Isolation**: SMTP credentials and sensitive configurations are stored exclusively in backend environment variables (`.env`) and never exposed to the client.
  - **Authenticated Recipient Resolution**: Target email addresses are pulled directly from verified, authenticated user session data to prevent unauthorized or spoofed relays.
  - **Graceful Failure Handling**: Delivery errors are caught server-side and accurately relayed to the UI, ensuring failed dispatches never trigger false success notifications.

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
│       ├── components/analytics/  # BarChart, DonutChart, HeroHighlight, TopExpensesLeaderboard
│       ├── components/budget/     # BudgetOverviewCard, UpcomingDuesWidget, MonthlySavingsTracker, BudgetSettingsModal
│       ├── components/expenses/   # List, Modal, Filters, Summary, TimePeriodBar,
│       │                          # CategoryBreakdown, DeleteConfirmModal, ReportExport
│       ├── components/layout/     # AuthLayout
│       ├── components/routing/    # ProtectedRoute
│       ├── components/ui/         # Alert, FormField, PasswordStrength
│       ├── lib/                   # api.js, expenseConstants.js, downloadFile.js
│       ├── pages/                 # Login, Register, Dashboard, BudgetPage, AnalyticsPage
│       ├── services/              # authService, expenseService, reportService, budgetService
│       └── store/                 # authStore (Zustand)
└── server/
    └── src/
        ├── config/                # db.js
        ├── controllers/           # auth, expense, report, budget
        ├── middleware/            # auth, csrf, error handling
        ├── models/                # User, Expense, BudgetPlan, FixedExpense
        ├── routes/                # auth, expense, report, budget
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
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your_finora_email@gmail.com
SMTP_PASS=your_google_app_password
EMAIL_FROM=Finora <your_finora_email@gmail.com>
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
- `GET /api/expenses/analytics` – Annual analytics data (supports `year`: returns monthly stacked trends, category distribution, top expenses, summary, and recent transactions)
- `GET /api/expenses/:id` – Retrieve a specific expense by ID
- `POST /api/expenses` – Create a new expense (requires CSRF token)
- `PUT /api/expenses/:id` – Update an existing expense (requires CSRF token)
- `DELETE /api/expenses/:id` – Delete an expense (requires CSRF token)

### Reports (`/api/reports`)

- `GET /api/reports/pdf` – Download the PDF expense report (requires login)
- `GET /api/reports/csv` – Download the CSV expense report (requires login)
- Both support `category`, `search`, `sortBy` (`date_desc`, `date_asc`, `amount_desc`, `amount_asc`, `title_asc`), `startDate`, `endDate`, and `periodName`.

### Budget & Fixed Commitments (`/api/budget`)

- `GET /api/budget/current` – Get active budget plan, dynamic cycle metrics (salary, commitments, daily spent, remaining spendable, safe daily spend), and fixed commitments
- `POST /api/budget/settings` – Configure salary amount, cycle type (`calendar` vs `salary_day`), and salary credit day (requires CSRF token)
- `POST /api/budget/toggle-fixed-expense` – Toggle a fixed commitment as paid/unpaid for the current cycle with auto-tenure decrement (requires CSRF token)
- `GET /api/budget/fixed-expenses` – List all user's recurring fixed commitments (active, inactive, completed)
- `POST /api/budget/fixed-expenses` – Create a new recurring fixed commitment (EMI, Rent, Loan, Subscription, etc.) with optional installment count (requires CSRF token)
- `PUT /api/budget/fixed-expenses/:id` – Update recurring commitment details (requires CSRF token)
- `DELETE /api/budget/fixed-expenses/:id` – Delete a recurring commitment (requires CSRF token)
- `POST /api/budget/dismiss-notification` – Dismiss a milestone completion banner notification (requires CSRF token)

### Notifications (`/api/reports/email`)

- `POST /api/reports/email` – Send PDF report through email (requires login)
