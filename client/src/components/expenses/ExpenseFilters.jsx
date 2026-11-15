import { Search, X, Filter, ArrowUpDown, Plus } from "lucide-react";
import { EXPENSE_CATEGORIES } from "../../lib/expenseConstants";

export default function ExpenseFilters({
  search,
  setSearch,
  category,
  setCategory,
  sortBy,
  setSortBy,
  onAddClick,
  onResetFilters,
  hasActiveFilters,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by title or notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-9 text-sm text-slate-900 outline-none transition focus:border-finora-600 focus:bg-white focus:ring-2 focus:ring-finora-100 placeholder:text-slate-400"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Category select */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100">
          <Filter size={15} className="shrink-0 text-slate-400" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 outline-none cursor-pointer"
          >
            <option value="all">All Categories</option>
            {EXPENSE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort select */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition focus-within:border-finora-600 focus-within:ring-2 focus-within:ring-finora-100">
          <ArrowUpDown size={15} className="shrink-0 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs sm:text-sm font-medium text-slate-800 outline-none cursor-pointer"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="amount_desc">Amount: High to Low</option>
            <option value="amount_asc">Amount: Low to High</option>
          </select>
        </div>

        {/* Clear filters button if active */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition"
          >
            Reset
          </button>
        )}

        {/* Add Expense Primary Button */}
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex items-center gap-2 rounded-xl bg-finora-800 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm shadow-finora-900/10 transition hover:bg-finora-700 hover:shadow-md"
        >
          <Plus size={16} />
          <span>Add Expense</span>
        </button>
      </div>
    </div>
  );
}
