import PDFDocument from "pdfkit";
import {
  formatMoney,
  formatDate,
  formatGeneratedAt,
} from "./reportData.js";

// Finora brand colors (same palette as the web app)
const COLORS = {
  brand950: "#06291c",
  brand900: "#104a32",
  brand700: "#117044",
  brand500: "#20ad68",
  brand400: "#48cc86",
  brand200: "#b4efce",
  brand100: "#d8f8e5",
  brand50: "#effcf5",
  text900: "#0f172a",
  text700: "#334155",
  text500: "#64748b",
  border: "#e2e8f0",
  zebra: "#f8fafc",
  white: "#ffffff",
};

const MARGIN = 40;
const FOOTER_SPACE = 54;
const CONTINUATION_TOP = 60;
const CELL_PAD_X = 6;
const CELL_PAD_Y = 6;
const TABLE_HEADER_HEIGHT = 22;
const BODY_FONT_SIZE = 8.5;

// Built-in PDF fonts support Latin characters only.
// Any other character (emoji, Hindi, etc.) is replaced with "?" in the PDF.
// The CSV file keeps the original text.
const pdfSafe = (value) => {
  const text = String(value ?? "").replace(/\r\n?/g, "\n");
  return text.replace(
    /[^\n\u0020-\u007E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC\u20B9]+/g,
    "?"
  );
};

const contentWidth = (doc) => doc.page.width - MARGIN * 2;
const bottomLimit = (doc) => doc.page.height - FOOTER_SPACE;

const fitText = (doc, text, maxWidth) => {
  if (doc.widthOfString(text) <= maxWidth) return text;

  let result = text;
  while (result.length > 1 && doc.widthOfString(`${result}...`) > maxWidth) {
    result = result.slice(0, -1);
  }

  return `${result.trimEnd()}...`;
};

const fitFontSize = (doc, text, font, maxSize, minSize, maxWidth) => {
  let size = maxSize;
  doc.font(font);

  while (size > minSize) {
    doc.fontSize(size);
    if (doc.widthOfString(text) <= maxWidth) break;
    size -= 0.5;
  }

  return size;
};

// Page helpers
const drawContinuationHeader = (ctx) => {
  const { doc, data } = ctx;
  const width = doc.page.width;

  doc.rect(0, 0, width, 34).fill(COLORS.brand950);
  doc.rect(0, 34, width, 2).fill(COLORS.brand500);

  doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.white);
  doc.text("finora", MARGIN, 11, { lineBreak: false });
  const brandWidth = doc.widthOfString("finora");
  doc.fillColor(COLORS.brand400).text(".", MARGIN + brandWidth, 11, {
    lineBreak: false,
  });

  doc.font("Helvetica").fontSize(8).fillColor(COLORS.brand200);
  doc.text(
    pdfSafe(`Expense Report  |  ${data.period.name}  |  ${data.period.dateRangeText}`),
    MARGIN,
    14,
    { width: contentWidth(doc), align: "right", lineBreak: false }
  );
};

const startNewPage = (ctx) => {
  ctx.doc.addPage();
  drawContinuationHeader(ctx);
  ctx.y = CONTINUATION_TOP;
};

const ensureSpace = (ctx, needed) => {
  if (ctx.y + needed > bottomLimit(ctx.doc)) {
    startNewPage(ctx);
    return true;
  }
  return false;
};

// First page header
const drawCoverHeader = (ctx) => {
  const { doc, data } = ctx;
  const width = doc.page.width;

  doc.rect(0, 0, width, 118).fill(COLORS.brand950);
  doc.rect(0, 118, width, 4).fill(COLORS.brand500);

  doc.font("Helvetica-Bold").fontSize(24).fillColor(COLORS.white);
  doc.text("finora", MARGIN, 28, { lineBreak: false });
  const brandWidth = doc.widthOfString("finora");
  doc.fillColor(COLORS.brand400).text(".", MARGIN + brandWidth, 28, {
    lineBreak: false,
  });

  doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.brand200);
  doc.text("Expense Report", MARGIN, 62, { lineBreak: false });

  doc.font("Helvetica").fontSize(9.5).fillColor(COLORS.white);
  doc.text(
    pdfSafe(`${data.period.name}  |  ${data.period.dateRangeText}`),
    MARGIN,
    86,
    { width: contentWidth(doc) * 0.62, lineBreak: false, ellipsis: true }
  );

  doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.brand200);
  doc.text("GENERATED ON", MARGIN, 34, {
    width: contentWidth(doc),
    align: "right",
    lineBreak: false,
    characterSpacing: 1,
  });
  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.white);
  doc.text(formatGeneratedAt(data.generatedAt), MARGIN, 48, {
    width: contentWidth(doc),
    align: "right",
    lineBreak: false,
  });

  ctx.y = 142;
};

// Report information box
const drawInfoBox = (ctx) => {
  const { doc, data } = ctx;
  const width = contentWidth(doc);
  const columnWidth = width / 2;
  const rowHeight = 32;

  const items = [
    ["ACCOUNT", data.user.name || "-"],
    ["EMAIL", data.user.email || "-"],
    ["CATEGORY FILTER", data.filters.category],
    ["SEARCH FILTER", data.filters.search],
    ["SORTED BY", data.filters.sortLabel],
    ["TRANSACTIONS INCLUDED", String(data.summary.count)],
  ];

  const boxHeight = rowHeight * 3 + 10;

  doc
    .roundedRect(MARGIN, ctx.y, width, boxHeight, 8)
    .lineWidth(0.8)
    .fillAndStroke(COLORS.brand50, COLORS.brand100);

  items.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = MARGIN + column * columnWidth + 14;
    const y = ctx.y + 9 + row * rowHeight;

    doc.font("Helvetica").fontSize(6.8).fillColor(COLORS.text500);
    doc.text(label, x, y, { lineBreak: false, characterSpacing: 0.8 });

    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.text900);
    const safeValue = fitText(doc, pdfSafe(value), columnWidth - 28);
    doc.text(safeValue, x, y + 11, { lineBreak: false });
  });

  ctx.y += boxHeight + 18;
};

// Summary cards
const drawSummaryCards = (ctx) => {
  const { doc, data } = ctx;
  const { summary, period } = data;
  const gap = 10;
  const cardWidth = (contentWidth(doc) - gap * 3) / 4;
  const cardHeight = 58;

  const cards = [
    {
      label: "TOTAL SPENT",
      value: formatMoney(summary.total),
      sub: period.name,
      dark: true,
    },
    {
      label: "TRANSACTIONS",
      value: String(summary.count),
      sub: `${summary.activeDays} day(s) with spending`,
    },
    {
      label: "AVG PER TRANSACTION",
      value: formatMoney(summary.average),
      sub: "Average expense amount",
    },
    {
      label: "DAILY AVERAGE",
      value: formatMoney(summary.dailyAverage),
      sub: period.days > 0 ? `Over ${period.days} day(s)` : "No data",
    },
    {
      label: "HIGHEST EXPENSE",
      value: summary.highest ? formatMoney(summary.highest.amount) : "-",
      sub: summary.highest ? summary.highest.title : "No data",
    },
    {
      label: "LOWEST EXPENSE",
      value: summary.lowest ? formatMoney(summary.lowest.amount) : "-",
      sub: summary.lowest ? summary.lowest.title : "No data",
    },
    {
      label: "TOP CATEGORY",
      value: summary.topCategory ? summary.topCategory.name : "-",
      sub: summary.topCategory
        ? `${formatMoney(summary.topCategory.total)} (${summary.topCategory.percent.toFixed(1)}%)`
        : "No data",
    },
    {
      label: "PEAK SPENDING DAY",
      value: summary.peakDay ? formatDate(summary.peakDay.date) : "-",
      sub: summary.peakDay ? formatMoney(summary.peakDay.total) : "No data",
    },
  ];

  cards.forEach((card, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const x = MARGIN + column * (cardWidth + gap);
    const y = ctx.y + row * (cardHeight + gap);
    const innerWidth = cardWidth - 20;

    doc
      .roundedRect(x, y, cardWidth, cardHeight, 8)
      .lineWidth(0.8)
      .fillAndStroke(
        card.dark ? COLORS.brand900 : COLORS.white,
        card.dark ? COLORS.brand900 : COLORS.border
      );

    doc
      .font("Helvetica")
      .fontSize(6.5)
      .fillColor(card.dark ? COLORS.brand200 : COLORS.text500);
    doc.text(card.label, x + 10, y + 9, {
      lineBreak: false,
      characterSpacing: 0.6,
    });

    const valueText = pdfSafe(card.value);
    const valueSize = fitFontSize(doc, valueText, "Helvetica-Bold", 14, 8, innerWidth);
    doc
      .font("Helvetica-Bold")
      .fontSize(valueSize)
      .fillColor(card.dark ? COLORS.white : COLORS.text900);
    doc.text(valueText, x + 10, y + 22, { lineBreak: false });

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(card.dark ? COLORS.brand200 : COLORS.text500);
    doc.text(fitText(doc, pdfSafe(card.sub), innerWidth), x + 10, y + 42, {
      lineBreak: false,
    });
  });

  ctx.y += cardHeight * 2 + gap + 22;
};

// Section title
const drawSectionTitle = (ctx, title, subtitle) => {
  const { doc } = ctx;

  doc.rect(MARGIN, ctx.y + 1, 3, 15).fill(COLORS.brand500);

  doc.font("Helvetica-Bold").fontSize(12).fillColor(COLORS.text900);
  doc.text(title, MARGIN + 10, ctx.y, { lineBreak: false });

  if (subtitle) {
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.text500);
    doc.text(pdfSafe(subtitle), MARGIN + 10, ctx.y + 15, { lineBreak: false });
  }

  ctx.y += subtitle ? 34 : 26;
};

// Generic table
const normalizeCell = (cell) => {
  if (cell && typeof cell === "object") return cell;
  return { text: cell === null || cell === undefined ? "" : String(cell) };
};

const measureRow = (doc, columns, row) => {
  let height = 0;

  columns.forEach((column) => {
    const cell = normalizeCell(row[column.key]);
    const textWidth = column.width - CELL_PAD_X * 2;
    let cellHeight = 0;

    if (column.bar) {
      cellHeight = 10;
    } else {
      doc
        .font(column.bold ? "Helvetica-Bold" : "Helvetica")
        .fontSize(BODY_FONT_SIZE);
      cellHeight += doc.heightOfString(pdfSafe(cell.text) || " ", {
        width: textWidth,
        align: column.align || "left",
      });

      if (cell.sub) {
        doc.font("Helvetica").fontSize(BODY_FONT_SIZE - 1.5);
        cellHeight +=
          2 + doc.heightOfString(pdfSafe(cell.sub), { width: textWidth });
      }
    }

    height = Math.max(height, cellHeight);
  });

  return Math.max(height + CELL_PAD_Y * 2, 22);
};

const drawTableHeader = (ctx, columns) => {
  const { doc } = ctx;

  doc.rect(MARGIN, ctx.y, contentWidth(doc), TABLE_HEADER_HEIGHT).fill(COLORS.brand900);

  let x = MARGIN;
  doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.white);

  columns.forEach((column) => {
    doc.text(column.label.toUpperCase(), x + CELL_PAD_X, ctx.y + 8, {
      width: column.width - CELL_PAD_X * 2,
      align: column.align || "left",
      lineBreak: false,
      characterSpacing: 0.5,
    });
    x += column.width;
  });

  ctx.y += TABLE_HEADER_HEIGHT;
};

const drawTableRow = (ctx, columns, row, rowHeight, options = {}) => {
  const { doc } = ctx;
  const { isTotal = false, zebra = false } = options;

  if (isTotal) {
    doc.rect(MARGIN, ctx.y, contentWidth(doc), rowHeight).fill(COLORS.brand50);
    doc
      .moveTo(MARGIN, ctx.y)
      .lineTo(MARGIN + contentWidth(doc), ctx.y)
      .lineWidth(1)
      .strokeColor(COLORS.brand500)
      .stroke();
  } else if (zebra) {
    doc.rect(MARGIN, ctx.y, contentWidth(doc), rowHeight).fill(COLORS.zebra);
  }

  let x = MARGIN;

  columns.forEach((column) => {
    const cell = normalizeCell(row[column.key]);
    const textX = x + CELL_PAD_X;
    const textWidth = column.width - CELL_PAD_X * 2;
    const textY = ctx.y + CELL_PAD_Y;

    if (column.bar) {
      doc
        .font("Helvetica")
        .fontSize(BODY_FONT_SIZE)
        .fillColor(COLORS.text700);
      doc.text(pdfSafe(cell.text), textX, textY, {
        width: 34,
        lineBreak: false,
      });

      const barX = textX + 38;
      const barWidth = Math.max(textWidth - 38, 10);
      const barY = textY + 2;
      const percent = Math.min(Math.max(cell.percent || 0, 0), 100);

      doc.roundedRect(barX, barY, barWidth, 5, 2.5).fill(COLORS.brand100);
      if (percent > 0) {
        doc
          .roundedRect(barX, barY, Math.max((barWidth * percent) / 100, 2.5), 5, 2.5)
          .fill(COLORS.brand500);
      }
    } else {
      const isStrong = column.bold || isTotal;
      doc
        .font(isStrong ? "Helvetica-Bold" : "Helvetica")
        .fontSize(BODY_FONT_SIZE)
        .fillColor(column.bold ? COLORS.text900 : COLORS.text700);

      doc.text(pdfSafe(cell.text), textX, textY, {
        width: textWidth,
        align: column.align || "left",
      });

      if (cell.sub) {
        const mainHeight = doc.heightOfString(pdfSafe(cell.text) || " ", {
          width: textWidth,
          align: column.align || "left",
        });

        doc
          .font("Helvetica")
          .fontSize(BODY_FONT_SIZE - 1.5)
          .fillColor(COLORS.text500);
        doc.text(pdfSafe(cell.sub), textX, textY + mainHeight + 2, {
          width: textWidth,
        });
      }
    }

    x += column.width;
  });

  if (!isTotal) {
    doc
      .moveTo(MARGIN, ctx.y + rowHeight)
      .lineTo(MARGIN + contentWidth(doc), ctx.y + rowHeight)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();
  }

  ctx.y += rowHeight;
};

const drawTable = (ctx, { columns, rows, totalRow = null, minStartSpace = 90 }) => {
  const { doc } = ctx;

  ensureSpace(ctx, Math.max(minStartSpace, TABLE_HEADER_HEIGHT + 30));
  drawTableHeader(ctx, columns);

  rows.forEach((row, index) => {
    const rowHeight = measureRow(doc, columns, row);

    if (ctx.y + rowHeight > bottomLimit(doc)) {
      startNewPage(ctx);
      drawTableHeader(ctx, columns);
    }

    drawTableRow(ctx, columns, row, rowHeight, { zebra: index % 2 === 1 });
  });

  if (totalRow) {
    const totalHeight = measureRow(doc, columns, totalRow);

    if (ctx.y + totalHeight > bottomLimit(doc)) {
      startNewPage(ctx);
      drawTableHeader(ctx, columns);
    }

    drawTableRow(ctx, columns, totalRow, totalHeight, { isTotal: true });
  }

  ctx.y += 22;
};

// Sections
const breakdownColumns = (firstLabel) => [
  { key: "name", label: firstLabel, width: 150, bold: true },
  { key: "count", label: "Transactions", width: 75, align: "right" },
  { key: "total", label: "Amount", width: 95, align: "right", bold: true },
  { key: "average", label: "Average", width: 90, align: "right" },
  { key: "share", label: "Share", width: 105, bar: true },
];

const toBreakdownRows = (items) =>
  items.map((item) => ({
    name: item.name,
    count: String(item.count),
    total: formatMoney(item.total),
    average: formatMoney(item.average),
    share: { text: `${item.percent.toFixed(1)}%`, percent: item.percent },
  }));

const drawBreakdownSection = (ctx, title, subtitle, firstLabel, items) => {
  const { summary } = ctx.data;

  ensureSpace(ctx, 100);
  drawSectionTitle(ctx, title, subtitle);

  drawTable(ctx, {
    columns: breakdownColumns(firstLabel),
    rows: toBreakdownRows(items),
    totalRow: {
      name: "Total",
      count: String(summary.count),
      total: formatMoney(summary.total),
      average: formatMoney(summary.average),
      share: { text: "100%", percent: 100 },
    },
  });
};

const drawTopExpensesSection = (ctx) => {
  const columns = [
    { key: "index", label: "#", width: 28 },
    { key: "date", label: "Date", width: 68 },
    { key: "title", label: "Title", width: 190, bold: true },
    { key: "category", label: "Category", width: 100 },
    { key: "amount", label: "Amount", width: 129, align: "right", bold: true },
  ];

  const rows = ctx.data.topExpenses.map((item, index) => ({
    index: String(index + 1),
    date: formatDate(item.date),
    title: item.title,
    category: item.category,
    amount: formatMoney(item.amount),
  }));

  ensureSpace(ctx, 110);
  drawSectionTitle(
    ctx,
    "Top Expenses",
    `Largest ${rows.length} transaction(s) in this report`
  );
  drawTable(ctx, { columns, rows });
};

const drawTransactionsSection = (ctx) => {
  const { data } = ctx;

  const columns = [
    { key: "index", label: "#", width: 28 },
    { key: "date", label: "Date", width: 68 },
    { key: "title", label: "Title / Notes", width: 162, bold: true },
    { key: "category", label: "Category", width: 88 },
    { key: "payment", label: "Payment", width: 84 },
    { key: "amount", label: "Amount", width: 85, align: "right", bold: true },
  ];

  const rows = data.transactions.map((item) => ({
    index: String(item.index),
    date: formatDate(item.date),
    title: { text: item.title, sub: item.notes || "" },
    category: item.category,
    payment: item.paymentMethod,
    amount: formatMoney(item.amount),
  }));

  ensureSpace(ctx, 120);
  drawSectionTitle(
    ctx,
    "Transaction Details",
    `${data.summary.count} transaction(s)  |  Sorted by: ${data.filters.sortLabel}`
  );

  drawTable(ctx, {
    columns,
    rows,
    totalRow: {
      index: "",
      date: "",
      title: `Total (${data.summary.count} transactions)`,
      category: "",
      payment: "",
      amount: formatMoney(data.summary.total),
    },
  });
};

const drawEmptyState = (ctx) => {
  const { doc } = ctx;
  const width = contentWidth(doc);

  doc
    .roundedRect(MARGIN, ctx.y, width, 70, 8)
    .lineWidth(0.8)
    .fillAndStroke(COLORS.zebra, COLORS.border);

  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.text900);
  doc.text("No transactions found", MARGIN, ctx.y + 20, {
    width,
    align: "center",
    lineBreak: false,
  });

  doc.font("Helvetica").fontSize(9).fillColor(COLORS.text500);
  doc.text(
    "There are no expenses for the selected period and filters.",
    MARGIN,
    ctx.y + 38,
    { width, align: "center", lineBreak: false }
  );

  ctx.y += 90;
};

// Footer with page numbers on every page
const drawFooters = (doc) => {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const previousBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .moveTo(MARGIN, pageHeight - 42)
      .lineTo(pageWidth - MARGIN, pageHeight - 42)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();

    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.text500);
    doc.text(
      "Finora  |  Personal Finance & Expense Management",
      MARGIN,
      pageHeight - 32,
      { lineBreak: false }
    );
    doc.text(`Page ${i + 1} of ${range.count}`, MARGIN, pageHeight - 32, {
      width: pageWidth - MARGIN * 2,
      align: "right",
      lineBreak: false,
    });

    doc.page.margins.bottom = previousBottomMargin;
  }
};

// Public API: returns a Buffer containing the finished PDF
export const buildPdfReport = (data) =>
  new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: MARGIN,
        bufferPages: true,
        info: {
          Title: "Finora Expense Report",
          Author: "Finora",
          Creator: "Finora",
          Subject: pdfSafe(`${data.period.name} - ${data.period.dateRangeText}`),
        },
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const ctx = { doc, data, y: 0 };

      drawCoverHeader(ctx);
      drawInfoBox(ctx);
      drawSummaryCards(ctx);

      if (data.summary.count === 0) {
        drawEmptyState(ctx);
      } else {
        drawBreakdownSection(
          ctx,
          "Category Breakdown",
          "Spending grouped by category",
          "Category",
          data.categories
        );

        drawBreakdownSection(
          ctx,
          "Payment Method Breakdown",
          "Spending grouped by payment method",
          "Payment Method",
          data.paymentMethods
        );

        if (data.months.length > 1) {
          drawBreakdownSection(
            ctx,
            "Monthly Breakdown",
            "Spending grouped by month",
            "Month",
            data.months
          );
        }

        drawTopExpensesSection(ctx);
        drawTransactionsSection(ctx);
      }

      drawFooters(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });