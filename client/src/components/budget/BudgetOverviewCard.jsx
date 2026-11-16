import { Link } from "react-router-dom";
import {
  Zap,
  ArrowUpRight,
  Sparkles,
  Calendar,
  PiggyBank,
} from "lucide-react";
import { formatCurrency } from "../../lib/expenseConstants";

export default function BudgetOverviewCard({ budgetData, loading }) {
  const metrics = budgetData?.metrics;
  const cycle = budgetData?.cycle;

  const isSalaryConfigured = (metrics?.effectiveSalary || 0) > 0;
  const isOverBudget = (metrics?.remainingSpendableBudget || 0) < 0;

  // Determine health color badge
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
      {/* Top Banner */}
      <div className="border-b border-slate-100 bg-gradient-to-r from-finora-950 via-finora-900 to-finora-950 px-6 py-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-finora-300 border border-white/15">
              <PiggyBank size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-finora-500/20 border border-finora-400/30 px-2 py-0.5 text-[10px] font-bold text-finora-200">
                  <Sparkles size={10} />
                  BUDGET & SAVINGS STATUS
                </span>
                {cycle && (
                  <span className="text-[11px] text-emerald-100/70 flex items-center gap-1">
                    <Calendar size={11} className="text-emerald-300" />
                    {cycle.label}
                  </span>
                )}
              </div>
              <h3 className="font-display text-sm sm:text-base font-bold text-white mt-0.5">
                Monthly Spendable Budget & Safe Daily Allowance
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {healthBadge && isSalaryConfigured && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${healthBadge.bg} ${healthBadge.text} ${healthBadge.border}`}
              >
                {healthBadge.label}
              </span>
            )}
            <Link
              to="/budget"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition backdrop-blur-sm"
            >
              <span>Manage Budget & Dues</span>
              <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 p-2 sm:p-4 bg-slate-50/40">
        {/* Metric 1: Monthly Salary */}
        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Salary Pool
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-slate-900">
            {loading ? "..." : formatCurrency(metrics?.effectiveSalary || 0)}
          </p>
          <span className="mt-1 block text-[11px] text-slate-500">
            {cycle?.cycleType === "salary_day" ? "Rolling paycheck cycle" : "Calendar month cycle"}
          </span>
        </div>

        {/* Metric 2: Fixed Commitments */}
        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fixed Dues (Rent/EMIs)
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-slate-900">
            {loading ? "..." : formatCurrency(metrics?.totalFixedCommitted || 0)}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-emerald-700">
              Paid: {formatCurrency(metrics?.paidFixedTotal || 0)}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-semibold text-amber-700">
              Pending: {formatCurrency(metrics?.pendingFixedTotal || 0)}
            </span>
          </div>
        </div>

        {/* Metric 3: Remaining Spendable Balance */}
        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Remaining Spendable
          </span>
          <p
            className={`mt-1 font-display text-xl sm:text-2xl font-black ${
              isOverBudget ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {loading ? "..." : formatCurrency(metrics?.remainingSpendableBudget || 0)}
          </p>
          <span className="mt-1 block text-[11px] text-slate-500">
            After reserving all fixed commitments
          </span>
        </div>

        {/* Metric 4: Safe Daily Spend */}
        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Safe Daily Spend
          </span>
          <p className="mt-1 font-display text-xl sm:text-2xl font-black text-finora-950 flex items-baseline gap-1">
            {loading ? "..." : formatCurrency(metrics?.safeDailySpend || 0)}
            <span className="text-xs font-semibold text-slate-400">/ day</span>
          </p>
          <span className="mt-1 block text-[11px] text-finora-800 font-semibold">
            {cycle?.daysRemaining || 0} days remaining in cycle
          </span>
        </div>
      </div>
    </div>
  );
}
