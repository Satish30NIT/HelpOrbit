type Variant = "success" | "warning" | "danger" | "info" | "muted" | "pending";

const classMap: Record<Variant, string> = {
  success: "status-chip status-chip--success",
  warning: "status-chip status-chip--warning",
  danger: "status-chip status-chip--danger",
  info: "status-chip status-chip--info",
  muted: "status-chip status-chip--muted",
  pending: "status-chip status-chip--pending",
};

type Props = {
  variant: Variant;
  children: React.ReactNode;
  className?: string;
};

export function StatusChip({ variant, children, className = "" }: Props) {
  return (
    <span className={`${classMap[variant]} ${className}`.trim()}>{children}</span>
  );
}
