import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  LogOut,
  ShieldCheck,
  Wallet,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard,
  Calendar,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import expenseService from "../services/expenseService";
import { calculateDateRange } from "../lib/expenseConstants";

import TimePeriodBar from "../components/expenses/TimePeriodBar";
import ExpenseSummaryCards from "../components/expenses/ExpenseSummaryCards";
import ExpenseFilters from "../components/expenses/ExpenseFilters";
import ExpenseList from "../components/expenses/ExpenseList";
import CategoryBreakdown from "../components/expenses/CategoryBreakdown";
import ExpenseModal from "../components/expenses/ExpenseModal";
import DeleteConfirmModal from "../components/expenses/DeleteConfirmModal";
import ReportExport from "../components/expenses/ReportExport";

export default function DashboardPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);

  // Expense Data State
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Time Period Filter State (defaults to "this_month")
  const [selectedPeriod, setSelectedPeriod] = useState("this_month");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [customRange, setCustomRange] = useState({
    startDate: "",
    endDate: "",
  });

  // Calculate the active start & end dates based on the active period
  const activeDateRange = useMemo(() => {
    return calculateDateRange(selectedPeriod, {
      year: selectedYear,
      month: selectedMonth,
      startDate: customRange.startDate,
      endDate: customRange.endDate,
    });
  }, [selectedPeriod, selectedYear, selectedMonth, customRange]);

  // Search, Category, and Sort Filter States
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // In-app Toast / Notification State
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Fetch Summary with active date range
  const fetchSummary = useCallback(async () => {
    try {
      const params = {};
      if (activeDateRange.startDate) params.startDate = activeDateRange.startDate;
      if (activeDateRange.endDate) params.endDate = activeDateRange.endDate;

      const data = await expenseService.getExpenseSummary(params);
      if (data.success) {
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Failed to fetch expense summary:", err);
    }
  }, [activeDateRange]);

  // Fetch Expenses list with active filters & date range
  const fetchExpenses = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const params = {};
        if (category && category !== "all") params.category = category;
        if (search && search.trim()) params.search = search.trim();
        if (sortBy) params.sortBy = sortBy;
        if (activeDateRange.startDate) params.startDate = activeDateRange.startDate;
        if (activeDateRange.endDate) params.endDate = activeDateRange.endDate;

        const data = await expenseService.getExpenses(params);
        if (data.success) {
          setExpenses(data.expenses);
        }
      } catch (err) {
        console.error("Failed to fetch expenses:", err);
        showNotification("error", "Unable to load expenses. Please try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [category, search, sortBy, activeDateRange]
  );

  // Trigger data reload on authentication and filter changes
  useEffect(() => {
    if (user && status === "authenticated") {
      fetchExpenses();
      fetchSummary();
    }
  }, [user, status, fetchExpenses, fetchSummary]);

  // Handle Month/Year Change from Navigator
  const handleChangeMonthYear = (year, month) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedPeriod("month_picker");
  };

  // Add / Edit submission
  const handleExpenseSubmit = async (expenseData) => {
    if (editingExpense) {
      const response = await expenseService.updateExpense(
        editingExpense._id,
        expenseData
      );
      showNotification("success", "Expense updated successfully.");
      fetchExpenses();
      fetchSummary();
      return response;
    } else {
      const response = await expenseService.createExpense(expenseData);
      showNotification("success", "Expense recorded successfully.");
      fetchExpenses();
      fetchSummary();
      return response;
    }
  };

  // Delete submission
  const handleDeleteConfirm = async () => {
    if (!deletingExpense) return;
    setDeleteLoading(true);

    try {
      await expenseService.deleteExpense(deletingExpense._id);
      showNotification("success", "Expense deleted successfully.");
      setDeletingExpense(null);
      fetchExpenses();
      fetchSummary();
    } catch (err) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to delete expense."
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("date_desc");
    setSelectedPeriod("this_month");
    setCustomRange({ startDate: "", endDate: "" });
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "all" ||
    sortBy !== "date_desc" ||
    selectedPeriod !== "this_month";

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <main className="min-h-screen bg-[#f7faf8] pb-16">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finora-900 text-white shadow-xs">
              <Wallet size={20} />
            </div>

            <span className="font-display text-xl font-extrabold tracking-tight text-finora-950">
              finora<span className="text-finora-500">.</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Add Button in Header */}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-finora-800 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-finora-700"
            >
              <Plus size={16} />
              Add Expense
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <LogOut size={16} />
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 space-y-6">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-finora-950 p-6 sm:p-9 text-white shadow-xl"
        >
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-finora-500/20 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-finora-200">
                <ShieldCheck size={14} />
                SECURE FINANCIAL TRACKING
              </span>

              <h1 className="mt-3.5 font-display text-2xl font-extrabold sm:text-4xl tracking-tight">
                Welcome back, {firstName}!
              </h1>

              <p className="mt-2 max-w-lg text-xs leading-6 text-emerald-100/75 sm:text-sm">
                Easily browse expenses across any month, past weeks, or full years.
                Clean metrics and instant filtering keep your budget clear.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleOpenAddModal}
                className="inline-flex items-center gap-2 rounded-xl bg-finora-400 px-5 py-3 text-sm font-bold text-finora-950 shadow-lg shadow-finora-400/20 transition hover:bg-finora-300"
              >
                <Plus size={18} />
                Add New Expense
              </button>

              <button
                type="button"
                onClick={() => {
                  fetchExpenses(true);
                  fetchSummary();
                }}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={refreshing ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>
          </div>
        </motion.section>

        {/* In-app Toast / Status Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex items-center justify-between rounded-xl border p-4 text-sm font-medium shadow-xs ${
                notification.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {notification.type === "success" ? (
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                )}
                <span>{notification.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Time Period Filter Navigation Bar */}
        <TimePeriodBar
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
          activeDateRange={activeDateRange}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onChangeMonthYear={handleChangeMonthYear}
          customRange={customRange}
          onChangeCustomRange={setCustomRange}
        />

        {/* Dynamic Metric Cards (adapts to active time window) */}
        <ExpenseSummaryCards
          summary={summary}
          activeDateRange={activeDateRange}
          loading={loading && !summary}
        />
{/* Report Export (PDF / CSV) for the active period and filters */}
<ReportExport
  activeDateRange={activeDateRange}
  search={search}
  category={category}
  sortBy={sortBy}
  recordCount={expenses.length}
  loading={loading}
  onNotify={showNotification}
/>
        {/* Main Section: Records & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 items-start">
          {/* Main 2 Cols: Search/Filter & Expense List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900 flex items-center gap-2">
                  Expense Records
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {expenses.length}
                  </span>
                </h2>
                <p className="text-xs text-slate-500">
                  Showing transactions for{" "}
                  <span className="font-medium text-slate-700">
                    {activeDateRange?.detailLabel || "All Time"}
                  </span>
                </p>
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-semibold text-finora-700 hover:underline self-start sm:self-auto"
                >
                  Clear all active filters
                </button>
              )}
            </div>

            {/* Filter Toolbar (Search, Category, Sorting) */}
            <ExpenseFilters
              search={search}
              setSearch={setSearch}
              category={category}
              setCategory={setCategory}
              sortBy={sortBy}
              setSortBy={setSortBy}
              onAddClick={handleOpenAddModal}
              onResetFilters={handleResetFilters}
              hasActiveFilters={hasActiveFilters}
            />

            {/* Expenses List */}
            <ExpenseList
              expenses={expenses}
              loading={loading}
              onEdit={handleOpenEditModal}
              onDelete={(exp) => setDeletingExpense(exp)}
              onAddClick={handleOpenAddModal}
              hasFilters={hasActiveFilters}
              onResetFilters={handleResetFilters}
              periodLabel={activeDateRange?.detailLabel || "This Window"}
            />
          </div>

          {/* Right Sidebar: Category Breakdown & Context */}
          <div className="space-y-6">
            {/* Category Breakdown (adapts to active time window) */}
            <CategoryBreakdown
              categoryBreakdown={summary?.categoryBreakdown}
              totalSpent={summary?.totalSpent}
              activeDateRange={activeDateRange}
            />

            {/* Account Information Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <ShieldCheck size={21} />
              </div>

              <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                Account Information
              </h3>

              <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                <p className="font-medium text-slate-700">{user?.name}</p>
                <p className="break-all">{user?.email}</p>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-finora-50 px-3 py-1 text-xs font-semibold text-finora-700 border border-finora-100">
                <span className="h-2 w-2 rounded-full bg-finora-500" />
                Active Session
              </div>
            </div>

            {/* Financial Tips Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-finora-50/50 to-white p-6 shadow-xs">
              <div className="flex items-center gap-2 text-finora-800 font-semibold text-xs tracking-wider uppercase">
                <CreditCard size={15} />
                Financial Tip
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-600">
                Comparing previous months using the <strong>Select Month</strong> stepper
                is one of the fastest ways to spot seasonal spikes in utility and shopping
                habits.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={15} />
            <span>Finora • Personal Finance & Expense Management</span>
          </div>
          <span>Seamless Multi-Period Tracking</span>
        </footer>
      </div>

      {/* Add / Edit Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleExpenseSubmit}
        initialData={editingExpense}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingExpense)}
        expense={deletingExpense}
        onClose={() => setDeletingExpense(null)}
        onConfirm={handleDeleteConfirm}
        loading={deleteLoading}
      />
    </main>
  );
}
