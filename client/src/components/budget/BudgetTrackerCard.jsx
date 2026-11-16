import { useState } from "react";
import {
  Wallet,
  CheckCircle2,
  Settings,
  Sparkles,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
  Zap,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency, getCategoryConfig } from "../../lib/expenseConstants";

export default function BudgetTrackerCard({
  budgetData,
  _loading,
  onOpenManageModal,
  onToggleFixedExpense,
  onDismissNotification,
}) {
  const [checklistExpanded, setChecklistExpanded] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  const metrics = budgetData?.metrics;
  const cycle = budgetData?.cycle;
  const salary = budgetData?.salary;
  const checklist = budgetData?.fixedExpenses?.checklist || [];
  const notifications = budgetData?.notifications || [];

  const handleToggle = async (fixedExpenseId, currentPaidStatus) => {
    if (togglingId) return;
    setTogglingId(fixedExpenseId);
    try {
      await onToggleFixedExpense(fixedExpenseId, !currentPaidStatus);
    } finally {
      setTogglingId(null);
    }
  };

  const isSalaryZero = !metrics || metrics.effectiveSalary <= 0;

  // Determine health color theme
  const healthBadge = {
    healthy: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200",
      label: "Healthy Pace",
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200",
      label: "75%+ Utilized",
    },
    critical: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
      label: "90%+ Critical",
    },
    exceeded: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
      label: "Over Budget",
    },
  }[metrics?.budgetHealth || "healthy"];

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden transition">
      {/* 1. Header Bar */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-finora-950 via-finora-900 to-finora-950 p-5 sm:p-6 text-white">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-finora-300 border border-white/15 backdrop-blur-md">
              <Wallet size={22} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-finora-500/20 border border-finora-400/30 px-2.5 py-0.5 text-[11px] font-bold text-finora-200">
                  <Sparkles size={11} />
                  BUDGET & COMMITMENTS
                </span>
                {cycle && (
                  <span className="text-xs text-finora-200/80 font-medium flex items-center gap-1">
                    <Calendar size={12} className="text-finora-300" />
                    {cycle.label}
                  </span>
                )}
              </div>

              <h2 className="mt-1 font-display text-lg sm:text-xl font-bold tracking-tight text-white">
                Monthly Salary & EMI Tracker
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {cycle && (
              <span className="hidden md:inline-flex items-center rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-finora-100 border border-white/10">
                {cycle.daysRemaining} day{cycle.daysRemaining === 1 ? "" : "s"} left
              </span>
            )}

            <button
              type="button"
              onClick={onOpenManageModal}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition active:scale-95"
            >
              <Settings size={15} />
              <span>Manage Budget & EMIs</span>
            </button>
          </div>
        </div>

        {/* Milestone / Tenure Completion Notification Banner */}
        <AnimatePresence>
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/20 p-3 text-xs font-medium text-emerald-100 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-300 shrink-0" />
                <span>{notif.message}</span>
              </div>
              <button
                type="button"
                onClick={() => onDismissNotification?.(notif.id)}
                className="text-emerald-300 hover:text-white p-1"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 2. Core Metrics Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Total Salary / Budget */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Monthly Salary / Budget
            </span>
            <div className="mt-2">
              <p className="font-display text-2xl font-black text-slate-900 truncate">
                {formatCurrency(metrics?.effectiveSalary || 0)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {isSalaryZero ? (
                  <button
                    type="button"
                    onClick={onOpenManageModal}
                    className="text-finora-700 font-semibold underline hover:text-finora-800"
                  >
                    Click to set salary
                  </button>
                ) : (
                  `Active ${salary?.cycleType === "salary_day" ? `Day ${salary.salaryDay}` : "Calendar"} cycle`
                )}
              </p>
            </div>
          </div>

          {/* Card 2: Fixed Commitments (EMIs & Rent) */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Fixed Commitments (EMIs)
              </span>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200/70">
                {budgetData?.fixedExpenses?.paidCount || 0} /{" "}
                {budgetData?.fixedExpenses?.totalCount || 0} Done
              </span>
            </div>
            <div className="mt-2">
              <p className="font-display text-2xl font-black text-slate-900 truncate">
                {formatCurrency(metrics?.totalFixedCommitted || 0)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(metrics?.paidFixedTotal || 0)} paid
                </span>{" "}
                • {formatCurrency(metrics?.pendingFixedTotal || 0)} pending
              </p>
            </div>
          </div>

          {/* Card 3: Daily Expenses Logged */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Daily Expenses Logged
              </span>
              <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-800 border border-sky-200/70">
                {metrics?.dailyExpensesCount || 0} entries
              </span>
            </div>
            <div className="mt-2">
              <p className="font-display text-2xl font-black text-slate-900 truncate">
                {formatCurrency(metrics?.dailyExpensesTotal || 0)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Logged across this cycle period
              </p>
            </div>
          </div>

          {/* Card 4: FINAL REMAINING SPENDABLE BUDGET */}
          <div
            className={`rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xs ${
              metrics?.budgetHealth === "exceeded"
                ? "border-red-200 bg-red-50/60"
                : "border-finora-300 bg-gradient-to-br from-finora-50/80 via-white to-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Remaining Spendable
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}
              >
                {healthBadge.label}
              </span>
            </div>

            <div className="mt-2">
              <p
                className={`font-display text-2xl sm:text-3xl font-black tracking-tight ${
                  metrics?.remainingSpendableBudget < 0
                    ? "text-red-700"
                    : "text-finora-950"
                }`}
              >
                {formatCurrency(metrics?.remainingSpendableBudget || 0)}
              </p>

              {/* Safe Daily Spend Allowance */}
              <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-finora-800">
                <Zap size={13} className="text-amber-500 fill-amber-500 shrink-0" />
                <span>
                  Safe Daily Spend:{" "}
                  <span className="font-black text-slate-900">
                    {formatCurrency(metrics?.safeDailySpend || 0)}/day
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Multi-Segment Progress Bar */}
        {metrics && metrics.effectiveSalary > 0 && (
          <div className="space-y-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-600">Budget Allocation Pace</span>
              <span className="text-slate-900">
                {metrics.utilizedPercent}% committed / spent
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 flex">
              {/* Paid Fixed Commitments */}
              {metrics.paidFixedTotal > 0 && (
                <div
                  style={{
                    width: `${Math.min(
                      (metrics.paidFixedTotal / metrics.effectiveSalary) * 100,
                      100
                    )}%`,
                  }}
                  className="bg-emerald-600 h-full transition-all duration-300"
                  title={`Paid EMIs: ${formatCurrency(metrics.paidFixedTotal)}`}
                />
              )}

              {/* Pending Fixed Commitments */}
              {metrics.pendingFixedTotal > 0 && (
                <div
                  style={{
                    width: `${Math.min(
                      (metrics.pendingFixedTotal / metrics.effectiveSalary) * 100,
                      100
                    )}%`,
                  }}
                  className="bg-amber-400 h-full transition-all duration-300"
                  title={`Pending EMIs: ${formatCurrency(metrics.pendingFixedTotal)}`}
                />
              )}

              {/* Daily Logged Expenses */}
              {metrics.dailyExpensesTotal > 0 && (
                <div
                  style={{
                    width: `${Math.min(
                      (metrics.dailyExpensesTotal / metrics.effectiveSalary) * 100,
                      100
                    )}%`,
                  }}
                  className="bg-sky-500 h-full transition-all duration-300"
                  title={`Daily Expenses: ${formatCurrency(metrics.dailyExpensesTotal)}`}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span>Paid EMIs ({formatCurrency(metrics.paidFixedTotal)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>Pending EMIs ({formatCurrency(metrics.pendingFixedTotal)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                <span>Daily Logged ({formatCurrency(metrics.dailyExpensesTotal)})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-200" />
                <span>Available ({formatCurrency(metrics.remainingSpendableBudget)})</span>
              </div>
            </div>
          </div>
        )}

        {/* 4. Interactive Fixed Expenses Checklist ("Tick as Done / Paid") */}
        <div className="rounded-2xl border border-slate-200/80 bg-white">
          <div
            onClick={() => setChecklistExpanded((prev) => !prev)}
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/70 transition rounded-2xl select-none"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-finora-100 text-finora-800">
                <CheckCircle2 size={17} />
              </div>

              <div>
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Fixed Commitments Checklist (EMIs, Rent & Loans)
                </h4>
                <p className="text-xs text-slate-500">
                  Tick each item when paid to formally subtract it from your budget
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                {checklist.filter((e) => e.isPaid).length} of {checklist.length} Paid
              </span>
              <button
                type="button"
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                {checklistExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {checklistExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-100 px-4 py-3 divide-y divide-slate-100"
              >
                {checklist.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">
                      No recurring EMIs or fixed commitments added yet.
                    </p>
                    <p className="mt-1">
                      Add your Bike EMI, TV EMI, Rent, or subscriptions in{" "}
                      <button
                        type="button"
                        onClick={onOpenManageModal}
                        className="text-finora-700 font-bold underline"
                      >
                        Manage Budget & EMIs
                      </button>
                      .
                    </p>
                  </div>
                ) : (
                  checklist.map((item) => {
                    const isPaid = Boolean(item.isPaid);
                    const config = getCategoryConfig(item.category);
                    const Icon = config.icon;
                    const isBusy = togglingId === item._id;

                    return (
                      <div
                        key={item._id}
                        className={`flex items-center justify-between py-3 transition rounded-xl px-2.5 -mx-2.5 ${
                          isPaid ? "bg-emerald-50/40" : "hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Checkbox Trigger */}
                          <button
                            type="button"
                            onClick={() => handleToggle(item._id, isPaid)}
                            disabled={isBusy}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                              isPaid
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                                : "border-slate-300 bg-white hover:border-slate-400"
                            } ${isBusy ? "opacity-50" : ""}`}
                            title={isPaid ? "Mark as Pending" : "Mark as Paid"}
                          >
                            {isPaid && <Check size={14} strokeWidth={3} />}
                          </button>

                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.color}`}
                          >
                            <Icon size={15} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-semibold truncate ${
                                  isPaid
                                    ? "line-through text-slate-400"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.title}
                              </p>

                              {isPaid && (
                                <span className="rounded-md bg-emerald-100/80 px-2 py-0.2 text-[10px] font-bold text-emerald-800">
                                  PAID
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>Due day {item.dueDay}</span>
                              {item.remainingInstallments !== null && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-600">
                                    {item.remainingInstallments} installment
                                    {item.remainingInstallments === 1 ? "" : "s"} left
                                  </span>
                                </>
                              )}
                              {item.notes && (
                                <>
                                  <span>•</span>
                                  <span className="truncate italic text-slate-400 max-w-xs">
                                    {item.notes}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3">
                          <p
                            className={`font-display text-sm sm:text-base font-extrabold ${
                              isPaid ? "text-emerald-700" : "text-slate-900"
                            }`}
                          >
                            {formatCurrency(item.amount)}
                          </p>
                          <span className="text-[10px] font-medium text-slate-400">
                            {isPaid ? "Deducted" : "Pending Tick"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
