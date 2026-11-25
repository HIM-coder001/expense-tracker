import React from "react";
import { LuTrash2, LuCircleDollarSign, LuReceipt } from "react-icons/lu";
import { getIcon } from "../../utils/iconMap";
import { formatDate, formatCurrency } from "../../utils/helper";

/**
 * Reusable list for income or expense records.
 * Props:
 *   items        – array of income/expense objects
 *   type         – "income" | "expense"
 *   onDelete     – (id) => void
 *   loadingId    – id currently being deleted (shows spinner)
 */
const TransactionList = ({ items = [], type, onDelete, loadingId }) => {
  const isIncome = type === "income";

  if (!items.length) {
    const EmptyIcon = isIncome ? LuCircleDollarSign : LuReceipt;
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl mb-3 ${
          isIncome ? "bg-emerald-50 text-emerald-400" : "bg-rose-50 text-rose-400"
        }`}>
          <EmptyIcon size={32} />
        </div>
        <p className="text-sm">No {isIncome ? "income" : "expense"} records yet</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const id    = item._id;
        const title = isIncome ? item.source : item.title;

        return (
          <li
            key={id}
            className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
          >
            {/* Icon */}
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg shrink-0 ${
              isIncome ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-500"
            }`}>
              {getIcon(item.icon, isIncome ? <LuCircleDollarSign size={18} /> : <LuReceipt size={18} />)}
            </div>

            {/* Title + date */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date)}</p>
            </div>

            {/* Amount */}
            <span
              className={`text-sm font-semibold shrink-0 ${
                isIncome ? "text-emerald-600" : "text-rose-500"
              }`}
            >
              {isIncome ? "+" : "-"}{formatCurrency(item.amount, item.currencyCode)}
            </span>

            {/* Delete */}
            <button
              onClick={() => onDelete(id)}
              disabled={loadingId === id}
              className="ml-2 shrink-0 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-40"
              aria-label="Delete"
            >
              <LuTrash2 size={16} />
            </button>
          </li>
        );
      })}
    </ul>
  );
};

export default TransactionList;
