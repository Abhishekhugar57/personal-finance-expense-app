import React from "react";

const variants = {
  primary:
    "bg-[var(--app-primary)] text-white hover:bg-[var(--app-primary-hover)] shadow-sm",
  secondary:
    "bg-[var(--app-surface)] text-[var(--app-text)] border border-[var(--app-border)] hover:bg-[var(--app-surface-elevated)]",
  danger: "bg-[var(--app-danger)] text-white hover:opacity-90",
  ghost:
    "bg-transparent text-[var(--app-text-muted)] hover:bg-[var(--app-surface-elevated)] hover:text-[var(--app-text)]",
  success: "bg-[var(--app-success)] text-white hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-2 text-xs rounded-lg min-h-[36px]",
  md: "px-4 py-2.5 text-sm rounded-xl min-h-[44px]",
  lg: "px-5 py-3 text-sm rounded-xl min-h-[48px]",
  icon: "p-2.5 rounded-xl min-h-[44px] min-w-[44px]",
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  loading = false,
  disabled,
  ...props
}) => (
  <button
    type="button"
    disabled={disabled || loading}
    className={[
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200",
      "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--app-primary)]",
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      className,
    ].join(" ")}
    {...props}
  >
    {loading ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
    ) : null}
    {children}
  </button>
);

export default Button;
