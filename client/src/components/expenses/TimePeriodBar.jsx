import { useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Check,
} from "lucide-react";
import {
  PERIOD_PRESETS,
} from "../../lib/expenseConstants";

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

export default function TimePeriodBar({
  selectedPeriod,
  onSelectPeriod,
  activeDateRange,
  selectedMonth,
  selectedYear,
  onChangeMonthYear,
  customRange,
  onChangeCustomRange,
}) {
  const [showMonthSelect, setShowMonthSelect] = useState(false);

  // Month navigation: previous month
  const handlePrevMonth = () => {
    let nextMonth = selectedMonth - 1;
    let nextYear = selectedYear;
    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    }
    onChangeMonthYear(nextYear, nextMonth);
  };

  // Month navigation: next month
  const handleNextMonth = () => {
    let nextMonth = selectedMonth + 1;
    let nextYear = selectedYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    onChangeMonthYear(nextYear, nextMonth);
  };

  // Year options for picker (current year - 5 to current year + 1)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear - 4 + i);

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-xs">
      {/* Top Bar: Label and Period Tabs */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-50 text-finora-700">
            <Clock size={16} />
          </div>
          <div>
            <h3 className="font-display text-sm font-bold text-slate-900">
              Time Period
            </h3>
            <p className="text-xs text-slate-400">
              Filter metrics and transactions by date
            </p>
          </div>
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-100/90 p-1">
          {PERIOD_PRESETS.map((preset) => {
            const isActive = selectedPeriod === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPeriod(preset.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-finora-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                {isActive && <Check size={12} className="stroke-[3]" />}
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-bar for Specific Month Navigation */}
      {selectedPeriod === "month_picker" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Prev Month Button */}
            <button
              type="button"
              onClick={handlePrevMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            {/* Current Month & Year Display Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-finora-50 text-finora-950 font-display font-bold text-sm border border-finora-100">
              <Calendar size={14} className="text-finora-600" />
              <span>
                {MONTH_NAMES[selectedMonth]} {selectedYear}
              </span>
            </div>

            {/* Next Month Button */}
            <button
              type="button"
              onClick={handleNextMonth}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>

            {/* Toggle dropdown selector */}
            <button
              type="button"
              onClick={() => setShowMonthSelect((prev) => !prev)}
              className="text-xs font-semibold text-finora-700 hover:underline ml-1"
            >
              {showMonthSelect ? "Hide Jump Picker" : "Jump to Month"}
            </button>
          </div>

          {/* Month & Year Selectors (Dropdowns) */}
          {showMonthSelect && (
            <div className="flex items-center gap-2 animate-in fade-in duration-200">
              <select
                value={selectedMonth}
                onChange={(e) =>
                  onChangeMonthYear(selectedYear, parseInt(e.target.value, 10))
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-finora-600"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) =>
                  onChangeMonthYear(parseInt(e.target.value, 10), selectedMonth)
                }
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-finora-600"
              >
                {yearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Sub-bar for Custom Date Range Inputs */}
      {selectedPeriod === "custom" && (
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>From:</span>
            <input
              type="date"
              value={customRange.startDate || ""}
              onChange={(e) =>
                onChangeCustomRange({
                  ...customRange,
                  startDate: e.target.value,
                })
              }
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-finora-600"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>To:</span>
            <input
              type="date"
              value={customRange.endDate || ""}
              onChange={(e) =>
                onChangeCustomRange({
                  ...customRange,
                  endDate: e.target.value,
                })
              }
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-finora-600"
            />
          </div>

          <span className="text-xs text-slate-400">
            Transactions will update automatically.
          </span>
        </div>
      )}

      {/* Active Filter Summary Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5">
          <Filter size={12} className="text-finora-600" />
          <span>Active Window:</span>
          <span className="font-semibold text-slate-800">
            {activeDateRange?.detailLabel || "All Time"}
          </span>
          {activeDateRange?.startDate && activeDateRange?.endDate && (
            <span className="text-slate-400">
              ({activeDateRange.startDate} to {activeDateRange.endDate})
            </span>
          )}
        </div>

        {selectedPeriod !== "this_month" && (
          <button
            type="button"
            onClick={() => onSelectPeriod("this_month")}
            className="text-xs font-semibold text-finora-700 hover:text-finora-800 hover:underline"
          >
            Reset to This Month
          </button>
        )}
      </div>
    </div>
  );
}
