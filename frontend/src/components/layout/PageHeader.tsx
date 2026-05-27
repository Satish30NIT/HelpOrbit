"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export type Breadcrumb = { label: string; href?: string };

type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-5 flex w-full flex-col items-stretch gap-4 text-left sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="min-w-0 flex-1 text-left">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-2 flex flex-wrap items-center justify-start gap-1 text-left text-xs">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="font-medium text-[var(--text-secondary)] hover:text-[var(--primary)]"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="rounded-md bg-[var(--primary-soft)] px-2 py-0.5 font-semibold text-[var(--primary)]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-left text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-[1.65rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-left text-sm leading-relaxed text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full shrink-0 flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
