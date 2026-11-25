// Side-nav menu items used by the DashboardLayout
export const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: "LuLayoutDashboard" },
  { label: "Income",    path: "/income",    icon: "LuTrendingUp"      },
  { label: "Expenses",  path: "/expense",   icon: "LuTrendingDown"    },
];

// Default chart colours
export const CHART_COLORS = {
  income:  "#7c3aed",
  expense: "#f43f5e",
  balance: "#0ea5e9",
};

export const CURRENCY_OPTIONS = [
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "KES", label: "Kenyan Shilling (KSh)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
];
