"use client";

import { Building2, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

type Variant = "total" | "active" | "inactive";

type Props = {
  title: string;
  value: number | string;
  variant: Variant;
  trendLabel?: string;
  loading?: boolean;
};

const variants: Record<
  Variant,
  { icon: LucideIcon; iconClass: string; decorClass: string; trendTone?: "up" | "down" }
> = {
  total: {
    icon: Building2,
    iconClass: "from-[var(--primary)] to-[var(--primary-light)]",
    decorClass: "text-[var(--primary)]/10",
  },
  active: {
    icon: Building2,
    iconClass: "from-emerald-500 to-teal-500 shadow-emerald-500/20",
    decorClass: "text-emerald-500/10",
    trendTone: "up",
  },
  inactive: {
    icon: Building2,
    iconClass: "from-slate-400 to-slate-500 shadow-slate-500/20",
    decorClass: "text-slate-400/10",
    trendTone: "down",
  },
};

export function CompanyMetricCard({
  title,
  value,
  variant,
  trendLabel,
  loading,
}: Props) {
  const v = variants[variant];
  const Icon = v.icon;

  return (
    <div className="stat-card group relative overflow-hidden">
      <Icon
        className={`pointer-events-none absolute -bottom-2 -right-2 h-14 w-14 ${v.decorClass} opacity-80`}
        strokeWidth={1.25}
        aria-hidden
      />
      <div className="relative flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-gradient-to-br text-white shadow-md ${v.iconClass}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="type-meta font-medium text-[var(--text-secondary)]">{title}</p>
            {trendLabel && !loading && (
              <span
                className={`flex shrink-0 items-center gap-0.5 text-[10px] font-semibold ${
                  v.trendTone === "down" ? "text-[var(--text-muted)]" : "text-emerald-600"
                }`}
              >
                {v.trendTone === "down" ? (
                  <TrendingDown className="h-3 w-3" aria-hidden />
                ) : (
                  <TrendingUp className="h-3 w-3" aria-hidden />
                )}
                {trendLabel}
              </span>
            )}
          </div>
          {loading ? (
            <div className="mt-2 flex h-8 items-center">
              <BrandedLoader size="xs" ring={false} />
            </div>
          ) : (
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              {value}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
