import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { verifyCsrfToken } from "../middleware/csrfMiddleware.js";
import {
  getCurrentBudget,
  updateBudgetSettings,
  toggleFixedExpense,
  getFixedExpenses,
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  dismissNotification,
  getMonthlySavingsHistory,
} from "../controllers/budgetController.js";

const router = Router();

// All budget routes require user authentication
router.use(protect);

// Current active cycle budget info & health
router.get("/current", getCurrentBudget);

// Monthly savings history & yearly analytics
router.get("/savings-history", getMonthlySavingsHistory);

// Update budget salary & cycle settings (requires CSRF)
router.post("/settings", verifyCsrfToken, updateBudgetSettings);

// Toggle fixed expense as paid / pending for active cycle (requires CSRF)
router.post("/toggle-fixed-expense", verifyCsrfToken, toggleFixedExpense);

// Fixed commitments CRUD
router.get("/fixed-expenses", getFixedExpenses);
router.post("/fixed-expenses", verifyCsrfToken, createFixedExpense);
router.put("/fixed-expenses/:id", verifyCsrfToken, updateFixedExpense);
router.delete("/fixed-expenses/:id", verifyCsrfToken, deleteFixedExpense);

// Dismiss completed milestone notifications
router.post("/dismiss-notification", verifyCsrfToken, dismissNotification);

export default router;
