import React from "react";
import { formatCurrency } from "../../utils/helper";

/**
 * Summary metric card.
 * Props:
 *   label      – string
 *   amount     – number (major units)
 *   currency   – ISO currency code
 *   icon       – React node (Lucide component or any JSX)
 *   colorClass – Tailwind classes for the icon wrapper bg + text color
 */
const SummaryCard = ({ label, amount, currency = "USD", icon, colorClass }) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-500">{label}</span>
    </div>
    <p className="text-2xl font-bold text-slate-800">
      {formatCurrency(amount, currency)}
    </p>
  </div>
);

export default SummaryCard;
