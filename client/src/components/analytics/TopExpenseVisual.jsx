import { Trophy, Flame, TrendingUp, Calendar, CreditCard, PlusCircle } from "lucide-react";
import {
  formatCurrency,
  formatExpenseDate,
  getCategoryConfig,
} from "../../lib/expenseConstants";

export default function TopExpenseVisual({
  peakExpense = null,
  topExpenses = [],
  year,
  onOpenAddModal,
}) {
  const categoryConfig = peakExpense
    ? getCategoryConfig(peakExpense.category)
    : null;
  const CategoryIcon = categoryConfig?.icon;

  return (
    <div className="h-full rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              Top Expense Highlight
            </h3>
            <p className="text-xs text-slate-500">
              Your largest individual purchase in {year}
            </p>
          </div>
        </div>

        {peakExpense ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-800">
            <Flame size={13} className="text-amber-600" />
            Rank #1
          </span>
        ) : (
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
            No Records
          </span>
        )}
      </div>

      {!peakExpense ? (
        <div className="my-auto flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-600 mb-3">
            <Trophy size={28} />
          </div>
          <p className="font-display text-sm font-bold text-slate-800">
            No purchases logged for {year}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Add transactions to discover your peak spending driver and view the top expenses leaderboard.
          </p>
          {onOpenAddModal && (
            <button
              type="button"
              onClick={onOpenAddModal}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-finora-800 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-finora-700 transition"
            >
              <PlusCircle size={14} />
              <span>Record An Expense</span>
            </button>
          )}
        </div>
      ) : (
        <div className="my-auto space-y-4 pt-1">
          {/* Main #1 Highlight Visual Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-finora-950 via-finora-900 to-finora-800 p-4 sm:p-5 text-white shadow-md">
            {/* Ambient glows */}
            <div className="absolute -right-6 -top-6 h-28 w-28 rounded-full bg-finora-400/20 blur-2xl" />
            <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-amber-400/10 blur-xl" />

            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-semibold backdrop-blur-md">
                  {CategoryIcon && <CategoryIcon size={14} className="text-finora-300" />}
                  <span>{peakExpense.category}</span>
                </div>

                {peakExpense.percentageOfYear > 0 && (
                  <span className="rounded-full bg-finora-400/20 border border-finora-400/30 px-2.5 py-0.5 text-[11px] font-bold text-finora-200">
                    {peakExpense.percentageOfYear}% of {year} Total
                  </span>
                )}
              </div>

              <div className="mt-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-finora-200/70">
                  Single Largest Purchase
                </p>
                <h4 className="mt-0.5 font-display text-lg sm:text-xl font-black text-white truncate">
                  {peakExpense.title}
                </h4>
                <p className="mt-1 font-display text-2xl font-extrabold text-finora-300 tracking-tight">
                  {formatCurrency(peakExpense.amount)}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-2.5 text-xs text-finora-100/80">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-finora-300" />
                  <span>{formatExpenseDate(peakExpense.date)}</span>
                </div>
                {peakExpense.paymentMethod && (
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={13} className="text-finora-300" />
                    <span>{peakExpense.paymentMethod}</span>
                  </div>
                )}
                {peakExpense.notes && (
                  <p className="w-full text-[11px] text-finora-200/70 italic truncate">
                    "{peakExpense.notes}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Top 5 Leaderboard (if more than 1 expense) */}
          {topExpenses.length > 1 && (
            <div className="border-t border-slate-100 pt-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <TrendingUp size={13} />
                Ranked Expenses Leaderboard
              </p>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {topExpenses.slice(0, 5).map((exp, idx) => {
                  const config = getCategoryConfig(exp.category);
                  const Icon = config.icon;

                  return (
                    <div
                      key={exp._id || idx}
                      className="flex items-center justify-between p-2 rounded-xl border border-slate-100 bg-slate-50/60 text-xs hover:bg-slate-100/70 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded font-bold text-[10px] ${
                            idx === 0
                              ? "bg-amber-100 text-amber-800"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-amber-50 text-amber-900 border border-amber-200"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          #{idx + 1}
                        </span>

                        <div
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${config.bg} ${config.color}`}
                        >
                          <Icon size={12} />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 text-[11px]">
                            {exp.title}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatExpenseDate(exp.date)}
                          </p>
                        </div>
                      </div>

                      <span className="font-bold text-slate-900 text-xs shrink-0 pl-2">
                        {formatCurrency(exp.amount)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer subtle tip */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
        Highest spending impacts calculated relative to annual total
      </div>
    </div>
  );
}
