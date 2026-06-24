import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Calendar, ChevronRight } from "lucide-react";
import { formatINR, formatDate } from "../../utils/format";

const UpcomingPayments = ({ loans = [] }) => {
  const upcoming = loans
    .filter((l) => l.status === "ACTIVE" && Number(l.outstandingAmount || l.remainingAmount) > 0)
    .filter((l) => l.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .slice(0, 4);

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center">
            <Calendar size={16} />
          </div>
          <h3 className="font-semibold text-[var(--app-text)]">Upcoming Payments</h3>
        </div>
        <Link
          to="/loans"
          className="text-xs font-semibold text-[var(--app-primary)] flex items-center gap-0.5 hover:underline"
        >
          View loans <ChevronRight size={14} />
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <p className="text-sm text-[var(--app-text-muted)] text-center py-6">No upcoming payments</p>
      ) : (
        <ul className="space-y-3">
          {upcoming.map((loan) => (
            <li
              key={loan._id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--app-bg)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--app-text)] truncate">
                  {loan.personName}
                </p>
                <p className="text-xs text-[var(--app-text-muted)]">
                  Due {formatDate(loan.dueDate)}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[var(--app-text)]">
                  {formatINR(loan.outstandingAmount || loan.remainingAmount)}
                </p>
                <Badge tone={loan.type === "TAKEN" ? "warning" : "primary"}>
                  {loan.type === "TAKEN" ? "Pay" : "Receive"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};

export default UpcomingPayments;
