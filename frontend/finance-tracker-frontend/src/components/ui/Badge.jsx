import React from "react";

const tones = {
  primary: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  purple: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export const Badge = ({ children, tone = "neutral", className = "" }) => (
  <span
    className={[
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
      tones[tone] || tones.neutral,
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

export default Badge;
