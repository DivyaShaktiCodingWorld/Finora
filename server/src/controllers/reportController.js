import {
  parseReportQuery,
  buildReportData,
  buildReportFileName,
} from "../utils/reportData.js";
import { buildCsvReport } from "../utils/csvReport.js";
import { buildPdfReport } from "../utils/pdfReport.js";

// Shared helper: validates the query and builds the report data
const prepareReport = async (req, res) => {
  const validation = parseReportQuery(req.query);

  if (!validation.success) {
    res.status(400).json({
      message: validation.error.issues[0]?.message || "Invalid report filters.",
    });
    return null;
  }

  return buildReportData({
    user: req.user,
    query: validation.data,
  });
};

// Handles expected errors (like "too many records") with a clean message
const handleReportError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
};

// GET /api/reports/csv
export const downloadCsvReport = async (req, res, next) => {
  try {
    const data = await prepareReport(req, res);
    if (!data) return;

    const csv = buildCsvReport(data);
    const fileName = buildReportFileName(data, "csv");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).send(csv);
  } catch (error) {
    return handleReportError(error, res, next);
  }
};

// GET /api/reports/pdf
export const downloadPdfReport = async (req, res, next) => {
  try {
    const data = await prepareReport(req, res);
    if (!data) return;

    const pdfBuffer = await buildPdfReport(data);
    const fileName = buildReportFileName(data, "pdf");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-store");

    return res.status(200).end(pdfBuffer);
  } catch (error) {
    return handleReportError(error, res, next);
  }
};