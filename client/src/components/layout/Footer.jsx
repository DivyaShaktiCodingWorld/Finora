import { Link } from "react-router-dom";
import { Wallet, ShieldCheck, ArrowUpRight, IndianRupee } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200/80 bg-white/60 backdrop-blur-xs">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 items-start">
          {/* Brand & Mission */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-950 text-emerald-400">
                <Wallet size={16} />
              </div>
              <span className="font-display text-lg font-extrabold text-finora-950">
                finora<span className="text-finora-500">.</span>
              </span>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-slate-500">
              Finora delivers secure personal finance tracking, intelligent paycheck cycle budgets,
              and multi-period expense analytics designed to keep your spending clear and balanced.
            </p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 border border-emerald-200/60">
                <ShieldCheck size={12} />
                AES-256 Encrypted
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700">
                <IndianRupee size={11} />
                Standard Currency: INR (₹)
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Navigation
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link
                  to="/dashboard"
                  className="hover:text-finora-700 hover:underline transition"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  to="/budget"
                  className="hover:text-finora-700 hover:underline transition"
                >
                  Budget & Savings
                </Link>
              </li>
              <li>
                <Link
                  to="/analytics"
                  className="hover:text-finora-700 hover:underline transition"
                >
                  Analytics & Reports
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy Links */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Legal & Trust
            </p>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li>
                <Link
                  to="/terms"
                  className="hover:text-finora-700 hover:underline transition flex items-center gap-1"
                >
                  <span>Terms & Conditions</span>
                  <ArrowUpRight size={12} />
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-finora-700 hover:underline transition flex items-center gap-1"
                >
                  <span>Privacy Policy</span>
                  <ArrowUpRight size={12} />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200/80 pt-6 text-xs text-slate-400">
          <p>© {currentYear} Finora Inc. All rights reserved.</p>
          <p className="text-[11px]">
            Designed for MCA SEC • Built with React, Tailwind & Node.js
          </p>
        </div>
      </div>
    </footer>
  );
}