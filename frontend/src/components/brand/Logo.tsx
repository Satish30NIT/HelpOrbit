"use client";

type LogoProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  collapsed?: boolean;
  variant?: "light" | "dark";
};

const sizes = {
  sm: { box: "h-8 w-8 text-sm", text: "text-sm" },
  md: { box: "h-10 w-10 text-base", text: "text-base" },
  lg: { box: "h-12 w-12 text-lg", text: "text-lg" },
};

export function Logo({
  size = "md",
  showText = true,
  collapsed,
  variant = "light",
}: LogoProps) {
  const s = sizes[size];
  const isDark = variant === "dark";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--primary)] font-bold text-white ${s.box}`}
      >
        H
      </div>
      {showText && !collapsed && (
        <div className="min-w-0">
          <p
            className={`truncate font-semibold tracking-tight ${s.text} ${
              isDark ? "text-white" : "text-[var(--text-primary)]"
            }`}
          >
            HelpOrbit
          </p>
          <p
            className={`truncate text-[11px] font-medium ${
              isDark ? "text-slate-400" : "text-[var(--text-secondary)]"
            }`}
          >
            Policy Platform
          </p>
        </div>
      )}
    </div>
  );
}
