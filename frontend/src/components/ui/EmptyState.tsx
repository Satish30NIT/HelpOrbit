import type { LucideIcon } from "lucide-react";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div className="table-empty">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-card)] border border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
        <Icon className="h-6 w-6" aria-hidden />
      </div>
      <p className="type-card-title text-[var(--text-primary)]">{title}</p>
      {description && (
        <p className="type-meta mt-1 max-w-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
