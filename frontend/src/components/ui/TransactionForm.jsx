import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import axiosInstance from "../../utils/axiosInstance";
import { API } from "../../utils/apiPaths";

/**
 * Reusable form for adding income or expense.
 * Props:
 *   type        – "income" | "expense"
 *   onSubmit    – async (payload) => void
 *   onClose     – () => void
 */
const TransactionForm = ({ type, onSubmit, onClose }) => {
  const isIncome = type === "income";
  const titleKey = isIncome ? "source" : "title";

  const [form, setForm] = useState({
    [titleKey]: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data: res } = await axiosInstance.get(API.CATEGORIES);
        const filtered = (res.data.categories || []).filter(c => c.type === type);
        setCategories(filtered);
        // Auto-select the first one if available
        if (filtered.length > 0) {
          setForm(prev => ({ ...prev, categoryId: filtered[0]._id }));
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    };
    loadCategories();
  }, [type]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(form.amount);
    if (!form[titleKey]?.trim()) {
      setError(`${isIncome ? "Source" : "Title"} is required`);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        [titleKey]: form[titleKey].trim(),
        amount,
        date: new Date(form.date).toISOString(),
        categoryId: form.categoryId || null,
      });
      toast.success(`${isIncome ? "Income" : "Expense"} added`);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to save";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Source / Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {isIncome ? "Source" : "Title"}
        </label>
        <input
          name={titleKey}
          value={form[titleKey]}
          onChange={handleChange}
          placeholder={isIncome ? "e.g. Salary" : "e.g. Groceries"}
          required
          maxLength={100}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
        <select
          name="categoryId"
          value={form.categoryId}
          onChange={handleChange}
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        >
          <option value="">Uncategorized</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          value={form.amount}
          onChange={handleChange}
          placeholder="0.00"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
        <input
          name="date"
          type="date"
          value={form.date}
          onChange={handleChange}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "Saving…" : "Add"}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;
