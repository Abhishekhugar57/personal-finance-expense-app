import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "../ui/Card";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444", "#7C3AED", "#06B6D4"];

const ExpensePie = ({ data }) => {
  const hasData = data?.length > 0;
  const total = data?.reduce((acc, curr) => acc + curr.amount, 0) || 0;
  const formatCurrency = (value) => `₹${Number(value).toLocaleString("en-IN")}`;

  return (
    <Card hover className="!p-4 md:!p-6">
      <h2 className="text-base font-semibold text-[var(--app-text)] mb-4">Category Breakdown</h2>
      {!hasData ? (
        <div className="h-[260px] flex items-center justify-center text-[var(--app-text-muted)] text-sm">
          No expense data available
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={90} paddingAngle={3} stroke="none">
                  {data.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={{ borderRadius: 12, border: "1px solid var(--app-border)", background: "var(--app-surface)" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] text-[var(--app-text-muted)] uppercase">Total</p>
              <p className="text-lg font-bold text-[var(--app-text)]">{formatCurrency(total)}</p>
            </div>
          </div>
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {data.map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="truncate text-[var(--app-text)]">{item.category}</span>
                </div>
                <span className="text-[var(--app-text-muted)] shrink-0 ml-2">
                  {total > 0 ? ((item.amount / total) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default ExpensePie;
