import type { HTMLAttributes } from "react";
import { Bot, Shield, Vault } from "lucide-react";
import { cn } from "../../lib/cn";

type EntityBadgeKind = "request" | "secret" | "agent";

interface EntityBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  kind: EntityBadgeKind;
  href?: string;
}

function iconForKind(kind: EntityBadgeKind) {
  if (kind === "request") {
    return <Shield className="h-3.5 w-3.5" />;
  }

  if (kind === "secret") {
    return <Vault className="h-3.5 w-3.5" />;
  }

  return <Bot className="h-3.5 w-3.5" />;
}

export function EntityBadge({
  kind,
  href,
  className,
  children,
  ...props
}: EntityBadgeProps) {
  const sharedClassName = cn(
    "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-full border border-[var(--color-entity-border)] bg-[var(--color-entity-soft)] px-2.5 py-1 text-xs font-semibold tracking-[0.01em] text-[var(--color-entity-text)]",
    href
      ? "transition hover:border-[var(--color-entity-strong)] hover:bg-[var(--color-surface-subtle)]"
      : null,
    className,
  );

  const content = (
    <>
      <span className="shrink-0 text-[var(--color-entity-strong)]">
        {iconForKind(kind)}
      </span>
      {children ? <span className="min-w-0 truncate">{children}</span> : null}
    </>
  );

  if (href) {
    return (
      <a href={href} className={sharedClassName}>
        {content}
      </a>
    );
  }

  return (
    <span className={sharedClassName} {...props}>
      {content}
    </span>
  );
}
