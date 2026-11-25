import React, { useEffect, useState } from "react";
import DashboardLayout from "../../components/Layouts/DashboardLayout";
import SummaryCard from "../../components/ui/SummaryCard";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";
import { formatDate, formatCurrency } from "../../utils/helper";
import { CHART_COLORS } from "../../utils/data";
import {
  LuWallet,
  LuTrendingUp,
  LuTrendingDown,
  LuCircleDollarSign,
  LuReceipt,
} from "react-icons/lu";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import toast from "react-hot-toast";

const PIE_COLORS = [
  "#7c3aed", "#a855f7", "#c084fc", "#e879f9", "#f0abfc", "#ddd6fe",
  "#6366f1", "#818cf8", "#38bdf8", "#34d399", "#fb923c", "#f87171",
  "#facc15", "#4ade80", "#2dd4bf", "#e879f9",
];

const Home = () => {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: res } = await axiosInstance.get(API.DASHBOARD);
        setData(res.data);
      } catch {
        toast.error("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
          Loading…
        </div>
      </DashboardLayout>
    );
  }

  const { summary, last60Days, monthlyChartData, recentTransactions } = data || {};
  const currency = user?.defaultCurrency || "USD";

  // Bar chart data: last 6 months (income vs expense by month)
  const barData = monthlyChartData || [];

  // Pie chart: expense breakdown (all categories with data)
  const pieData = (last60Days?.expense || [])
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      name: c.categoryName || "Uncategorized",
      value: c.total,
    }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Hello, {user?.fullName?.split(" ")[0]}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Here's your financial snapshot
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Balance"
            amount={summary?.balance ?? 0}
            currency={currency}
            icon={<LuWallet size={20} />}
            colorClass="bg-violet-100 text-violet-600"
          />
          <SummaryCard
            label="Total Income"
            amount={summary?.totalIncome ?? 0}
            currency={currency}
            icon={<LuTrendingUp size={20} />}
            colorClass="bg-emerald-100 text-emerald-600"
          />
          <SummaryCard
            label="Total Expenses"
            amount={summary?.totalExpenses ?? 0}
            currency={currency}
            icon={<LuTrendingDown size={20} />}
            colorClass="bg-rose-100 text-rose-500"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Bar chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Income vs Expenses — Last 6 Months
            </h2>
            {barData.length ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData} margin={{ top: 4, right: 10, left: 0, bottom: 4 }}
                  barCategoryGap="30%" barGap={4}>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
                      : v >= 1_000   ? `${(v / 1_000).toFixed(0)}k`
                      : `${v}`
                    }
                    width={42}
                  />
                  <Tooltip
                    formatter={(val, name) => [formatCurrency(val, currency), name]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    cursor={{ fill: "#f8fafc" }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar dataKey="income"  name="Income"  fill={CHART_COLORS.income}  radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill={CHART_COLORS.expense} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart />
            )}
          </div>

          {/* Pie chart */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              Expense Breakdown (60 days)
            </h2>
            {pieData.length ? (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      label={(entry) => `${(entry.percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, _name, props) => [
                        formatCurrency(val, currency),
                        props.payload.name,
                      ]}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Category legend */}
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {pieData.map((entry, i) => {
                    const total = pieData.reduce((sum, e) => sum + e.value, 0);
                    const percent = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
                    return (
                      <li key={i} className="flex items-center gap-2 min-w-0">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        <span className="text-xs text-slate-600 truncate">
                          {entry.name}
                        </span>
                        <span className="ml-auto text-xs font-medium text-slate-700 shrink-0">
                          {percent}% · {formatCurrency(entry.value, currency)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : (
              <EmptyChart />
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            Recent Transactions
          </h2>
          {recentTransactions?.length ? (
            <ul className="space-y-3">
              {recentTransactions.map((tx, i) => {
                const TxIcon = tx.type === "income" ? LuCircleDollarSign : LuReceipt;
                return (
                  <li key={i} className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
                      tx.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
                    }`}>
                      <TxIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{tx.title}</p>
                      <p className="text-xs text-slate-400">{formatDate(tx.date)}</p>
                    </div>
                    <span
                      className={`text-sm font-semibold shrink-0 ${
                        tx.type === "income" ? "text-emerald-600" : "text-rose-500"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount, tx.currencyCode)}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-slate-400 text-center py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

const EmptyChart = () => (
  <div className="flex items-center justify-center h-[220px] text-slate-300 text-sm">
    No data yet
  </div>
);

export default Home;
