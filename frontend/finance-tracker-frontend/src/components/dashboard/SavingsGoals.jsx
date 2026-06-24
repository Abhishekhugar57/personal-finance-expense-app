import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Target, ChevronRight } from "lucide-react";
import { formatINR } from "../../utils/format";

const SavingsGoals = ({ goals = [] }) => {
  const activeGoals = goals.filter((g) => g.status !== "completed").slice(0, 3);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
            <Target size={16} />
          </div>
          <h3 className="font-semibold text-[var(--app-text)]">Savings Goals</h3>
        </div>
        <Link
          to="/goals"
          className="text-xs font-semibold text-[var(--app-primary)] flex items-center gap-0.5 hover:underline"
        >
          Manage <ChevronRight size={14} />
        </Link>
      </div>
      {activeGoals.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] text-center py-4">
          No active goals. <Link to="/goals" className="text-[var(--app-primary)]">Create one</Link>
        </p>
      ) : (
        <ul className="space-y-4">
          {activeGoals.map((goal) => {
            const percent = Math.min(
              100,
              (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100
            );
            return (
              <li key={goal._id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-[var(--app-text)]">{goal.name}</span>
                  <span className="text-[var(--app-text-muted)]">{percent.toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--app-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">
                  {formatINR(goal.currentAmount)} of {formatINR(goal.targetAmount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default SavingsGoals;
