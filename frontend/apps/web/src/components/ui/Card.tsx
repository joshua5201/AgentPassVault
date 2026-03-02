import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  actions?: ReactNode;
}

export function Card({ title, description, actions, className, children, ...props }: CardProps) {
  return (
    <article className={cn("rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5", className)} {...props}>
      {title || description || actions ? (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-base font-semibold text-[var(--color-text)]">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}
          </div>
          {actions}
        </header>
      ) : null}
      {children}
    </article>
  );
}
