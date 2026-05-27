type Props = {
  rows?: number;
  cols?: number;
};

export function TableSkeleton({ rows = 6, cols = 5 }: Props) {
  return (
    <div className="p-4" aria-busy="true" aria-label="Loading">
      <div className="mb-3 flex gap-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-4 flex-1 rounded-md" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="mb-2 flex gap-3 border-t border-[var(--border)] pt-3">
          {Array.from({ length: cols }).map((_, c) => (
            <div
              key={c}
              className="skeleton h-8 flex-1 rounded-md"
              style={{ animationDelay: `${(r + c) * 60}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
