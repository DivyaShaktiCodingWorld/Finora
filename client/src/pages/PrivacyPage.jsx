import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Database,
  EyeOff,
  UserCheck,
  Clock,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function PrivacyPage() {
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
        <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-finora-950 via-emerald-950 to-slate-950 p-6 sm:p-10 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-1 text-xs font-bold text-emerald-300">
            <ShieldCheck size={14} />
            <span>DATA PROTECTION & PRIVACY</span>
          </div>

          <h1 className="mt-4 font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
            Privacy Policy
          </h1>

          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-emerald-100/75 leading-relaxed">
            Your privacy and financial confidentiality are our highest priority. Learn how
            Finora safeguards your personal information, records, and active sessions.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <Database size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                1. Information We Collect
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              Finora collects only the minimum necessary data required to deliver reliable
              budget tracking and expense analysis:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li><strong>Account Credentials:</strong> Name, valid email address, and cryptographically hashed password.</li>
              <li><strong>Financial Records:</strong> Transaction titles, amounts in Rupee (₹), categories, payment methods, transaction dates, and personal notes.</li>
              <li><strong>Budget Configurations:</strong> Monthly salary, cycle settings, and fixed dues/EMI commitments.</li>
              <li><strong>Session Data:</strong> Secure JWT cookies and CSRF tokens strictly for session authentication.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <Lock size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                2. How We Protect Your Data
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              Security is embedded into every layer of Finora&apos;s architecture:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="font-bold text-xs text-slate-900">Bcrypt Password Hashing</p>
                <p className="text-[11px] text-slate-500 mt-1">Passwords are salted and hashed; plain text passwords are never stored or logged.</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="font-bold text-xs text-slate-900">CSRF & Rate Limiting</p>
                <p className="text-[11px] text-slate-500 mt-1">State-modifying requests require anti-forgery tokens, protecting against cross-site attacks.</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="font-bold text-xs text-slate-900">HTTP-Only Cookie Sessions</p>
                <p className="text-[11px] text-slate-500 mt-1">Session tokens are stored in secure cookies shielded from malicious client-side JavaScript.</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="font-bold text-xs text-slate-900">User Isolation</p>
                <p className="text-[11px] text-slate-500 mt-1">All database queries strictly scope data to your verified user ID.</p>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <EyeOff size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                3. Zero Third-Party Sharing
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              We never sell, rent, monetize, or share your financial records with advertising
              networks, third-party data brokers, or marketing partners. Your records exist
              solely for your personal visibility.
            </p>
          </section>

          {/* Section 4 */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
                <UserCheck size={18} />
              </div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                4. Your Rights: Export & Deletion
              </h2>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-600">
              You maintain full sovereignty over your information. At any time, you can:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-slate-600">
              <li>Export all expense data in PDF or CSV formats directly from the dashboard.</li>
              <li>Edit or delete individual transactions at your convenience.</li>
              <li>Clear budget configurations and fixed commitment lists at any time.</li>
            </ul>
          </section>
        </div>

        {/* Bottom Navigation */}
        <div className="flex items-center justify-between border-t border-slate-200/80 pt-6 text-xs text-slate-500">
          <Link to="/terms" className="font-bold text-finora-700 hover:underline">
            ← Read Terms & Conditions
          </Link>
          <span>Finora Privacy Assurance</span>
        </div>
      </div>
    </div>
  );
}