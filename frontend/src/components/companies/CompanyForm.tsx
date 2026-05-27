"use client";

import { FormEvent, useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { emptyAddressFields } from "@/lib/companyAddress";
import type { CompanyFormValues } from "@/types/company";

export const COMPANY_FORM_ID = "company-form";

const empty: CompanyFormValues = {
  title: "",
  email: "",
  phone: "",
  ...emptyAddressFields,
  description: "",
  is_active: true,
};

type Props = {
  initial?: Partial<CompanyFormValues>;
  onSubmit: (values: CompanyFormValues) => Promise<void>;
  loading?: boolean;
  showStatusToggle?: boolean;
};

export function CompanyForm({
  initial,
  onSubmit,
  loading,
  showStatusToggle = false,
}: Props) {
  const [values, setValues] = useState<CompanyFormValues>({
    ...empty,
    ...initial,
    is_active: initial?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: keyof CompanyFormValues, value: string | boolean) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.title.trim()) next.title = "Title is required";
    if (!values.email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Enter a valid email";
    }
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSubmit({
      ...values,
      title: values.title.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      address_line_1: values.address_line_1.trim(),
      city: values.city.trim(),
      state: values.state.trim(),
      country: values.country.trim(),
      pin_code: values.pin_code.trim(),
      description: values.description.trim(),
    });
  }

  return (
    <form id={COMPANY_FORM_ID} onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
          Title <span className="text-[var(--danger)]">*</span>
        </label>
        <input
          required
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          disabled={loading}
          placeholder="e.g. Radha Enterprise"
          className={`input-field ${errors.title ? "border-red-300" : ""}`}
        />
        {errors.title && (
          <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
          Email <span className="text-[var(--danger)]">*</span>
        </label>
        <input
          type="email"
          required
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          disabled={loading}
          placeholder="contact@company.com"
          className={`input-field ${errors.email ? "border-red-300" : ""}`}
        />
        {errors.email && (
          <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
          Phone
        </label>
        <input
          value={values.phone}
          onChange={(e) => set("phone", e.target.value)}
          disabled={loading}
          placeholder="+91 …"
          className="input-field"
        />
      </div>

      <fieldset className="space-y-4 rounded-xl border border-[var(--border)] bg-slate-50/50 p-4">
        <legend className="px-1 text-sm font-semibold text-[var(--text-primary)]">
          Address
        </legend>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
            Address Line 1
          </label>
          <input
            value={values.address_line_1}
            onChange={(e) => set("address_line_1", e.target.value)}
            disabled={loading}
            placeholder="Building, street, area"
            className="input-field"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              City
            </label>
            <input
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              disabled={loading}
              placeholder="City"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              State
            </label>
            <input
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
              disabled={loading}
              placeholder="State / Province"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              Country
            </label>
            <input
              value={values.country}
              onChange={(e) => set("country", e.target.value)}
              disabled={loading}
              placeholder="Country"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--text-secondary)]">
              PIN / ZIP Code
            </label>
            <input
              value={values.pin_code}
              onChange={(e) => set("pin_code", e.target.value)}
              disabled={loading}
              placeholder="PIN or ZIP"
              className="input-field"
            />
          </div>
        </div>
      </fieldset>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
          Description
        </label>
        <textarea
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          disabled={loading}
          className="input-field min-h-[100px] resize-y"
          placeholder="Optional notes about this company…"
        />
      </div>

      {showStatusToggle && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)]/40 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Company status</p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {values.is_active
                ? "Active — company is visible and usable"
                : "Inactive — company is disabled"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {values.is_active ? "Active" : "Inactive"}
            </span>
            <Switch
              checked={values.is_active}
              disabled={loading}
              onChange={(checked) => set("is_active", checked)}
              aria-label="Toggle company active status"
            />
          </div>
        </div>
      )}
    </form>
  );
}

export function CompanyFormFooter({
  onCancel,
  submitLabel,
  loading,
}: {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <button type="button" onClick={onCancel} disabled={loading} className="btn-secondary flex-1">
        Cancel
      </button>
      <button
        type="submit"
        form={COMPANY_FORM_ID}
        disabled={loading}
        className="btn-primary inline-flex flex-[2] items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <BrandedLoader size="xs" ring={false} />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </button>
    </div>
  );
}
