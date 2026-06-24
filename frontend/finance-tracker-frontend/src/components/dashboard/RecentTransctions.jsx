import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { formatINR, formatDate } from "../../utils/format";

const RecentTransactions = ({ transactions = [] }) => (
  <Card>
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-[var(--app-text)]">Recent Transactions</h3>
      <Link
        to="/transactions"
        className="text-xs font-semibold text-[var(--app-primary)] flex items-center gap-0.5 hover:underline"
      >
        View all <ChevronRight size={14} />
      </Link>
    </div>
    {transactions.length === 0 ? (
      <p className="text-sm text-[var(--app-text-muted)] text-center py-6">No transactions yet</p>
    ) : (
      <ul className="space-y-3">
        {transactions.slice(0, 5).map((txn) => {
          const isIncome = txn.type === "income";
          const Icon = isIncome ? ArrowDownLeft : ArrowUpRight;
          return (
            <li key={txn._id} className="flex items-center gap-3">
              <div
                className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isIncome
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30"
                    : "bg-red-50 text-red-500 dark:bg-red-900/30"
                }`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--app-text)] truncate">
                  {txn.note || txn.category_id?.name || txn.type}
                </p>
                <p className="text-xs text-[var(--app-text-muted)]">
                  {formatDate(txn.transaction_date)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${isIncome ? "text-emerald-600" : "text-red-500"}`}>
                  {isIncome ? "+" : "-"}{formatINR(txn.amount)}
                </p>
                {txn.category_id?.name ? (
                  <Badge tone="neutral" className="mt-0.5">{txn.category_id.name}</Badge>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </Card>
);

export default RecentTransactions;
