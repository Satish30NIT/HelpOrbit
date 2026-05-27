import type { CompanyAddressFields } from "@/types/company";

export function formatCompanyAddress(c: CompanyAddressFields): string | null {
  const parts = [
    c.address_line_1,
    c.city,
    c.state,
    c.country,
    c.pin_code,
  ]
    .map((p) => (p != null ? String(p).trim() : ""))
    .filter(Boolean);
  if (parts.length) return parts.join(", ");
  return c.address?.trim() || null;
}

export const emptyAddressFields = {
  address_line_1: "",
  city: "",
  state: "",
  country: "",
  pin_code: "",
};
