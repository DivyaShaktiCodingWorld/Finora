import mongoose from "mongoose";

const cycleRecordSchema = new mongoose.Schema(
  {
    cycleKey: {
      type: String,
      required: true,
    },
    salaryOverride: {
      type: Number,
      default: null,
    },
    paidFixedExpenseIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FixedExpense",
      },
    ],
  },
  { _id: false }
);

const budgetNotificationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["success", "info", "warning"],
      default: "info",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const budgetPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    monthlySalary: {
      type: Number,
      required: true,
      min: [0, "Salary cannot be negative"],
      default: 0,
    },
    cycleType: {
      type: String,
      enum: ["calendar_month", "salary_day"],
      default: "calendar_month",
    },
    salaryDay: {
      type: Number,
      min: [1, "Salary day must be between 1 and 31"],
      max: [31, "Salary day must be between 1 and 31"],
      default: 1,
    },
    cycles: [cycleRecordSchema],
    notifications: [budgetNotificationSchema],
  },
  {
    timestamps: true,
  }
);

const BudgetPlan = mongoose.model("BudgetPlan", budgetPlanSchema);

export default BudgetPlan;
