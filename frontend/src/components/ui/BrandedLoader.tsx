"use client";

import { motion } from "framer-motion";
import { Logo } from "@/components/brand/Logo";

export type BrandedLoaderSize = "xs" | "sm" | "md" | "lg";

type Props = {
  size?: BrandedLoaderSize;
  message?: string;
  showMessage?: boolean;
  className?: string;
  /** Animated ring around the logo (off for inline/button use) */
  ring?: boolean;
};

const ringSizes: Record<BrandedLoaderSize, { halo: string; spin: string }> = {
  xs: { halo: "h-7 w-7", spin: "h-7 w-7" },
  sm: { halo: "h-12 w-12", spin: "h-10 w-10" },
  md: { halo: "h-20 w-20", spin: "h-16 w-16" },
  lg: { halo: "h-28 w-28", spin: "h-20 w-20" },
};

const logoSize: Record<BrandedLoaderSize, "sm" | "md" | "lg"> = {
  xs: "sm",
  sm: "sm",
  md: "md",
  lg: "lg",
};

export function BrandedLoader({
  size = "md",
  message,
  showMessage,
  className = "",
  ring,
}: Props) {
  const showRing = ring ?? size !== "xs";
  const rings = ringSizes[size];
  const displayMessage = showMessage ?? Boolean(message);

  const inline = size === "xs" && !displayMessage;

  return (
    <div
      className={`flex flex-col items-center justify-center ${
        inline ? `inline-flex h-4 w-4 overflow-hidden ${className}` : className
      }`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message ?? "Loading"}
    >
      <div
        className={`relative flex items-center justify-center ${
          inline ? "h-4 w-4" : rings.halo
        }`}
      >
        {showRing && (
          <>
            <motion.div
              className={`absolute rounded-full border-2 border-[#6d4cff]/20 ${rings.halo}`}
              animate={{ scale: [1, 1.12, 1], opacity: [0.45, 1, 0.45] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className={`absolute rounded-full border-2 border-t-[#6d4cff] border-r-transparent border-b-transparent border-l-transparent ${rings.spin}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            />
          </>
        )}
        <motion.div
          className={size === "xs" ? "scale-[0.55]" : size === "sm" ? "scale-75" : ""}
          animate={showRing ? { scale: [1, 1.03, 1] } : undefined}
          transition={{ duration: 1.8, repeat: Infinity }}
        >
          <Logo size={logoSize[size]} showText={false} />
        </motion.div>
      </div>
      {displayMessage && message ? (
        <motion.p
          className={`mt-3 text-center font-semibold text-[var(--text-secondary)] ${
            size === "xs" ? "text-xs" : size === "sm" ? "text-xs" : "text-sm"
          }`}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      ) : null}
    </div>
  );
}
