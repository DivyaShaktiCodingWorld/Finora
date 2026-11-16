import mongoose from "mongoose";
import { EXPENSE_CATEGORIES } from "./Expense.js";

const fixedExpenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must not exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      default: "Bills",
      validate: {
        validator: (v) => EXPENSE_CATEGORIES.includes(v),
        message: "Invalid category",
      },
    },
    dueDay: {
      type: Number,
      min: [1, "Due day must be between 1 and 31"],
      max: [31, "Due day must be between 1 and 31"],
      default: 1,
    },
    // "recurring" = ongoing (House Rent, School Fees, Bills, etc.)
    // "installment" = finite loans/EMIs (TV, Bike, Personal Loan)
    commitmentType: {
      type: String,
      enum: ["recurring", "installment"],
      default: "recurring",
    },
    // Null for recurring. Number for finite installment tenure
    totalInstallments: {
      type: Number,
      min: 1,
      default: null,
    },
    remainingInstallments: {
      type: Number,
      min: 0,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Notes must not exceed 300 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const FixedExpense = mongoose.model("FixedExpense", fixedExpenseSchema);

export default FixedExpense;
