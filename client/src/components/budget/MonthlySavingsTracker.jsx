import { useState, useEffect, useCallback, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Sparkles,
  Wallet,
  Clock,
  Plus,
  Trash2,
  X,
  IndianRupee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../../lib/expenseConstants";
import budgetService from "../../services/budgetService";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthlySavingsTracker({ onNotify }) {
  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth(); // 0-11
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [savingsData, setSavingsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Future Month Salary Planning Modal State
  const [isPlanFutureModalOpen, setIsPlanFutureModalOpen] = useState(false);
  const [futureModalMonth, setFutureModalMonth] = useState(12);
  const [futureModalSalary, setFutureModalSalary] = useState("");
  const [savingFuture, setSavingFuture] = useState(false);

  const fetchSavingsHistory = useCallback(
    async (year) => {
      setLoading(true);
      try {
        const data = await budgetService.getMonthlySavingsHistory({ year });
        if (data.success) {
          setSavingsData(data);
        }
      } catch (err) {
        console.error("Failed to fetch monthly savings history:", err);
        onNotify?.(
          "error",
          err.response?.data?.message || "Failed to load savings history.",
        );
      } finally {
        setLoading(false);
      }
    },
    [onNotify],
  );

  useEffect(() => {
    fetchSavingsHistory(selectedYear);
  }, [selectedYear, fetchSavingsHistory]);

  const summary = savingsData?.summary;
  const breakdown = savingsData?.monthlyBreakdown || [];
  const availableYears = savingsData?.availableYears || [currentYear];

  // Available future months for planning in selectedYear
  const availableFutureMonths = useMemo(() => {
    if (selectedYear < currentYear) return [];
    const list = [];
    for (let m = 1; m <= 12; m++) {
      const monthIdx = m - 1;
      const isFuture =
        selectedYear > currentYear ||
        (selectedYear === currentYear && monthIdx > currentMonthIndex);
      if (isFuture) {
        const alreadyHasSalary = breakdown.some(
          (b) => b.monthNumber === m && (b.salary > 0 || b.hasCustomSalary)
        );
        list.push({
          monthNumber: m,
          monthName: MONTH_NAMES[monthIdx],
          alreadyHasSalary,
        });
      }
    }
    return list;
  }, [selectedYear, currentYear, currentMonthIndex, breakdown]);

  // Months sorted in reverse chronological order (current/latest month first)
  // and future months without salary are excluded
  const visibleMonths = useMemo(() => {
    const sorted = [...breakdown].sort((a, b) => b.monthNumber - a.monthNumber);
    return sorted.filter(
      (item) =>
        !item.isFutureMonth ||
        item.hasCustomSalary ||
        (item.salary && item.salary > 0) ||
        (item.expenseCount && item.expenseCount > 0)
    );
  }, [breakdown]);

  const handleSaveFutureMonth = async (e) => {
    e.preventDefault();
    const parsed = parseFloat(futureModalSalary);
    if (isNaN(parsed) || parsed <= 0) {
      onNotify?.("error", "Please enter a valid salary greater than ₹0.");
      return;
    }

    setSavingFuture(true);
    try {
      await budgetService.setMonthSalary({
        year: selectedYear,
        month: Number(futureModalMonth),
        salary: parsed,
      });
      onNotify?.(
        "success",
        `Salary added for ${
          MONTH_NAMES[futureModalMonth - 1]
        } ${selectedYear}! It is now tracked in your savings ledger.`
      );
      setIsPlanFutureModalOpen(false);
      setFutureModalSalary("");
      await fetchSavingsHistory(selectedYear);
    } catch (err) {
      console.error("Failed to plan future month salary:", err);
      onNotify?.(
        "error",
        err.response?.data?.message || "Failed to set future month salary."
      );
    } finally {
      setSavingFuture(false);
    }
  };

  const handleRemoveFutureMonth = async (monthNum) => {
    try {
      await budgetService.setMonthSalary({
        year: selectedYear,
        month: monthNum,
        salary: 0,
      });
      onNotify?.("info", "Future planned month removed from savings ledger.");
      await fetchSavingsHistory(selectedYear);
    } catch (err) {
      console.error("Failed to remove future month:", err);
      onNotify?.("error", "Failed to remove future month.");
    }
  };

  const handlePrevYear = () => {
    const prev = selectedYear - 1;
    if (prev >= 2000) setSelectedYear(prev);
  };

  const handleNextYear = () => {
    const next = selectedYear + 1;
    if (next <= 2100) setSelectedYear(next);
  };

  const isNetPositive = (summary?.totalSaved || 0) >= 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar with Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-finora-100 text-finora-800">
            <PiggyBank size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                <Sparkles size={11} />
                WEALTH & SURPLUS TRACKER
              </span>
            </div>
            <h3 className="mt-0.5 font-display text-base sm:text-lg font-bold text-slate-900">
              Month-by-Month Savings History
            </h3>
            <p className="text-xs text-slate-500">
              Track your salary surplus, monthly savings rate, and financial
              reserves over time
            </p>
          </div>
        </div>

        {/* Year Stepper */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handlePrevYear}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Previous Year"
          >
            <ChevronLeft size={16} />
          </button>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="h-9 rounded-xl border border-slate-200 bg-white px-3 font-display text-sm font-bold text-slate-900 focus:border-finora-600 focus:outline-none"
          >
            {availableYears.map((yr) => (
              <option key={yr} value={yr}>
                {yr} Financial Year
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleNextYear}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Next Year"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Saved */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border p-5 shadow-xs ${
            isNetPositive
              ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40"
              : "border-red-200 bg-gradient-to-br from-white to-red-50/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Saved ({selectedYear})
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isNetPositive
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {isNetPositive ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`font-display text-2xl font-black ${
                isNetPositive ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {loading ? "..." : formatCurrency(summary?.totalSaved || 0)}
            </span>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <span
              className={`font-bold ${
                isNetPositive ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {summary?.averageSavingsRate || 0}%
            </span>
            <span>of total salary saved</span>
          </div>
        </motion.div>

        {/* Card 2: Average Monthly Savings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Avg. Monthly Savings
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-100 text-finora-800">
              <PiggyBank size={16} />
            </div>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-2xl font-black text-slate-900">
              {loading
                ? "..."
                : formatCurrency(summary?.averageMonthlySavings || 0)}
            </span>
            <span className="text-xs font-medium text-slate-400">/ mo</span>
          </div>

          <p className="mt-2 text-[11px] text-slate-500">
            {summary?.joinYear === selectedYear ? (
              <>
                Across {summary?.elapsedMonthsCount || 0} tracked month(s) since
                joining in {summary?.joinMonthName}
              </>
            ) : (
              <>
                Across {summary?.elapsedMonthsCount || 0} active months in{" "}
                {selectedYear}
              </>
            )}
          </p>
        </motion.div>

        {/* Card 3: Total Income vs Total Spent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Spent vs Earned
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Wallet size={16} />
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Earned:</span>
              <span className="font-bold text-slate-800">
                {loading ? "..." : formatCurrency(summary?.totalIncome || 0)}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Total Outflow:</span>
              <span className="font-bold text-slate-800">
                {loading ? "..." : formatCurrency(summary?.totalSpent || 0)}
              </span>
            </div>
          </div>

          {/* Mini Progress Bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                (summary?.averageSavingsRate || 0) >= 20
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.max(
                    0,
                    summary?.totalIncome
                      ? ((summary.totalIncome - summary.totalSpent) /
                          summary.totalIncome) *
                          100
                      : 0,
                  ),
                )}%`,
              }}
            />
          </div>
        </motion.div>

        {/* Card 4: Best Savings Month */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-finora-200 bg-gradient-to-br from-finora-950 to-finora-900 p-5 text-white shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-finora-300">
              Best Month
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-finora-200">
              <Sparkles size={16} />
            </div>
          </div>

          <div className="mt-2">
            <span className="font-display text-xl sm:text-2xl font-black text-white">
              {summary?.bestMonth ? summary.bestMonth.monthName : "No Data Yet"}
            </span>
          </div>

          {summary?.bestMonth ? (
            <p className="mt-1 text-xs text-finora-200/90 font-medium">
              Saved{" "}
              <strong className="text-white">
                {formatCurrency(summary.bestMonth.netSavings)}
              </strong>{" "}
              ({summary.bestMonth.savingsRate}% rate)
            </p>
          ) : (
            <p className="mt-1 text-xs text-finora-200/70">
              Log salary and expenses to see your peak savings
            </p>
          )}
        </motion.div>
      </div>

      {/* 3. Month-by-Month Savings Ledger & Health Cards */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-display text-base font-bold text-slate-900">
              Monthly Breakdown ({selectedYear})
            </h4>
            <p className="text-xs text-slate-500">
              Ordered with current month first, showing your actual savings
              ledger, fixed commitments, and surplus
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Action to plan future month if any future month exists */}
            {selectedYear >= currentYear && availableFutureMonths.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const firstUnplanned =
                    availableFutureMonths.find((m) => !m.alreadyHasSalary) ||
                    availableFutureMonths[0];
                  setFutureModalMonth(firstUnplanned.monthNumber);
                  setFutureModalSalary("");
                  setIsPlanFutureModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
              >
                <Plus size={13} />
                <span>+ Plan Future Month Salary</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Surplus Saved
              </span>
              <span className="flex items-center gap-1.5 font-medium text-red-600">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Deficit / Overspent
              </span>
              {visibleMonths.some((i) => i.isFutureMonth) && (
                <span className="flex items-center gap-1.5 font-medium text-indigo-700">
                  <span className="h-2 w-2 rounded-full bg-indigo-500" />
                  Future Planned
                </span>
              )}
              <span className="flex items-center gap-1.5 font-medium text-slate-400">
                <span className="h-2 w-2 rounded-full bg-slate-200 border border-slate-300" />
                Not on Finora yet
              </span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Calculating historical savings...
          </div>
        ) : visibleMonths.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No savings data available for {selectedYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleMonths.map((item) => {
              const isPreJoin =
                item.isPreJoinMonth || item.status === "not_joined";
              const isSurplus = item.status === "surplus";
              const isDeficit = item.status === "deficit";
              const isFuture = item.isFutureMonth;
              const isCurrent = item.isCurrentMonth;

              return (
                <div
                  key={item.monthNumber}
                  className={`relative rounded-2xl border p-4 transition ${
                    isCurrent
                      ? "border-finora-600 bg-finora-50/20 ring-1 ring-finora-600/40"
                      : isPreJoin
                        ? "border-slate-200/70 bg-slate-50/50 opacity-60"
                        : isFuture
                          ? "border-indigo-200 bg-gradient-to-br from-white to-indigo-50/30 shadow-2xs"
                          : isSurplus
                            ? "border-emerald-200/90 bg-white hover:border-emerald-300"
                            : isDeficit
                              ? "border-red-200 bg-red-50/20 hover:border-red-300"
                              : "border-slate-200 bg-white"
                  }`}
                >
                  {/* Month Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-bold text-slate-900">
                        {item.monthName}
                      </span>
                      {isCurrent && (
                        <span className="rounded-full bg-finora-100 px-2 py-0.5 text-[10px] font-bold text-finora-800 border border-finora-200">
                          Current
                        </span>
                      )}
                    </div>

                    {/* Status Pill */}
                    {isPreJoin ? (
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        Not on Finora yet
                      </span>
                    ) : isFuture ? (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                          <Sparkles size={11} />
                          Planned
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFutureMonth(item.monthNumber)}
                          className="text-slate-400 hover:text-red-500 p-0.5 rounded transition"
                          title="Remove future planned salary"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : isSurplus ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <TrendingUp size={12} />+
                        {formatCurrency(item.netSavings)}
                      </span>
                    ) : isDeficit ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200">
                        <TrendingDown size={12} />
                        {formatCurrency(item.netSavings)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium">
                        Break-even
                      </span>
                    )}
                  </div>

                  {isPreJoin ? (
                    <div className="mt-4 py-5 px-3 rounded-xl bg-white/70 border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-semibold text-slate-500">
                        Pre-membership Period
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Savings tracking started upon joining in{" "}
                        {summary?.joinMonthName || "a later month"}{" "}
                        {summary?.joinYear || ""}
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Outflow Breakdown Items */}
                      <div className="mt-3 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-slate-600">
                          <span>
                            {isFuture ? "Planned Salary:" : "Salary Budget:"}
                          </span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(item.salary)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-500">
                          <span>
                            {isFuture
                              ? "Projected Dues (Rent/EMIs):"
                              : "Fixed Dues (Rent/EMIs):"}
                          </span>
                          <span className="font-medium text-slate-700">
                            {formatCurrency(item.fixedSpent)}
                          </span>
                        </div>

                        {!isFuture && (
                          <div className="flex items-center justify-between text-slate-500">
                            <span>
                              Daily Variable Expenses ({item.expenseCount}):
                            </span>
                            <span className="font-medium text-slate-700">
                              {formatCurrency(item.variableSpent)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-slate-700 font-semibold">
                          <span>{isFuture ? "Projected Dues:" : "Total Outflow:"}</span>
                          <span className="text-slate-900">
                            {formatCurrency(item.totalSpent)}
                          </span>
                        </div>
                      </div>

                      {/* Net Savings / Surplus */}
                      <div
                        className={`mt-3 rounded-xl p-2.5 ${
                          isFuture
                            ? "bg-indigo-50/50 border border-indigo-100"
                            : "bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-medium ${
                              isFuture
                                ? "text-indigo-900 font-semibold"
                                : "text-slate-600"
                            }`}
                          >
                            {isFuture
                              ? "Projected Savings:"
                              : isSurplus
                                ? "Net Savings:"
                                : "Net Deficit:"}
                          </span>
                          <span
                            className={`font-display font-bold ${
                              isFuture
                                ? "text-indigo-700"
                                : isSurplus
                                  ? "text-emerald-700"
                                  : isDeficit
                                    ? "text-red-600"
                                    : "text-slate-700"
                            }`}
                          >
                            {isSurplus || isFuture
                              ? `+${formatCurrency(item.netSavings)}`
                              : formatCurrency(item.netSavings)}{" "}
                            <span className="text-[11px] font-normal">
                              ({item.savingsRate}%)
                            </span>
                          </span>
                        </div>

                        {/* Bar */}
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div
                            className={`h-full rounded-full ${
                              isFuture
                                ? "bg-indigo-500"
                                : isSurplus
                                  ? "bg-emerald-500"
                                  : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Math.abs(item.savingsRate))
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan Future Month Salary Modal */}
      <AnimatePresence>
        {isPlanFutureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPlanFutureModalOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl z-10"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold text-slate-900">
                      Plan Future Month Salary
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add salary for upcoming months in {selectedYear}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPlanFutureModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveFutureMonth} className="mt-4 space-y-4">
                <div>
                  <label
                    htmlFor="future-month-select"
                    className="block text-xs font-bold uppercase text-slate-700"
                  >
                    Select Upcoming Month
                  </label>
                  <select
                    id="future-month-select"
                    value={futureModalMonth}
                    onChange={(e) => setFutureModalMonth(Number(e.target.value))}
                    className="mt-1.5 w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-finora-600 focus:outline-none"
                  >
                    {availableFutureMonths.map((m) => (
                      <option key={m.monthNumber} value={m.monthNumber}>
                        {m.monthName} {selectedYear}
                        {m.alreadyHasSalary ? " (Edit existing salary)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="future-month-salary"
                    className="block text-xs font-bold uppercase text-slate-700"
                  >
                    Expected Salary (₹) *
                  </label>
                  <div className="relative mt-1.5">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <IndianRupee size={16} />
                    </div>
                    <input
                      id="future-month-salary"
                      type="number"
                      min="1"
                      step="any"
                      required
                      value={futureModalSalary}
                      onChange={(e) => setFutureModalSalary(e.target.value)}
                      placeholder="e.g. 60,000"
                      autoFocus
                      className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-9 pr-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-finora-600 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Once added, this month will appear in your ledger with
                    projected savings.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsPlanFutureModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingFuture}
                    className="rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {savingFuture ? "Saving..." : "Add to Savings Ledger"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
