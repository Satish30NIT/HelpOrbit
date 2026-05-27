import type { ReactNode } from "react";
import { PageShell } from "./PageShell";

type Props = {
  /** KPI / stat cards row */
  metrics?: ReactNode;
  /** Primary actions (e.g. Add) — directly below the app page header */
  toolbar?: ReactNode;
  /** Search & filter toolbar */
  filters?: ReactNode;
  /** Main table module (use DataTableModule) */
  table: ReactNode;
  className?: string;
};

/**
 * Standard list-page layout: toolbar → metrics → filters → flex table area.
 * Use with usePageHeader() for title in the app header (actions go in toolbar).
 */
export function DataPageLayout({ metrics, toolbar, filters, table, className = "" }: Props) {
  return (
    <PageShell className={className}>
      {toolbar && <section className="page-section page-section--toolbar">{toolbar}</section>}
      {metrics && <section className="page-section page-section--metrics">{metrics}</section>}
      {filters && <section className="page-section page-section--filters">{filters}</section>}
      <section className="page-section page-section--table">{table}</section>
    </PageShell>
  );
}

export function PageToolbar({ children }: { children: ReactNode }) {
  return <div className="page-toolbar">{children}</div>;
}

type MetricsProps = {
  children: ReactNode;
  columns?: 2 | 3 | 4;
};

export function PageMetricsRow({ children, columns = 3 }: MetricsProps) {
  const grid =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 4
        ? "sm:grid-cols-2 xl:grid-cols-4"
        : "sm:grid-cols-3";
  return <div className={`page-metrics-grid ${grid}`}>{children}</div>;
}

type FilterProps = {
  children: ReactNode;
  title?: string;
  busy?: boolean;
  busyOverlay?: ReactNode;
  /** Keep search, selects, etc. on one row */
  singleRow?: boolean;
};

export function PageFilterBar({
  children,
  title = "Filters",
  busy,
  busyOverlay,
  singleRow = false,
}: FilterProps) {
  return (
    <div className="page-filter-bar">
      {busyOverlay}
      <div className={`page-filter-bar__inner ${singleRow ? "page-filter-bar__inner--row" : ""}`}>
        <div className="page-filter-bar__label">{title}</div>
        <div
          className={`page-filter-bar__fields ${singleRow ? "page-filter-bar__fields--single-row" : ""} ${busy ? "opacity-60" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

type TableModuleProps = {
  children: ReactNode;
  pagination?: ReactNode;
  loadingOverlay?: ReactNode;
  className?: string;
};

/** Card with scrollable body + pinned pagination footer */
export function DataTableModule({
  children,
  pagination,
  loadingOverlay,
  className = "",
}: TableModuleProps) {
  return (
    <div className={`table-module flex min-h-0 flex-1 flex-col ${className}`.trim()}>
      <div className="table-module-scroll relative min-h-0 flex-1">{children}</div>
      {pagination && (
        <div className="table-module-pagination relative">
          {loadingOverlay}
          {pagination}
        </div>
      )}
    </div>
  );
}
