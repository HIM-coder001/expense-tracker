import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Expense from "../models/Expense.js";
import User from "../models/User.js";

const toMinorUnits = (amount) => Math.round(amount * 100);
const toMajorUnits = (amount) => amount / 100;

const formatExpense = (doc) => ({
  ...doc,
  amount: toMajorUnits(doc.amount),
});

// ─── Add Expense ──────────────────────────────────────────────────────────────

export const addExpense = async (req, res) => {
  const userId = req.user.id;
  const { icon, title, amount, date, categoryId, currencyCode } = req.body;

  let resolvedCurrency = currencyCode;
  if (!resolvedCurrency) {
    const user = await User.findById(userId).select("defaultCurrency").lean();
    resolvedCurrency = user?.defaultCurrency || "USD";
  }

  const newExpense = await Expense.create({
    userId,
    icon,
    title,
    amount: toMinorUnits(amount),
    date: new Date(date),
    categoryId: categoryId || null,
    currencyCode: resolvedCurrency,
  });

  return res.status(201).json({
    status: "success",
    data: { expense: formatExpense(newExpense.toObject()) },
  });
};

// ─── Get All Expenses (cursor-based pagination) ───────────────────────────────

export const getAllExpenses = async (req, res) => {
  const userId = req.user.id;
  // req.validatedQuery is set by validate(schema, "query") middleware.
  // Express 5 makes req.query read-only so we can't reassign it there.
  const { limit = 20, cursor, categoryId } = req.validatedQuery ?? req.query;

  const pageSize = Math.min(parseInt(limit, 10) || 20, 100);

  const filter = { userId };
  if (categoryId) filter.categoryId = new mongoose.Types.ObjectId(categoryId);
  if (cursor) filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };

  const docs = await Expense.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(pageSize + 1)
    .lean();

  const hasNextPage = docs.length > pageSize;
  const results = hasNextPage ? docs.slice(0, pageSize) : docs;
  const nextCursor = hasNextPage ? results[results.length - 1]._id : null;

  return res.status(200).json({
    status: "success",
    data: {
      expenses: results.map(formatExpense),
      pagination: { hasNextPage, nextCursor, pageSize },
    },
  });
};

// ─── Delete Expense ───────────────────────────────────────────────────────────

export const deleteExpense = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({
      status: "error",
      code: "INVALID_ID",
      message: "Invalid expense ID",
    });
  }

  const deleted = await Expense.findOneAndDelete({ _id: id, userId });

  if (!deleted) {
    return res.status(404).json({
      status: "error",
      code: "NOT_FOUND",
      message: "Expense record not found",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Expense deleted successfully",
  });
};

// ─── Download Excel ───────────────────────────────────────────────────────────

export const downloadExpenseExcel = async (req, res) => {
  const userId = req.user.id;

  const expenses = await Expense.find({ userId })
    .select("title amount currencyCode date -_id")
    .sort({ date: -1 })
    .lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Expenses");

  sheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Amount", key: "amount", width: 15 },
    { header: "Currency", key: "currencyCode", width: 10 },
    { header: "Date", key: "date", width: 15 },
  ];

  expenses.forEach((item) => {
    sheet.addRow({
      title: item.title,
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
    'attachment; filename="expense-details.xlsx"'
  );

  await workbook.xlsx.write(res);
  res.end();
};
