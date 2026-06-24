import React, { useMemo } from "react";
import { Card } from "../ui/Card";
import { Lightbulb } from "lucide-react";
import { formatINR } from "../../utils/format";

const SpendingInsights = ({ categoryBreakdown = [], expense = 0 }) => {
  const insights = useMemo(() => {
    if (!categoryBreakdown.length) return [];
    const sorted = [...categoryBreakdown].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const topPercent = expense > 0 ? ((top.amount / expense) * 100).toFixed(0) : 0;
    const items = [
      {
        text: `${top.category} is your top spending category at ${topPercent}% of expenses.`,
        tone: "primary",
      },
    ];
    if (sorted.length > 1) {
      items.push({
        text: `You spent ${formatINR(sorted[1].amount)} on ${sorted[1].category} this period.`,
        tone: "neutral",
      });
    }
    if (expense > 0 && top.amount / expense > 0.4) {
      items.push({
        text: "Consider setting a budget for your top category to control spending.",
        tone: "warning",
      });
    }
    return items.slice(0, 3);
  }, [categoryBreakdown, expense]);

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 flex items-center justify-center">
          <Lightbulb size={16} />
        </div>
        <h3 className="font-semibold text-[var(--app-text)]">Spending Insights</h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)]">Add transactions to see insights</p>
      ) : (
        <ul className="space-y-3">
          {insights.map((item, i) => (
            <li
              key={i}
              className="text-sm text-[var(--app-text-muted)] pl-3 border-l-2 border-[var(--app-primary)]"
            >
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default SpendingInsights;
