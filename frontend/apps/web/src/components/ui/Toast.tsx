import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToastTone = "info" | "success" | "error";

interface ToastProps {
  tone?: ToastTone;
  title: string;
  children?: ReactNode;
  onDismiss?: () => void;
}

const toneClass: Record<ToastTone, string> = {
  info: "border-[var(--color-border)] bg-[var(--color-primary-soft)] text-[var(--color-text)]",
  success:
    "border-[var(--color-border)] bg-[var(--color-success-soft)] text-[var(--color-text)]",
  error:
    "border-[var(--color-border)] bg-[var(--color-danger-soft)] text-[var(--color-text)]",
};

export function Toast({
  tone = "info",
  title,
  children,
  onDismiss,
}: ToastProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-panel)] border px-4 py-3 shadow-sm",
        toneClass[tone],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold">{title}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="text-sm opacity-80 transition hover:opacity-100"
          >
            x
          </button>
        ) : null}
      </div>
      {children ? (
        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
          {children}
        </div>
      ) : null}
    </div>
  );
}
