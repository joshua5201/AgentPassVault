import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type ToastTone = "info" | "success" | "error";

interface ToastProps {
  tone?: ToastTone;
  title: string;
  children?: ReactNode;
}

const toneClass: Record<ToastTone, string> = {
  info: "border-sky-200 bg-sky-50 text-sky-900",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-rose-200 bg-rose-50 text-rose-900",
};

export function Toast({ tone = "info", title, children }: ToastProps) {
  return (
    <div className={cn("rounded-lg border px-4 py-3", toneClass[tone])}>
      <p className="text-sm font-semibold">{title}</p>
      {children ? <div className="mt-1 text-sm opacity-90">{children}</div> : null}
    </div>
  );
}
