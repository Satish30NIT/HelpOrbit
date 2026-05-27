"use client";

import type { LucideIcon } from "lucide-react";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: LucideIcon;
  accent: "indigo" | "violet" | "emerald" | "amber";
  loading?: boolean;
};

const accents = {
  indigo: { icon: "text-[var(--primary)]", soft: "bg-[var(--primary-soft)]" },
  violet: { icon: "text-[var(--primary)]", soft: "bg-[var(--primary-soft)]" },
  emerald: { icon: "text-[var(--success)]", soft: "bg-[var(--success-soft)]" },
  amber: { icon: "text-[var(--warning)]", soft: "bg-[var(--warning-soft)]" },
};

export function StatCard({ title, value, icon: Icon, accent, loading }: StatCardProps) {
  const a = accents[accent];

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${a.soft} ${a.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-auto pt-4">
        <p className="type-meta font-medium text-[var(--text-secondary)]">{title}</p>
        {loading ? (
          <div className="mt-2 flex h-9 items-center">
            <BrandedLoader size="xs" ring={false} />
          </div>
        ) : (
          <p className="mt-1 text-3xl font-semibold tracking-tight text-[var(--text-primary)]">
            {value}
          </p>
        )}
      </div>
    </div>
  );
}
