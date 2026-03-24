import type { HTMLAttributes, ReactNode } from "react";
import { CopyLinkButton } from "./CopyLinkButton";
import { cn } from "../../lib/cn";

type DetailPanelTone = "requests" | "secrets" | "agents";

interface DetailPanelProps extends HTMLAttributes<HTMLDivElement> {
  tone: DetailPanelTone;
  eyebrow: string;
  heading: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  copyLink?: string;
}

interface DetailPanelSectionProps extends HTMLAttributes<HTMLElement> {
  heading: string;
  children: ReactNode;
}

function toneAccentClass(tone: DetailPanelTone) {
  void tone;
  return "bg-[var(--color-accent-strong)] text-[var(--color-accent-text)]";
}

export function DetailPanel({
  tone,
  eyebrow,
  heading,
  description,
  actions,
  copyLink,
  className,
  children,
  ...props
}: DetailPanelProps) {
  return (
    <aside
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] shadow-[var(--color-shadow)]",
        className,
      )}
      {...props}
    >
      <div
        className={cn("absolute inset-y-0 left-0 w-1", toneAccentClass(tone))}
      />

      <header className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-subtle)] px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-subtle)]">
              {eyebrow}
            </p>
            <div className="mt-2 text-[var(--color-text)]">{heading}</div>
            {description ? (
              <div className="mt-2 text-sm text-[var(--color-text-muted)]">
                {description}
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {copyLink ? <CopyLinkButton link={copyLink} /> : null}
            {actions}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5">{children}</div>
    </aside>
  );
}

export function DetailPanelSection({
  heading,
  className,
  children,
  ...props
}: DetailPanelSectionProps) {
  return (
    <section
      className={cn(
        "border-t border-[var(--color-border)] py-5 first:border-t-0",
        className,
      )}
      {...props}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-subtle)]">
        {heading}
      </p>
      <div className="mt-2">{children}</div>
    </section>
  );
}
