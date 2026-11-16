import {
  Utensils,
  Car,
  Home,
  Zap,
  Film,
  ShoppingBag,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Plane,
  TrendingUp,
  Receipt,
  MoreHorizontal,
} from "lucide-react";

export const EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Housing & Rent",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Healthcare",
  "Education",
  "Personal Care",
  "Travel",
  "Investments",
  "Bills",
  "Other",
];

export const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "UPI / Net Banking",
  "Bank Transfer",
  "Other",
];

export const CATEGORY_COLORS = {
  "Food & Dining": "#f59e0b",
  Transportation: "#0284c7",
  "Housing & Rent": "#6366f1",
  Utilities: "#eab308",
  Entertainment: "#a855f7",
  Shopping: "#ec4899",
  Healthcare: "#f43f5e",
  Education: "#06b6d4",
  "Personal Care": "#14b8a6",
  Travel: "#10b981",
  Investments: "#059669",
  Bills: "#8b5cf6",
  Other: "#64748b",
};

export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || "#64748b";
}

export const CATEGORY_CONFIG = {
  "Food & Dining": {
    icon: Utensils,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeBg: "bg-amber-100/70",
    hex: "#f59e0b",
  },
  Transportation: {
    icon: Car,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200",
    badgeBg: "bg-sky-100/70",
    hex: "#0284c7",
  },
  "Housing & Rent": {
    icon: Home,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badgeBg: "bg-indigo-100/70",
    hex: "#6366f1",
  },
  Utilities: {
    icon: Zap,
    color: "text-yellow-700",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badgeBg: "bg-yellow-100/70",
    hex: "#eab308",
  },
  Entertainment: {
    icon: Film,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    badgeBg: "bg-purple-100/70",
    hex: "#a855f7",
  },
  Shopping: {
    icon: ShoppingBag,
    color: "text-pink-700",
    bg: "bg-pink-50",
    border: "border-pink-200",
    badgeBg: "bg-pink-100/70",
    hex: "#ec4899",
  },
  Healthcare: {
    icon: HeartPulse,
    color: "text-rose-700",
    bg: "bg-rose-50",
    border: "border-rose-200",
    badgeBg: "bg-rose-100/70",
    hex: "#f43f5e",
  },
  Education: {
    icon: GraduationCap,
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    badgeBg: "bg-cyan-100/70",
    hex: "#06b6d4",
  },
  "Personal Care": {
    icon: Sparkles,
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    badgeBg: "bg-teal-100/70",
    hex: "#14b8a6",
  },
  Travel: {
    icon: Plane,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100/70",
    hex: "#10b981",
  },
  Investments: {
    icon: TrendingUp,
    color: "text-emerald-800",
    bg: "bg-emerald-100/80",
    border: "border-emerald-300",
    badgeBg: "bg-emerald-200/70",
    hex: "#059669",
  },
  Bills: {
    icon: Receipt,
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    badgeBg: "bg-violet-100/70",
    hex: "#8b5cf6",
  },
  Other: {
    icon: MoreHorizontal,
    color: "text-slate-700",
    bg: "bg-slate-100",
    border: "border-slate-200",
    badgeBg: "bg-slate-200/70",
    hex: "#64748b",
  },
};

export function getCategoryConfig(category) {
  return (
    CATEGORY_CONFIG[category] || {
      icon: MoreHorizontal,
      color: "text-slate-700",
      bg: "bg-slate-100",
      border: "border-slate-200",
      badgeBg: "bg-slate-200/70",
    }
  );
}

export function formatCurrency(amount) {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatExpenseDate(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function toInputDateFormat(dateInput) {
  if (!dateInput) return new Date().toISOString().split("T")[0];
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return new Date().toISOString().split("T")[0];
  return d.toISOString().split("T")[0];
}

export const PERIOD_PRESETS = [
  { id: "this_month", label: "This Month" },
  { id: "last_month", label: "Last Month" },
  { id: "last_7_days", label: "Last 7 Days" },
  { id: "this_year", label: "This Year" },
  { id: "all_time", label: "All Time" },
  { id: "month_picker", label: "Select Month" },
  { id: "custom", label: "Custom Dates" },
];

export function calculateDateRange(preset, options = {}) {
  const now = new Date();

  if (preset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDate: toInputDateFormat(start),
      endDate: toInputDateFormat(end),
      label: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      detailLabel: "This Month",
    };
  }

  if (preset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return {
      startDate: toInputDateFormat(start),
      endDate: toInputDateFormat(end),
      label: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      detailLabel: "Last Month",
    };
  }

  if (preset === "last_7_days") {
    const start = new Date();
    start.setDate(now.getDate() - 6);
    return {
      startDate: toInputDateFormat(start),
      endDate: toInputDateFormat(now),
      label: "Last 7 Days",
      detailLabel: "Past 7 Days",
    };
  }

  if (preset === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return {
      startDate: toInputDateFormat(start),
      endDate: toInputDateFormat(end),
      label: `${now.getFullYear()}`,
      detailLabel: `Full Year ${now.getFullYear()}`,
    };
  }

  if (preset === "month_picker") {
    const y = options.year ?? now.getFullYear();
    const m = options.month ?? now.getMonth();
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0);
    return {
      startDate: toInputDateFormat(start),
      endDate: toInputDateFormat(end),
      label: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      detailLabel: start.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    };
  }

  if (preset === "custom") {
    return {
      startDate: options.startDate || null,
      endDate: options.endDate || null,
      label: "Custom",
      detailLabel:
        options.startDate && options.endDate
          ? `${formatExpenseDate(options.startDate)} – ${formatExpenseDate(options.endDate)}`
          : "Custom Date Range",
    };
  }

  // Default: All Time
  return {
    startDate: null,
    endDate: null,
    label: "All Time",
    detailLabel: "All Time",
  };
}
