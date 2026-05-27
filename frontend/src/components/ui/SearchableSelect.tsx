"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Check, Search } from "lucide-react";
import { BrandedLoader } from "./BrandedLoader";

export type SearchableOption = {
  value: string;
  label: string;
  sublabel?: string;
};

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: SearchableOption[];
  onSearchChange?: (query: string) => void;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  emptyMessage?: string;
};

export function SearchableSelect({
  label,
  placeholder = "Search and select…",
  value,
  onChange,
  options,
  onSearchChange,
  loading,
  disabled,
  required,
  emptyMessage = "No results found",
}: Props) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (selected) {
      setQuery(selected.label);
    } else if (!value) {
      setQuery("");
    }
  }, [selected, value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function handleQueryChange(next: string) {
    setQuery(next);
    onSearchChange?.(next);
    if (!open) setOpen(true);
    if (value && next !== selected?.label) {
      onChange("");
    }
  }

  function selectOption(opt: SearchableOption) {
    onChange(opt.value);
    setQuery(opt.label);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-[var(--text-primary)]">
        {label}
        {required && <span className="text-[var(--danger)]"> *</span>}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-11 items-center justify-center text-[var(--text-muted)]"
          aria-hidden
        >
          <Search className="h-4 w-4 shrink-0" />
        </span>
        <input
          id={id}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          required={required && !value}
          value={query}
          placeholder={placeholder}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => {
            setOpen(true);
            onSearchChange?.(query);
          }}
          className="input-field w-full py-2.5 pr-11 pl-11"
        />
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-1.5 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-slate-100"
        >
          {loading ? <BrandedLoader size="xs" ring={false} /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {open && !disabled && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
        >
          {loading && options.length === 0 ? (
            <li className="flex justify-center px-4 py-4">
              <BrandedLoader size="sm" ring />
            </li>
          ) : options.length === 0 ? (
            <li className="px-4 py-3 text-sm text-slate-500">{emptyMessage}</li>
          ) : (
            options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => selectOption(opt)}
                    className={`flex w-full items-start gap-2 px-4 py-2.5 text-left text-sm transition hover:bg-indigo-50 dark:hover:bg-indigo-950/40 ${
                      active ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" : ""
                    }`}
                  >
                    <span className="flex-1">
                      <span className="font-medium">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="mt-0.5 block text-xs text-slate-500">{opt.sublabel}</span>
                      )}
                    </span>
                    {active && <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
