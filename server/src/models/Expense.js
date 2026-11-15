import mongoose from "mongoose";

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing & Rent",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Education",
  "Personal Care",
  "Travel",
  "Investments",
  "Bills",
  "Other",
];

export const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI / Net Banking",
  "Bank Transfer",
  "Other",
];

const expenseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Expense title is required"],
      trim: true,
      minlength: [1, "Title cannot be empty"],
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Expense amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      enum: {
        values: EXPENSE_CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: "Other",
    },
    date: {
      type: Date,
      required: [true, "Expense date is required"],
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      enum: {
        values: PAYMENT_METHODS,
        message: "{VALUE} is not a valid payment method",
      },
      default: "Cash",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user expenses ordered by date
expenseSchema.index({ user: 1, date: -1 });

const Expense = mongoose.model("Expense", expenseSchema);

export default Expense;
