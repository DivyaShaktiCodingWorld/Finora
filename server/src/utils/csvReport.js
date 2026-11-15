import { formatGeneratedAt, formatWeekday } from "./reportData.js";

const BOM = "\uFEFF";
const EOL = "\r\n";

// Escapes one CSV cell.
// Text that starts with = + - @ is prefixed with an apostrophe so that
// Excel / Google Sheets never run it as a formula (CSV injection protection).
const csvCell = (value) => {
  if (value === null || value === undefined) return "";

  let text = String(value);

  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
};

const csvRow = (cells) => cells.map(csvCell).join(",");

const isoDate = (date) => date.toISOString().slice(0, 10);

const isoDateTime = (date) =>
  date ? date.toISOString().slice(0, 16).replace("T", " ") : "";

const money = (amount) => Number(amount || 0).toFixed(2);

export const buildCsvReport = (data) => {
  const { summary, period, filters, user } = data;
  const lines = [];

  const addRow = (...cells) => lines.push(csvRow(cells));
  const addBlank = () => lines.push("");

  // Report information
  addRow("FINORA EXPENSE REPORT");
  addRow("Generated On", formatGeneratedAt(data.generatedAt));
  addRow("Account Name", user.name);
  addRow("Account Email", user.email);
  addRow("Period", period.name);
  addRow("Date Range", period.dateRangeText);
  addRow("Category Filter", filters.category);
  addRow("Search Filter", filters.search);
  addRow("Sorted By", filters.sortLabel);
  addRow("Currency", data.currency);
  addBlank();

  // Summary
  addRow("SUMMARY");
  addRow("Metric", "Value", "Details");
  addRow("Total Spent", money(summary.total), "");
  addRow("Total Transactions", summary.count, "");
  addRow("Average per Transaction", money(summary.average), "");
  addRow(
    "Daily Average",
    money(summary.dailyAverage),
    period.days > 0 ? `Calculated over ${period.days} day(s)` : ""
  );
  addRow("Days With Spending", summary.activeDays, "");
  addRow(
    "Highest Expense",
    summary.highest ? money(summary.highest.amount) : "",
    summary.highest ? summary.highest.title : ""
  );
  addRow(
    "Lowest Expense",
    summary.lowest ? money(summary.lowest.amount) : "",
    summary.lowest ? summary.lowest.title : ""
  );
  addRow(
    "Top Category",
    summary.topCategory ? money(summary.topCategory.total) : "",
    summary.topCategory
      ? `${summary.topCategory.name} (${summary.topCategory.percent.toFixed(1)}%)`
      : ""
  );
  addRow(
    "Top Payment Method",
    summary.topPaymentMethod ? money(summary.topPaymentMethod.total) : "",
    summary.topPaymentMethod
      ? `${summary.topPaymentMethod.name} (${summary.topPaymentMethod.percent.toFixed(1)}%)`
      : ""
  );
  addRow(
    "Peak Spending Day",
    summary.peakDay ? money(summary.peakDay.total) : "",
    summary.peakDay
      ? `${isoDate(summary.peakDay.date)} (${summary.peakDay.count} transaction(s))`
      : ""
  );
  addBlank();

  // Breakdown tables
  const addBreakdown = (title, firstColumn, rows) => {
    addRow(title);
    addRow(
      firstColumn,
      "Transactions",
      "Total Amount",
      "Average Amount",
      "Share of Total (%)"
    );

    rows.forEach((row) => {
      addRow(
        row.name,
        row.count,
        money(row.total),
        money(row.average),
        row.percent.toFixed(1)
      );
    });

    addRow(
      "TOTAL",
      summary.count,
      money(summary.total),
      money(summary.average),
      summary.count > 0 ? "100.0" : "0.0"
    );
    addBlank();
  };

  if (summary.count > 0) {
    addBreakdown("CATEGORY BREAKDOWN", "Category", data.categories);
    addBreakdown("PAYMENT METHOD BREAKDOWN", "Payment Method", data.paymentMethods);

    if (data.months.length > 1) {
      addBreakdown("MONTHLY BREAKDOWN", "Month", data.months);
    }
  }

  // Transaction details
  addRow("TRANSACTION DETAILS");
  addRow(
    "No.",
    "Date",
    "Day",
    "Title",
    "Category",
    "Payment Method",
    "Amount",
    "Share of Total (%)",
    "Cumulative Total",
    "Notes",
    "Added On"
  );

  if (data.transactions.length === 0) {
    addRow("", "", "", "No transactions found for the selected filters.");
  } else {
    data.transactions.forEach((item) => {
      addRow(
        item.index,
        isoDate(item.date),
        formatWeekday(item.date),
        item.title,
        item.category,
        item.paymentMethod,
        money(item.amount),
        item.percent.toFixed(1),
        money(item.cumulative),
        item.notes,
        isoDateTime(item.createdAt)
      );
    });

    addRow(
      "",
      "",
      "",
      "TOTAL",
      "",
      "",
      money(summary.total),
      "100.0",
      money(summary.total),
      `${summary.count} transaction(s)`,
      ""
    );
  }

  // UTF-8 BOM makes Excel open the file with the correct encoding
  return BOM + lines.join(EOL) + EOL;
};