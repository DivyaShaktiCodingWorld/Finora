import { PieChart, Info } from "lucide-react";
import { formatCurrency, getCategoryConfig } from "../../lib/expenseConstants";

export default function CategoryBreakdown({
  categoryBreakdown = [],
  totalSpent = 0,
  activeDateRange,
}) {
  const periodLabel = activeDateRange?.label || "This Window";

  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-50 text-finora-700">
            <PieChart size={17} />
          </div>
          <h3 className="font-display text-base font-bold text-slate-900">
            Category Breakdown
          </h3>
        </div>

        <div className="mt-6 flex flex-col items-center justify-center py-6 text-center text-slate-400">
          <Info size={24} className="mb-2 text-slate-300" />
          <p className="text-xs font-medium text-slate-500">
            No spending recorded for {periodLabel}.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Add an expense or select another time period.
          </p>
        </div>
      </div>
    );
  }

  // Display top 6 categories
  const topCategories = categoryBreakdown.slice(0, 6);

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-50 text-finora-700">
            <PieChart size={17} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900">
              Spending by Category
            </h3>
            <p className="text-xs text-slate-400">{periodLabel}</p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-700 font-display">
          Total: {formatCurrency(totalSpent)}
        </span>
      </div>

      <div className="mt-4 space-y-3.5">
        {topCategories.map((item) => {
          const config = getCategoryConfig(item.category);
          const Icon = config.icon;
          const percentage = parseFloat(item.percentage) || 0;

          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${config.bg} ${config.color}`}
                  >
                    <Icon size={13} />
                  </div>
                  <span className="text-slate-700 font-semibold truncate max-w-[120px] sm:max-w-[150px]">
                    {item.category}
                  </span>
                  <span className="text-slate-400">
                    ({item.count} {item.count === 1 ? "item" : "items"})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-slate-900">
                    {formatCurrency(item.total)}
                  </span>
                  <span className="text-slate-400 w-11 text-right">
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-finora-600 transition-all duration-500"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
