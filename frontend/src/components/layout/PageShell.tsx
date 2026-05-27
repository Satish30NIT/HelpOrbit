import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Full-height module layout (tables, split views) */
  fill?: boolean;
  className?: string;
};

/**
 * Standard dashboard page wrapper — use on every module page for consistent
 * spacing, width, and scroll behavior.
 */
export function PageShell({ children, fill = true, className = "" }: Props) {
  return (
    <div
      className={`page-shell ${fill ? "page-shell--fill" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
