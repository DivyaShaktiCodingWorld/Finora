import { useState } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { formatCurrency } from "../../lib/expenseConstants";

export default function UpcomingDuesWidget({
  checklist = [],
  onToggleFixedExpense,
  onOpenManageModal,
}) {
  const [togglingId, setTogglingId] = useState(null);

  const pendingDues = checklist.filter((item) => !item.isPaid);
  const paidDues = checklist.filter((item) => item.isPaid);

  const handleToggle = async (id, currentPaidStatus) => {
    if (togglingId) return;
    setTogglingId(id);
    try {
      await onToggleFixedExpense(id, !currentPaidStatus);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-finora-50 text-finora-800">
            <CreditCard size={17} />
          </div>
          <div>
            <h4 className="font-display text-sm font-bold text-slate-900">
              Monthly Fixed Dues
            </h4>
            <p className="text-[11px] text-slate-500">
              {pendingDues.length} pending • {paidDues.length} paid
            </p>
          </div>
        </div>

        <Link
          to="/budget"
          className="text-xs font-bold text-finora-800 hover:underline flex items-center gap-0.5"
          title="Open Budget Planner"
        >
          <span>All Dues</span>
          <ArrowUpRight size={13} />
        </Link>
      </div>

      {/* Dues List */}
      {checklist.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
          <p className="text-xs text-slate-500">
            No fixed dues configured yet (House Rent, School Fees, EMIs).
          </p>
          <button
            type="button"
            onClick={onOpenManageModal}
            className="mt-2 text-xs font-bold text-finora-800 hover:underline"
          >
            + Set Up Fixed Dues
          </button>
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {checklist.map((item) => {
            const isInstallment =
              item.commitmentType === "installment" ||
              (item.totalInstallments !== null &&
                item.totalInstallments !== undefined);

            return (
              <div
                key={item._id}
                className={`flex items-center justify-between rounded-xl border p-2.5 transition ${
                  item.isPaid
                    ? "border-emerald-100 bg-emerald-50/20"
                    : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Quick Toggle Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleToggle(item._id, item.isPaid)}
                    disabled={togglingId === item._id}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                      item.isPaid
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-slate-300 bg-white text-transparent hover:border-slate-400"
                    }`}
                    title={item.isPaid ? "Mark as pending" : "Mark as paid"}
                  >
                    <Check size={14} className={item.isPaid ? "opacity-100" : "opacity-0"} />
                  </button>

                  <div className="min-w-0">
                    <span
                      className={`block truncate text-xs font-bold transition ${
                        item.isPaid
                          ? "text-emerald-800 line-through decoration-emerald-600 decoration-2 opacity-75"
                          : "text-slate-900"
                      }`}
                    >
                      {item.title}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      Due: {item.dueDay}th • {isInstallment ? `EMI (${item.remainingInstallments ?? item.totalInstallments} left)` : "Recurring"}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="font-display text-xs font-bold text-slate-900">
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

      {/* Footer Link */}
      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-[11px]">
        <span className="text-slate-500">Need to add new dues?</span>
        <button
          type="button"
          onClick={onOpenManageModal}
          className="font-bold text-finora-800 hover:underline"
        >
          + Add Commitment
        </button>
      </div>
    </div>
  );
}
