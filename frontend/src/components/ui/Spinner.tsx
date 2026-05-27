import { BrandedLoader } from "./BrandedLoader";

/** @deprecated Prefer BrandedLoader — kept for inline/button loading */
export function Spinner({ className = "" }: { className?: string }) {
  return <BrandedLoader size="xs" ring={false} className={className} />;
}
