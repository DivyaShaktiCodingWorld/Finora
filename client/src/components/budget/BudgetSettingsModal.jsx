import { useState, useEffect } from "react";
import {
  X,
  Wallet,
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Home,
  GraduationCap,
  Sparkles,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  EXPENSE_CATEGORIES,
  formatCurrency,
  getCategoryConfig,
} from "../../lib/expenseConstants";
import budgetService from "../../services/budgetService";

export default function BudgetSettingsModal({
  isOpen,
  onClose,
  budgetData,
  onSettingsSaved,
  onNotify,
  initialTab = "salary",
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // "salary" | "emis"

  // Settings State
  const [monthlySalary, setMonthlySalary] = useState("");
  const [cycleType, setCycleType] = useState("calendar_month");
  const [salaryDay, setSalaryDay] = useState(1);
  const [savingSettings, setSavingSettings] = useState(false);

  // Fixed Expenses State
  const [fixedExpenses, setFixedExpenses] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // New/Edit Fixed Expense Form
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState("Bills");
  const [formDueDay, setFormDueDay] = useState(1);
  const [formCommitmentType, setFormCommitmentType] = useState("recurring"); // "recurring" | "installment"
  const [formInstallments, setFormInstallments] = useState(12);
  const [formNotes, setFormNotes] = useState("");
  const [savingFixedExpense, setSavingFixedExpense] = useState(false);

  // Populate form with existing settings
  useEffect(() => {
    if (budgetData?.salary) {
      setMonthlySalary(String(budgetData.salary.amount || ""));
      setCycleType(budgetData.salary.cycleType || "calendar_month");
      setSalaryDay(budgetData.salary.salaryDay || 1);
    }
  }, [budgetData]);

  // Sync initial tab when changed
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load fixed expenses list when modal opens
  const fetchFixedExpenses = async () => {
    setLoadingList(true);
    try {
      const data = await budgetService.getFixedExpenses();
      if (data.success) {
        setFixedExpenses(data.fixedExpenses);
      }
    } catch (err) {
      console.error("Failed to load fixed commitments:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFixedExpenses();
    }
  }, [isOpen]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const salaryNum = parseFloat(monthlySalary);
    if (isNaN(salaryNum) || salaryNum < 0) {
      onNotify?.("error", "Please provide a valid salary amount.");
      return;
    }

    setSavingSettings(true);
    try {
      const response = await budgetService.updateBudgetSettings({
        monthlySalary: salaryNum,
        cycleType,
        salaryDay: cycleType === "salary_day" ? parseInt(salaryDay, 10) : 1,
      });

      if (response.success) {
        onNotify?.("success", "Budget settings saved successfully.");
        onSettingsSaved?.();
      }
    } catch (err) {
      onNotify?.(
        "error",
        err.response?.data?.message || "Failed to update budget settings."
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const resetForm = () => {
    setFormTitle("");
    setFormAmount("");
    setFormCategory("Bills");
    setFormDueDay(1);
    setFormCommitmentType("recurring");
    setFormInstallments(12);
    setFormNotes("");
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleApplyPreset = (preset) => {
    setFormTitle(preset.title);
    setFormCategory(preset.category);
    setFormCommitmentType(preset.type);
    if (preset.type === "installment") {
      setFormInstallments(preset.installments || 12);
    }
  };

  const handleEditClick = (exp) => {
    setEditingId(exp._id);
    setFormTitle(exp.title);
    setFormAmount(String(exp.amount));
    setFormCategory(exp.category);
    setFormDueDay(exp.dueDay || 1);
    const isInst =
      exp.commitmentType === "installment" ||
      (exp.totalInstallments !== null && exp.totalInstallments !== undefined);
    setFormCommitmentType(isInst ? "installment" : "recurring");
    setFormInstallments(
      exp.remainingInstallments || exp.totalInstallments || 12
    );
    setFormNotes(exp.notes || "");
    setIsAddingNew(true);
  };

  const handleSaveFixedExpense = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      onNotify?.("error", "Please enter a title for the commitment.");
      return;
    }

    const amt = parseFloat(formAmount);
    if (isNaN(amt) || amt <= 0) {
      onNotify?.("error", "Amount must be greater than 0.");
      return;
    }

    setSavingFixedExpense(true);

    const isInstallment = formCommitmentType === "installment";
    const payload = {
      title: formTitle.trim(),
      amount: amt,
      category: formCategory,
      dueDay: parseInt(formDueDay, 10) || 1,
      commitmentType: formCommitmentType,
      totalInstallments: isInstallment ? parseInt(formInstallments, 10) : null,
      remainingInstallments: isInstallment
        ? parseInt(formInstallments, 10)
        : null,
      notes: formNotes.trim(),
    };

    try {
      if (editingId) {
        await budgetService.updateFixedExpense(editingId, payload);
        onNotify?.("success", `Updated "${formTitle}" successfully.`);
      } else {
        await budgetService.createFixedExpense(payload);
        onNotify?.("success", `Added "${formTitle}" to fixed commitments.`);
      }

      resetForm();
      fetchFixedExpenses();
      onSettingsSaved?.();
    } catch (err) {
      onNotify?.(
        "error",
        err.response?.data?.message || "Failed to save fixed commitment."
      );
    } finally {
      setSavingFixedExpense(false);
    }
  };

  const handleDeleteFixedExpense = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      await budgetService.deleteFixedExpense(id);
      onNotify?.("success", `Deleted "${title}".`);
      fetchFixedExpenses();
      onSettingsSaved?.();
    } catch (err) {
      onNotify?.(
        "error",
        err.response?.data?.message || "Failed to delete commitment."
      );
    }
  };

  if (!isOpen) return null;

  const activeCommitments = fixedExpenses.filter((e) => !e.isCompleted);
  const completedCommitments = fixedExpenses.filter((e) => e.isCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
      />

      {/* Modal Dialog */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-finora-100 text-finora-800">
              <Wallet size={20} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Budget & Fixed Commitments Manager
              </h3>
              <p className="text-xs text-slate-500">
                Configure monthly salary, paycheck cycle, and fixed dues (Rent, School Fees, EMIs)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 px-6 pt-2 bg-slate-50/30 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("salary")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "salary"
                ? "border-finora-800 text-finora-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Wallet size={16} />
            <span>Salary & Paycheck Cycle</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("emis")}
            className={`flex items-center gap-2 border-b-2 pb-3 text-xs sm:text-sm font-bold transition ${
              activeTab === "emis"
                ? "border-finora-800 text-finora-950"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <CreditCard size={16} />
            <span>Fixed Dues & EMIs ({activeCommitments.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "salary" ? (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Salary Amount Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Monthly Salary / Base Budget ($ or ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="e.g. 50000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-4 py-2.5 text-base font-bold text-slate-900 focus:border-finora-600 focus:outline-none focus:ring-1 focus:ring-finora-600"
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  This serves as your total incoming budget pool for calculating safe spend allowances and net monthly savings.
                </p>
              </div>

              {/* Cycle Type Options */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Budget & Paycheck Cycle Mode
                </label>

                {/* Option 1: Calendar Month */}
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    cycleType === "calendar_month"
                      ? "border-finora-600 bg-finora-50/40 ring-1 ring-finora-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cycleType"
                    value="calendar_month"
                    checked={cycleType === "calendar_month"}
                    onChange={() => setCycleType("calendar_month")}
                    className="mt-0.5 text-finora-700 focus:ring-finora-600"
                  />
                  <div>
                    <span className="block font-bold text-xs sm:text-sm text-slate-900">
                      Standard Calendar Month (1st to Month-End)
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Best if you prefer budgeting by full calendar months (Jan, Feb, Mar, etc.).
                    </span>
                  </div>
                </label>

                {/* Option 2: Paycheck Credit Day */}
                <label
                  className={`flex items-start gap-3 rounded-2xl border p-4 cursor-pointer transition ${
                    cycleType === "salary_day"
                      ? "border-finora-600 bg-finora-50/40 ring-1 ring-finora-600"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="cycleType"
                    value="salary_day"
                    checked={cycleType === "salary_day"}
                    onChange={() => setCycleType("salary_day")}
                    className="mt-0.5 text-finora-700 focus:ring-finora-600"
                  />
                  <div>
                    <span className="block font-bold text-xs sm:text-sm text-slate-900">
                      Salary Credit Day Cycle (Rolling Paycheck Window)
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">
                      Tracks from the exact day your salary hits your bank account until the day before the next salary.
                    </span>
                  </div>
                </label>
              </div>

              {/* Salary Day Selector */}
              {cycleType === "salary_day" && (
                <div className="rounded-2xl border border-finora-200 bg-finora-50/40 p-4 space-y-2">
                  <label className="block text-xs font-bold text-finora-950">
                    On which day of the month is your salary credited?
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <select
                      value={salaryDay}
                      onChange={(e) => setSalaryDay(Number(e.target.value))}
                      className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-900 focus:border-finora-600 focus:outline-none"
                    >
                      {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <option key={day} value={day}>
                          {day}
                          {day === 1
                            ? "st"
                            : day === 2
                            ? "nd"
                            : day === 3
                            ? "rd"
                            : "th"}{" "}
                          of every month
                        </option>
                      ))}
                    </select>

                    <span className="text-xs text-slate-600">
                      Cycle runs from {salaryDay}th of this month to {salaryDay - 1 || 30}th of next month.
                    </span>
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-finora-800 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-finora-700 transition disabled:opacity-50"
                >
                  {savingSettings ? "Saving Settings..." : "Save Budget & Cycle Settings"}
                </button>
              </div>
            </form>
          ) : (
            /* Tab 2: Fixed Commitments & EMIs */
            <div className="space-y-5">
              {/* Add New Trigger */}
              {!isAddingNew ? (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setIsAddingNew(true);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs sm:text-sm font-bold text-slate-700 hover:border-finora-300 hover:bg-finora-50/60 hover:text-finora-800 transition"
                >
                  <Plus size={16} />
                  <span>+ Add Fixed Commitment (House Rent, School Fees, Bike/TV EMI, Loans)</span>
                </button>
              ) : (
                /* Add / Edit Form */
                <form
                  onSubmit={handleSaveFixedExpense}
                  className="rounded-2xl border border-finora-200 bg-finora-50/30 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-finora-100 pb-2">
                    <h4 className="font-display text-sm font-bold text-slate-900">
                      {editingId ? "Edit Commitment" : "Add Fixed Commitment"}
                    </h4>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  {!editingId && (
                    <div>
                      <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                        Quick Presets:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyPreset({
                              title: "House Rent",
                              category: "Housing & Rent",
                              type: "recurring",
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-finora-400 hover:bg-finora-50"
                        >
                          <Home size={13} className="text-emerald-600" />
                          House Rent
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyPreset({
                              title: "Kid's School Fees",
                              category: "Education",
                              type: "recurring",
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-finora-400 hover:bg-finora-50"
                        >
                          <GraduationCap size={13} className="text-blue-600" />
                          Kid's School Fees
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyPreset({
                              title: "Bike / Vehicle EMI",
                              category: "Transportation",
                              type: "installment",
                              installments: 12,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-finora-400 hover:bg-finora-50"
                        >
                          <CreditCard size={13} className="text-purple-600" />
                          Bike / Car EMI
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleApplyPreset({
                              title: "TV / Appliance EMI",
                              category: "Shopping",
                              type: "installment",
                              installments: 6,
                            })
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-finora-400 hover:bg-finora-50"
                        >
                          <Sparkles size={13} className="text-amber-600" />
                          TV / Appliance EMI
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Commitment Type Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <label
                      className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                        formCommitmentType === "recurring"
                          ? "border-finora-600 bg-white ring-1 ring-finora-600"
                          : "border-slate-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="formCommitmentType"
                        value="recurring"
                        checked={formCommitmentType === "recurring"}
                        onChange={() => setFormCommitmentType("recurring")}
                        className="mt-0.5 text-finora-700"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          Ongoing Regular Commitment
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          House Rent, Kid School Fees, Wi-Fi, Society Maintenance (No countdown)
                        </span>
                      </div>
                    </label>

                    <label
                      className={`flex items-start gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                        formCommitmentType === "installment"
                          ? "border-finora-600 bg-white ring-1 ring-finora-600"
                          : "border-slate-200 bg-white/60 hover:bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="formCommitmentType"
                        value="installment"
                        checked={formCommitmentType === "installment"}
                        onChange={() => setFormCommitmentType("installment")}
                        className="mt-0.5 text-finora-700"
                      />
                      <div>
                        <span className="block text-xs font-bold text-slate-900">
                          Loan / EMI Installment
                        </span>
                        <span className="block text-[11px] text-slate-500">
                          TV EMI, Bike EMI, Loans (Counts down installments to completion!)
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Title / Obligation Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. House Rent, Kid School Fees, Bike EMI"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-finora-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Monthly Amount ($ or ₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="e.g. 15000"
                        value={formAmount}
                        onChange={(e) => setFormAmount(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-finora-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Category
                      </label>
                      <select
                        value={formCategory}
                        onChange={(e) => setFormCategory(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-finora-600"
                      >
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Due Day of Month (1 - 31)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formDueDay}
                        onChange={(e) => setFormDueDay(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-finora-600"
                        required
                      />
                    </div>
                  </div>

                  {/* Installments field (Only if type === "installment") */}
                  {formCommitmentType === "installment" && (
                    <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 space-y-1.5">
                      <div className="flex items-center gap-3">
                        <label className="text-xs font-bold text-purple-950">
                          Remaining Installments (Months):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="360"
                          value={formInstallments}
                          onChange={(e) => setFormInstallments(e.target.value)}
                          className="w-24 rounded-lg border border-purple-200 bg-white px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Counts down each time you mark it as paid in a monthly cycle. Upon reaching 0, it auto-completes and celebrates!
                      </p>
                    </div>
                  )}

                  {/* Recurring field info note */}
                  {formCommitmentType === "recurring" && (
                    <div className="flex items-center gap-2 rounded-xl bg-slate-100/80 px-3 py-2 text-xs text-slate-600">
                      <Info size={14} className="text-slate-400 shrink-0" />
                      <span>This commitment repeats every month indefinitely without expiration.</span>
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Notes (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Landlord account, Term 1 School Fees, Loan account #"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingFixedExpense}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-finora-800 px-4 py-2 text-xs font-bold text-white hover:bg-finora-700 transition disabled:opacity-50"
                    >
                      {savingFixedExpense ? "Saving..." : editingId ? "Update Commitment" : "Save Commitment"}
                    </button>
                  </div>
                </form>
              )}

              {/* Commitments List */}
              <div className="space-y-3">
                <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
                  Active Fixed Dues ({activeCommitments.length})
                </h4>

                {loadingList ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Loading commitments...
                  </div>
                ) : activeCommitments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center text-xs text-slate-500">
                    No active fixed commitments found. Add House Rent, Kid's School Fees, or EMIs above!
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeCommitments.map((exp) => {
                      const catConfig = getCategoryConfig(exp.category);
                      const isInstallment =
                        exp.commitmentType === "installment" ||
                        (exp.totalInstallments !== null && exp.totalInstallments !== undefined);

                      return (
                        <div
                          key={exp._id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 text-xs">
                              {catConfig.icon ? <catConfig.icon size={16} /> : <CreditCard size={16} />}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-slate-900">
                                  {exp.title}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    isInstallment
                                      ? "bg-purple-50 text-purple-700 border border-purple-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {isInstallment
                                    ? `EMI (${exp.remainingInstallments ?? exp.totalInstallments} left)`
                                    : "Recurring"}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                <span>Due: {exp.dueDay}th of month</span>
                                <span>•</span>
                                <span>{exp.category}</span>
                                {exp.notes && (
                                  <>
                                    <span>•</span>
                                    <span className="italic max-w-[150px] truncate">{exp.notes}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-display text-sm font-bold text-slate-900">
                              {formatCurrency(exp.amount)}
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleEditClick(exp)}
                                className="p-1.5 text-slate-400 hover:text-finora-800 transition"
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteFixedExpense(exp._id, exp.title)
                                }
                                className="p-1.5 text-slate-400 hover:text-red-600 transition"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Completed EMIs Section */}
              {completedCommitments.length > 0 && (
                <div className="pt-2 space-y-2">
                  <h4 className="font-display text-xs font-bold uppercase tracking-wider text-slate-400">
                    Completed Loans & EMIs ({completedCommitments.length})
                  </h4>

                  <div className="space-y-1.5 opacity-75">
                    {completedCommitments.map((exp) => (
                      <div
                        key={exp._id}
                        className="flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-600" />
                          <span className="font-medium text-slate-700 line-through">
                            {exp.title}
                          </span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Fully Paid Off
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-600">
                            {formatCurrency(exp.amount)}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteFixedExpense(exp._id, exp.title)
                            }
                            className="p-1 text-slate-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
