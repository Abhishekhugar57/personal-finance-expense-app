import React from "react";
import { Button } from "./Button";

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <div
    className="flex flex-col items-center justify-center text-center py-12 px-6 rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)]"
    role="status"
  >
    {Icon ? (
      <div className="h-14 w-14 rounded-2xl bg-[var(--app-primary)]/10 text-[var(--app-primary)] flex items-center justify-center mb-4">
        <Icon size={28} aria-hidden />
      </div>
    ) : null}
    <h3 className="text-lg font-semibold text-[var(--app-text)]">{title}</h3>
    {description ? (
      <p className="mt-1 text-sm text-[var(--app-text-muted)] max-w-sm">{description}</p>
    ) : null}
    {actionLabel && onAction ? (
      <Button className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);

export default EmptyState;
