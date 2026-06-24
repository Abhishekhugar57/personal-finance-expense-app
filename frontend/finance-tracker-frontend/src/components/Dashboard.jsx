import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import api from "../api/client";
import { goalApi } from "../services/featureService";
import SummaryCards from "./dashboard/SummaryCard";
import WelcomeCard from "./dashboard/WelcomeCard";
import IncomeExpenseChart from "./dashboard/IncomeExpChart";
import ExpensePie from "./dashboard/ExpensePie";
import SavingsGrowthChart from "./dashboard/SavingsGrowthChart";
import LoanSummaryCards from "./dashboard/LoanSummaryCards";
import RecentTransactions from "./dashboard/RecentTransctions";
import UpcomingPayments from "./dashboard/UpcomingPayments";
import SavingsGoals from "./dashboard/SavingsGoals";
import CashFlowSummary from "./dashboard/CashFlowSummary";
import FinancialHealthScore from "./dashboard/FinancialHealthScore";
import SpendingInsights from "./dashboard/SpendingInsights";
import { SkeletonDashboard } from "./ui/Skeleton";
import { Select } from "./ui/Input";
import { parseTxnDate } from "../utils/format";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loans, setLoans] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("last3Months");
  const user = useSelector((state) => state.user);

  const fetchDashboard = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setError("");
      const [overviewRes, loansRes, goalsRes] = await Promise.all([
        api.get("/dashboard/overview"),
        api.get("/get/loan"),
        goalApi.list().catch(() => ({ data: [] })),
      ]);
      setData(overviewRes.data);
      setLoans(loansRes.data || []);
      setGoals(goalsRes.data || []);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchDashboard();
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;
    const handleFinanceRefresh = () => fetchDashboard({ silent: true });
    window.addEventListener("finance-data-changed", handleFinanceRefresh);
    return () => window.removeEventListener("finance-data-changed", handleFinanceRefresh);
  }, [user]);

  const filteredOverview = useMemo(() => {
    if (!data) return null;
    const allTransactions = data.transactions || [];
    const now = new Date();

    const isOpeningBalanceTxn = (txn) =>
      txn?.isOpeningBalance === true ||
      String(txn?.note || "").trim().toLowerCase() === "opening balance";

    const filteredTransactions = allTransactions.filter((txn) => {
      const txnDate = parseTxnDate(txn);
      if (!txnDate) return false;
      if (filter === "thisMonth") {
        return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
      }
      if (filter === "last3Months") {
        const pastDate = new Date(now);
        pastDate.setMonth(now.getMonth() - 3);
        return txnDate >= pastDate && txnDate <= now;
      }
      if (filter === "thisYear") {
        return txnDate.getFullYear() === now.getFullYear();
      }
      return true;
    });

    const income = filteredTransactions
      .filter((t) => t.type === "income" && !isOpeningBalanceTxn(t))
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);

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
      if (txn.type === "income" && !isOpeningBalanceTxn(txn)) monthlyMap[key].income += amount;
      else if (txn.type === "expense") {
        monthlyMap[key].expense += amount;
        const cat = txn.category_id?.name || "Other";
        categoryMap[cat] = (categoryMap[cat] || 0) + amount;
      }
    });

    const loanBurden = loans
      .filter((l) => l.type === "TAKEN" && l.status === "ACTIVE")
      .reduce((s, l) => s + Number(l.outstandingAmount || 0), 0);

    return {
      ...data,
      totalBalance: Number(data.totalBalance || 0),
      income,
      expense,
      savings: income - expense,
      monthlyData: Object.values(monthlyMap).sort((a, b) => a.sortDate - b.sortDate),
      categoryBreakdown: Object.keys(categoryMap).map((k) => ({ category: k, amount: categoryMap[k] })),
      recentTransactions: [...filteredTransactions]
        .sort((a, b) => parseTxnDate(b) - parseTxnDate(a))
        .slice(0, 5),
      loanBurden,
    };
  }, [data, filter, loans]);

  if (loading) return <SkeletonDashboard />;
  if (!data || !filteredOverview || error) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[var(--app-text-muted)]">
        {error || "Failed to load dashboard."}
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="hidden md:block text-2xl font-bold text-[var(--app-text)]">Dashboard</h1>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full sm:w-auto sm:min-w-[180px]"
          aria-label="Date filter"
        >
          <option value="thisMonth">This Month</option>
          <option value="last3Months">Last 3 Months</option>
          <option value="thisYear">This Year</option>
        </Select>
      </div>

      <WelcomeCard balance={filteredOverview.totalBalance} />

      <SummaryCards data={filteredOverview} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <CashFlowSummary
          income={filteredOverview.income}
          expense={filteredOverview.expense}
          savings={filteredOverview.savings}
        />
        <FinancialHealthScore
          income={filteredOverview.income}
          expense={filteredOverview.expense}
          loanBurden={filteredOverview.loanBurden > 0 ? 0.3 : 0}
        />
        <SpendingInsights
          categoryBreakdown={filteredOverview.categoryBreakdown}
          expense={filteredOverview.expense}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <IncomeExpenseChart data={filteredOverview.monthlyData} />
        <ExpensePie data={filteredOverview.categoryBreakdown} />
      </div>

      <SavingsGrowthChart data={filteredOverview.monthlyData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <RecentTransactions transactions={filteredOverview.recentTransactions} />
        <UpcomingPayments loans={loans} />
      </div>

      <SavingsGoals goals={goals} />

      <div className="space-y-4">
        <h2 className="text-base font-semibold text-[var(--app-text)]">Loan Summary</h2>
        <LoanSummaryCards loans={loans} />
      </div>
    </div>
  );
};

export default Dashboard;
