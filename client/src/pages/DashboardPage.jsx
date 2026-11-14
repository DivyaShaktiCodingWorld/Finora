
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  CreditCard,
  LogOut,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [loggingOut, setLoggingOut] = useState(false);

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
    <main className="min-h-screen bg-[#f7faf8]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finora-900 text-white">
              <Wallet size={21} />
            </div>

            <span className="font-display text-xl font-extrabold text-finora-950">
              finora<span className="text-finora-500">.</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut size={17} />
            {loggingOut ? "Signing out..." : "Logout"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl bg-finora-950 p-8 text-white shadow-xl sm:p-12"
        >
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-finora-500/20 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-finora-200">
              <ShieldCheck size={15} />
              AUTHENTICATED SESSION
            </span>

            <h1 className="mt-7 font-display text-3xl font-extrabold sm:text-5xl">
              Welcome, {firstName}!
            </h1>

            <p className="mt-4 max-w-lg text-sm leading-7 text-emerald-100/70 sm:text-base">
              Your Finora account is ready. Take control of your money
              and build better financial habits.
            </p>
          </div>
        </motion.section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
              <CreditCard size={21} />
            </div>

            <h2 className="mt-5 font-display text-lg font-bold text-slate-900">
              Expense tracking
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your expense management features will be available here.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
              <ShieldCheck size={21} />
            </div>

            <h2 className="mt-5 font-display text-lg font-bold text-slate-900">
              Account information
            </h2>

            <p className="mt-2 break-all text-sm text-slate-500">
              {user?.email}
            </p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-finora-50 px-3 py-1.5 text-xs font-semibold text-finora-700">
              <span className="h-2 w-2 rounded-full bg-finora-500" />
              Authenticated
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-2 text-sm text-slate-400">
          <ArrowUpRight size={16} />
          Your Money. Your Control.
        </div>
      </div>
    </main>
  );
}
