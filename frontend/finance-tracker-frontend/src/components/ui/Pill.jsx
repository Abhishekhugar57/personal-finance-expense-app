import React from "react";

export const Pill = ({ active, onClick, children, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border min-h-[40px]",
      active
        ? "bg-[var(--app-primary)] text-white border-[var(--app-primary)] shadow-sm"
        : "bg-[var(--app-surface)] text-[var(--app-text-muted)] border-[var(--app-border)] hover:border-[var(--app-primary)]/40",
      className,
    ].join(" ")}
  >
    {children}
  </button>
);

export default Pill;
