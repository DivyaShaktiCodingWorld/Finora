
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const alertStyles = {
  error: {
    className: "border-red-200 bg-red-50 text-red-700",
    Icon: AlertCircle,
  },
  success: {
    className: "border-finora-200 bg-finora-50 text-finora-800",
    Icon: CheckCircle2,
  },
  info: {
    className: "border-blue-200 bg-blue-50 text-blue-700",
    Icon: Info,
  },
};

export default function Alert({ type = "error", message }) {
  if (!message) return null;

  const config = alertStyles[type] || alertStyles.error;
  const Icon = config.Icon;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-3.5 text-sm ${config.className}`}
    >
      <Icon size={19} className="mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
