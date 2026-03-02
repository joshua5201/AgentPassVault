import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label?: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search",
  emptyText = "No results",
  disabled = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = options.find((option) => option.value === value)?.label;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <div className="space-y-1.5 text-sm text-[var(--color-text)]">
      {label ? <span className="font-medium">{label}</span> : null}
      <div className="relative">
        <button
          type="button"
          className={cn(
            "flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-left text-sm text-[var(--color-text)] transition focus:outline-none focus:ring-2 focus:ring-[var(--color-focus)]",
            disabled ? "cursor-not-allowed opacity-60" : "",
          )}
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => {
            if (disabled) {
              return;
            }
            setOpen((previous) => !previous);
          }}
          disabled={disabled}
        >
          <span>{selectedLabel ?? placeholder}</span>
          <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />
        </button>

        {open ? (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-[var(--color-border)] bg-white p-2 shadow-lg">
            <input
              className="w-full rounded-md border border-[var(--color-border)] px-2 py-1.5 text-sm outline-none focus:border-[var(--color-border-strong)]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`${label ?? "Select"} Search`}
            />
            <ul className="mt-2 max-h-56 overflow-auto" role="listbox">
              {filteredOptions.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[var(--color-surface-muted)]",
                      option.value === value ? "bg-[var(--color-surface-muted)] font-medium" : "",
                    )}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
              {filteredOptions.length === 0 ? (
                <li className="px-2 py-2 text-sm text-[var(--color-text-muted)]">{emptyText}</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
