import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Income from "../models/Income.js";
import User from "../models/User.js";

// Convert major units (e.g. 10.50) to integer minor units (1050)
const toMinorUnits = (amount) => Math.round(amount * 100);
// Convert integer minor units (1050) back to major units (10.50)
const toMajorUnits = (amount) => amount / 100;

const formatIncome = (doc) => ({
  ...doc,
  amount: toMajorUnits(doc.amount),
});

// ─── Add Income ───────────────────────────────────────────────────────────────

export const addIncome = async (req, res) => {
  const userId = req.user.id;
  const { icon, source, amount, date, categoryId, currencyCode } = req.body;

  // Resolve currency: use request value → user default → "USD"
  let resolvedCurrency = currencyCode;
  if (!resolvedCurrency) {
    const user = await User.findById(userId).select("defaultCurrency").lean();
    resolvedCurrency = user?.defaultCurrency || "USD";
  }

  const newIncome = await Income.create({
    userId,
    icon,
    source,
    amount: toMinorUnits(amount),
    date: new Date(date),
    categoryId: categoryId || null,
    currencyCode: resolvedCurrency,
  });

  return res.status(201).json({
    status: "success",
    data: { income: formatIncome(newIncome.toObject()) },
  });
};

// ─── Get All Income (cursor-based pagination) ─────────────────────────────────

export const getAllIncome = async (req, res) => {
  const userId = req.user.id;
  // req.validatedQuery is set by validate(schema, "query") middleware.
  // Express 5 makes req.query read-only so we can't reassign it there.
  const { limit = 20, cursor, categoryId } = req.validatedQuery ?? req.query;

  const pageSize = Math.min(parseInt(limit, 10) || 20, 100);

  const filter = { userId };
  if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);

  // Cursor is the _id of the last document from the previous page
  if (cursor) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const docs = await Income.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(pageSize + 1) // fetch one extra to determine if there's a next page
    .lean();

  const hasNextPage = docs.length > pageSize;
  const results = hasNextPage ? docs.slice(0, pageSize) : docs;
  const nextCursor = hasNextPage ? results[results.length - 1]._id : null;

  return res.status(200).json({
    status: "success",
    data: {
      income: results.map(formatIncome),
      pagination: {
        hasNextPage,
        nextCursor,
        pageSize,
      },
    },
  });
};

// ─── Delete Income ────────────────────────────────────────────────────────────

export const deleteIncome = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      status: "error",
      code: "INVALID_ID",
      message: "Invalid income ID",
    });
  }

  // userId scoped — prevents IDOR
  const deleted = await Income.findOneAndDelete({ _id: id, userId });

  if (!deleted) {
    return res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "Income record not found",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Income deleted successfully",
  });
};

// ─── Download Excel ───────────────────────────────────────────────────────────

export const downloadIncomeExcel = async (req, res) => {
  const userId = req.user.id;

  const income = await Income.find({ userId })
    .select("source amount currencyCode date -_id")
    .sort({ date: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Income");

  sheet.columns = [
    { header: "Source", key: "source", width: 30 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Currency", key: "currencyCode", width: 10 },
    { header: "Date", key: "date", width: 15 },
  ];

  income.forEach((item) => {
    sheet.addRow({
      source: item.source,
      amount: toMajorUnits(item.amount),
      currencyCode: item.currencyCode,
      date: item.date ? new Date(item.date).toISOString().split("T")[0] : "",
    });
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="income-details.xlsx"'
  );

  await workbook.xlsx.write(res);
  res.end();
};
