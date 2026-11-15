import { Router } from "express";
import { protect } from "../middleware/authMiddleware.js";
import { verifyCsrfToken } from "../middleware/csrfMiddleware.js";
import {
  getExpenses,
  getExpenseSummary,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from "../controllers/expenseController.js";

const router = Router();

// All expense routes require authentication
router.use(protect);

// Read endpoints
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.get("/:id", getExpenseById);

// Mutating endpoints require CSRF verification
router.post("/", verifyCsrfToken, createExpense);
router.put("/:id", verifyCsrfToken, updateExpense);
router.delete("/:id", verifyCsrfToken, deleteExpense);

export default router;
