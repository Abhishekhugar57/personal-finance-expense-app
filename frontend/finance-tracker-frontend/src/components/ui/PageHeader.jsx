import React from "react";

export const PageHeader = ({ title, subtitle, action, icon: Icon }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div className="flex items-center gap-3 min-w-0">
      {Icon ? (
        <div className="h-11 w-11 shrink-0 rounded-2xl bg-[var(--app-primary)] text-white flex items-center justify-center shadow-sm">
          <Icon size={20} aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0">
        <h1 className="text-xl md:text-2xl font-bold text-[var(--app-text)] tracking-tight truncate">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-[var(--app-text-muted)] mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

export default PageHeader;
