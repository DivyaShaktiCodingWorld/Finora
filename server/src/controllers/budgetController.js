import mongoose from "mongoose";
import { z } from "zod";
import crypto from "crypto";
import User from "../models/User.js";
import BudgetPlan from "../models/BudgetPlan.js";
import FixedExpense from "../models/FixedExpense.js";
import Expense, { EXPENSE_CATEGORIES } from "../models/Expense.js";
import { sendFinoraEmail } from "../utils/emailService.js";
// Helper to format currency in server messages
const formatMoney = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount || 0);

// Helper: Calculate cycle date bounds based on cycleType and salaryDay
export const calculateBudgetCycle = (cycleType, salaryDay = 1, referenceDate = new Date()) => {
  const ref = new Date(referenceDate);
  const year = ref.getUTCFullYear();
  const month = ref.getUTCMonth(); // 0-11
  const date = ref.getUTCDate();

  let startDate;
  let endDate;
  let cycleKey;
  let label;

  if (cycleType === "salary_day" && salaryDay > 1) {
    if (date < salaryDay) {
      // Current cycle started in previous month on salaryDay
      startDate = new Date(Date.UTC(year, month - 1, salaryDay, 0, 0, 0, 0));
      // Ends this month on (salaryDay - 1)
      endDate = new Date(Date.UTC(year, month, salaryDay - 1, 23, 59, 59, 999));
    } else {
      // Current cycle started this month on salaryDay
      startDate = new Date(Date.UTC(year, month, salaryDay, 0, 0, 0, 0));
      // Ends next month on (salaryDay - 1)
      endDate = new Date(Date.UTC(year, month + 1, salaryDay - 1, 23, 59, 59, 999));
    }

    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);
    cycleKey = `${startStr}_to_${endStr}`;

    const startFormat = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(startDate);
    const endFormat = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(endDate);

    label = `Paycheck Cycle (${startFormat} – ${endFormat})`;
  } else {
    // Standard Calendar Month
    startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    cycleKey = `${year}-${String(month + 1).padStart(2, "0")}`;

    const monthFormat = new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(startDate);

    label = `${monthFormat} (Calendar Month)`;
  }

  const nowMs = Date.now();
  const endMs = endDate.getTime();
  const startMs = startDate.getTime();

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const daysTotal = Math.max(1, Math.round((endMs - startMs) / MS_PER_DAY));
  const daysRemaining = Math.max(
    1,
    Math.ceil((endMs - Math.max(nowMs, startMs)) / MS_PER_DAY)
  );
  const daysElapsed = Math.max(0, daysTotal - daysRemaining);

  return {
    cycleType,
    salaryDay,
    cycleKey,
    startDate,
    endDate,
    label,
    daysTotal,
    daysRemaining,
    daysElapsed,
  };
};

// GET /api/budget/current
export const getCurrentBudget = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // 1. Get or create user budget plan
    let budgetPlan = await BudgetPlan.findOne({ user: userId });
    if (!budgetPlan) {
      budgetPlan = await BudgetPlan.create({
        user: userId,
        monthlySalary: 0,
        cycleType: "calendar_month",
        salaryDay: 1,
        cycles: [],
        notifications: [],
      });
    }

    // 2. Compute active cycle
    const cycleInfo = calculateBudgetCycle(
      budgetPlan.cycleType,
      budgetPlan.salaryDay
    );

    // 3. Find or initialize active cycle record
    let cycleRecord = budgetPlan.cycles.find(
      (c) => c.cycleKey === cycleInfo.cycleKey
    );
    if (!cycleRecord) {
      cycleRecord = {
        cycleKey: cycleInfo.cycleKey,
        salaryOverride: null,
        paidFixedExpenseIds: [],
      };
      budgetPlan.cycles.push(cycleRecord);
      await budgetPlan.save();
    }

    // 4. Fetch all user fixed expenses
    const fixedExpenses = await FixedExpense.find({
      user: userId,
      $or: [{ isActive: true }, { isCompleted: true }],
    })
      .sort({ isCompleted: 1, dueDay: 1, createdAt: -1 });

    // Auto-heal any items where remaining installments accidentally exceeded total installments
    for (const exp of fixedExpenses) {
      if (
        exp.totalInstallments &&
        exp.remainingInstallments > exp.totalInstallments
      ) {
        exp.remainingInstallments = exp.totalInstallments;
        await exp.save();
      }
    }

    const activeFixedExpenses = fixedExpenses.filter((e) => e.isActive && !e.isCompleted);
    const completedFixedExpenses = fixedExpenses.filter((e) => e.isCompleted);

    const paidIdsSet = new Set(
      cycleRecord.paidFixedExpenseIds.map((id) => id.toString())
    );

    // Build checklist items with isPaid status
    const fixedExpensesChecklist = activeFixedExpenses.map((exp) => ({
      ...exp.toObject ? exp.toObject() : exp,
      isPaid: paidIdsSet.has(exp._id.toString()),
    }));

    // Calculate fixed commitments sums
    const totalFixedCommitted = Math.round(
      activeFixedExpenses.reduce((sum, e) => sum + e.amount, 0) * 100
    ) / 100;

    const paidFixedTotal = Math.round(
      fixedExpensesChecklist
        .filter((e) => e.isPaid)
        .reduce((sum, e) => sum + e.amount, 0) * 100
    ) / 100;

    const pendingFixedTotal = Math.max(
      0,
      Math.round((totalFixedCommitted - paidFixedTotal) * 100) / 100
    );

    // 5. Query daily variable expenses logged by user in this cycle window
    const userObjectId =
      mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    const dailyExpensesAggregation = await Expense.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: cycleInfo.startDate, $lte: cycleInfo.endDate },
          $or: [
            { fixedExpense: { $exists: false } },
            { fixedExpense: null },
          ],
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const dailyExpensesTotal =
      Math.round((dailyExpensesAggregation[0]?.totalAmount || 0) * 100) / 100;
    const dailyExpensesCount = dailyExpensesAggregation[0]?.count || 0;

    // 6. Compute real-time balances & health status
    const effectiveSalary =
      cycleRecord.salaryOverride !== null && cycleRecord.salaryOverride !== undefined
        ? cycleRecord.salaryOverride
        : budgetPlan.monthlySalary;

    // Planned spendable budget for the month after fixed commitments
    const plannedSpendableBudget = Math.max(
      0,
      Math.round((effectiveSalary - totalFixedCommitted) * 100) / 100
    );

    // Actual total money paid out so far (paid fixed + daily logged)
    const actualSpentSoFar = Math.round(
      (paidFixedTotal + dailyExpensesTotal) * 100
    ) / 100;

    // Final remaining budget (accounting for both daily spend and reserved commitments)
    const remainingSpendableBudget = Math.round(
      (effectiveSalary - totalFixedCommitted - dailyExpensesTotal) * 100
    ) / 100;

    // Cash remaining in hand (before paying pending EMIs)
    const liquidCashInHand = Math.round(
      (effectiveSalary - actualSpentSoFar) * 100
    ) / 100;

    // Safe Daily Spending Allowance
    const safeDailySpend =
      remainingSpendableBudget > 0 && cycleInfo.daysRemaining > 0
        ? Math.round((remainingSpendableBudget / cycleInfo.daysRemaining) * 100) / 100
        : 0;

    // Overall utilized percentage of total salary
    const totalCommittedOrSpent = totalFixedCommitted + dailyExpensesTotal;
    const utilizedPercent =
      effectiveSalary > 0
        ? Math.round((totalCommittedOrSpent / effectiveSalary) * 1000) / 10
        : 0;

    // Status: healthy, warning, critical, exceeded
    let budgetHealth = "healthy";
    if (remainingSpendableBudget < 0) {
      budgetHealth = "exceeded";
    } else if (utilizedPercent >= 90) {
      budgetHealth = "critical";
    } else if (utilizedPercent >= 75) {
      budgetHealth = "warning";
    }

    return res.status(200).json({
      success: true,
      cycle: cycleInfo,
      salary: {
        amount: effectiveSalary,
        baseSalary: budgetPlan.monthlySalary,
        isOverridden: cycleRecord.salaryOverride !== null,
        cycleType: budgetPlan.cycleType,
        salaryDay: budgetPlan.salaryDay,
      },
      metrics: {
        effectiveSalary,
        totalFixedCommitted,
        paidFixedTotal,
        pendingFixedTotal,
        dailyExpensesTotal,
        dailyExpensesCount,
        actualSpentSoFar,
        plannedSpendableBudget,
        remainingSpendableBudget,
        liquidCashInHand,
        safeDailySpend,
        utilizedPercent,
        budgetHealth,
      },
      fixedExpenses: {
        checklist: fixedExpensesChecklist,
        totalCount: activeFixedExpenses.length,
        paidCount: fixedExpensesChecklist.filter((e) => e.isPaid).length,
        pendingCount: fixedExpensesChecklist.filter((e) => !e.isPaid).length,
        completedCount: completedFixedExpenses.length,
      },
      notifications: budgetPlan.notifications.filter((n) => !n.isRead),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budget/settings
const budgetSettingsSchema = z.object({
  monthlySalary: z.coerce
    .number({ required_error: "Monthly salary is required" })
    .min(0, "Salary cannot be negative"),
  cycleType: z.enum(["calendar_month", "salary_day"]).default("calendar_month"),
  salaryDay: z.coerce.number().min(1).max(31).default(1),
  salaryOverride: z.coerce.number().min(0).optional().nullable(),
});

export const updateBudgetSettings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const validation = budgetSettingsSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0]?.message || "Invalid settings input.",
      });
    }

    const { monthlySalary, cycleType, salaryDay, salaryOverride } = validation.data;

    let budgetPlan = await BudgetPlan.findOne({ user: userId });
    if (!budgetPlan) {
      budgetPlan = new BudgetPlan({ user: userId });
    }

    budgetPlan.monthlySalary = monthlySalary;
    budgetPlan.cycleType = cycleType;
    budgetPlan.salaryDay = cycleType === "salary_day" ? salaryDay : 1;

    // Handle optional override for active cycle
    const cycleInfo = calculateBudgetCycle(
      budgetPlan.cycleType,
      budgetPlan.salaryDay
    );

    let cycleRecord = budgetPlan.cycles.find(
      (c) => c.cycleKey === cycleInfo.cycleKey
    );
    if (!cycleRecord) {
      cycleRecord = {
        cycleKey: cycleInfo.cycleKey,
        salaryOverride: null,
        paidFixedExpenseIds: [],
      };
      budgetPlan.cycles.push(cycleRecord);
    }

    if (salaryOverride !== undefined) {
      cycleRecord.salaryOverride = salaryOverride;
    }

    await budgetPlan.save();
void sendFinoraEmail({
  to: req.user.email,
  subject: "Finora: Budget settings updated",
  heading: "Your budget settings have been updated",
  intro: `Hello ${req.user.name || "there"}, your monthly budget settings were successfully updated.`,
  details: [
    {
      label: "Monthly income",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(monthlySalary),
    },
    {
      label: "Budget cycle",
      value: cycleType === "salary_day"
        ? `Salary day: ${salaryDay}`
        : "Calendar month",
    },
  ],
});
    return res.status(200).json({
      success: true,
      message: "Budget settings updated successfully.",
      budgetPlan,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budget/month-salary
const setMonthSalarySchema = z.object({
  year: z.coerce.number().min(2000).max(2100),
  month: z.coerce.number().min(1).max(12),
  salary: z.coerce.number().min(0, "Salary cannot be negative"),
});

export const setMonthSalary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const validation = setMonthSalarySchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0]?.message || "Invalid input.",
      });
    }

    const { year, month, salary } = validation.data;

    let budgetPlan = await BudgetPlan.findOne({ user: userId });
    if (!budgetPlan) {
      budgetPlan = new BudgetPlan({ user: userId });
    }

    const cycleKeyPrefix = `${year}-${String(month).padStart(2, "0")}`;
    let cycleRecord = budgetPlan.cycles.find((c) =>
      c.cycleKey.startsWith(cycleKeyPrefix)
    );

    if (!cycleRecord) {
      cycleRecord = {
        cycleKey: cycleKeyPrefix,
        salaryOverride: salary > 0 ? salary : null,
        paidFixedExpenseIds: [],
      };
      budgetPlan.cycles.push(cycleRecord);
    } else {
      cycleRecord.salaryOverride = salary > 0 ? salary : null;
    }

    await budgetPlan.save();

    return res.status(200).json({
      success: true,
      message:
        salary > 0
          ? `Salary for ${cycleKeyPrefix} set to ${formatMoney(salary)}.`
          : `Salary for ${cycleKeyPrefix} removed.`,
      cycle: cycleRecord,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budget/toggle-fixed-expense
const toggleFixedExpenseSchema = z.object({
  fixedExpenseId: z.string().trim(),
  isPaid: z.boolean(),
});

export const toggleFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const validation = toggleFixedExpenseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid toggle payload.",
      });
    }

    const { fixedExpenseId, isPaid } = validation.data;

    if (!mongoose.Types.ObjectId.isValid(fixedExpenseId)) {
      return res.status(400).json({
        message: "Invalid fixed expense ID format.",
      });
    }

    const [budgetPlan, fixedExpense] = await Promise.all([
      BudgetPlan.findOne({ user: userId }),
      FixedExpense.findOne({ _id: fixedExpenseId, user: userId }),
    ]);

    if (!budgetPlan || !fixedExpense) {
      return res.status(404).json({
        message: "Budget plan or fixed commitment not found.",
      });
    }

    const cycleInfo = calculateBudgetCycle(
      budgetPlan.cycleType,
      budgetPlan.salaryDay
    );

    let cycleRecord = budgetPlan.cycles.find(
      (c) => c.cycleKey === cycleInfo.cycleKey
    );
    if (!cycleRecord) {
      cycleRecord = {
        cycleKey: cycleInfo.cycleKey,
        salaryOverride: null,
        paidFixedExpenseIds: [],
      };
      budgetPlan.cycles.push(cycleRecord);
    }

    // Auto-heal any corrupt state where remaining installments accidentally exceeded total
    if (
      fixedExpense.totalInstallments &&
      fixedExpense.remainingInstallments > fixedExpense.totalInstallments
    ) {
      fixedExpense.remainingInstallments = fixedExpense.totalInstallments;
    }

    const isCurrentlyPaid = cycleRecord.paidFixedExpenseIds.some(
      (id) => id.toString() === fixedExpenseId
    );

    // Target state: if isPaid is explicitly boolean, use it. Otherwise, toggle
    const targetPaid = typeof isPaid === "boolean" ? isPaid : !isCurrentlyPaid;

    let completionNotification = null;

    if (targetPaid && !isCurrentlyPaid) {
      // 1. Add to cycle paid list
      cycleRecord.paidFixedExpenseIds.push(fixedExpense._id);

      // 2. Decrement remaining tenure if finite
      if (
        fixedExpense.remainingInstallments !== null &&
        fixedExpense.remainingInstallments !== undefined
      ) {
        if (fixedExpense.remainingInstallments <= 1) {
          fixedExpense.remainingInstallments = 0;
          fixedExpense.isCompleted = true;
          fixedExpense.isActive = false;
          fixedExpense.completedAt = new Date();

          completionNotification = {
            id: crypto.randomUUID(),
            message: `🎉 Milestone Reached: Your "${fixedExpense.title}" commitment (${formatMoney(
              fixedExpense.amount
            )}) has completed its tenure! It has been removed from future recurring commitments, freeing up your budget.`,
            type: "success",
            createdAt: new Date(),
            isRead: false,
          };
          budgetPlan.notifications.unshift(completionNotification);
        } else {
          fixedExpense.remainingInstallments -= 1;
        }
      }

      // 3. Create or ensure linked Expense document so charts & lists capture it
      const existingExpense = await Expense.findOne({
        user: userId,
        fixedExpense: fixedExpense._id,
        cycleKey: cycleInfo.cycleKey,
      });

      if (!existingExpense) {
        await Expense.create({
          user: userId,
          title: fixedExpense.title,
          amount: fixedExpense.amount,
          category: fixedExpense.category,
          date: new Date(),
          paymentMethod: "Bank Transfer",
          notes: `Fixed commitment payment for cycle ${cycleInfo.cycleKey}`,
          fixedExpense: fixedExpense._id,
          cycleKey: cycleInfo.cycleKey,
        });
      }
    } else if (!targetPaid && isCurrentlyPaid) {
      // 1. Remove from cycle paid list
      cycleRecord.paidFixedExpenseIds = cycleRecord.paidFixedExpenseIds.filter(
        (id) => id.toString() !== fixedExpenseId
      );

      // 2. Revert completion or decrement
      if (fixedExpense.isCompleted && fixedExpense.remainingInstallments === 0) {
        fixedExpense.isCompleted = false;
        fixedExpense.isActive = true;
        fixedExpense.completedAt = null;
        fixedExpense.remainingInstallments = 1;
      } else if (
        fixedExpense.remainingInstallments !== null &&
        fixedExpense.remainingInstallments !== undefined
      ) {
        const maxTenure = fixedExpense.totalInstallments || Infinity;
        fixedExpense.remainingInstallments = Math.min(
          maxTenure,
          fixedExpense.remainingInstallments + 1
        );
      }

      // 3. Delete linked Expense document
      await Expense.deleteMany({
        user: userId,
        fixedExpense: fixedExpense._id,
        cycleKey: cycleInfo.cycleKey,
      });
    }

    await Promise.all([fixedExpense.save(), budgetPlan.save()]);
    void sendFinoraEmail({
      to: req.user.email,
      subject: `Finora: ${fixedExpense.title} payment status`,
      heading: targetPaid
        ? "Fixed commitment marked as paid"
        : "Fixed commitment marked as pending",
      intro: `Your fixed commitment "${fixedExpense.title}" has a new payment status.`,
      details: [
        { label: "Commitment", value: fixedExpense.title },
        {
          label: "Amount",
          value: new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
          }).format(fixedExpense.amount),
        },
        { label: "Status", value: targetPaid ? "Paid" : "Pending" },
        { label: "Category", value: fixedExpense.category },
      ],
    });

    return res.status(200).json({
      success: true,
      message: targetPaid
        ? `Marked "${fixedExpense.title}" as paid.`
        : `Marked "${fixedExpense.title}" as pending.`,
      isPaid: targetPaid,
      completionNotification,
      fixedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/budget/fixed-expenses
export const getFixedExpenses = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const fixedExpenses = await FixedExpense.find({ user: userId })
      .sort({ isCompleted: 1, dueDay: 1, createdAt: -1 });

    for (const exp of fixedExpenses) {
      if (
        exp.totalInstallments &&
        exp.remainingInstallments > exp.totalInstallments
      ) {
        exp.remainingInstallments = exp.totalInstallments;
        await exp.save();
      }
    }

    return res.status(200).json({
      success: true,
      count: fixedExpenses.length,
      fixedExpenses: fixedExpenses.map((e) => (e.toObject ? e.toObject() : e)),
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budget/fixed-expenses
const createFixedExpenseSchema = z.object({
  title: z
    .string({ required_error: "Title is required" })
    .trim()
    .min(1, "Title cannot be empty")
    .max(100, "Title must not exceed 100 characters"),
  amount: z.coerce
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),
  category: z
    .string({ required_error: "Category is required" })
    .trim()
    .refine((val) => EXPENSE_CATEGORIES.includes(val), {
      message: "Invalid category filter.",
    }),
  dueDay: z.coerce.number().min(1).max(31).default(1),
  commitmentType: z.enum(["recurring", "installment"]).default("recurring"),
  totalInstallments: z.coerce.number().min(1).optional().nullable(),
  remainingInstallments: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().trim().max(300).optional().default(""),
});

export const createFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const validation = createFixedExpenseSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0]?.message || "Invalid input.",
      });
    }

    const {
      title,
      amount,
      category,
      dueDay,
      commitmentType,
      totalInstallments,
      remainingInstallments,
      notes,
    } = validation.data;

    // Only installments have finite tenure; recurring commitments (Rent, School Fees, etc.) have null
    const isInstallment = commitmentType === "installment";
    const installments =
      isInstallment && totalInstallments !== undefined && totalInstallments !== null
        ? totalInstallments
        : null;

    const remaining =
      isInstallment &&
      remainingInstallments !== undefined &&
      remainingInstallments !== null
        ? remainingInstallments
        : installments;

    const fixedExpense = await FixedExpense.create({
      user: userId,
      title,
      amount,
      category,
      dueDay,
      commitmentType: commitmentType || "recurring",
      totalInstallments: installments,
      remainingInstallments: remaining,
      notes: notes || "",
    });
void sendFinoraEmail({
  to: req.user.email,
  subject: "Finora: Fixed commitment added",
  heading: "A fixed commitment was added",
  intro: "Your new fixed commitment has been saved successfully.",
  details: [
    { label: "Title", value: fixedExpense.title },
    { label: "Category", value: fixedExpense.category },
    {
      label: "Amount",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(fixedExpense.amount),
    },
    { label: "Due day", value: String(fixedExpense.dueDay) },
  ],
});
    return res.status(201).json({
      success: true,
      message: `Fixed commitment "${title}" created successfully.`,
      fixedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/budget/fixed-expenses/:id
export const updateFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const validation = createFixedExpenseSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: validation.error.issues[0]?.message || "Invalid input.",
      });
    }

    const fixedExpense = await FixedExpense.findOneAndUpdate(
      { _id: id, user: userId },
      validation.data,
      { new: true, runValidators: true }
    );

    if (!fixedExpense) {
      return res.status(404).json({ message: "Fixed expense not found." });
    }
void sendFinoraEmail({
  to: req.user.email,
  subject: "Finora: Fixed commitment updated",
  heading: "Your fixed commitment was updated",
  intro: "Your fixed commitment details have been updated successfully.",
  details: [
    { label: "Title", value: fixedExpense.title },
    { label: "Category", value: fixedExpense.category },
    {
      label: "Amount",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(fixedExpense.amount),
    },
    { label: "Due day", value: String(fixedExpense.dueDay) },
  ],
});
    return res.status(200).json({
      success: true,
      message: `"${fixedExpense.title}" updated successfully.`,
      fixedExpense,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/budget/fixed-expenses/:id
export const deleteFixedExpense = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid ID format." });
    }

    const fixedExpense = await FixedExpense.findOneAndDelete({
      _id: id,
      user: userId,
    });

    if (!fixedExpense) {
      return res.status(404).json({ message: "Fixed expense not found." });
    }
void sendFinoraEmail({
  to: req.user.email,
  subject: "Finora: Fixed commitment deleted",
  heading: "A fixed commitment was deleted",
  intro: "The following fixed commitment was removed from your account.",
  details: [
    { label: "Title", value: fixedExpense.title },
    { label: "Category", value: fixedExpense.category },
    {
      label: "Amount",
      value: new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "INR",
      }).format(fixedExpense.amount),
    },
  ],
});
    // Clean up from cycles paid IDs
    await BudgetPlan.updateOne(
      { user: userId },
      { $pull: { "cycles.$[].paidFixedExpenseIds": id } }
    );

    // Clean up any linked expenses
    await Expense.deleteMany({
      user: userId,
      fixedExpense: id,
    });

    return res.status(200).json({
      success: true,
      message: `"${fixedExpense.title}" deleted successfully.`,
      deletedId: id,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/budget/dismiss-notification
export const dismissNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { notificationId } = req.body;

    if (!notificationId) {
      return res.status(400).json({ message: "Notification ID is required." });
    }

    await BudgetPlan.updateOne(
      { user: userId, "notifications.id": notificationId },
      { $set: { "notifications.$.isRead": true } }
    );

    return res.status(200).json({
      success: true,
      message: "Notification dismissed.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/budget/savings-history?year=2026
export const getMonthlySavingsHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userObjectId =
      mongoose.Types.ObjectId.isValid(userId)
        ? new mongoose.Types.ObjectId(userId)
        : userId;

    const currentYear = new Date().getUTCFullYear();
    const currentMonthIndex = new Date().getUTCMonth(); // 0-11

    const yearQuery = req.query.year ? parseInt(req.query.year, 10) : currentYear;
    const targetYear =
      Number.isInteger(yearQuery) && yearQuery >= 2000 && yearQuery <= 2100
        ? yearQuery
        : currentYear;

    // 0. Determine when user joined Finora to track savings only from join month forward
    let userCreatedAt = req.user?.createdAt ? new Date(req.user.createdAt) : null;
    if (!userCreatedAt) {
      const userDoc = await User.findById(userId).select("createdAt").lean();
      userCreatedAt = userDoc?.createdAt ? new Date(userDoc.createdAt) : new Date();
    }
    const joinYear = userCreatedAt.getUTCFullYear();
    const joinMonthIndex = userCreatedAt.getUTCMonth(); // 0-11

    // 1. Fetch user budget plan
    const budgetPlan = await BudgetPlan.findOne({ user: userId });
    const baseSalary = budgetPlan?.monthlySalary || 0;

    // 2. Discover all years with expense activity
    const yearsAgg = await Expense.aggregate([
      { $match: { user: userObjectId } },
      { $group: { _id: { $year: "$date" } } },
      { $sort: { _id: -1 } },
    ]);
    const availableYearsSet = new Set(
      yearsAgg.map((y) => y._id).filter((y) => typeof y === "number")
    );
    availableYearsSet.add(currentYear);
    availableYearsSet.add(joinYear);
    const availableYears = Array.from(availableYearsSet).sort((a, b) => b - a);

    // 3. Aggregate daily variable expenses grouped by month for targetYear
    const startOfYear = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));

    const monthlyExpensesAgg = await Expense.aggregate([
      {
        $match: {
          user: userObjectId,
          date: { $gte: startOfYear, $lte: endOfYear },
          $or: [
            { fixedExpense: { $exists: false } },
            { fixedExpense: null },
          ],
        },
      },
      {
        $group: {
          _id: { $month: "$date" }, // 1 to 12
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const expenseByMonthMap = new Map();
    for (const item of monthlyExpensesAgg) {
      expenseByMonthMap.set(item._id, {
        totalAmount: Math.round(item.totalAmount * 100) / 100,
        count: item.count,
      });
    }

    // 4. Fetch fixed commitments to compute fixed monthly commitments
    const fixedExpenses = await FixedExpense.find({
      user: userId,
      $or: [{ isActive: true }, { isCompleted: true }],
    }).lean();

    // Default active recurring and installment commitments sum
    const activeFixedCommittedMonthly = Math.round(
      fixedExpenses
        .filter((e) => e.isActive && !e.isCompleted)
        .reduce((sum, e) => sum + e.amount, 0) * 100
    ) / 100;

    // Map cycle records by month prefix (e.g. '2026-03')
    const cyclesMap = new Map();
    if (budgetPlan?.cycles) {
      for (const cycle of budgetPlan.cycles) {
        const match = cycle.cycleKey.match(/^(\d{4})-(\d{2})/);
        if (match && parseInt(match[1], 10) === targetYear) {
          const monthNum = parseInt(match[2], 10);
          cyclesMap.set(monthNum, cycle);
        }
      }
    }

    const MONTH_NAMES = [
      { full: "January", short: "Jan" },
      { full: "February", short: "Feb" },
      { full: "March", short: "Mar" },
      { full: "April", short: "Apr" },
      { full: "May", short: "May" },
      { full: "June", short: "Jun" },
      { full: "July", short: "Jul" },
      { full: "August", short: "Aug" },
      { full: "September", short: "Sep" },
      { full: "October", short: "Oct" },
      { full: "November", short: "Nov" },
      { full: "December", short: "Dec" },
    ];

    const monthlyBreakdown = [];
    let cumulativeSavings = 0;
    let sumIncomeElapsed = 0;
    let sumSpentElapsed = 0;
    let sumSavedElapsed = 0;
    let elapsedCount = 0;
    let bestMonth = null;

    for (let m = 1; m <= 12; m++) {
      const monthIdx = m - 1;
      const isCurrentMonth =
        targetYear === currentYear && monthIdx === currentMonthIndex;
      const isFutureMonth =
        targetYear === currentYear && monthIdx > currentMonthIndex;
      const isPastMonth =
        targetYear < currentYear ||
        (targetYear === currentYear && monthIdx < currentMonthIndex);

      // Determine if month is before the user joined Finora
      const isPreJoinMonth =
        targetYear < joinYear ||
        (targetYear === joinYear && monthIdx < joinMonthIndex);

      const cycle = cyclesMap.get(m);
      const hasCustomSalary =
        cycle?.salaryOverride !== null &&
        cycle?.salaryOverride !== undefined &&
        Number(cycle.salaryOverride) > 0;

      // Daily variable expenses
      const expenseInfo = expenseByMonthMap.get(m) || {
        totalAmount: 0,
        count: 0,
      };
      const monthVariableSpent = expenseInfo.totalAmount;
      const monthExpenseCount = expenseInfo.count;

      const hasActivity =
        monthExpenseCount > 0 ||
        (cycle?.paidFixedExpenseIds && cycle.paidFixedExpenseIds.length > 0);

      // FUTURE MONTHS RULE:
      // A future month (e.g. December when current is November) must NOT be displayed
      // as upcoming unless the user has explicitly added a salary for that month (or logged activity).
      if (isFutureMonth && !hasCustomSalary && !hasActivity) {
        continue;
      }

      const monthSalary = isPreJoinMonth
        ? 0
        : hasCustomSalary
        ? cycle.salaryOverride
        : isFutureMonth
        ? 0
        : baseSalary;

      // Fixed expenses for this month
      let monthFixedSpent = 0;
      if (!isPreJoinMonth) {
        if (cycle?.paidFixedExpenseIds && cycle.paidFixedExpenseIds.length > 0) {
          const paidSet = new Set(
            cycle.paidFixedExpenseIds.map((id) => id.toString())
          );
          monthFixedSpent = Math.round(
            fixedExpenses
              .filter((e) => paidSet.has(e._id.toString()))
              .reduce((sum, e) => sum + e.amount, 0) * 100
          ) / 100;
        } else {
          // If past or current month without cycle record, or future month with salary, use active committed
          monthFixedSpent = activeFixedCommittedMonthly;
        }
      }

      const totalSpent =
        Math.round((monthFixedSpent + monthVariableSpent) * 100) / 100;
      const netSavings = isPreJoinMonth
        ? 0
        : Math.round((monthSalary - totalSpent) * 100) / 100;
      const savingsRate =
        !isPreJoinMonth && monthSalary > 0
          ? Math.round((netSavings / monthSalary) * 1000) / 10
          : 0;

      let status = "neutral";
      if (isPreJoinMonth) {
        status = "not_joined";
      } else if (isFutureMonth) {
        status = "future_planned";
      } else if (monthSalary > 0 || totalSpent > 0) {
        if (netSavings > 0) status = "surplus";
        else if (netSavings < 0) status = "deficit";
      }

      if (!isFutureMonth && !isPreJoinMonth) {
        cumulativeSavings += netSavings;
        sumIncomeElapsed += monthSalary;
        sumSpentElapsed += totalSpent;
        sumSavedElapsed += netSavings;
        elapsedCount += 1;

        if (
          !bestMonth ||
          netSavings > bestMonth.netSavings ||
          (netSavings === bestMonth.netSavings && savingsRate > bestMonth.savingsRate)
        ) {
          bestMonth = {
            monthIndex: monthIdx,
            monthName: MONTH_NAMES[monthIdx].full,
            netSavings,
            savingsRate,
          };
        }
      }

      monthlyBreakdown.push({
        monthNumber: m,
        monthIndex: monthIdx,
        monthName: MONTH_NAMES[monthIdx].full,
        monthShort: MONTH_NAMES[monthIdx].short,
        isCurrentMonth,
        isFutureMonth,
        isPastMonth,
        isPreJoinMonth,
        hasCustomSalary,
        salary: monthSalary,
        fixedSpent: monthFixedSpent,
        variableSpent: monthVariableSpent,
        expenseCount: monthExpenseCount,
        totalSpent,
        netSavings,
        savingsRate,
        status,
        cumulativeSavingsSoFar: Math.round(cumulativeSavings * 100) / 100,
      });
    }

    // Sort descending: current month first, then previous, then previous
    monthlyBreakdown.reverse();

    const totalIncome = Math.round(sumIncomeElapsed * 100) / 100;
    const totalSpent = Math.round(sumSpentElapsed * 100) / 100;
    const totalSaved = Math.round(sumSavedElapsed * 100) / 100;
    const averageMonthlySavings =
      elapsedCount > 0 ? Math.round((totalSaved / elapsedCount) * 100) / 100 : 0;
    const averageSavingsRate =
      totalIncome > 0 ? Math.round((totalSaved / totalIncome) * 1000) / 10 : 0;

    return res.status(200).json({
      success: true,
      year: targetYear,
      availableYears,
      summary: {
        totalIncome,
        totalSpent,
        totalSaved,
        averageMonthlySavings,
        averageSavingsRate,
        elapsedMonthsCount: elapsedCount,
        bestMonth,
        baseSalary,
        userJoinedAt: userCreatedAt,
        joinYear,
        joinMonthIndex,
        joinMonthName: MONTH_NAMES[joinMonthIndex]?.full || "",
      },
      monthlyBreakdown,
    });
  } catch (error) {
    next(error);
  }
};
