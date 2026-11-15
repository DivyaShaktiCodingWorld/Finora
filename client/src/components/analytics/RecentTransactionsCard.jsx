import { Link } from "react-router-dom";
import { ArrowUpRight, Clock, Receipt, CreditCard, Calendar } from "lucide-react";
import {
  formatCurrency,
  formatExpenseDate,
  getCategoryConfig,
} from "../../lib/expenseConstants";

export default function RecentTransactionsCard({ transactions = [] }) {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              Recent Transactions Feed
            </h3>
            <p className="text-xs text-slate-500">
              Latest expense activity across all categories
            </p>
          </div>
        </div>

        {/* View All Transactions Link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-finora-300 hover:bg-finora-50 hover:text-finora-800 shadow-2xs"
        >
          <span>View All in Dashboard</span>
          <ArrowUpRight size={14} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2">
            <Receipt size={24} />
          </div>
          <p className="font-display text-sm font-bold text-slate-800">
            No transactions found
          </p>
          <p className="text-xs text-slate-500 mt-0.5 max-w-sm">
            When you add transactions, your latest activity with category tags and notes will appear here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {transactions.map((t) => {
            const config = getCategoryConfig(t.category);
            const Icon = config.icon;

            return (
              <div
                key={t._id}
                className="group flex items-center justify-between py-3 transition hover:bg-slate-50/70 rounded-xl px-2.5 -mx-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} ${config.color} border ${config.border}`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 text-sm group-hover:text-finora-800 transition-colors">
                      {t.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        {t.category}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" />
                        {formatExpenseDate(t.date)}
                      </span>
                      {t.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-[11px] text-slate-500">
                            <CreditCard size={11} className="text-slate-400" />
                            {t.paymentMethod}
                          </span>
                        </>
                      )}
                    </div>
                    {t.notes && (
                      <p className="mt-1 text-xs text-slate-400 italic truncate max-w-md">
                        "{t.notes}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0 pl-3">
                  <span className="font-display text-sm sm:text-base font-extrabold text-slate-900">
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to view all */}
      {transactions.length > 0 && (
        <div className="mt-4 border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-500">
          <span>Showing the latest {transactions.length} records</span>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1 font-bold text-finora-700 hover:text-finora-800 transition"
          >
            <span>Full search & filter table in Dashboard</span>
            <ArrowUpRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
}
