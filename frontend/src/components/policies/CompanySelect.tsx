"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchCompanyDropdown } from "@/lib/companies";
import type { Company } from "@/types/policy";
import { SearchableSelect } from "@/components/ui/SearchableSelect";

type Props = {
  value: string;
  onChange: (companyId: string) => void;
  disabled?: boolean;
};

export function CompanySelect({ value, onChange, disabled }: Props) {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const list = await fetchCompanyDropdown(search || undefined);
        if (!cancelled) setCompanies(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  const options = useMemo(
    () =>
      companies.map((c) => ({
        value: c.id,
        label: c.title,
        sublabel: c.email,
      })),
    [companies]
  );

  return (
    <SearchableSelect
      label="Company"
      placeholder="Search companies…"
      value={value}
      onChange={onChange}
      options={options}
      onSearchChange={setSearch}
      loading={loading}
      disabled={disabled}
      required
      emptyMessage="No companies found"
    />
  );
}
