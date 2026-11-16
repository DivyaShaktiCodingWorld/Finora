import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import expenseService from "../services/expenseService";
import budgetService from "../services/budgetService";
import { calculateDateRange } from "../lib/expenseConstants";

import TimePeriodBar from "../components/expenses/TimePeriodBar";
import ExpenseSummaryCards from "../components/expenses/ExpenseSummaryCards";
import ExpenseFilters from "../components/expenses/ExpenseFilters";
import ExpenseList from "../components/expenses/ExpenseList";
import CategoryBreakdown from "../components/expenses/CategoryBreakdown";
import ExpenseModal from "../components/expenses/ExpenseModal";
import DeleteConfirmModal from "../components/expenses/DeleteConfirmModal";
import ReportExport from "../components/expenses/ReportExport";
import BudgetOverviewCard from "../components/budget/BudgetOverviewCard";
import UpcomingDuesWidget from "../components/budget/UpcomingDuesWidget";
import BudgetSettingsModal from "../components/budget/BudgetSettingsModal";
import OnboardingSalaryModal from "../components/budget/OnboardingSalaryModal";

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

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

  // Budget & Fixed Commitments State
  const [budgetData, setBudgetData] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

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

  // Fetch Budget data for active cycle
  const fetchBudget = useCallback(async () => {
    try {
      setBudgetLoading(true);
      const data = await budgetService.getCurrentBudget();
      if (data.success) {
        setBudgetData(data);
      }
    } catch (err) {
      console.error("Failed to fetch budget:", err);
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  // Trigger data reload on authentication and filter changes
  useEffect(() => {
    if (user && status === "authenticated") {
      fetchExpenses();
      fetchSummary();
      fetchBudget();
    }
  }, [user, status, fetchExpenses, fetchSummary, fetchBudget]);

  // Prompt newly created user or user with unconfigured salary to add their salary
  useEffect(() => {
    if (!budgetLoading && budgetData && user?._id) {
      const salaryAmount = budgetData.salary?.amount || 0;
      const isSkipped = localStorage.getItem(
        `finora_onboarding_skipped_${user._id}`
      );
      if (salaryAmount === 0 && !isSkipped) {
        setIsOnboardingModalOpen(true);
      }
    }
  }, [budgetLoading, budgetData, user]);

  const handleToggleFixedExpense = async (fixedExpenseId, targetPaidStatus) => {
    try {
      const response = await budgetService.toggleFixedExpense(
        fixedExpenseId,
        targetPaidStatus
      );
      if (response.success) {
        if (response.completionNotification) {
          showNotification("success", response.completionNotification.message);
        } else {
          showNotification("success", response.message);
        }
        await Promise.all([fetchBudget(), fetchSummary(), fetchExpenses()]);
      }
    } catch (err) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to update fixed commitment."
      );
    }
  };

  const handleDismissNotification = async (notificationId) => {
    try {
      await budgetService.dismissNotification(notificationId);
      fetchBudget();
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

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
      fetchBudget();
      return response;
    } else {
      const response = await expenseService.createExpense(expenseData);
      showNotification("success", "Expense recorded successfully.");
      fetchExpenses();
      fetchSummary();
      fetchBudget();
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
      fetchBudget();
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

  // Listen for global Add Expense trigger from sidebar or mobile bar
  useEffect(() => {
    const handleGlobalAdd = () => {
      handleOpenAddModal();
    };
    window.addEventListener("finora:open-add-expense", handleGlobalAdd);
    return () => {
      window.removeEventListener("finora:open-add-expense", handleGlobalAdd);
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-6">
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

        {/* Milestone Celebration Banner */}
        <AnimatePresence>
          {budgetData?.notifications?.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-between rounded-2xl border border-emerald-300 bg-gradient-to-r from-emerald-500/15 via-emerald-400/20 to-teal-500/15 p-4 text-emerald-950 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
                  <Sparkles size={18} />
                </div>
                <div>
                  <span className="block text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Milestone Completed!
                  </span>
                  <span className="text-xs sm:text-sm font-semibold">
                    {notif.message}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDismissNotification(notif.id)}
                className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-200/50 hover:text-emerald-950 transition"
                title="Dismiss"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Salary Setup Banner if not configured */}
        {!budgetLoading &&
          budgetData &&
          (!budgetData.salary?.amount || budgetData.salary.amount === 0) && (
            <div className="rounded-2xl border border-finora-200 bg-gradient-to-r from-finora-50 via-white to-emerald-50/50 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-finora-100 text-finora-800">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Add your monthly salary
                  </h4>
                  <p className="text-xs text-slate-500">
                    Finora needs your income to calculate safe daily spend,
                    track savings rate, and forecast month-end balance.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOnboardingModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-finora-900 px-4 py-2 text-xs font-bold text-white hover:bg-finora-800 transition shrink-0 self-start sm:self-auto"
              >
                <Plus size={14} />
                <span>Set Up Salary &amp; Dues</span>
              </button>
            </div>
          )}

        {/* Executive Budget & Spendable Balance Summary */}
        <BudgetOverviewCard
          budgetData={budgetData}
          loading={budgetLoading}
        />

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

          {/* Right Sidebar: Dues Checklist & Category Breakdown */}
          <div className="space-y-6">
            {/* Upcoming / Monthly Fixed Dues Checklist (House Rent, School Fees, EMIs) */}
            <UpcomingDuesWidget
              checklist={budgetData?.fixedExpenses?.checklist}
              onToggleFixedExpense={handleToggleFixedExpense}
              onOpenManageModal={() => setIsBudgetModalOpen(true)}
            />

            {/* Category Breakdown (adapts to active time window) */}
            <CategoryBreakdown
              categoryBreakdown={summary?.categoryBreakdown}
              totalSpent={summary?.totalSpent}
              activeDateRange={activeDateRange}
            />
          </div>
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

      {/* Budget & Fixed Commitments Manager Modal */}
      <BudgetSettingsModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        budgetData={budgetData}
        onSettingsSaved={fetchBudget}
        onNotify={showNotification}
      />

      {/* Onboarding Salary & Dues Setup Modal */}
      <OnboardingSalaryModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onSuccess={() => {
          fetchBudget();
          fetchSummary();
        }}
        onNotify={showNotification}
        user={user}
      />
    </div>
  );
}
