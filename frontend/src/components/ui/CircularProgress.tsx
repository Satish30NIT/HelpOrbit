"use client";

import { useId } from "react";

type Props = {
  value: number;
  size?: number;
  strokeWidth?: number;
  acknowledged?: number;
  pending?: number;
};

export function CircularProgress({
  value,
  size = 52,
  strokeWidth = 5,
  acknowledged = 0,
  pending = 0,
}: Props) {
  const gradId = useId().replace(/:/g, "");
  const pct = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const center = size / 2;

  return (
    <div
      className="group relative mx-auto flex flex-col items-center"
      title={`${acknowledged} acknowledged · ${pending} pending · ${pct}% complete`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            className="stroke-slate-200"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
          />
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#6d4cff" />
            </linearGradient>
          </defs>
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[var(--text-primary)]">
          {pct}%
        </span>
      </div>
      <div className="mt-1 flex gap-1 text-[9px] font-semibold">
        <span className="text-emerald-600">{acknowledged} ack</span>
        <span className="text-[var(--text-muted)]">·</span>
        <span className="text-amber-600">{pending} pend</span>
      </div>
    </div>
  );
}
