import React from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "../ui/Card";

const SavingsGrowthChart = ({ data = [] }) => {
  const chartData = data.map((item) => ({
    ...item,
    savings: (item.income || 0) - (item.expense || 0),
    label: item.month,
  }));

  const hasData = chartData.some((d) => d.savings !== 0);
  const formatCurrency = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  return (
    <Card hover className="!p-4 md:!p-6">
      <h2 className="text-base font-semibold text-[var(--app-text)] mb-4">Savings Growth</h2>
      {!hasData ? (
        <div className="h-[200px] flex items-center justify-center text-[var(--app-text-muted)] text-sm">
          No savings data yet
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--app-chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "var(--app-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={formatCurrency} tick={{ fill: "var(--app-text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
            <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, background: "var(--app-surface)", border: "1px solid var(--app-border)" }} />
            <Area type="monotone" dataKey="savings" stroke="#4F46E5" strokeWidth={2} fill="url(#savingsGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
};

export default SavingsGrowthChart;
