import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  PiggyBank,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  Sparkles,
  Settings,
  CreditCard,
  Check,
  Zap,
  ArrowUpRight,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import budgetService from "../services/budgetService";
import expenseService from "../services/expenseService";
import { formatCurrency } from "../lib/expenseConstants";

import BudgetSettingsModal from "../components/budget/BudgetSettingsModal";
import MonthlySavingsTracker from "../components/budget/MonthlySavingsTracker";
import ExpenseModal from "../components/expenses/ExpenseModal";

export default function BudgetPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);
  const [activeViewTab, setActiveViewTab] = useState("checklist"); // "checklist" | "savings"

  // Budget data
  const [budgetData, setBudgetData] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter for checklist: "all" | "recurring" | "installment" | "completed"
  const [checklistFilter, setChecklistFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  // Modals state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsModalInitialTab, setSettingsModalInitialTab] = useState("salary");
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Notification state
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchBudget = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setBudgetLoading(true);

      try {
        const data = await budgetService.getCurrentBudget();
        if (data.success) {
          setBudgetData(data);
        }
      } catch (err) {
        console.error("Failed to load budget:", err);
        showNotification("error", "Unable to load budget details.");
      } finally {
        setBudgetLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user && status === "authenticated") {
      fetchBudget();
    }
  }, [user, status, fetchBudget]);

  const handleToggleFixedExpense = async (fixedExpenseId, currentPaidStatus) => {
    if (togglingId) return;
    setTogglingId(fixedExpenseId);

    try {
      const response = await budgetService.toggleFixedExpense(
        fixedExpenseId,
        !currentPaidStatus
      );
      if (response.success) {
        if (response.completionNotification) {
          showNotification("success", response.completionNotification.message);
        } else {
          showNotification("success", response.message);
        }
        fetchBudget(true);
      }
    } catch (err) {
      showNotification(
        "error",
        err.response?.data?.message || "Failed to update commitment."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const handleDismissNotification = async (notificationId) => {
    try {
      await budgetService.dismissNotification(notificationId);
      fetchBudget(true);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  const handleOpenSettings = (tab = "salary") => {
    setSettingsModalInitialTab(tab);
    setIsSettingsModalOpen(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleExpenseSubmit = async (expenseData) => {
    const response = await expenseService.createExpense(expenseData);
    showNotification("success", "Expense recorded successfully.");
    fetchBudget(true);
    return response;
  };

  const metrics = budgetData?.metrics;
  const cycle = budgetData?.cycle;
  const checklist = budgetData?.fixedExpenses?.checklist || [];
  const notifications = budgetData?.notifications || [];

  // Filter checklist
  const filteredChecklist = checklist.filter((item) => {
    if (checklistFilter === "all") return true;
    if (checklistFilter === "recurring") {
      return (
        item.commitmentType === "recurring" ||
        item.totalInstallments === null ||
        item.totalInstallments === undefined
      );
    }
    if (checklistFilter === "installment") {
      return (
        item.commitmentType === "installment" ||
        (item.totalInstallments !== null && item.totalInstallments !== undefined)
      );
    }
    return true;
  });

  return (
    <main className="min-h-screen bg-[#f7faf8] pb-16">
      {/* Top Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finora-900 text-white shadow-xs">
                <Wallet size={20} />
              </div>

              <span className="font-display text-xl font-extrabold tracking-tight text-finora-950">
                finora<span className="text-finora-500">.</span>
              </span>
            </Link>

            {/* Navigation Switcher Tabs */}
            <nav className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/budget"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-finora-900 shadow-xs"
              >
                <PiggyBank size={14} className="text-finora-600" />
                <span>Budget & Savings</span>
              </Link>
              <Link
                to="/analytics"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <BarChart3 size={14} />
                <span>Analytics</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Nav Switcher */}
            <div className="flex sm:hidden items-center gap-1">
              <Link
                to="/dashboard"
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                title="Dashboard"
              >
                <LayoutDashboard size={18} />
              </Link>
              <Link
                to="/budget"
                className="p-2 rounded-xl bg-finora-50 text-finora-700"
                title="Budget & Savings"
              >
                <PiggyBank size={18} />
              </Link>
              <Link
                to="/analytics"
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                title="Analytics"
              >
                <BarChart3 size={18} />
              </Link>
            </div>

            {/* Quick Add Expense */}
            <button
              type="button"
              onClick={() => setIsAddExpenseModalOpen(true)}
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

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-8 space-y-6">
        {/* Milestone Celebration Banner */}
        <AnimatePresence>
          {notifications.map((notif) => (
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
                <PiggyBank size={14} />
                DEDICATED FINANCIAL PLANNER
              </span>

              <h1 className="mt-3.5 font-display text-2xl font-extrabold sm:text-4xl tracking-tight">
                Budget & Monthly Savings Hub
              </h1>

              <p className="mt-2 max-w-lg text-xs leading-6 text-emerald-100/75 sm:text-sm">
                Control your monthly salary, manage recurring commitments (House Rent, School Fees, EMIs),
                and track month-by-month savings growth in one dedicated place.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => handleOpenSettings("salary")}
                className="inline-flex items-center gap-2 rounded-xl bg-finora-400 px-5 py-3 text-sm font-bold text-finora-950 shadow-lg shadow-finora-400/20 transition hover:bg-finora-300"
              >
                <Settings size={18} />
                Manage Salary & Dues
              </button>

              <button
                type="button"
                onClick={() => fetchBudget(true)}
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

        {/* 4 Core Cycle Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Monthly Salary */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Salary / Budget
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-100 text-finora-800">
                <Wallet size={16} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-slate-900">
                {budgetLoading ? "..." : formatCurrency(metrics?.effectiveSalary || 0)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span>{cycle?.label || "Active Cycle"}</span>
              <button
                type="button"
                onClick={() => handleOpenSettings("salary")}
                className="font-semibold text-finora-700 hover:underline"
              >
                Edit
              </button>
            </div>
          </div>

          {/* Card 2: Fixed Commitments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fixed Dues (Rent, Fees, EMIs)
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <CreditCard size={16} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-slate-900">
                {budgetLoading ? "..." : formatCurrency(metrics?.totalFixedCommitted || 0)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-emerald-700 font-semibold">
                Paid: {formatCurrency(metrics?.paidFixedTotal || 0)}
              </span>
              <span className="text-amber-700 font-semibold">
                Pending: {formatCurrency(metrics?.pendingFixedTotal || 0)}
              </span>
            </div>
          </div>

          {/* Card 3: Daily Expenses Logged */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Daily Expenses Logged
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <LayoutDashboard size={16} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-2xl font-black text-slate-900">
                {budgetLoading ? "..." : formatCurrency(metrics?.dailyExpensesTotal || 0)}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              {metrics?.dailyExpensesCount || 0} transactions logged in this cycle
            </p>
          </div>

          {/* Card 4: Remaining Spendable Budget & Safe Daily Spend */}
          <div
            className={`rounded-2xl border p-5 shadow-xs ${
              (metrics?.remainingSpendableBudget || 0) < 0
                ? "border-red-200 bg-gradient-to-br from-white to-red-50/40"
                : "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Remaining Spendable Balance
              </span>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  (metrics?.remainingSpendableBudget || 0) < 0
                    ? "bg-red-100 text-red-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                <Zap size={16} />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={`font-display text-2xl font-black ${
                  (metrics?.remainingSpendableBudget || 0) < 0
                    ? "text-red-600"
                    : "text-emerald-700"
                }`}
              >
                {budgetLoading
                  ? "..."
                  : formatCurrency(metrics?.remainingSpendableBudget || 0)}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-bold text-finora-900">
                Safe Daily Spend: {formatCurrency(metrics?.safeDailySpend || 0)} / day
              </span>
              <span className="text-slate-400">
                {cycle?.daysRemaining || 0} days left
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher: Checklist vs Monthly Savings History */}
        <div className="flex border-b border-slate-200 pb-1 gap-2">
          <button
            type="button"
            onClick={() => setActiveViewTab("checklist")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeViewTab === "checklist"
                ? "bg-finora-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <CheckCircle2 size={16} />
            <span>Monthly Dues & Checklist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab("savings")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition ${
              activeViewTab === "savings"
                ? "bg-finora-900 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PiggyBank size={16} />
            <span>Month-by-Month Savings Tracker</span>
          </button>
        </div>

        {/* View 1: Monthly Dues & Interactive Checklist */}
        {activeViewTab === "checklist" ? (
          <div className="space-y-6">
            {/* Checklist Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    Cycle Commitments & Due Dates ({checklist.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mark commitments paid as you settle them this cycle. Ticking off an EMI decrements its remaining tenure!
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Filter Pills */}
                  <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setChecklistFilter("all")}
                      className={`rounded-lg px-2.5 py-1 ${
                        checklistFilter === "all"
                          ? "bg-white text-finora-950 font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      All ({checklist.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistFilter("recurring")}
                      className={`rounded-lg px-2.5 py-1 ${
                        checklistFilter === "recurring"
                          ? "bg-white text-finora-950 font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Recurring (Rent/Fees)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChecklistFilter("installment")}
                      className={`rounded-lg px-2.5 py-1 ${
                        checklistFilter === "installment"
                          ? "bg-white text-finora-950 font-bold shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      EMIs & Loans
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSettings("emis")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-finora-900 hover:bg-slate-50 transition"
                  >
                    <Plus size={14} />
                    <span>Add / Manage Dues</span>
                  </button>
                </div>
              </div>

              {/* Items List */}
              {checklist.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                    <CreditCard size={20} />
                  </div>
                  <h4 className="font-display text-sm font-bold text-slate-700">
                    No recurring commitments configured yet
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Add fixed dues like House Rent, Kid's School Fees, Bike EMI, or TV installments to keep track of them.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleOpenSettings("emis")}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-finora-800 px-4 py-2 text-xs font-bold text-white hover:bg-finora-700"
                  >
                    <Plus size={14} />
                    Add Fixed Commitment
                  </button>
                </div>
              ) : filteredChecklist.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No commitments match the active filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredChecklist.map((item) => {
                    const isInstallment =
                      item.commitmentType === "installment" ||
                      (item.totalInstallments !== null &&
                        item.totalInstallments !== undefined);

                    return (
                      <div
                        key={item._id}
                        className={`flex items-center justify-between rounded-2xl border p-4 transition ${
                          item.isPaid
                            ? "border-emerald-200 bg-emerald-50/25"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Toggle Checkbox Button */}
                          <button
                            type="button"
                            onClick={() => handleToggleFixedExpense(item._id, item.isPaid)}
                            disabled={togglingId === item._id}
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition ${
                              item.isPaid
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                            }`}
                            title={item.isPaid ? "Mark as pending" : "Mark as paid"}
                          >
                            <Check size={16} className={item.isPaid ? "opacity-100" : "opacity-0"} />
                          </button>

                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs sm:text-sm font-bold ${
                                  item.isPaid
                                    ? "text-emerald-950 line-through opacity-75"
                                    : "text-slate-900"
                                }`}
                              >
                                {item.title}
                              </span>

                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  isInstallment
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {isInstallment
                                  ? `EMI (${item.remainingInstallments ?? item.totalInstallments} left)`
                                  : "Recurring"}
                              </span>
                            </div>

                            <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                              <span>Due on {item.dueDay}th</span>
                              <span>•</span>
                              <span>{item.category}</span>
                              {item.notes && (
                                <>
                                  <span>•</span>
                                  <span className="italic max-w-[120px] truncate">{item.notes}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-display text-sm sm:text-base font-bold text-slate-900">
                            {formatCurrency(item.amount)}
                          </span>
                          <span
                            className={`block text-[10px] font-bold ${
                              item.isPaid ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {item.isPaid ? "Paid" : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* View 2: Month-by-Month Savings Tracker */
          <MonthlySavingsTracker onNotify={showNotification} />
        )}

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ArrowUpRight size={15} />
            <span>Finora • Budget Planner & Monthly Savings</span>
          </div>
          <span>Safe Daily Spend & Paycheck Cycles</span>
        </footer>
      </div>

      {/* Budget & Fixed Commitments Settings Modal */}
      <BudgetSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        budgetData={budgetData}
        onSettingsSaved={() => fetchBudget(true)}
        onNotify={showNotification}
        initialTab={settingsModalInitialTab}
      />

      {/* Add Expense Modal */}
      <ExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
      />
    </main>
  );
}
