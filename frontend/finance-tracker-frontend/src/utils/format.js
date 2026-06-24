export const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatPercent = (n) =>
  `${Number(n || 0).toFixed(1)}%`;

export const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export const toDateInputValue = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const parseTxnDate = (txn) => {
  const rawDate = txn?.transaction_date || txn?.date;
  if (!rawDate) return null;
  if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    const [y, m, d] = rawDate.split("-").map(Number);
    const localDate = new Date(y, m - 1, d);
    return Number.isNaN(localDate.getTime()) ? null : localDate;
  }
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const getInitials = (name) =>
  String(name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export const calcSavingsRate = (income, expense) => {
  if (!income || income <= 0) return 0;
  return Math.max(0, ((income - expense) / income) * 100);
};

export const calcHealthScore = ({ income, expense, savingsRate, loanBurden = 0 }) => {
  let score = 50;
  if (income > 0) {
    const expenseRatio = expense / income;
    if (expenseRatio < 0.5) score += 25;
    else if (expenseRatio < 0.7) score += 15;
    else if (expenseRatio < 0.9) score += 5;
    else score -= 10;
  }
  if (savingsRate >= 20) score += 20;
  else if (savingsRate >= 10) score += 10;
  else if (savingsRate > 0) score += 5;
  else score -= 15;
  score -= Math.min(20, loanBurden * 20);
  return Math.max(0, Math.min(100, Math.round(score)));
};
