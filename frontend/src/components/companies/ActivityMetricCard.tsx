"use client";

import {
  Building2,
  LogIn,
  Pencil,
  ScrollText,
  Trash2,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

type Variant = "total" | "created" | "updated" | "deleted" | "logins";

type Props = {
  title: string;
  value: number;
  trend: number;
  variant: Variant;
  loading?: boolean;
  compact?: boolean;
};

const variants: Record<Variant, { icon: LucideIcon; iconClass: string }> = {
  total: {
    icon: ScrollText,
    iconClass: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  created: {
    icon: Building2,
    iconClass: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  updated: {
    icon: Pencil,
    iconClass: "bg-[var(--warning-soft)] text-[var(--warning)]",
  },
  deleted: {
    icon: Trash2,
    iconClass: "bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  logins: {
    icon: LogIn,
    iconClass: "bg-[var(--info-soft)] text-[var(--info-text)]",
  },
};

export function ActivityMetricCard({
  title,
  value,
  trend,
  variant,
  loading,
  compact = false,
}: Props) {
  const v = variants[variant];
  const Icon = v.icon;
  const up = trend >= 0;

  return (
    <div
      className={`stat-card relative overflow-hidden ${compact ? "!min-h-0 px-2.5 py-2" : ""}`}
    >
      <div className={`flex items-center ${compact ? "gap-2" : "gap-3"}`}>
        <div
          className={`flex shrink-0 items-center justify-center rounded-[var(--radius-control)] ${v.iconClass} ${
            compact ? "h-7 w-7" : "h-9 w-9"
          }`}
        >
          <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p
              className={`truncate font-medium text-[var(--text-secondary)] ${
                compact ? "text-[10px]" : "text-xs"
              }`}
            >
              {title}
            </p>
            {!loading && (
              <p
                className={`flex shrink-0 items-center gap-0.5 font-semibold leading-none ${
                  compact ? "text-[9px]" : "text-[10px]"
                } ${up ? "text-emerald-600" : "text-red-600"}`}
              >
                {up ? (
                  <TrendingUp className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} aria-hidden />
                ) : (
                  <TrendingDown className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} aria-hidden />
                )}
                {Math.abs(trend)}%
              </p>
            )}
          </div>
          {loading ? (
            <div className={`flex items-center ${compact ? "mt-0.5 h-5" : "mt-1 h-7"}`}>
              <BrandedLoader size="xs" ring={false} />
            </div>
          ) : (
            <p
              className={`font-bold leading-none tracking-tight text-[var(--text-primary)] ${
                compact ? "mt-0.5 text-lg" : "mt-0.5 text-2xl"
              }`}
            >
              {value.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
