import { DollarSign, Hash, CalendarDays, TrendingUp } from "lucide-react";
import { formatCurrency } from "../../lib/expenseConstants";

export default function AnalyticsSummaryCards({ summary, year, loading }) {
  const cards = [
    {
      title: `${year} Total Spent`,
      value: formatCurrency(summary?.yearTotalSpent || 0),
      subtitle: `${summary?.yearTotalCount || 0} total transactions`,
      icon: DollarSign,
      iconBg: "bg-finora-50",
      iconColor: "text-finora-700",
      highlight: true,
    },
    {
      title: "Monthly Average",
      value: formatCurrency(summary?.avgMonthlySpent || 0),
      subtitle: summary?.activeMonthsCount
        ? `Over ${summary.activeMonthsCount} active month(s)`
        : "Calculated across year",
      icon: CalendarDays,
      iconBg: "bg-sky-50",
      iconColor: "text-sky-700",
    },
    {
      title: "Peak Spending Month",
      value: summary?.peakMonth ? summary.peakMonth.fullName : "N/A",
      subtitle: summary?.peakMonth
        ? formatCurrency(summary.peakMonth.total)
        : "No expenses recorded",
      icon: TrendingUp,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-700",
    },
    {
      title: "Top Category",
      value: summary?.topCategory ? summary.topCategory.category : "N/A",
      subtitle: summary?.topCategory
        ? `${formatCurrency(summary.topCategory.total)} (${summary.topCategory.percentage}%)`
        : "No categories recorded",
      icon: Hash,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;

        return (
          <div
            key={idx}
            className={`rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
              card.highlight
                ? "border-finora-200/90 bg-gradient-to-br from-finora-50/70 via-white to-white"
                : "border-slate-200/90 bg-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {card.title}
              </span>
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconBg} ${card.iconColor}`}
              >
                <Icon size={18} />
              </div>
            </div>

            <div className="mt-3">
              {loading ? (
                <div className="h-7 w-28 animate-pulse rounded bg-slate-200" />
              ) : (
                <p className="font-display text-xl sm:text-2xl font-extrabold text-slate-900 truncate">
                  {card.value}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500 truncate">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
