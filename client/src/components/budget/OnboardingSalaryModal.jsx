import { useState } from "react";
import {
  X,
  Sparkles,
  CreditCard,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  Check,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import budgetService from "../../services/budgetService";
import { EXPENSE_CATEGORIES } from "../../lib/expenseConstants";

export default function OnboardingSalaryModal({
  isOpen,
  onClose,
  onSuccess,
  onNotify,
  user,
}) {
  // Salary State
  const [salary, setSalary] = useState("");
  const [cycleType, setCycleType] = useState("calendar_month"); // "calendar_month" | "salary_day"
  const [salaryDay, setSalaryDay] = useState(1);

  // Commitments / EMI State
  const [hasCommitments, setHasCommitments] = useState(false);
  const [commitments, setCommitments] = useState([
    {
      title: "",
      amount: "",
      category: "Housing & Rent",
      commitmentType: "recurring", // "recurring" | "installment"
      remainingInstallments: 12,
      dueDay: 5,
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSkip = () => {
    if (user?._id) {
      try {
        localStorage.setItem(`finora_onboarding_skipped_${user._id}`, "true");
      } catch (e) {
        console.error("Failed to save skip flag:", e);
      }
    }
    onClose();
  };

  const handleAddCommitmentRow = () => {
    setCommitments((prev) => [
      ...prev,
      {
        title: "",
        amount: "",
        category: "Bills",
        commitmentType: "recurring",
        remainingInstallments: 12,
        dueDay: 5,
      },
    ]);
  };

  const handleRemoveCommitmentRow = (index) => {
    setCommitments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateCommitment = (index, field, value) => {
    setCommitments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const parsedSalary = parseFloat(salary);
    if (isNaN(parsedSalary) || parsedSalary <= 0) {
      setErrorMsg("Please enter a valid monthly salary greater than ₹0.");
      return;
    }

    setSaving(true);
    try {
      // 1. Save Budget Settings
      await budgetService.updateBudgetSettings({
        monthlySalary: parsedSalary,
        cycleType,
        salaryDay: cycleType === "salary_day" ? Number(salaryDay) : 1,
      });

      // 2. If user opted to add commitments, save them
      if (hasCommitments && commitments.length > 0) {
        for (const item of commitments) {
          if (item.title.trim() && parseFloat(item.amount) > 0) {
            await budgetService.createFixedExpense({
              title: item.title.trim(),
              amount: parseFloat(item.amount),
              category: item.category,
              dueDay: Number(item.dueDay) || 1,
              commitmentType: item.commitmentType,
              remainingInstallments:
                item.commitmentType === "installment"
                  ? Number(item.remainingInstallments) || 12
                  : null,
              totalInstallments:
                item.commitmentType === "installment"
                  ? Number(item.remainingInstallments) || 12
                  : null,
            });
          }
        }
      }

      // 3. Clear skip flag & notify
      if (user?._id) {
        localStorage.setItem(`finora_onboarding_completed_${user._id}`, "true");
        localStorage.removeItem(`finora_onboarding_skipped_${user._id}`);
      }

      onNotify?.(
        "success",
        "Welcome to Finora! Your monthly salary & commitments are set up 🎉"
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Failed to complete onboarding salary setup:", err);
      setErrorMsg(
        err.response?.data?.message ||
          "Failed to save settings. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-finora-950 via-finora-900 to-finora-950 p-6 text-white relative">
            <button
              type="button"
              onClick={handleSkip}
              className="absolute top-5 right-5 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
              title="Skip for now"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <Sparkles size={11} />
                WELCOME TO FINORA
              </span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-black text-white">
              Add Your Monthly Salary
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-finora-200/90 leading-relaxed">
              Hello {user?.name || "there"}! Tell us your monthly income so
              Finora can calculate your spendable budget, track savings surplus,
              and protect your cash reserves.
            </p>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSave}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-2xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Step 1: Salary Input */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="onboarding-salary"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700"
                >
                  This Month&apos;s Take-Home Salary (₹) *
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <IndianRupee size={18} />
                  </div>
                  <input
                    id="onboarding-salary"
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="e.g. 60,000"
                    autoFocus
                    className="w-full rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-4 font-display text-base font-bold text-slate-900 placeholder:text-slate-400 focus:border-finora-600 focus:outline-none focus:ring-2 focus:ring-finora-600/20"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  You can adjust or override this salary anytime for individual
                  months.
                </p>
              </div>

              {/* Cycle Type Selection */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Budget Cycle Type
                </span>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCycleType("calendar_month")}
                    className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition ${
                      cycleType === "calendar_month"
                        ? "border-finora-600 bg-finora-50/40 ring-1 ring-finora-600/40"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        cycleType === "calendar_month"
                          ? "border-finora-600 bg-finora-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {cycleType === "calendar_month" && <Check size={10} />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Calendar Month
                      </span>
                      <span className="text-[11px] text-slate-500">
                        1st to end of every month (Recommended)
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCycleType("salary_day")}
                    className={`flex items-start gap-2.5 rounded-2xl border p-3 text-left transition ${
                      cycleType === "salary_day"
                        ? "border-finora-600 bg-finora-50/40 ring-1 ring-finora-600/40"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                        cycleType === "salary_day"
                          ? "border-finora-600 bg-finora-600 text-white"
                          : "border-slate-300"
                      }`}
                    >
                      {cycleType === "salary_day" && <Check size={10} />}
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-900">
                        Paycheck Day
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Rolls on the day salary arrives (e.g. 5th, 25th)
                      </span>
                    </div>
                  </button>
                </div>

                {cycleType === "salary_day" && (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                    <label
                      htmlFor="salary-day-input"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Day of month salary is credited (1–31):
                    </label>
                    <div className="mt-1.5 flex items-center gap-2">
                      <input
                        id="salary-day-input"
                        type="number"
                        min="1"
                        max="31"
                        value={salaryDay}
                        onChange={(e) => setSalaryDay(Number(e.target.value))}
                        className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 focus:border-finora-600 focus:outline-none"
                      />
                      <span className="text-xs text-slate-500">
                        Cycle runs from day {salaryDay} to day {salaryDay - 1 || 31}{" "}
                        next month
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Fixed Commitments / EMIs Toggle */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-100 text-finora-800">
                    <CreditCard size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Add Fixed Dues or EMIs (Optional)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Rent, loan installments, insurance, tuition, or wifi
                    </span>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCommitments}
                    onChange={(e) => setHasCommitments(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-finora-600"></div>
                </label>
              </div>

              {hasCommitments && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  {commitments.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">
                          Commitment #{idx + 1}
                        </span>
                        {commitments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCommitmentRow(idx)}
                            className="text-slate-400 hover:text-red-600 p-1 transition"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Title
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Apartment Rent, Car EMI"
                            value={item.title}
                            onChange={(e) =>
                              handleUpdateCommitment(idx, "title", e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-finora-600 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Amount (₹)
                          </label>
                          <input
                            type="number"
                            min="1"
                            step="any"
                            placeholder="e.g. 15,000"
                            value={item.amount}
                            onChange={(e) =>
                              handleUpdateCommitment(idx, "amount", e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-finora-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Category
                          </label>
                          <select
                            value={item.category}
                            onChange={(e) =>
                              handleUpdateCommitment(idx, "category", e.target.value)
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-finora-600 focus:outline-none"
                          >
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            Type
                          </label>
                          <select
                            value={item.commitmentType}
                            onChange={(e) =>
                              handleUpdateCommitment(
                                idx,
                                "commitmentType",
                                e.target.value
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-finora-600 focus:outline-none"
                          >
                            <option value="recurring">
                              Recurring (Ongoing)
                            </option>
                            <option value="installment">
                              EMI (Fixed Tenure)
                            </option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500">
                            {item.commitmentType === "installment"
                              ? "Tenure (Months)"
                              : "Due Day"}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.commitmentType === "installment" ? 360 : 31}
                            value={
                              item.commitmentType === "installment"
                                ? item.remainingInstallments
                                : item.dueDay
                            }
                            onChange={(e) =>
                              handleUpdateCommitment(
                                idx,
                                item.commitmentType === "installment"
                                  ? "remainingInstallments"
                                  : "dueDay",
                                e.target.value
                              )
                            }
                            className="mt-1 w-full rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-900 focus:border-finora-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddCommitmentRow}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-finora-700 hover:bg-finora-50 hover:border-finora-400 transition"
                  >
                    <Plus size={13} />
                    <span>Add Another Commitment</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSkip}
                className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-slate-800 py-2.5 px-4 rounded-xl hover:bg-slate-100 transition"
              >
                Skip for now, I&apos;ll do this later
              </button>

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-finora-900 to-finora-950 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:from-finora-800 hover:to-finora-900 disabled:opacity-50 transition"
              >
                {saving ? (
                  <span>Saving your profile...</span>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Save &amp; Start Tracking</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
