import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

export const Modal = ({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
}) => {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg", xl: "max-w-xl" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onMouseDown={onClose}
    >
      <div
        className={[
          "w-full bg-[var(--app-surface)] rounded-t-2xl sm:rounded-2xl shadow-xl",
          "max-h-[90dvh] overflow-y-auto border border-[var(--app-border)]",
          widths[size] || widths.md,
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--app-border)] bg-[var(--app-surface)] p-4 sm:p-5">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-[var(--app-text)]">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-[var(--app-text-muted)]">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X size={18} />
          </Button>
        </div>
        <div className="p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  variant = "danger",
  loading = false,
}) => (
  <Modal open={open} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-[var(--app-text-muted)]">{message}</p>
    <div className="mt-6 flex gap-3">
      <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button
        variant={variant}
        className="flex-1"
        onClick={onConfirm}
        loading={loading}
      >
        {confirmLabel}
      </Button>
    </div>
  </Modal>
);

export default Modal;
