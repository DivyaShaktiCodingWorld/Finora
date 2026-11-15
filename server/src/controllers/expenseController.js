import mongoose from "mongoose";
import { z } from "zod";
import Expense, {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
} from "../models/Expense.js";

// Validation schemas
const createExpenseSchema = z.object({
  title: z
    .string({ required_error: "Expense title is required" })
    .trim()
    .min(1, "Expense title cannot be empty")
    .max(100, "Expense title must not exceed 100 characters"),
  amount: z.coerce
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .refine((val) => EXPENSE_CATEGORIES.includes(val), {
      message: `Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(", ")}`,
    }),
  date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : new Date())),
  paymentMethod: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || PAYMENT_METHODS.includes(val), {
      message: `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(", ")}`,
    }),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .default(""),
});

const updateExpenseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Expense title cannot be empty")
    .max(100, "Expense title must not exceed 100 characters")
    .optional(),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than 0")
    .optional(),
  category: z
    .string()
    .trim()
    .refine((val) => EXPENSE_CATEGORIES.includes(val), {
      message: `Invalid category. Must be one of: ${EXPENSE_CATEGORIES.join(", ")}`,
    })
    .optional(),
  date: z
    .string()
    .or(z.date())
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  paymentMethod: z
    .string()
    .trim()
    .refine((val) => !val || PAYMENT_METHODS.includes(val), {
      message: `Invalid payment method. Must be one of: ${PAYMENT_METHODS.join(", ")}`,
    })
    .optional(),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional(),
});

// GET /api/expenses
export const getExpenses = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { category, search, startDate, endDate, sortBy } = req.query;

    const filter = { user: userId };

    // Category filter
    if (category && category !== "all") {
      filter.category = category;
    }

    // Search query on title or notes
    if (search && search.trim()) {
      filter.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { notes: { $regex: search.trim(), $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        // Include the entire end day
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Sorting
    let sortOption = { date: -1, createdAt: -1 };
    if (sortBy === "date_asc") {
      sortOption = { date: 1, createdAt: 1 };
    } else if (sortBy === "amount_desc") {
      sortOption = { amount: -1, date: -1 };
    } else if (sortBy === "amount_asc") {
      sortOption = { amount: 1, date: -1 };
    } else if (sortBy === "title_asc") {
      sortOption = { title: 1 };
    }

    const expenses = await Expense.find(filter).sort(sortOption).lean();

    return res.status(200).json({
      success: true,
      count: expenses.length,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/summary
export const getExpenseSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    // Date range for current calendar month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    // Period match filter
    const periodMatch = { user: userId };
    if (startDate || endDate) {
      periodMatch.date = {};
      if (startDate) {
        periodMatch.date.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        periodMatch.date.$lte = end;
      }
    }

    // Run parallel aggregation
    const [overallStats, thisMonthStats, periodStats, categoryStats] = await Promise.all([
      // Overall Total & Count
      Expense.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // This Month's Total & Count
      Expense.aggregate([
        {
          $match: {
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // Selected Period Total, Count, & Average
      Expense.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
      ]),

      // Spending by Category in Selected Period
      Expense.aggregate([
        { $match: periodMatch },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
    ]);

    const overallTotalSpent = overallStats[0]?.totalSpent || 0;
    const overallTotalCount = overallStats[0]?.count || 0;

    const thisMonthSpent = thisMonthStats[0]?.totalSpent || 0;
    const thisMonthCount = thisMonthStats[0]?.count || 0;

    const periodTotalSpent = periodStats[0]?.totalSpent || 0;
    const periodTotalCount = periodStats[0]?.count || 0;
    const periodAvgAmount = periodStats[0]?.avgAmount || 0;

    const categoryBreakdown = categoryStats.map((item) => ({
      category: item._id,
      total: item.total,
      count: item.count,
      percentage:
        periodTotalSpent > 0
          ? ((item.total / periodTotalSpent) * 100).toFixed(1)
          : 0,
    }));

    const topCategory = categoryBreakdown[0] || null;

    return res.status(200).json({
      success: true,
      summary: {
        totalSpent: periodTotalSpent,
        totalCount: periodTotalCount,
        avgAmount: periodAvgAmount,
        overallTotalSpent,
        overallTotalCount,
        thisMonthSpent,
        thisMonthCount,
        categoryBreakdown,
        topCategory,
        isFiltered: Boolean(startDate || endDate),
        startDate: startDate || null,
        endDate: endDate || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/expenses/:id
export const getExpenseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense ID format.",
      });
    }

    const expense = await Expense.findOne({
      _id: id,
      user: req.user._id,
    }).lean();

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses
export const createExpense = async (req, res, next) => {
  try {
    const validation = createExpenseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0]?.message || "Validation failed.",
      });
    }

    const expenseData = {
      ...validation.data,
      user: req.user._id,
    };

    const expense = await Expense.create(expenseData);

    return res.status(201).json({
      success: true,
      message: "Expense created successfully.",
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
export const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense ID format.",
      });
    }

    const validation = updateExpenseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0]?.message || "Validation failed.",
      });
    }

    const expense = await Expense.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    // Apply allowed updates
    const updates = validation.data;
    if (updates.title !== undefined) expense.title = updates.title;
    if (updates.amount !== undefined) expense.amount = updates.amount;
    if (updates.category !== undefined) expense.category = updates.category;
    if (updates.date !== undefined) expense.date = updates.date;
    if (updates.paymentMethod !== undefined)
      expense.paymentMethod = updates.paymentMethod;
    if (updates.notes !== undefined) expense.notes = updates.notes;

    await expense.save();

    return res.status(200).json({
      success: true,
      message: "Expense updated successfully.",
      expense,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
export const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid expense ID format.",
      });
    }

    const expense = await Expense.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Expense deleted successfully.",
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};
