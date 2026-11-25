import moment from "moment";

/** Format a Date or ISO string to "DD MMM YYYY" */
export const formatDate = (date) =>
  date ? moment(date).format("DD MMM YYYY") : "—";

/** Format a number as a currency string (major units, e.g. 1050 → "$10.50") */
export const formatCurrency = (amount, currencyCode = "USD") => {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(num);
};

/** Truncate a string to `max` characters */
export const truncate = (str, max = 40) =>
  str && str.length > max ? `${str.slice(0, max)}…` : str;

/** Trigger a file download from a Blob */
export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/** Build chart-ready data: last N months with income & expense totals */
export const buildMonthlyChartData = (incomeList = [], expenseList = []) => {
  const months = {};

  const add = (list, key) => {
    list.forEach((item) => {
      const month = moment(item.date).format("MMM YY");
      if (!months[month]) months[month] = { month, income: 0, expense: 0 };
      months[month][key] += item.amount;
    });
  };

  add(incomeList, "income");
  add(expenseList, "expense");

  return Object.values(months).sort(
    (a, b) => moment(a.month, "MMM YY") - moment(b.month, "MMM YY")
  );
};
