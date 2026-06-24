import React from "react";
import { Card } from "../ui/Card";
import { Heart } from "lucide-react";
import { calcHealthScore } from "../../utils/format";

const getScoreColor = (score) => {
  if (score >= 75) return "text-emerald-500";
  if (score >= 50) return "text-amber-500";
  return "text-red-500";
};

const getScoreLabel = (score) => {
  if (score >= 75) return "Excellent";
  if (score >= 50) return "Good";
  if (score >= 30) return "Fair";
  return "Needs Attention";
};

const FinancialHealthScore = ({ income, expense, loanBurden = 0 }) => {
  const savingsRate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const score = calcHealthScore({ income, expense, savingsRate, loanBurden });

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card className="flex flex-col items-center">
      <div className="flex items-center gap-2 w-full mb-4">
        <div className="h-8 w-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-500 flex items-center justify-center">
          <Heart size={16} />
        </div>
        <h3 className="font-semibold text-[var(--app-text)]">Financial Health</h3>
      </div>
      <div className="relative">
        <svg width="120" height="120" className="-rotate-90">
          <circle cx="60" cy="60" r="42" fill="none" stroke="var(--app-border)" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r="42"
            fill="none"
            stroke="var(--app-primary)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
          <span className="text-[10px] text-[var(--app-text-muted)]">/ 100</span>
        </div>
      </div>
      <p className={`mt-3 text-sm font-semibold ${getScoreColor(score)}`}>{getScoreLabel(score)}</p>
      <p className="text-xs text-[var(--app-text-muted)] text-center mt-1">
        Based on savings rate & spending habits
      </p>
    </Card>
  );
};

export default FinancialHealthScore;
