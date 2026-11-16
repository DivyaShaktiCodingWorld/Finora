import { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import {
  Wallet,
  LayoutDashboard,
  PiggyBank,
  BarChart3,
  Plus,
  LogOut,
  Sparkles,
  RefreshCw,
  X,
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

const FINANCIAL_TIPS = [
  {
    title: "50/30/20 Budgeting",
    tip: "Allocate 50% of income to Needs, 30% to Wants, and 20% to Savings & Debt repayment for balanced financial health.",
  },
  {
    title: "Monthly Spikes",
    tip: "Comparing previous months using the Select Month stepper is one of the fastest ways to spot seasonal spikes in utilities.",
  },
  {
    title: "The 24-Hour Rule",
    tip: "Wait 24 hours before making unplanned purchases above ₹1,000 to prevent impulse spending.",
  },
  {
    title: "Pay Yourself First",
    tip: "Transfer your monthly savings immediately on paycheck day rather than saving whatever is left at the end.",
  },
  {
    title: "Audit Subscriptions",
    tip: "Review recurring dues each quarter to cancel unused streaming apps and gym memberships you no longer use.",
  },
  {
    title: "Daily Safe Spend",
    tip: "Keeping discretionary daily spending under your calculated safe threshold guarantees surplus at month end.",
  },
];

export default function Sidebar({ onCloseMobile }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [loggingOut, setLoggingOut] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);

  const navItems = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      description: "Overview & expenses",
    },
    {
      to: "/budget",
      label: "Budget & Savings",
      icon: PiggyBank,
      description: "Salary & monthly goals",
    },
    {
      to: "/analytics",
      label: "Analytics",
      icon: BarChart3,
      description: "Trends & visual reports",
    },
  ];

  const handleOpenAddExpense = () => {
    window.dispatchEvent(new CustomEvent("finora:open-add-expense"));
    if (onCloseMobile) onCloseMobile();
  };

  const handleNextTip = (e) => {
    e.stopPropagation();
    setTipIndex((prev) => (prev + 1) % FINANCIAL_TIPS.length);
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

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "F";
  const currentTip = FINANCIAL_TIPS[tipIndex];

  return (
    <aside className="flex h-full w-full flex-col justify-between overflow-y-auto bg-white border-r border-slate-200/80 px-4 py-5 select-none scrollbar-thin">
      {/* Top Header & Navigation */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="group flex items-center gap-3 transition"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finora-950 text-emerald-400 shadow-md shadow-finora-950/20 group-hover:scale-105 transition-transform">
              <Wallet size={20} strokeWidth={2.4} />
            </div>
            <div>
              <span className="font-display text-xl font-extrabold tracking-tight text-finora-950">
                finora<span className="text-finora-500">.</span>
              </span>
              <span className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                Expense Management
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Quick Add Expense Action Button */}
        <div className="px-1">
          <button
            type="button"
            onClick={handleOpenAddExpense}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-finora-900 via-finora-800 to-finora-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-finora-900/25 transition-all hover:from-finora-800 hover:to-finora-700 hover:shadow-md hover:shadow-finora-900/30 active:scale-[0.99]"
          >
            <Plus size={18} strokeWidth={2.6} className="text-emerald-300" />
            <span>Add Expense</span>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Menu
          </p>

          <nav className="mt-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-emerald-50/80 text-finora-950 font-bold border border-emerald-200/80 shadow-xs"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                            isActive
                              ? "bg-finora-900 text-emerald-300"
                              : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-700"
                          }`}
                        >
                          <Icon size={17} strokeWidth={isActive ? 2.4 : 2} />
                        </div>
                        <div>
                          <span className="block leading-tight">{item.label}</span>
                          <span className="block text-[10px] font-normal text-slate-400 leading-tight">
                            {item.description}
                          </span>
                        </div>
                      </div>

                      {isActive && (
                        <span className="h-2 w-2 rounded-full bg-finora-600 shadow-xs" />
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Financial Tip Card (moved into sidebar) */}
        <div className="px-1">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50/60 via-finora-50/40 to-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-finora-900 font-bold text-[11px] tracking-wider uppercase">
                <Sparkles size={13} className="text-finora-600" />
                <span>Financial Tip</span>
              </div>

              <button
                type="button"
                onClick={handleNextTip}
                title="Next Tip"
                className="rounded-md p-1 text-slate-400 hover:bg-emerald-100/60 hover:text-finora-800 transition"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            <p className="mt-2 text-xs font-semibold text-slate-800 leading-snug">
              {currentTip.title}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              {currentTip.tip}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Section: Account Information, Active Session & Logout */}
      <div className="mt-6 space-y-3 pt-4 border-t border-slate-200/80">
        {/* Account Information Card */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-finora-900 font-bold text-sm text-emerald-300 shadow-xs">
              {userInitial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 leading-tight">
                {user?.name || "Account"}
              </p>
              <p className="truncate text-[11px] text-slate-500 leading-tight">
                {user?.email || "Signed In"}
              </p>
            </div>
          </div>

          {/* Active Session Tab */}
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-200/60">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
              </span>
              Active Session
            </div>

            <span className="text-[10px] text-slate-400 font-medium">₹ INR</span>
          </div>
        </div>

        {/* Quick Legal Links */}
        <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-slate-500 px-1">
          <Link
            to="/terms"
            onClick={onCloseMobile}
            className="hover:text-finora-700 hover:underline transition"
          >
            Terms & Conditions
          </Link>
          <span className="text-slate-300">•</span>
          <Link
            to="/privacy"
            onClick={onCloseMobile}
            className="hover:text-finora-700 hover:underline transition"
          >
            Privacy Policy
          </Link>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
        >
          <LogOut size={14} />
          <span>{loggingOut ? "Signing out..." : "Logout"}</span>
        </button>
      </div>
    </aside>
  );
}