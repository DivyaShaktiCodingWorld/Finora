import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  DollarSign,
  Calendar,
  CreditCard,
  Tag,
  AlignLeft,
  Loader2,
} from "lucide-react";

import {
  EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  toInputDateFormat,
} from "../../lib/expenseConstants";
import Alert from "../ui/Alert";

export default function ExpenseModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
}) {
  const isEditing = Boolean(initialData && initialData._id);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Food & Dining",
    date: toInputDateFormat(new Date()),
    paymentMethod: "Credit Card",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || "",
        amount: initialData.amount !== undefined ? String(initialData.amount) : "",
        category: initialData.category || "Food & Dining",
        date: toInputDateFormat(initialData.date),
        paymentMethod: initialData.paymentMethod || "Credit Card",
        notes: initialData.notes || "",
      });
    } else {
      setForm({
        title: "",
        amount: "",
        category: "Food & Dining",
        date: toInputDateFormat(new Date()),
        paymentMethod: "Credit Card",
        notes: "",
      });
    }
    setErrors({});
    setServerError("");
  }, [initialData, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, submitting, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Expense title is required.";
    } else if (form.title.length > 100) {
      nextErrors.title = "Title cannot exceed 100 characters.";
    }

    const numAmount = parseFloat(form.amount);
    if (!form.amount || isNaN(numAmount) || numAmount <= 0) {
      nextErrors.amount = "Enter a valid amount greater than 0.";
    }

    if (!form.category) {
      nextErrors.category = "Please select a category.";
    }

    if (!form.date) {
      nextErrors.date = "Expense date is required.";
    }

    if (form.notes && form.notes.length > 500) {
      nextErrors.notes = "Notes cannot exceed 500 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || submitting) return;

    setSubmitting(true);
    setServerError("");

    try {
      await onSubmit({
        title: form.title.trim(),
        amount: parseFloat(form.amount),
        category: form.category,
        date: form.date,
        paymentMethod: form.paymentMethod,
        notes: form.notes.trim(),
      });
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (isEditing
          ? "Failed to update expense. Please try again."
          : "Failed to create expense. Please try again.");
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => !submitting && onClose()}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
            className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl z-10 my-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-xl font-bold text-slate-900">
                  {isEditing ? "Edit Expense" : "Add New Expense"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {isEditing
                    ? "Update the details of your recorded expense."
                    : "Track a new spending transaction with details."}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            {/* Error notification if any */}
            {serverError && (
              <div className="mt-4">
                <Alert type="error" message={serverError} />
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-title"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Expense Title *
                </label>
                <div
                  className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-all ${
                    errors.title ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100"
                  }`}
                >
                  <Tag size={18} className="shrink-0 text-slate-400" />
                  <input
                    id="expense-title"
                    name="title"
                    type="text"
                    placeholder="e.g. Weekly Grocery Run"
                    value={form.title}
                    onChange={handleChange}
                    disabled={submitting}
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                {errors.title && (
                  <p className="text-xs font-medium text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Amount and Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="expense-amount"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Amount ($) *
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-all ${
                      errors.amount ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100"
                    }`}
                  >
                    <DollarSign size={18} className="shrink-0 text-slate-400" />
                    <input
                      id="expense-amount"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={handleChange}
                      disabled={submitting}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-xs font-medium text-red-500">{errors.amount}</p>
                  )}
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="expense-date"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Date *
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-all ${
                      errors.date ? "border-red-400 ring-2 ring-red-100" : "border-slate-200 focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100"
                    }`}
                  >
                    <Calendar size={18} className="shrink-0 text-slate-400" />
                    <input
                      id="expense-date"
                      name="date"
                      type="date"
                      value={form.date}
                      onChange={handleChange}
                      disabled={submitting}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none"
                    />
                  </div>
                  {errors.date && (
                    <p className="text-xs font-medium text-red-500">{errors.date}</p>
                  )}
                </div>
              </div>

              {/* Category and Payment Method Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="expense-category"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Category *
                  </label>
                  <div
                    className={`flex items-center gap-3 rounded-xl border bg-white px-3.5 py-3 transition-all ${
                      errors.category ? "border-red-400" : "border-slate-200 focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100"
                    }`}
                  >
                    <select
                      id="expense-category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      disabled={submitting}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none cursor-pointer"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.category && (
                    <p className="text-xs font-medium text-red-500">{errors.category}</p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="expense-payment"
                    className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                  >
                    Payment Method
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition-all focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100">
                    <CreditCard size={18} className="shrink-0 text-slate-400" />
                    <select
                      id="expense-payment"
                      name="paymentMethod"
                      value={form.paymentMethod}
                      onChange={handleChange}
                      disabled={submitting}
                      className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none cursor-pointer"
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm} value={pm}>
                          {pm}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label
                  htmlFor="expense-notes"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-600"
                >
                  Notes (Optional)
                </label>
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 transition-all focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100">
                  <AlignLeft size={18} className="mt-0.5 shrink-0 text-slate-400" />
                  <textarea
                    id="expense-notes"
                    name="notes"
                    rows={2}
                    placeholder="Add extra context or receipt details..."
                    value={form.notes}
                    onChange={handleChange}
                    disabled={submitting}
                    className="min-w-0 flex-1 resize-none bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
                {errors.notes && (
                  <p className="text-xs font-medium text-red-500">{errors.notes}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-finora-800 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-finora-900/15 transition-all hover:bg-finora-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {isEditing ? "Save Changes" : "Add Expense"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
