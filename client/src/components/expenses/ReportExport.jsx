
import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Filter,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

import reportService from "../../services/reportService";
import { downloadBlob, getBlobErrorMessage } from "../../lib/downloadFile";

const toSlug = (text) =>
  String(text || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ReportExport({
  activeDateRange,
  search,
  category,
  sortBy,
  recordCount,
  loading,
  onNotify,
}) {
  const [downloading, setDownloading] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  const periodLabel = activeDateRange?.detailLabel || "All Time";
  const isEmpty = !loading && recordCount === 0;
  const isBusy = downloading !== null || emailSending;

  const activeFilters = [];

  if (category && category !== "all") {
    activeFilters.push(category);
  }

  if (search && search.trim()) {
    activeFilters.push(`"${search.trim()}"`);
  }

  const getReportParams = () => {
    const params = {};

    if (category && category !== "all") {
      params.category = category;
    }

    if (search && search.trim()) {
      params.search = search.trim();
    }

    if (sortBy) {
      params.sortBy = sortBy;
    }

    if (activeDateRange?.startDate) {
      params.startDate = activeDateRange.startDate;
    }

    if (activeDateRange?.endDate) {
      params.endDate = activeDateRange.endDate;
    }

    params.periodName = periodLabel;

    return params;
  };

  const handleDownload = async (format) => {
    if (isBusy || isEmpty || loading) return;

    setDownloading(format);

    try {
      const blob = await reportService.downloadReport(
        format,
        getReportParams()
      );

      const today = new Date().toISOString().split("T")[0];

      const fileName =
        `finora-expense-report_${toSlug(periodLabel)}_${today}.${format}`;

      downloadBlob(blob, fileName);

      onNotify?.(
        "success",
        `${format.toUpperCase()} report downloaded successfully.`
      );
    } catch (err) {
      const message = await getBlobErrorMessage(
        err,
        `Unable to generate the ${format.toUpperCase()} report. Please try again.`
      );

      onNotify?.("error", message);
    } finally {
      setDownloading(null);
    }
  };

  const handleEmailReport = async () => {
    if (isBusy || isEmpty || loading) return;

    setEmailSending(true);
    setEmailStatus(null);

    try {
      const result = await reportService.emailPdfReport(
        getReportParams()
      );

      if (!result?.success) {
        throw new Error(
          result?.message || "The email could not be sent."
        );
      }

      setEmailStatus({
        type: "success",
        title: "Report sent successfully!",
        message:
          result.message ||
          "Your Finora PDF expense report has been sent to your registered email address.",
      });
    } catch (err) {
      setEmailStatus({
        type: "error",
        title: "Unable to send report",
        message:
          err.response?.data?.message ||
          err.message ||
          "Something went wrong while sending your report. Please try again.",
      });
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        {/* Report information */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-finora-50 text-finora-700">
            <Download size={19} />
          </div>

          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-slate-900">
              Download Report
            </h3>

            <p className="mt-0.5 text-xs leading-5 text-slate-500">
              {isEmpty ? (
                "No transactions to export for the selected filters."
              ) : (
                <>
                  Detailed report of{" "}
                  <span className="font-semibold text-slate-700">
                    {loading ? "your" : recordCount} transaction
                    {recordCount === 1 ? "" : "s"}
                  </span>{" "}
                  for{" "}
                  <span className="font-semibold text-slate-700">
                    {periodLabel}
                  </span>
                  , with summary, category and payment breakdowns.
                </>
              )}
            </p>

            {activeFilters.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <Filter size={12} className="text-finora-600" />

                {activeFilters.map((item) => (
                  <span
                    key={item}
                    className="max-w-[220px] truncate rounded-full border border-finora-100 bg-finora-50 px-2.5 py-0.5 text-[11px] font-semibold text-finora-700"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-2 lg:flex lg:shrink-0">

          <button
            type="button"
            onClick={() => handleDownload("pdf")}
            disabled={isBusy || isEmpty || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-finora-800 px-4 py-2.5 text-xs font-bold text-white shadow-sm shadow-finora-900/10 transition hover:bg-finora-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {downloading === "pdf" ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <FileText size={16} />
            )}

            {downloading === "pdf"
              ? "Preparing PDF..."
              : "Download PDF"}
          </button>

          <button
            type="button"
            onClick={() => handleDownload("csv")}
            disabled={isBusy || isEmpty || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-finora-200 hover:bg-finora-50 hover:text-finora-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {downloading === "csv" ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={16} />
            )}

            {downloading === "csv"
              ? "Preparing CSV..."
              : "Download CSV"}
          </button>

          <button
            type="button"
            onClick={handleEmailReport}
            disabled={isBusy || isEmpty || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-finora-200 bg-finora-50 px-4 py-2.5 text-xs font-bold text-finora-800 shadow-sm transition hover:border-finora-300 hover:bg-finora-100 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
          >
            {emailSending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Mail size={16} />
            )}

            {emailSending ? "Sending report..." : "Send PDF to Email"}
          </button>
        </div>
      </div>

      {/* Email success/error notification */}
      {emailStatus && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 flex items-start gap-3 rounded-2xl border p-4 shadow-sm sm:p-5 ${
            emailStatus.type === "success"
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-200 bg-red-50"
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              emailStatus.type === "success"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {emailStatus.type === "success" ? (
              <CheckCircle2 size={22} />
            ) : (
              <AlertCircle size={22} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4
              className={`text-sm font-bold ${
                emailStatus.type === "success"
                  ? "text-emerald-900"
                  : "text-red-900"
              }`}
            >
              {emailStatus.title}
            </h4>

            <p
              className={`mt-1 break-words text-xs leading-5 sm:text-sm ${
                emailStatus.type === "success"
                  ? "text-emerald-800"
                  : "text-red-800"
              }`}
            >
              {emailStatus.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setEmailStatus(null)}
            aria-label="Dismiss notification"
            className="shrink-0 rounded-lg p-1 text-slate-500 transition hover:bg-white/70 hover:text-slate-900"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
