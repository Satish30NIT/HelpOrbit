"use client";

import { BrandedLoader } from "./BrandedLoader";

type Props = {
  show: boolean;
  label?: string;
  /** Slim bar at top of container (good for tables on refetch) */
  bar?: boolean;
  /** Progress bar only — does not block interaction */
  barOnly?: boolean;
  /** Lighter overlay that does not block clicks (filters, footer) */
  compact?: boolean;
};

export function LoadingOverlay({ show, label, bar, barOnly, compact }: Props) {
  if (!show) return null;

  if (barOnly) {
    return <div className="loading-progress-bar" role="presentation" aria-hidden />;
  }

  return (
    <>
      {bar ? <div className="loading-progress-bar" role="presentation" aria-hidden /> : null}
      <div
        className={compact ? "loading-overlay-compact" : "loading-overlay"}
        aria-hidden={false}
      >
        <BrandedLoader
          size={compact ? "sm" : "md"}
          message={label}
          showMessage={Boolean(label) && !compact}
          ring
        />
      </div>
    </>
  );
}
