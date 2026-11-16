import { Link, useNavigate } from "react-router-dom";
import {
  FileText,
  ShieldCheck,
  ArrowLeft,
  Wallet,
  AlertCircle,
  Lock,
  Scale,
  Clock,
  HelpCircle,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function TermsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[#f7faf8] py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
          <button
            type="button"
            onClick={() => (user ? navigate("/dashboard") : navigate(-1))}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 self-start"
          >
            <ArrowLeft size={16} />
            <span>{user ? "Back to Dashboard" : "Go Back"}</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Clock size={14} className="text-finora-600" />
            <span>Last Updated: November 2026</span>
          </div>
        </div>

        {/* Title Banner */}
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-900 via-finora-950 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-bold text-emerald-300">
            <Scale size={14} />
            <span>LEGAL AGREEMENT</span>
          </div>

          <h1 className="mt-4 font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
            Terms & Conditions
          </h1>

          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-emerald-100/75 leading-relaxed">
            Please read these terms and conditions carefully before using the Finora
            personal finance platform. By creating an account or using our services, you agree
            to be bound by these provisions.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <FileText size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                1. Acceptance of Terms
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              By accessing and using Finora (&quot;the Service&quot;), you acknowledge that you
              have read, understood, and agree to be bound by the terms, conditions, and notices
              contained herein. If you do not accept these terms in full, you must discontinue
              use of Finora immediately.
            </p>
          </section>

          {/* Section 2 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <Lock size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                2. User Accounts & Password Security
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              When creating an account on Finora, you must provide accurate, current, and
              complete information. You are solely responsible for maintaining the
              confidentiality of your login credentials and password. Finora uses modern
              salted hashing (Bcrypt) and secure session tokens, but you must immediately notify
              us if you suspect any unauthorized access to your account.
            </p>
          </section>

          {/* Section 3 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <AlertCircle size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                3. Financial Tool Disclaimer (Not Financial Advice)
              </h2>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-900 leading-relaxed">
              <strong>Important Notice:</strong> Finora is an informational budgeting, expense
              recording, and personal cash-flow management tool designed for academic, tracking,
              and educational purposes. Finora does not provide certified financial advisory,
              legal, tax, or investment advice. Any decisions made based on data displayed
              are at your sole discretion.
            </div>
          </section>

          {/* Section 4 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <Wallet size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                4. Expense Data & Currency
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              All financial figures, reports, and budgets entered into Finora are expressed in
              the standard Indian Rupee (₹ INR) currency format. You retain full ownership of
              the expense records and notes you submit to the system. You may export your records
              at any time via PDF and CSV formats.
            </p>
          </section>

          {/* Section 5 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <ShieldCheck size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                5. Acceptable Use Policy
              </h2>
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li>Do not attempt to compromise or reverse-engineer the API or backend infrastructure.</li>
              <li>Do not use the platform for fraudulent, unauthorized, or illegal financial activities.</li>
              <li>Do not submit malicious scripts, automated bot scrapers, or excessive bulk requests.</li>
            </ul>
          </section>

          {/* Section 6 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <HelpCircle size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                6. Contact & Inquiries
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              If you have any questions or feedback regarding these Terms & Conditions, please
              contact the Finora development and security team through the assignment repository
              or academic coordinator.
            </p>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-6 text-xs text-slate-500">
          <Link to="/privacy" className="font-bold text-finora-700 hover:underline">
            Read Privacy Policy →
          </Link>
          <span>Finora Personal Finance</span>
        </div>
      </div>
    </div>
  );
}