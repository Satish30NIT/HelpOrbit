"use client";

import { FormEvent, useState } from "react";
import { CompanySelect } from "./CompanySelect";
import { Switch } from "@/components/ui/Switch";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import type { PolicyFormValues } from "@/types/policy";

export const POLICY_FORM_ID = "policy-form";

type Props = {
  initial?: Partial<PolicyFormValues>;
  onSubmit: (values: PolicyFormValues) => Promise<void>;
  showCompany?: boolean;
  showPackagingToggle?: boolean;
  loading?: boolean;
};

const empty: PolicyFormValues = {
  company_id: "",
  policy_name: "",
  title: "",
  description: "",
};

export function PolicyForm({
  initial,
  onSubmit,
  showCompany = true,
  showPackagingToggle = false,
  loading,
}: Props) {
  const [values, setValues] = useState<PolicyFormValues>({
    ...empty,
    ...initial,
    title: initial?.title || initial?.policy_name || "",
    is_active: initial?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (showCompany && !values.company_id) next.company_id = "Company is required";
    if (!values.title.trim()) next.title = "Title is required";
    if (!values.description.trim()) next.description = "Description is required";
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSubmit({ ...values, title: values.title.trim() });
  }

  return (
    <form id={POLICY_FORM_ID} onSubmit={handleSubmit} className="space-y-5">
      {showCompany && (
        <div>
          <CompanySelect
            value={values.company_id}
            onChange={(company_id) => setValues((v) => ({ ...v, company_id }))}
            disabled={loading}
          />
          {errors.company_id && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.company_id}</p>
          )}
        </div>
      )}

      {showPackagingToggle && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--primary-soft)]/40 px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Policy packaging
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
              {values.is_active
                ? "Enabled — policy is active for assigned users"
                : "Disabled — policy is hidden from users"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="text-xs font-medium text-[var(--text-muted)]">
              {values.is_active ? "Enabled" : "Disabled"}
            </span>
            <Switch
              checked={values.is_active ?? true}
              disabled={loading}
              onChange={(checked) => setValues((v) => ({ ...v, is_active: checked }))}
              aria-label="Enable or disable policy packaging"
            />
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
          Title <span className="text-[var(--danger)]">*</span>
        </label>
        <input
          required
          value={values.title}
          onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
          disabled={loading}
          placeholder="e.g. Order Return Policy"
          className={`input-field ${errors.title ? "border-red-300 ring-red-500/10" : ""}`}
        />
        {errors.title && (
          <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.title}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
          Description <span className="text-[var(--danger)]">*</span>
        </label>
        <textarea
          required
          rows={12}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          disabled={loading}
          className={`input-field min-h-[200px] resize-y leading-relaxed ${errors.description ? "border-red-300" : ""}`}
          placeholder="Enter full policy content…"
        />
        {errors.description && (
          <p className="mt-1.5 text-xs text-[var(--danger)]">{errors.description}</p>
        )}
      </div>
    </form>
  );
}

export function PolicyFormFooter({
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
        form={POLICY_FORM_ID}
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
