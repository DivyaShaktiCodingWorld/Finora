import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Layers } from "lucide-react";
import { formatCurrency, getCategoryColor } from "../../lib/expenseConstants";

export default function MonthlyStackedBarChart({
  monthlyTrends = [],
  year,
  onSelectCategory,
  selectedCategory = null,
}) {
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate highest month total for proportional scaling
  const maxTotal = useMemo(() => {
    const highest = Math.max(...monthlyTrends.map((m) => m.total || 0), 0);
    if (highest <= 0) return 100;
    // Round up to a clean multiple
    const magnitude = Math.pow(10, Math.floor(Math.log10(highest)));
    return Math.ceil(highest / magnitude) * magnitude;
  }, [monthlyTrends]);

  // Y-axis tick intervals (4 steps)
  const yTicks = useMemo(() => {
    return [
      maxTotal,
      Math.round((maxTotal * 0.75) * 100) / 100,
      Math.round((maxTotal * 0.5) * 100) / 100,
      Math.round((maxTotal * 0.25) * 100) / 100,
      0,
    ];
  }, [maxTotal]);

  // Collect distinct categories present across all months for the legend
  const presentCategories = useMemo(() => {
    const catMap = new Map();
    monthlyTrends.forEach((m) => {
      m.categories?.forEach((c) => {
        const prev = catMap.get(c.category) || 0;
        catMap.set(c.category, prev + c.total);
      });
    });
    return Array.from(catMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [monthlyTrends]);

  // Chart Dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const padding = { top: 25, right: 20, bottom: 45, left: 65 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const colWidth = chartWidth / 12;
  const barWidth = 32;

  const handleMouseMove = (e, month) => {
    const rect = e.currentTarget.closest("svg")?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
    setHoveredMonth(month);
  };

  const hasData = monthlyTrends.some((m) => m.total > 0);

  return (
    <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-6 transition">
      {/* Chart Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-5 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 sm:text-lg">
              Monthly Category Spending
            </h3>
            <p className="text-xs text-slate-500">
              Stacked monthly expenditure for {year} broken down by category in a single bar
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200/70">
          <Layers size={14} className="text-finora-600" />
          <span>Single Bar / Categorized Stack</span>
        </div>
      </div>

      <div className="relative w-full overflow-x-auto">
        <div className="min-w-[680px]">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
            onMouseLeave={() => setHoveredMonth(null)}
          >
            {/* Horizontal Gridlines & Y-Axis Labels */}
            {yTicks.map((tick, index) => {
              const yPos = padding.top + (index / (yTicks.length - 1)) * chartHeight;
              return (
                <g key={tick + "_" + index}>
                  <line
                    x1={padding.left}
                    y1={yPos}
                    x2={svgWidth - padding.right}
                    y2={yPos}
                    stroke={index === yTicks.length - 1 ? "#cbd5e1" : "#f1f5f9"}
                    strokeDasharray={index === yTicks.length - 1 ? "none" : "3 3"}
                    strokeWidth={1}
                  />
                  <text
                    x={padding.left - 10}
                    y={yPos + 4}
                    textAnchor="end"
                    className="fill-slate-400 font-sans text-[11px] font-medium"
                  >
                    {formatCurrency(tick)}
                  </text>
                </g>
              );
            })}

            {/* Month Columns & Bars */}
            {monthlyTrends.map((m, mIndex) => {
              const colX = padding.left + mIndex * colWidth;
              const barX = colX + (colWidth - barWidth) / 2;
              const isHovered = hoveredMonth?.month === m.month;

              // Build stacked segments from bottom to top
              let currentY = padding.top + chartHeight;
              const segments = [];

              if (m.categories && m.categories.length > 0 && maxTotal > 0) {
                m.categories.forEach((cat, cIdx) => {
                  const segHeight = (cat.total / maxTotal) * chartHeight;
                  const segY = currentY - segHeight;
                  currentY = segY;

                  const isHighlighted =
                    !selectedCategory || selectedCategory === cat.category;

                  segments.push({
                    ...cat,
                    x: barX,
                    y: segY,
                    height: Math.max(segHeight, 1.5),
                    isTop: cIdx === m.categories.length - 1,
                    isHighlighted,
                  });
                });
              }

              return (
                <g
                  key={m.month}
                  className="cursor-pointer"
                  onMouseEnter={(e) => hasData && handleMouseMove(e, m)}
                  onMouseMove={(e) => hasData && handleMouseMove(e, m)}
                >
                  {/* Hover Column Background Pill */}
                  {isHovered && m.total > 0 && (
                    <rect
                      x={colX + 2}
                      y={padding.top}
                      width={colWidth - 4}
                      height={chartHeight + 28}
                      fill="#f0fdf4"
                      rx="8"
                      opacity="0.8"
                    />
                  )}

                  {/* Empty/Placeholder state bar if no spend in this month */}
                  {m.total === 0 && (
                    <g>
                      <rect
                        x={barX}
                        y={padding.top + chartHeight - 20}
                        width={barWidth}
                        height={20}
                        fill="#f8fafc"
                        stroke="#e2e8f0"
                        strokeDasharray="2 2"
                        rx="4"
                      />
                      <circle
                        cx={barX + barWidth / 2}
                        cy={padding.top + chartHeight}
                        r="2.5"
                        fill="#cbd5e1"
                      />
                    </g>
                  )}

                  {/* Stacked Segments */}
                  {segments.map((seg, sIdx) => {
                    const color = getCategoryColor(seg.category);
                    const isTopSegment = sIdx === segments.length - 1;

                    return (
                      <rect
                        key={seg.category}
                        x={seg.x}
                        y={seg.y}
                        width={barWidth}
                        height={seg.height}
                        fill={color}
                        rx={isTopSegment ? 4 : 0}
                        ry={isTopSegment ? 4 : 0}
                        opacity={
                          seg.isHighlighted
                            ? isHovered
                              ? 1
                              : 0.92
                            : 0.22
                        }
                        className="transition-all duration-150"
                      />
                    );
                  })}

                  {/* Month Label (X-Axis) */}
                  <text
                    x={colX + colWidth / 2}
                    y={svgHeight - 14}
                    textAnchor="middle"
                    className={`font-sans text-xs transition-colors duration-150 ${
                      isHovered && m.total > 0
                        ? "fill-finora-800 font-bold"
                        : "fill-slate-500 font-medium"
                    }`}
                  >
                    {m.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Floating Interactive Tooltip */}
          <AnimatePresence>
            {hoveredMonth && hoveredMonth.total > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: "absolute",
                  left: Math.min(Math.max(tooltipPos.x, 140), 700),
                  top: Math.max(tooltipPos.y - 12, 10),
                  pointerEvents: "none",
                  transform: "translate(-50%, -100%)",
                }}
                className="z-30 w-64 rounded-xl border border-slate-200 bg-white/95 p-3.5 shadow-xl backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {hoveredMonth.fullName} {year}
                    </span>
                    <p className="font-display text-sm font-extrabold text-slate-900">
                      {formatCurrency(hoveredMonth.total)}
                    </p>
                  </div>
                  <span className="rounded-full bg-finora-50 px-2 py-0.5 text-[10px] font-bold text-finora-700">
                    {hoveredMonth.categories?.length || 0} categories
                  </span>
                </div>

                <div className="mt-2.5 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {hoveredMonth.categories?.map((cat) => (
                    <div
                      key={cat.category}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: getCategoryColor(cat.category),
                          }}
                        />
                        <span className="truncate text-slate-700 font-medium">
                          {cat.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 pl-2">
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(cat.total)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({cat.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Categories Legend or Empty State Banner */}
      {!hasData ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-3.5 text-center text-xs text-slate-500">
          <span className="font-semibold text-slate-700">No expenses recorded for {year}.</span>{" "}
          Add an expense or choose another year to see the stacked category breakdown.
        </div>
      ) : presentCategories.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Categories in {year}
            </span>
            <span className="text-[11px] text-slate-400">
              Click category chip to filter
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {presentCategories.map((item) => {
              const color = getCategoryColor(item.name);
              const isSelected = selectedCategory === item.name;

              return (
                <button
                  key={item.name}
                  type="button"
                  onClick={() =>
                    onSelectCategory?.(isSelected ? null : item.name)
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    isSelected
                      ? "border-slate-800 bg-slate-900 text-white shadow-xs"
                      : "border-slate-200 bg-slate-50/80 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span>{item.name}</span>
                  <span
                    className={`ml-1 text-[11px] ${
                      isSelected ? "text-slate-300" : "text-slate-400"
                    }`}
                  >
                    {formatCurrency(item.total)}
                  </span>
                </button>
              );
            })}

            {selectedCategory && (
              <button
                type="button"
                onClick={() => onSelectCategory?.(null)}
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 hover:bg-red-100 transition"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
