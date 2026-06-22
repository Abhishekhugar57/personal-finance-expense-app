import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import SummaryCards from "./dashboard/SummaryCard";
import IncomeExpenseChart from "./dashboard/IncomeExpChart";
import ExpensePie from "./dashboard/ExpensePie";
import LoanSummaryCards from "./dashboard/LoanSummaryCards";
import RecentTransactions from "./dashboard/RecentTransctions";
import UpcomingPayments from "./dashboard/UpcomingPayments";
import SavingsGoals from "./dashboard/SavingsGoals";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("last3Months");

  const user = useSelector((state) => state.user); // ✅ ADD THIS

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const handleFinanceRefresh = () => fetchDashboard({ silent: true });
    window.addEventListener("finance-data-changed", handleFinanceRefresh);
    return () => {
      window.removeEventListener("finance-data-changed", handleFinanceRefresh);
    };
  }, [user]);

  const fetchDashboard = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const [overviewRes, loansRes] = await Promise.all([
        axios.get("/api/dashboard/overview", { withCredentials: true }),
        axios.get("/api/get/loan", { withCredentials: true }),
      ]);
      setData(overviewRes.data);
      setLoans(loansRes.data || []);
    } catch (error) {
      console.error("Dashboard error:", error);
      setError("Failed to load dashboard data.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredOverview = useMemo(() => {
    if (!data) return null;

    const allTransactions = data.transactions || [];
    const now = new Date();
    const parseTxnDate = (txn) => {
      const rawDate = txn.transaction_date || txn.date;
      if (!rawDate) return null;

      // Parse YYYY-MM-DD as local date to avoid UTC timezone shifts.
      if (typeof rawDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        const [y, m, d] = rawDate.split("-").map(Number);
        const localDate = new Date(y, m - 1, d);
        return Number.isNaN(localDate.getTime()) ? null : localDate;
      }

      const parsed = new Date(rawDate);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    };
    const isOpeningBalanceTxn = (txn) =>
      txn?.isOpeningBalance === true ||
      String(txn?.note || "")
        .trim()
        .toLowerCase() === "opening balance" ||
      String(txn?.category_id?.name || "")
        .trim()
        .toLowerCase() === "opening balance";

    const filteredTransactions = allTransactions.filter((txn) => {
      const txnDate = parseTxnDate(txn);
      if (!txnDate) return false;

      if (filter === "thisMonth") {
        return (
          txnDate.getMonth() === now.getMonth() &&
          txnDate.getFullYear() === now.getFullYear()
        );
      }

      if (filter === "last3Months") {
        const pastDate = new Date(now);
        pastDate.setHours(0, 0, 0, 0);
        pastDate.setMonth(now.getMonth() - 3);
        return txnDate >= pastDate && txnDate <= now;
      }

      if (filter === "thisYear") {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);
        return txnDate >= startOfYear && txnDate <= endOfToday;
      }

      return true;
    });

    const income = filteredTransactions
      .filter((t) => t.type === "income" && !isOpeningBalanceTxn(t))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

    const savings = income - expense;

    const monthlyMap = {};
    const categoryMap = {};

    filteredTransactions.forEach((txn) => {
      const amount = Number(txn.amount || 0);
      const d = parseTxnDate(txn);
      if (!d) return;

      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: d.toLocaleString("default", { month: "short" }),
          year: d.getFullYear(),
          income: 0,
          expense: 0,
          sortDate: new Date(d.getFullYear(), d.getMonth(), 1),
        };
      }

      if (txn.type === "income" && !isOpeningBalanceTxn(txn)) {
        monthlyMap[key].income += amount;
      } else if (txn.type === "expense") {
        monthlyMap[key].expense += amount;
        const categoryName = txn.category_id?.name || "Other";
        categoryMap[categoryName] = (categoryMap[categoryName] || 0) + amount;
      }
    });

    const monthlyData = Object.values(monthlyMap).sort(
      (a, b) => a.sortDate - b.sortDate
    );

    const categoryBreakdown = Object.keys(categoryMap).map((key) => ({
      category: key,
      amount: categoryMap[key],
    }));

    const recentTransactions = [...filteredTransactions]
      .sort((a, b) => parseTxnDate(b) - parseTxnDate(a))
      .slice(0, 5);

    return {
      ...data,
      totalBalance: Number(data.totalBalance || 0),
      income,
      expense,
      savings,
      monthlyData,
      categoryBreakdown,
      recentTransactions,
    };
  }, [data, filter]);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 animate-pulse pb-24">
        <div className="h-24 bg-white rounded-2xl" />
        <div className="h-72 bg-white rounded-2xl" />
        <div className="h-72 bg-white rounded-2xl" />
      </div>
    );
  }

  if (!data || !filteredOverview || error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
        {error || "Failed to load dashboard."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-full px-3 py-3 md:px-6 md:py-6 bg-gray-50 space-y-4 md:space-y-8 overflow-x-hidden pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-800 leading-tight">
          Financial Overview
        </h1>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
        >
          <option value="thisMonth">This Month</option>
          <option value="last3Months">Last 3 Months</option>
          <option value="thisYear">This Year</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="scale-[0.95] md:scale-100 origin-top">
        <SummaryCards data={filteredOverview} />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        <IncomeExpenseChart data={filteredOverview.monthlyData} />
        <ExpensePie data={filteredOverview.categoryBreakdown} />
      </div>

      {/* Loan Summary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 leading-tight">
            Loans
          </h2>
          <p className="text-sm text-gray-500">
            Real-time totals from your loans
          </p>
        </div>
        <LoanSummaryCards loans={loans} />
      </div>

      {/* Bottom Section */}
    </div>
  );
};

export default Dashboard;
