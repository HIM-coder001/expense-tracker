import mongoose from "mongoose";
import Income from "../models/Income.js";
import Expense from "../models/Expense.js";

const toMajorUnits = (amount) => amount / 100;

/**
 * GET /api/v1/dashboard
 *
 * Returns:
 *  - totalIncome, totalExpenses, balance (all in major units)
 *  - last60DaysByCategory: { income: [...], expense: [...] }
 *  - recentTransactions: last 5 income + last 5 expense, merged and sorted
 *
 * All aggregations use $match first so the compound indexes on
 * { userId, date } are hit. No N+1 — everything is one pipeline each.
 */
export const getDashboardData = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  // Start of the current month, then go back 5 more months = 6 months total
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  // Run all aggregations in parallel
  const [
    incomeTotals,
    expenseTotals,
    incomeByCategory,
    expenseByCategory,
    incomeByMonth,
    expenseByMonth,
    recentIncome,
    recentExpense,
  ] = await Promise.all([
    // Total income
    Income.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    // Total expenses
    Expense.aggregate([
      { $match: { userId } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),

    // Last 60 days income by category (includes uncategorized)
    Income.aggregate([
      { $match: { userId, date: { $gte: sixtyDaysAgo } } },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
    ]),

    // Last 60 days expenses by category (includes uncategorized)
    Expense.aggregate([
      { $match: { userId, date: { $gte: sixtyDaysAgo } } },
      {
        $group: {
          _id: "$categoryId",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
      { $sort: { total: -1 } },
    ]),

    // Last 6 months income totals by month
    Income.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Last 6 months expense totals by month
    Expense.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),

    // Recent income (last 5)
    Income.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .select("source amount currencyCode date icon")
      .lean(),

    // Recent expenses (last 5)
    Expense.find({ userId })
      .sort({ date: -1 })
      .limit(5)
      .select("title amount currencyCode date icon")
      .lean(),
  ]);

  const totalIncome = incomeTotals[0]?.total ?? 0;
  const totalExpenses = expenseTotals[0]?.total ?? 0;
  const balance = totalIncome - totalExpenses;

  // Build the 6-month bar chart data: ensure every month in range is present
  const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const monthlyMap = {};
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    monthlyMap[key] = { month: MONTH_NAMES[d.getMonth()], income: 0, expense: 0 };
  }
  incomeByMonth.forEach(({ _id, total }) => {
    const key = `${_id.year}-${_id.month}`;
    if (monthlyMap[key]) monthlyMap[key].income = toMajorUnits(total);
  });
  expenseByMonth.forEach(({ _id, total }) => {
    const key = `${_id.year}-${_id.month}`;
    if (monthlyMap[key]) monthlyMap[key].expense = toMajorUnits(total);
  });
  const monthlyChartData = Object.values(monthlyMap);

  // Merge and sort recent transactions
  const recentTransactions = [
    ...recentIncome.map((i) => ({
      type: "income",
      title: i.source,
      amount: toMajorUnits(i.amount),
      currencyCode: i.currencyCode,
      date: i.date,
      icon: i.icon,
    })),
    ...recentExpense.map((e) => ({
      type: "expense",
      title: e.title,
      amount: toMajorUnits(e.amount),
      currencyCode: e.currencyCode,
      date: e.date,
      icon: e.icon,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const formatCategory = (item) => ({
    categoryId: item._id,
    categoryName: item.category?.name ?? "Uncategorized",
    categoryIcon: item.category?.icon ?? "📦",
    total: toMajorUnits(item.total),
    count: item.count,
  });

  return res.status(200).json({
    status: "success",
    data: {
      summary: {
        totalIncome: toMajorUnits(totalIncome),
        totalExpenses: toMajorUnits(totalExpenses),
        balance: toMajorUnits(balance),
      },
      last60Days: {
        income: incomeByCategory.map(formatCategory),
        expense: expenseByCategory.map(formatCategory),
      },
      monthlyChartData,
      recentTransactions,
    },
  });
};
