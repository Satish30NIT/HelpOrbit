"use client";

import { motion } from "framer-motion";
import { BrandedLoader } from "@/components/ui/BrandedLoader";

export function AppLoader({ message = "Loading HelpOrbit..." }: { message?: string }) {
  return (
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#f5f7fb]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#f3eeff] via-[#f5f7fb] to-[#ede9fe]"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <div className="relative">
        <BrandedLoader size="lg" message={message} showMessage />
      </div>
    </motion.div>
  );
}
