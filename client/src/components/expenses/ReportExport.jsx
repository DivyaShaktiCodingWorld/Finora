import { useState } from "react";
import {
  FileText,
  FileSpreadsheet,
  Download,
  RefreshCw,
  Filter,
} from "lucide-react";

import reportService from "../../services/reportService";
import { downloadBlob, getBlobErrorMessage } from "../../lib/downloadFile";

// Converts text like "Last 7 Days" into "last-7-days" for file names
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
  const [downloading, setDownloading] = useState(null); // "pdf" | "csv" | null

  const periodLabel = activeDateRange?.detailLabel || "All Time";
  const isEmpty = !loading && recordCount === 0;
  const isBusy = downloading !== null;

  // Small chips that show what the report will contain
  const activeFilters = [];
  if (category && category !== "all") activeFilters.push(category);
  if (search && search.trim()) activeFilters.push(`"${search.trim()}"`);

  const handleDownload = async (format) => {
    if (isBusy || isEmpty) return;

    setDownloading(format);

    try {
      const params = {};
      if (category && category !== "all") params.category = category;
      if (search && search.trim()) params.search = search.trim();
      if (sortBy) params.sortBy = sortBy;
      if (activeDateRange?.startDate) params.startDate = activeDateRange.startDate;
      if (activeDateRange?.endDate) params.endDate = activeDateRange.endDate;
      params.periodName = periodLabel;

      const blob = await reportService.downloadReport(format, params);

      const today = new Date().toISOString().split("T")[0];
      const fileName = `finora-expense-report_${toSlug(periodLabel)}_${today}.${format}`;

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

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: title and description */}
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

        {/* Right: action buttons */}
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
            {downloading === "pdf" ? "Preparing PDF..." : "Download PDF"}
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
            {downloading === "csv" ? "Preparing CSV..." : "Download CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}