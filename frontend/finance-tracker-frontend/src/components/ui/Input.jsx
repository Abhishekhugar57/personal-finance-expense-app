import React from "react";

const fieldClass =
  "w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-4 py-3 text-sm text-[var(--app-text)] shadow-sm transition focus:border-[var(--app-primary)] focus:ring-2 focus:ring-[var(--app-primary)]/20 outline-none disabled:opacity-60";

export const Input = ({ label, error, hint, id, className = "", ...props }) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-xs font-semibold text-[var(--app-text-muted)]">
          {label}
        </label>
      ) : null}
      <input id={inputId} className={`${fieldClass} ${className}`} aria-invalid={!!error} {...props} />
      {error ? (
        <p className="text-xs text-[var(--app-danger)]" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--app-text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
};

export const Select = ({ label, error, id, children, className = "", ...props }) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-xs font-semibold text-[var(--app-text-muted)]">
          {label}
        </label>
      ) : null}
      <select id={selectId} className={`${fieldClass} ${className}`} aria-invalid={!!error} {...props}>
        {children}
      </select>
      {error ? <p className="text-xs text-[var(--app-danger)]" role="alert">{error}</p> : null}
    </div>
  );
};

export const Textarea = ({ label, error, id, className = "", ...props }) => {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={textareaId} className="text-xs font-semibold text-[var(--app-text-muted)]">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={`${fieldClass} min-h-[100px] resize-y ${className}`}
        aria-invalid={!!error}
        {...props}
      />
      {error ? <p className="text-xs text-[var(--app-danger)]" role="alert">{error}</p> : null}
    </div>
  );
};

export default Input;
