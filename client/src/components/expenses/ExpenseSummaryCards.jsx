import { motion } from "framer-motion";
import {
  Wallet,
  Calendar,
  Receipt,
  PieChart,
} from "lucide-react";
import { formatCurrency, getCategoryConfig } from "../../lib/expenseConstants";

export default function ExpenseSummaryCards({
  summary,
  activeDateRange,
  loading = false,
}) {
  const {
    totalSpent = 0,
    totalCount = 0,
    avgAmount = 0,
    overallTotalSpent = 0,
    overallTotalCount = 0,
    thisMonthSpent = 0,
    topCategory = null,
    isFiltered = false,
  } = summary || {};

  const TopCategoryIcon = topCategory
    ? getCategoryConfig(topCategory.category).icon
    : PieChart;

  const periodLabel = activeDateRange?.label || "This Period";

  const cards = [
    {
      title: isFiltered ? `Spent (${periodLabel})` : "Total Expenses",
      value: formatCurrency(totalSpent),
      subtitle: `${totalCount} ${totalCount === 1 ? "transaction" : "transactions"} in window`,
      icon: Wallet,
      iconBg: "bg-finora-50 text-finora-700 border-finora-100",
      accent: "text-slate-900",
    },
    {
      title: isFiltered ? "All-Time Total" : "This Month",
      value: formatCurrency(isFiltered ? overallTotalSpent : thisMonthSpent),
      subtitle: isFiltered
        ? `${overallTotalCount} total transactions`
        : "Current calendar month",
      icon: Calendar,
      iconBg: "bg-emerald-50 text-emerald-700 border-emerald-100",
      accent: "text-slate-900",
    },
    {
      title: "Average Ticket",
      value: avgAmount > 0 ? formatCurrency(avgAmount) : "$0.00",
      subtitle:
        totalCount > 0
          ? `Per transaction (${totalCount} total)`
          : "No transactions in window",
      icon: Receipt,
      iconBg: "bg-blue-50 text-blue-700 border-blue-100",
      accent: "text-slate-900",
    },
    {
      title: "Top Category",
      value: topCategory ? topCategory.category : "None yet",
      subtitle: topCategory
        ? `${formatCurrency(topCategory.total)} (${topCategory.percentage}% of window)`
        : "No activity in period",
      icon: TopCategoryIcon,
      iconBg: "bg-amber-50 text-amber-700 border-amber-100",
      accent: topCategory
        ? "text-slate-900 text-lg sm:text-xl truncate"
        : "text-slate-400 text-base",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05, duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate mr-2">
                {card.title}
              </span>
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${card.iconBg}`}
              >
                <Icon size={19} />
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-slate-100" />
              ) : (
                <p
                  className={`font-display font-extrabold ${
                    card.accent || "text-2xl text-slate-900"
                  }`}
                >
                  {card.value}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400 truncate">
                {card.subtitle}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
