import { Eye, EyeOff } from "lucide-react";
import { Badge, Button, Table } from "../ui";
import { EmptyState } from "../states/EmptyState";

export interface SecretCatalogRow {
  id: string;
  name: string;
  encryptedValue: string;
  updatedAt: string;
}

interface SecretsCatalogViewProps {
  loading: boolean;
  rows: SecretCatalogRow[];
  revealedValues: Record<string, string>;
  onToggleReveal: (row: SecretCatalogRow) => void;
}

export function SecretsCatalogView({ loading, rows, revealedValues, onToggleReveal }: SecretsCatalogViewProps) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No secrets yet"
        message={loading ? "Loading secrets..." : "Create your first encrypted secret to support request fulfillment."}
        actionLabel="Create secret"
      />
    );
  }

  return (
    <Table
      headers={["Name", "Updated", "Value", "Status"]}
      rows={rows.map((secret) => {
        const value = revealedValues[secret.id];
        const canReveal = Boolean(secret.encryptedValue);

        return [
          secret.name,
          secret.updatedAt,
          <div key={`${secret.id}-value`} className="flex items-center gap-2">
            <code className="rounded bg-[var(--color-surface-muted)] px-2 py-1 text-xs">
              {value ? value : "••••••••••••"}
            </code>
            {canReveal ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onToggleReveal(secret)}
                startIcon={value ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              >
                {value ? "Hide" : "Show"}
              </Button>
            ) : null}
          </div>,
          <Badge key={`${secret.id}-active`} tone="success">
            Active
          </Badge>,
        ];
      })}
    />
  );
}
