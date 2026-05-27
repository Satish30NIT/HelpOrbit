"use client";

import { FormEvent, useEffect, useState } from "react";
import { Switch } from "@/components/ui/Switch";
import { fetchCompanyDropdown } from "@/lib/companies";
import type { CompanyDropdownItem } from "@/types/company";
import type { RoleOption, UserFormValues } from "@/types/user";

export const USER_FORM_ID = "user-form";

const empty: UserFormValues = {
  first_name: "",
  middle_name: "",
  last_name: "",
  user_name: "",
  email: "",
  phone: "",
  password: "",
  role_id: 1,
  is_active: true,
  company_ids: [],
};

type Props = {
  initial?: Partial<UserFormValues>;
  roles: RoleOption[];
  onSubmit: (values: UserFormValues) => Promise<void>;
  loading?: boolean;
  isEdit?: boolean;
};

export function UserForm({ initial, roles, onSubmit, loading, isEdit }: Props) {
  const [values, setValues] = useState<UserFormValues>({ ...empty, ...initial });
  const [companies, setCompanies] = useState<CompanyDropdownItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCompanyDropdown()
      .then(setCompanies)
      .catch(() => setCompanies([]));
  }, []);

  const set = (key: keyof UserFormValues, value: string | boolean | number | string[]) =>
    setValues((v) => ({ ...v, [key]: value }));

  function toggleCompany(id: string) {
    setValues((v) => {
      const setIds = new Set(v.company_ids);
      if (setIds.has(id)) setIds.delete(id);
      else setIds.add(id);
      return { ...v, company_ids: [...setIds] };
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!values.first_name.trim()) next.first_name = "Required";
    if (!values.last_name.trim()) next.last_name = "Required";
    if (!values.user_name.trim()) next.user_name = "Required";
    if (!values.email.trim()) next.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) next.email = "Invalid email";
    if (!isEdit && values.password.length < 6) next.password = "Min 6 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    await onSubmit({
      ...values,
      first_name: values.first_name.trim(),
      middle_name: values.middle_name.trim(),
      last_name: values.last_name.trim(),
      user_name: values.user_name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
    });
  }

  return (
    <form id={USER_FORM_ID} onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="filter-label">First name *</label>
          <input
            className={`input-field ${errors.first_name ? "border-[var(--danger)]" : ""}`}
            value={values.first_name}
            onChange={(e) => set("first_name", e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="filter-label">Middle name</label>
          <input
            className="input-field"
            value={values.middle_name}
            onChange={(e) => set("middle_name", e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="filter-label">Last name *</label>
          <input
            className={`input-field ${errors.last_name ? "border-[var(--danger)]" : ""}`}
            value={values.last_name}
            onChange={(e) => set("last_name", e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="filter-label">Username *</label>
          <input
            className={`input-field ${errors.user_name ? "border-[var(--danger)]" : ""}`}
            value={values.user_name}
            onChange={(e) => set("user_name", e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="filter-label">Email *</label>
          <input
            type="email"
            className={`input-field ${errors.email ? "border-[var(--danger)]" : ""}`}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="filter-label">Phone</label>
          <input
            className="input-field"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <label className="filter-label">{isEdit ? "New password" : "Password *"}</label>
          <input
            type="password"
            className={`input-field ${errors.password ? "border-[var(--danger)]" : ""}`}
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            disabled={loading}
            placeholder={isEdit ? "Leave blank to keep current" : ""}
          />
        </div>
        <div>
          <label className="filter-label">Role</label>
          <select
            className="input-field"
            value={values.role_id}
            onChange={(e) => set("role_id", Number(e.target.value))}
            disabled={loading}
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.role_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEdit && (
        <div className="flex items-center gap-3">
          <Switch
            checked={values.is_active}
            onChange={(v) => set("is_active", v)}
            disabled={loading}
          />
          <span className="text-sm font-medium text-[var(--text-primary)]">Active user</span>
        </div>
      )}

      <div>
        <label className="filter-label">Companies</label>
        <div className="max-h-48 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--border)] p-3">
          {companies.length === 0 ? (
            <p className="type-meta">No companies available</p>
          ) : (
            <ul className="space-y-2">
              {companies.map((c) => (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={values.company_ids.includes(c.id)}
                      onChange={() => toggleCompany(c.id)}
                      disabled={loading}
                      className="h-4 w-4 rounded border-[var(--border)]"
                    />
                    <span className="text-[var(--text-primary)]">{c.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </form>
  );
}

export function UserFormFooter({
  onCancel,
  submitLabel,
  loading,
}: {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="btn-secondary" disabled={loading}>
        Cancel
      </button>
      <button type="submit" form={USER_FORM_ID} className="btn-primary" disabled={loading}>
        {submitLabel}
      </button>
    </div>
  );
}
