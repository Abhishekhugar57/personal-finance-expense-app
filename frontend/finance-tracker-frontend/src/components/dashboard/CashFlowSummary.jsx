import React from "react";
import { Card } from "../ui/Card";
import { Activity } from "lucide-react";
import { formatINR } from "../../utils/format";

const CashFlowSummary = ({ income, expense, savings }) => (
  <Card>
    <div className="flex items-center gap-2 mb-4">
      <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center">
        <Activity size={16} />
      </div>
      <h3 className="font-semibold text-[var(--app-text)]">Cash Flow</h3>
    </div>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-[var(--app-text-muted)]">Inflow</span>
        <span className="text-sm font-bold text-emerald-600">+{formatINR(income)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm text-[var(--app-text-muted)]">Outflow</span>
        <span className="text-sm font-bold text-red-500">-{formatINR(expense)}</span>
      </div>
      <div className="h-px bg-[var(--app-border)]" />
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-[var(--app-text)]">Net Cash Flow</span>
        <span className={`text-base font-bold ${savings >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {savings >= 0 ? "+" : ""}{formatINR(savings)}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[var(--app-border)] overflow-hidden flex">
        {income > 0 ? (
          <>
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${Math.min(100, (income / (income + expense)) * 100)}%` }}
            />
            <div
              className="h-full bg-red-400 transition-all"
              style={{ width: `${Math.min(100, (expense / (income + expense)) * 100)}%` }}
            />
          </>
        ) : null}
      </div>
    </div>
  </Card>
);

export default CashFlowSummary;
