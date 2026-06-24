import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "../ui/Card";

const IncomeExpenseChart = ({ data }) => {
  const hasData = data?.some((item) => item.income > 0 || item.expense > 0);
  const formatCurrency = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

  return (
    <Card hover className="!p-4 md:!p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-base font-semibold text-[var(--app-text)]">Income vs Expense</h2>
        <span className="text-xs text-[var(--app-text-muted)]">Monthly trend</span>
      </div>
      {!hasData ? (
        <div className="h-[260px] flex flex-col items-center justify-center text-[var(--app-text-muted)] text-sm">
          <p>No financial activity yet</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} barGap={6} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-chart-grid)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "var(--app-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCurrency} tick={{ fill: "var(--app-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
            <Tooltip
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ borderRadius: 12, border: "1px solid var(--app-border)", background: "var(--app-surface)", color: "var(--app-text)" }}
            />
            <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} stroke="none" />
            <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} stroke="none" />
          </BarChart>
        </ResponsiveContainer>
      )}
      <div className="flex gap-4 mt-3 text-xs text-[var(--app-text-muted)]">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />Income</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-500 rounded-full" />Expense</span>
      </div>
    </Card>
  );
};

export default IncomeExpenseChart;
