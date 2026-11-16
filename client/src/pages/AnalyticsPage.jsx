import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  BarChart3,
  LogOut,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  LayoutDashboard,
  Calendar,
  PiggyBank,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";
import expenseService from "../services/expenseService";

import MonthlyStackedBarChart from "../components/analytics/MonthlyStackedBarChart";
import CategoryPieChart from "../components/analytics/CategoryPieChart";
import TopExpenseVisual from "../components/analytics/TopExpenseVisual";
import RecentTransactionsCard from "../components/analytics/RecentTransactionsCard";
import AnalyticsSummaryCards from "../components/analytics/AnalyticsSummaryCards";
import ExpenseModal from "../components/expenses/ExpenseModal";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Quick Add Expense modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const fetchAnalytics = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await expenseService.getExpenseAnalytics({
          year: selectedYear,
        });
        if (data.success) {
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Failed to fetch analytics:", err);
        showNotification(
          "error",
          err.response?.data?.message || "Failed to load analytics data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedYear]
  );

  useEffect(() => {
    if (user && status === "authenticated") {
      fetchAnalytics();
    }
  }, [user, status, fetchAnalytics]);

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
    fetchAnalytics(true);
    return response;
  };

  const availableYears = analyticsData?.availableYears || [
    new Date().getFullYear(),
  ];

  const handleStepYear = (direction) => {
    setSelectedYear((prev) => prev + direction);
    setSelectedCategory(null);
  };

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
                className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
              >
                <PiggyBank size={14} />
                <span>Budget & Savings</span>
              </Link>
              <Link
                to="/analytics"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-finora-900 shadow-xs"
              >
                <BarChart3 size={14} className="text-finora-600" />
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
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100"
                title="Budget & Savings"
              >
                <PiggyBank size={18} />
              </Link>
              <Link
                to="/analytics"
                className="p-2 rounded-xl bg-finora-50 text-finora-700"
                title="Analytics"
              >
                <BarChart3 size={18} />
              </Link>
            </div>

            {/* Quick Add Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-finora-800 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-finora-700"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
            >
              <LogOut size={16} />
              <span className="hidden md:inline">
                {loggingOut ? "Signing out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-8 space-y-7">
        {/* Notifications */}
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

        {/* ========================================================= */}
        {/* ZONE 1: ANNUAL EXECUTIVE PULSE & YEAR COMMAND CENTER      */}
        {/* ========================================================= */}
        <section className="space-y-4">
          {/* Streamlined Executive Command Hero */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl bg-finora-950 p-6 sm:p-7 text-white shadow-xl"
          >
            <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-finora-500/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-finora-200">
                    <Sparkles size={13} />
                    ANNUAL OVERVIEW
                  </span>
                  <span className="text-xs font-semibold text-finora-300/80">
                    • Financial Year {selectedYear}
                  </span>
                </div>

                <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Yearly Financial Analytics
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-finora-100/80 max-w-xl leading-relaxed">
                  Analyze your month-by-month expenditure, category distribution shares, and high-impact purchase drivers.
                </p>
              </div>

              {/* Integrated Year Controller Pill */}
              <div className="flex flex-wrap items-center gap-2 bg-white/10 p-2 rounded-2xl border border-white/15 backdrop-blur-md self-start lg:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => handleStepYear(-1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                  title="Previous Year"
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-2 px-2.5">
                  <Calendar size={16} className="text-finora-300 shrink-0" />
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(Number(e.target.value));
                      setSelectedCategory(null);
                    }}
                    className="bg-transparent font-display text-base sm:text-lg font-extrabold text-white focus:outline-none cursor-pointer"
                  >
                    {availableYears.map((yr) => (
                      <option key={yr} value={yr} className="text-slate-900 bg-white">
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => handleStepYear(1)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
                  title="Next Year"
                >
                  <ChevronRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => fetchAnalytics(true)}
                  disabled={refreshing}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-1 active:scale-95"
                  title="Refresh Analytics"
                >
                  <RefreshCw
                    size={15}
                    className={refreshing ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>
          </motion.div>

          {/* 4 Annual KPI Cards */}
          <AnalyticsSummaryCards
            summary={analyticsData?.summary}
            year={selectedYear}
            loading={loading}
          />
        </section>

        {/* ========================================================= */}
        {/* ZONE 2: SPENDING VISUALIZATIONS & CATEGORY BREAKDOWN      */}
        {/* ========================================================= */}
        <section className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 shadow-xs space-y-6">
          {/* Section Framing Header */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-finora-800 text-white text-xs font-black shadow-xs">
                01
              </span>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Spending Trends & Category Allocations
                </h2>
                <p className="text-xs text-slate-500">
                  Month-by-month categorized bar flow and proportional shares for {selectedYear}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-finora-100/70 border border-finora-200 px-3 py-0.5 text-xs font-bold text-finora-800">
              Interactive Visualizations
            </span>
          </div>

          {/* Month-wise Stacked Bar Chart */}
          <MonthlyStackedBarChart
            monthlyTrends={analyticsData?.monthlyTrends || []}
            year={selectedYear}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* 2-Column Split: Donut Chart + Top Expense Spotlight */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Category Pie / Donut Chart */}
            <CategoryPieChart
              categoryBreakdown={analyticsData?.categoryBreakdown || []}
              totalSpent={analyticsData?.summary?.yearTotalSpent || 0}
              year={selectedYear}
            />

            {/* Top Most Expense Visual & Leaderboard */}
            <TopExpenseVisual
              peakExpense={analyticsData?.peakExpense}
              topExpenses={analyticsData?.topExpenses || []}
              year={selectedYear}
              onOpenAddModal={() => setIsModalOpen(true)}
            />
          </div>
        </section>

        {/* ========================================================= */}
        {/* ZONE 3: TRANSACTION AUDIT & RECENT ACTIVITY FEED          */}
        {/* ========================================================= */}
        <section className="rounded-3xl border border-slate-200/80 bg-slate-50/70 p-5 sm:p-7 shadow-xs space-y-5">
          {/* Section Framing Header */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-white text-xs font-black shadow-xs">
                02
              </span>
              <div>
                <h2 className="font-display text-base sm:text-lg font-bold text-slate-900">
                  Transaction Records & Account Activity
                </h2>
                <p className="text-xs text-slate-500">
                  Latest transactions recorded across all payment methods
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-white border border-slate-200 px-3 py-0.5 text-xs font-bold text-slate-600">
              Activity Feed
            </span>
          </div>

          {/* Recent Transactions Card */}
          <RecentTransactionsCard
            transactions={analyticsData?.recentTransactions || []}
          />
        </section>
      </div>

      {/* Add Expense Modal */}
      <ExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleExpenseSubmit}
      />
    </main>
  );
}
