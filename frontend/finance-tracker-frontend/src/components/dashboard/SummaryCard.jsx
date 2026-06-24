import React from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { formatINR, formatPercent, calcSavingsRate } from "../../utils/format";

const icons = {
  balance: Wallet,
  income: TrendingUp,
  expense: TrendingDown,
  savings: PiggyBank,
};

const SummaryCards = ({ data }) => {
  const savingsRate = calcSavingsRate(data.income, data.expense);
  const isNegativeSavings = data.savings < 0;

  const cards = [
    {
      key: "balance",
      title: "Total Balance",
      value: formatINR(data.totalBalance),
      gradient: "from-indigo-500 to-indigo-600",
      sub: "Across all accounts",
    },
    {
      key: "income",
      title: "Monthly Income",
      value: formatINR(data.income),
      gradient: "from-emerald-500 to-emerald-600",
      sub: "This period",
    },
    {
      key: "expense",
      title: "Monthly Expenses",
      value: formatINR(data.expense),
      gradient: "from-red-500 to-rose-600",
      sub: "This period",
    },
    {
      key: "savings",
      title: "Savings Rate",
      value: formatPercent(savingsRate),
      gradient: isNegativeSavings
        ? "from-red-500 to-rose-600"
        : "from-violet-500 to-purple-600",
      sub: formatINR(data.savings) + " saved",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      {cards.map((card, i) => {
        const Icon = icons[card.key];
        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.gradient} text-white p-4 md:p-5 shadow-lg`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] md:text-xs font-medium opacity-90">{card.title}</p>
                <p className="mt-1 text-lg md:text-2xl font-bold tracking-tight truncate">
                  {card.value}
                </p>
                <p className="mt-0.5 text-[10px] md:text-xs opacity-75 truncate">{card.sub}</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Icon size={18} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SummaryCards;
