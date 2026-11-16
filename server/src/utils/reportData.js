import { z } from "zod";
import Expense, { EXPENSE_CATEGORIES } from "../models/Expense.js";

// Safety limit so a single report can never exhaust server memory
export const MAX_REPORT_RECORDS = 10000;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const SORT_LABELS = {
  date_desc: "Newest First",
  date_asc: "Oldest First",
  amount_desc: "Amount: High to Low",
  amount_asc: "Amount: Low to High",
  title_asc: "Title: A to Z",
};

// Formatting helpers (same style as the dashboard: Indian locale, INR)
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatMoney = (amount) => currencyFormatter.format(amount || 0);

export const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const formatWeekday = (date) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  }).format(date);

export const formatMonth = (date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);

export const formatGeneratedAt = (date) =>
  `${new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(date)} UTC`;

// Query validation
const blankToUndefined = (value) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const dateField = z.preprocess(
  blankToUndefined,
  z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Dates must use the YYYY-MM-DD format.")
    .refine((value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    }, "Invalid date provided.")
    .optional()
);

const reportQuerySchema = z
  .object({
    category: z.preprocess(
      blankToUndefined,
      z
        .string()
        .trim()
        .refine((value) => value === "all" || EXPENSE_CATEGORIES.includes(value), {
          message: "Invalid category filter.",
        })
        .optional()
    ),
    search: z.preprocess(
      blankToUndefined,
      z.string().trim().max(100, "Search text is too long.").optional()
    ),
    startDate: dateField,
    endDate: dateField,
    sortBy: z.preprocess(
      blankToUndefined,
      z.enum(Object.keys(SORT_LABELS), { message: "Invalid sort option." }).optional()
    ),
    periodName: z.preprocess(
      blankToUndefined,
      z.string().trim().max(60, "Period name is too long.").optional()
    ),
  })
  .refine(
    (value) =>
      !value.startDate || !value.endDate || value.startDate <= value.endDate,
    { message: "Start date cannot be after end date." }
  );

export const parseReportQuery = (query) => reportQuerySchema.safeParse(query);

// Database filter (mirrors the filters used by GET /api/expenses)
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildExpenseFilter = (userId, query) => {
  const filter = { user: userId };

  if (query.category && query.category !== "all") {
    filter.category = query.category;
  }

  if (query.search) {
    const pattern = escapeRegex(query.search);
    filter.$or = [
      { title: { $regex: pattern, $options: "i" } },
      { notes: { $regex: pattern, $options: "i" } },
    ];
  }

  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) {
      filter.date.$gte = new Date(`${query.startDate}T00:00:00.000Z`);
    }
    if (query.endDate) {
      filter.date.$lte = new Date(`${query.endDate}T23:59:59.999Z`);
    }
  }

  return filter;
};

const buildSortOption = (sortBy) => {
  if (sortBy === "date_asc") return { date: 1, createdAt: 1 };
  if (sortBy === "amount_desc") return { amount: -1, date: -1 };
  if (sortBy === "amount_asc") return { amount: 1, date: -1 };
  if (sortBy === "title_asc") return { title: 1 };
  return { date: -1, createdAt: -1 };
};

// Math helpers (money is summed in cents to avoid floating point drift)
const toCents = (amount) => Math.round((Number(amount) || 0) * 100);
const fromCents = (cents) => Math.round(cents) / 100;
const percentOf = (part, total) =>
  total > 0 ? Math.round((part / total) * 1000) / 10 : 0;

const dayKeyOf = (date) => date.toISOString().slice(0, 10);

const groupEntries = (entries, keyFn) => {
  const groups = new Map();

  entries.forEach((entry) => {
    const key = keyFn(entry);
    const group = groups.get(key) || { key, count: 0, totalCents: 0 };
    group.count += 1;
    group.totalCents += entry.amountCents;
    groups.set(key, group);
  });

  return [...groups.values()];
};

const decorateGroups = (groups, grandTotalCents) =>
  groups.map((group) => ({
    name: group.key,
    count: group.count,
    total: fromCents(group.totalCents),
    average: fromCents(group.totalCents / group.count),
    percent: percentOf(group.totalCents, grandTotalCents),
    totalCents: group.totalCents,
  }));

const byTotalDesc = (a, b) =>
  b.totalCents - a.totalCents || a.name.localeCompare(b.name);

// Pure computation (no database access) so it is easy to test
export const computeReport = ({ expenses, user, query, now = new Date() }) => {
  const entries = expenses.map((expense) => ({
    id: String(expense._id),
    title: expense.title,
    category: expense.category,
    paymentMethod: expense.paymentMethod || "Not specified",
    notes: expense.notes || "",
    date: new Date(expense.date),
    createdAt: expense.createdAt ? new Date(expense.createdAt) : null,
    amountCents: toCents(expense.amount),
  }));

  const count = entries.length;
  const totalCents = entries.reduce((sum, entry) => sum + entry.amountCents, 0);

  // Transactions in the same order the user sees on the dashboard
  let runningCents = 0;
  const transactions = entries.map((entry, index) => {
    runningCents += entry.amountCents;
    return {
      index: index + 1,
      id: entry.id,
      date: entry.date,
      dayKey: dayKeyOf(entry.date),
      title: entry.title,
      category: entry.category,
      paymentMethod: entry.paymentMethod,
      amount: fromCents(entry.amountCents),
      percent: percentOf(entry.amountCents, totalCents),
      cumulative: fromCents(runningCents),
      notes: entry.notes,
      createdAt: entry.createdAt,
    };
  });

  // Breakdown tables
  const categories = decorateGroups(
    groupEntries(entries, (entry) => entry.category),
    totalCents
  ).sort(byTotalDesc);

  const paymentMethods = decorateGroups(
    groupEntries(entries, (entry) => entry.paymentMethod),
    totalCents
  ).sort(byTotalDesc);

  const months = decorateGroups(
    groupEntries(entries, (entry) => entry.date.toISOString().slice(0, 7)),
    totalCents
  )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((month) => ({
      ...month,
      key: month.name,
      name: formatMonth(new Date(`${month.name}-01T00:00:00.000Z`)),
    }));

  // Highest / lowest / peak day
  let highest = null;
  let lowest = null;
  entries.forEach((entry) => {
    if (!highest || entry.amountCents > highest.amountCents) highest = entry;
    if (!lowest || entry.amountCents < lowest.amountCents) lowest = entry;
  });

  const dayGroups = groupEntries(entries, (entry) => dayKeyOf(entry.date));
  const peakDayGroup = dayGroups.reduce(
    (best, group) =>
      !best || group.totalCents > best.totalCents ? group : best,
    null
  );

  const topExpenses = [...transactions]
    .sort((a, b) => b.amount - a.amount || b.date - a.date)
    .slice(0, 5);

  // Number of days used for the daily average
  const startMs = query.startDate
    ? new Date(`${query.startDate}T00:00:00.000Z`).getTime()
    : entries.reduce((min, entry) => Math.min(min, entry.date.getTime()), Infinity);

  const latestEntryMs = entries.reduce(
    (max, entry) => Math.max(max, entry.date.getTime()),
    -Infinity
  );
  const todayMs = new Date(`${dayKeyOf(now)}T00:00:00.000Z`).getTime();
  const configuredEndMs = query.endDate
    ? new Date(`${query.endDate}T00:00:00.000Z`).getTime()
    : latestEntryMs;
  const endMs = Math.max(Math.min(configuredEndMs, todayMs), latestEntryMs);

  const periodDays =
    count > 0 && Number.isFinite(startMs) && Number.isFinite(endMs)
      ? Math.max(1, Math.floor((endMs - startMs) / MS_PER_DAY) + 1)
      : 0;

  // Human readable period information
  const startLabel = query.startDate
    ? formatDate(new Date(`${query.startDate}T00:00:00.000Z`))
    : null;
  const endLabel = query.endDate
    ? formatDate(new Date(`${query.endDate}T00:00:00.000Z`))
    : null;

  let dateRangeText = "All dates";
  if (startLabel && endLabel) dateRangeText = `${startLabel} - ${endLabel}`;
  else if (startLabel) dateRangeText = `From ${startLabel}`;
  else if (endLabel) dateRangeText = `Up to ${endLabel}`;

  const periodName =
    query.periodName ||
    (query.startDate || query.endDate ? "Custom Range" : "All Time");

  return {
    generatedAt: now,
    currency: "INR",
    user: {
      name: user?.name || "",
      email: user?.email || "",
    },
    period: {
      name: periodName,
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      dateRangeText,
      days: periodDays,
    },
    filters: {
      category: query.category && query.category !== "all" ? query.category : "All Categories",
      search: query.search || "None",
      sortBy: query.sortBy || "date_desc",
      sortLabel: SORT_LABELS[query.sortBy] || SORT_LABELS.date_desc,
    },
    summary: {
      count,
      total: fromCents(totalCents),
      average: count > 0 ? fromCents(totalCents / count) : 0,
      dailyAverage: periodDays > 0 ? fromCents(totalCents / periodDays) : 0,
      activeDays: dayGroups.length,
      highest: highest
        ? { title: highest.title, amount: fromCents(highest.amountCents), date: highest.date }
        : null,
      lowest: lowest
        ? { title: lowest.title, amount: fromCents(lowest.amountCents), date: lowest.date }
        : null,
      topCategory: categories[0] || null,
      topPaymentMethod: paymentMethods[0] || null,
      peakDay: peakDayGroup
        ? {
            date: new Date(`${peakDayGroup.key}T00:00:00.000Z`),
            total: fromCents(peakDayGroup.totalCents),
            count: peakDayGroup.count,
          }
        : null,
    },
    categories,
    paymentMethods,
    months,
    topExpenses,
    transactions,
  };
};

// Fetches the user's expenses and builds the report data
export const buildReportData = async ({ user, query }) => {
  const filter = buildExpenseFilter(user._id, query);
  const sortOption = buildSortOption(query.sortBy);

  const expenses = await Expense.find(filter)
    .sort(sortOption)
    .limit(MAX_REPORT_RECORDS + 1)
    .lean();

  if (expenses.length > MAX_REPORT_RECORDS) {
    const error = new Error(
      `This report has more than ${MAX_REPORT_RECORDS} transactions. Please choose a shorter date range.`
    );
    error.statusCode = 413;
    throw error;
  }

  return computeReport({ expenses, user, query });
};

// File name used by the server in the Content-Disposition header
export const buildReportFileName = (data, extension) => {
  const today = data.generatedAt.toISOString().slice(0, 10);

  if (data.period.startDate && data.period.endDate) {
    return `finora-expenses_${data.period.startDate}_to_${data.period.endDate}.${extension}`;
  }

  return `finora-expenses_all-time_${today}.${extension}`;
};