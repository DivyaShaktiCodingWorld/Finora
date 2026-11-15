import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  Sparkles,
  Wallet,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency } from "../../lib/expenseConstants";
import budgetService from "../../services/budgetService";

export default function MonthlySavingsTracker({ onNotify }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [savingsData, setSavingsData] = useState(null);
  const [loading, setLoading] = useState(true);

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
          err.response?.data?.message || "Failed to load savings history."
        );
      } finally {
        setLoading(false);
      }
    },
    [onNotify]
  );

  useEffect(() => {
    fetchSavingsHistory(selectedYear);
  }, [selectedYear, fetchSavingsHistory]);

  const summary = savingsData?.summary;
  const breakdown = savingsData?.monthlyBreakdown || [];
  const availableYears = savingsData?.availableYears || [currentYear];

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
              Track your salary surplus, monthly savings rate, and financial reserves over time
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
              {isNetPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
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
            Across {summary?.elapsedMonthsCount || 0} active months in {selectedYear}
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
                      : 0
                  )
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-display text-base font-bold text-slate-900">
              Monthly Breakdown ({selectedYear})
            </h4>
            <p className="text-xs text-slate-500">
              Complete audit of salary, fixed commitments (Rent, Fees, EMIs), daily spend, and net savings
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Surplus Saved
            </span>
            <span className="flex items-center gap-1.5 font-medium text-red-600">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Deficit / Overspent
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-400">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              Upcoming
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Calculating historical savings...
          </div>
        ) : breakdown.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No savings data available for {selectedYear}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdown.map((item) => {
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
                      : isFuture
                      ? "border-slate-200/60 bg-slate-50/40 opacity-70"
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
                    {isFuture ? (
                      <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                        <Clock size={12} />
                        Upcoming
                      </span>
                    ) : isSurplus ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                        <TrendingUp size={12} />
                        +{formatCurrency(item.netSavings)}
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

                  {/* Outflow Breakdown Items */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Salary Budget:</span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.salary)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Fixed Dues (Rent/EMIs):</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(item.fixedSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500">
                      <span>Daily Variable Expenses ({item.expenseCount}):</span>
                      <span className="font-medium text-slate-700">
                        {formatCurrency(item.variableSpent)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-slate-700 font-semibold">
                      <span>Total Outflow:</span>
                      <span className="text-slate-900">
                        {formatCurrency(item.totalSpent)}
                      </span>
                    </div>
                  </div>

                  {/* Net Savings & Rate Bar */}
                  {!isFuture && (
                    <div className="mt-3 rounded-xl bg-slate-50 p-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">
                          {isSurplus ? "Net Savings:" : "Net Deficit:"}
                        </span>
                        <span
                          className={`font-display font-bold ${
                            isSurplus
                              ? "text-emerald-700"
                              : isDeficit
                              ? "text-red-600"
                              : "text-slate-700"
                          }`}
                        >
                          {isSurplus ? `+${formatCurrency(item.netSavings)}` : formatCurrency(item.netSavings)}{" "}
                          <span className="text-[11px] font-normal">
                            ({item.savingsRate}%)
                          </span>
                        </span>
                      </div>

                      {/* Bar */}
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${
                            isSurplus ? "bg-emerald-500" : "bg-red-500"
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
