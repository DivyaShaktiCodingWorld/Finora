import { motion } from "framer-motion";
import {
  Pencil,
  Trash2,
  Calendar,
  CreditCard,
  FileQuestion,
  Plus,
} from "lucide-react";
import {
  formatCurrency,
  formatExpenseDate,
  getCategoryConfig,
} from "../../lib/expenseConstants";

export default function ExpenseList({
  expenses = [],
  loading = false,
  onEdit,
  onDelete,
  onAddClick,
  hasFilters = false,
  onResetFilters,
  periodLabel = "This Window",
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 animate-pulse"
          >
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 rounded-xl bg-slate-100" />
              <div className="space-y-2">
                <div className="h-4 w-36 rounded bg-slate-100" />
                <div className="h-3 w-24 rounded bg-slate-100" />
              </div>
            </div>
            <div className="h-6 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 px-6 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <FileQuestion size={28} />
        </div>

        <h3 className="mt-4 font-display text-base font-bold text-slate-900">
          {hasFilters
            ? `No expenses found for ${periodLabel}`
            : "No expenses recorded yet"}
        </h3>

        <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-slate-500">
          {hasFilters
            ? "Try selecting another month or year, clearing the search term, or resetting filters."
            : "Start taking control of your personal finances by logging your first expense."}
        </p>

        <div className="mt-5 flex items-center gap-3">
          {hasFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Reset All Filters
            </button>
          ) : (
            <button
              type="button"
              onClick={onAddClick}
              className="inline-flex items-center gap-2 rounded-xl bg-finora-800 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-finora-900/10 hover:bg-finora-700 transition"
            >
              <Plus size={16} />
              Add Your First Expense
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <div className="divide-y divide-slate-100">
        {expenses.map((expense, idx) => {
          const config = getCategoryConfig(expense.category);
          const Icon = config.icon;

          return (
            <motion.div
              key={expense._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02, duration: 0.2 }}
              className="group flex flex-col gap-3 p-4 transition-all hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5 sm:items-center">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${config.bg} ${config.color} ${config.border}`}
                >
                  <Icon size={20} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate max-w-[280px] sm:max-w-md">
                      {expense.title}
                    </h4>

                    {/* Category badge */}
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${config.badgeBg} ${config.color}`}
                    >
                      {expense.category}
                    </span>
                  </div>

                  {/* Metadata Row: Date, Payment Method, Notes */}
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      <Calendar size={13} className="text-slate-400" />
                      {formatExpenseDate(expense.date)}
                    </span>

                    {expense.paymentMethod && (
                      <span className="inline-flex items-center gap-1">
                        <CreditCard size={13} className="text-slate-400" />
                        {expense.paymentMethod}
                      </span>
                    )}

                    {expense.notes && (
                      <span
                        className="truncate text-slate-400 max-w-[200px] sm:max-w-xs"
                        title={expense.notes}
                      >
                        • {expense.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Amount & Actions */}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100 sm:border-t-0 sm:pt-0 sm:justify-end">
                <div className="text-left sm:text-right">
                  <p className="font-display text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                    -{formatCurrency(expense.amount)}
                  </p>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1 sm:opacity-90 sm:transition-opacity sm:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => onEdit(expense)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-200/60 hover:text-slate-700"
                    title="Edit expense"
                    aria-label="Edit expense"
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDelete(expense)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    title="Delete expense"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
