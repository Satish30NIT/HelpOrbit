"use client";

import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

const PAGE_SIZE_OPTIONS = [7, 10, 25, 50] as const;

type Props = {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loading?: boolean;
  itemLabel?: string;
};

function visiblePages(current: number, total: number): number[] {
  if (total <= 1) return total === 0 ? [] : [1];
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set([1, total, current, current - 1, current + 1]);
  return [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
}

export function TablePagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  loading = false,
  itemLabel = "items",
}: Props) {
  const safeTotalPages = Math.max(totalPages, 1);
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages = visiblePages(page, safeTotalPages);

  return (
    <div className="table-footer relative">
      <p className="text-sm text-[var(--text-secondary)]">
        Showing{" "}
        <span className="font-semibold text-[var(--text-primary)]">{start}</span> to{" "}
        <span className="font-semibold text-[var(--text-primary)]">{end}</span> of{" "}
        <span className="font-semibold text-[var(--text-primary)]">{total}</span> {itemLabel}
      </p>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="pagination-btn"
            aria-label="Previous page"
          >
            {loading && page > 1 ? (
              <BrandedLoader size="xs" ring={false} />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              disabled={loading}
              onClick={() => onPageChange(p)}
              className={p === page ? "pagination-btn-active" : "pagination-btn"}
              aria-label={`Page ${p}`}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= safeTotalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="pagination-btn"
            aria-label="Next page"
          >
            {loading && page < safeTotalPages ? (
              <BrandedLoader size="xs" ring={false} />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="relative">
          <select
            value={limit}
            disabled={loading}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="pagination-select appearance-none pr-9"
            aria-label="Items per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n} per page
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
