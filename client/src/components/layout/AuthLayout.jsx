
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BarChart3,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const benefits = [
  {
    icon: Wallet,
    title: "Track every rupee",
    description: "Know exactly where your money goes.",
  },
  {
    icon: BarChart3,
    title: "Understand your habits",
    description: "Turn spending into smarter decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Stay in control",
    description: "Keep your financial life organized.",
  },
];

export default function AuthLayout() {
  return (
    <main className="min-h-screen bg-[#f7faf8] lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-finora-950 p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-finora-700/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 h-[450px] w-[450px] rounded-full bg-finora-500/20 blur-3xl" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-finora-400 text-finora-950">
              <Wallet size={23} strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl font-extrabold">
              finora<span className="text-finora-400">.</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-finora-200 backdrop-blur">
            <Sparkles size={14} />
            YOUR PERSONAL FINANCE COMPANION
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-[1.13] tracking-tight xl:text-6xl">
            Your money.
            <br />
            Your <span className="text-finora-400">control.</span>
          </h1>

          <p className="mt-6 max-w-md text-base leading-8 text-emerald-100/65">
            A simpler way to understand your spending, build better
            habits, and move towards your financial goals.
          </p>

          <div className="mt-12 space-y-7">
            {benefits.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-finora-300">
                  <Icon size={21} />
                </div>

                <div>
                  <h3 className="font-semibold text-white">{title}</h3>
                  <p className="mt-1 text-sm text-emerald-100/50">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-emerald-100/40">
          <span>© {new Date().getFullYear()} Finora</span>
          <span>Your Money. Your Control.</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25, rotate: 4 }}
          animate={{ opacity: 1, y: 0, rotate: 4 }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-32 right-10 hidden w-56 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-xl xl:block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-100/70">
              Smart money habits
            </span>
            <ArrowUpRight size={17} className="text-finora-300" />
          </div>

          <div className="mt-4 flex h-14 items-end gap-2">
            {[35, 55, 42, 75, 60, 90, 70].map((height, index) => (
              <div
                key={index}
                style={{ height: `${height}%` }}
                className="flex-1 rounded-t-md bg-finora-400/80"
              />
            ))}
          </div>

          <p className="mt-3 text-xs text-emerald-100/60">
            Build better habits, one day at a time.
          </p>
        </motion.div>
      </section>

      <section className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finora-900 text-white">
              <Wallet size={21} />
            </div>
            <span className="font-display text-xl font-extrabold text-finora-950">
              finora.
            </span>
          </Link>

          <span className="text-xs font-medium text-slate-400">
            Your Money. Your Control.
          </span>
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:px-14 xl:px-20">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            <Outlet />
          </motion.div>
        </div>

        <footer className="px-6 pb-6 text-center text-xs text-slate-400 flex flex-wrap items-center justify-center gap-3">
          <span>Securely manage your finances with Finora.</span>
          <span>•</span>
          <Link to="/terms" className="hover:text-slate-600 transition hover:underline">
            Terms & Conditions
          </Link>
          <span>•</span>
          <Link to="/privacy" className="hover:text-slate-600 transition hover:underline">
            Privacy Policy
          </Link>
        </footer>
      </section>
    </main>
  );
}
