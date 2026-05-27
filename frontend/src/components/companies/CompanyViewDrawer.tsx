"use client";

import { useCallback, useEffect, useState } from "react";
import { History, Mail, MapPin, Phone } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { fetchCompany } from "@/lib/companies";
import { formatCompanyAddress } from "@/lib/companyAddress";
import type { CompanyListItem } from "@/types/company";
import { ApiError } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";

type Props = {
  companyId: string | null;
  open: boolean;
  onClose: () => void;
  onViewActivity?: (companyId: string, title: string) => void;
};

export function CompanyViewDrawer({ companyId, open, onClose, onViewActivity }: Props) {
  const { toast } = useToast();
  const [company, setCompany] = useState<CompanyListItem | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      setCompany(await fetchCompany(companyId));
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Failed to load company", "error");
      onClose();
    } finally {
      setLoading(false);
    }
  }, [companyId, toast, onClose]);

  useEffect(() => {
    if (open && companyId) load();
    if (!open) setCompany(null);
  }, [open, companyId, load]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="panel"
      title={company?.title || "Company details"}
      description={company?.is_active ? "Active company" : "Inactive company"}
    >
      <div className="relative min-h-[14rem]">
        <LoadingOverlay show={loading && !!company} bar />
        {loading && !company ? (
          <div className="flex justify-center py-16">
            <BrandedLoader size="md" message="Loading company…" showMessage />
          </div>
        ) : company ? (
        <div className="space-y-5">
          <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)]/20 p-4">
            <Row icon={Mail} label="Email" value={company.email} />
            {company.phone && <Row icon={Phone} label="Phone" value={company.phone} />}
            {(company.address_line_1 ||
              company.city ||
              company.state ||
              company.country ||
              company.pin_code) && (
              <div className="flex gap-3 border-t border-[var(--border)] pt-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                <div className="space-y-2 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Address
                  </p>
                  {company.address_line_1 && (
                    <AddressLine label="Address Line 1" value={company.address_line_1} />
                  )}
                  {company.city && <AddressLine label="City" value={company.city} />}
                  {company.state && <AddressLine label="State" value={company.state} />}
                  {company.country && <AddressLine label="Country" value={company.country} />}
                  {company.pin_code && (
                    <AddressLine label="PIN / ZIP Code" value={company.pin_code} />
                  )}
                </div>
              </div>
            )}
            {!company.address_line_1 &&
              !company.city &&
              company.address &&
              formatCompanyAddress(company) && (
                <Row icon={MapPin} label="Address" value={formatCompanyAddress(company)!} />
              )}
            <div className="flex items-center gap-2 pt-1">
              <span
                className={
                  company.is_active ? "badge-success" : "badge-muted"
                }
              >
                {company.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </section>

          {company.description && (
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Description
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {company.description}
              </p>
            </section>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            Created{" "}
            {new Date(company.created_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          {onViewActivity && (
            <button
              type="button"
              onClick={() => onViewActivity(company.id, company.title)}
              className="btn-secondary mt-2 flex w-full items-center justify-center gap-2 py-2.5 text-sm"
            >
              <History className="h-4 w-4" />
              View activity log
            </button>
          )}
        </div>
        ) : null}
      </div>
    </Drawer>
  );
}

function AddressLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs font-medium text-[var(--text-muted)]">{label}: </span>
      <span className="text-[var(--text-primary)]">{value}</span>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
        <p className="text-sm text-[var(--text-primary)]">{value}</p>
      </div>
    </div>
  );
}
