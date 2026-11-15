import { useState, useMemo } from "react";
import { PieChart as PieChartIcon } from "lucide-react";
import {
  formatCurrency,
  getCategoryColor,
} from "../../lib/expenseConstants";

export default function CategoryPieChart({
  categoryBreakdown = [],
  totalSpent = 0,
  year,
}) {
  const [activeCategory, setActiveCategory] = useState(null);

  // Filter out any 0-total categories
  const validCategories = useMemo(() => {
    return categoryBreakdown.filter((c) => c.total > 0);
  }, [categoryBreakdown]);

  // Compute angles for each slice
  const slices = useMemo(() => {
    if (totalSpent <= 0 || validCategories.length === 0) return [];

    const computedSlices = [];
    let currentAngle = 0;

    for (let i = 0; i < validCategories.length; i += 1) {
      const item = validCategories[i];
      const sliceAngle = (item.total / totalSpent) * 360;
      const endAngle = currentAngle + sliceAngle;

      computedSlices.push({
        ...item,
        startAngle: currentAngle,
        endAngle,
        color: getCategoryColor(item.category),
      });

      currentAngle = endAngle;
    }

    return computedSlices;
  }, [validCategories, totalSpent]);

  // SVG parameters
  const size = 250;
  const center = size / 2;
  const innerRadius = 64;
  const defaultOuterRadius = 100;
  const activeOuterRadius = 108;

  // Arc path generator helper
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, innerR, outerR, startAngle, endAngle) => {
    const effectiveEndAngle =
      endAngle - startAngle >= 359.99 ? startAngle + 359.99 : endAngle;

    const startOuter = polarToCartesian(x, y, outerR, effectiveEndAngle);
    const endOuter = polarToCartesian(x, y, outerR, startAngle);
    const startInner = polarToCartesian(x, y, innerR, startAngle);
    const endInner = polarToCartesian(x, y, innerR, effectiveEndAngle);

    const largeArcFlag = effectiveEndAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", startOuter.x, startOuter.y,
      "A", outerR, outerR, 0, largeArcFlag, 0, endOuter.x, endOuter.y,
      "L", startInner.x, startInner.y,
      "A", innerR, innerR, 0, largeArcFlag, 1, endInner.x, endInner.y,
      "Z",
    ].join(" ");
  };

  const currentDisplay = activeCategory || {
    label: "Total Spent",
    sub: `${validCategories.length} categories`,
    amount: totalSpent,
    percentage: 100,
  };

  return (
    <div className="h-full rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
            <PieChartIcon size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              Expense Distribution
            </h3>
            <p className="text-xs text-slate-500">
              Category-wise spending shares for {year}
            </p>
          </div>
        </div>

        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {validCategories.length} Categories
        </span>
      </div>

      {validCategories.length === 0 ? (
        <div className="my-auto flex flex-col items-center justify-center py-10 text-center">
          {/* Subtle placeholder donut ring */}
          <div className="relative mb-3 flex items-center justify-center">
            <svg width={150} height={150} viewBox="0 0 150 150">
              <circle
                cx={75}
                cy={75}
                r={52}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth={20}
              />
              <circle
                cx={75}
                cy={75}
                r={52}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth={20}
                strokeDasharray="8 8"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <PieChartIcon size={22} className="text-slate-400" />
              <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                No Data
              </span>
            </div>
          </div>
          <p className="font-display text-sm font-bold text-slate-800">
            No category spending recorded
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">
            Categories and share percentages will automatically appear as you add expenses.
          </p>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row items-center gap-6 my-auto pt-2">
          {/* Donut Chart SVG */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              className="select-none overflow-visible"
              onMouseLeave={() => setActiveCategory(null)}
            >
              <g>
                {slices.map((slice) => {
                  const isActive = activeCategory?.category === slice.category;
                  const outerR = isActive ? activeOuterRadius : defaultOuterRadius;
                  const pathData = describeArc(
                    center,
                    center,
                    innerRadius,
                    outerR,
                    slice.startAngle,
                    slice.endAngle
                  );

                  return (
                    <path
                      key={slice.category}
                      d={pathData}
                      fill={slice.color}
                      opacity={activeCategory && !isActive ? 0.45 : 1}
                      stroke="#ffffff"
                      strokeWidth={2}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() =>
                        setActiveCategory({
                          category: slice.category,
                          label: slice.category,
                          amount: slice.total,
                          percentage: slice.percentage,
                          count: slice.count,
                        })
                      }
                    />
                  );
                })}
              </g>
            </svg>

            {/* Donut Center Display */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[120px]">
                {currentDisplay.label}
              </span>
              <span className="font-display text-base font-extrabold text-slate-900 leading-tight">
                {formatCurrency(currentDisplay.amount)}
              </span>
              <span className="mt-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {currentDisplay.percentage}%
              </span>
            </div>
          </div>

          {/* Category Breakdown List */}
          <div className="w-full flex-1 max-h-56 overflow-y-auto pr-1 space-y-1.5">
            {validCategories.map((cat) => {
              const isSelected = activeCategory?.category === cat.category;
              const color = getCategoryColor(cat.category);

              return (
                <div
                  key={cat.category}
                  onMouseEnter={() =>
                    setActiveCategory({
                      category: cat.category,
                      label: cat.category,
                      amount: cat.total,
                      percentage: cat.percentage,
                      count: cat.count,
                    })
                  }
                  onMouseLeave={() => setActiveCategory(null)}
                  className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition ${
                    isSelected
                      ? "border-finora-300 bg-finora-50/70 shadow-xs"
                      : "border-slate-100 bg-slate-50/50 hover:bg-slate-100/70"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {cat.category}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {cat.count} transaction{cat.count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">
                      {formatCurrency(cat.total)}
                    </p>
                    <p className="text-[11px] font-semibold text-finora-700">
                      {cat.percentage}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer subtle tip */}
      <div className="mt-4 pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400">
        Hover over any slice or category row to inspect details
      </div>
    </div>
  );
}
