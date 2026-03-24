import type { TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Textarea({
  label,
  hint,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <label
      className="block space-y-1.5 text-sm text-[var(--color-text)]"
      htmlFor={textareaId}
    >
      {label ? <span className="font-medium">{label}</span> : null}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-24 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] shadow-sm outline-none transition placeholder:text-[var(--color-text-subtle)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-focus)]",
          error ? "border-[var(--color-danger)]" : "",
          className,
        )}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      ) : null}
      {!error && hint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>
      ) : null}
    </label>
  );
}
