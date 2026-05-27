type FieldDiff = { from?: unknown; to?: unknown };

export type ChangeSummary = {
  previous: Record<string, unknown>;
  current: Record<string, unknown>;
  fields: string[];
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function formatChangeValue(value: unknown): string {
  return formatValue(value);
}

export type ChangeRow = {
  field: string;
  from: string;
  to: string;
};

function mapDiffToRows(data: unknown): ChangeRow[] {
  if (Array.isArray(data)) {
    return data
      .filter((item) => item && typeof item === "object" && "field" in item)
      .map((item) => {
        const row = item as {
          field: string;
          from?: unknown;
          to?: unknown;
          previous?: unknown;
          current?: unknown;
        };
        return {
          field: row.field,
          from: formatChangeValue(row.from ?? row.previous),
          to: formatChangeValue(row.to ?? row.current),
        };
      });
  }
  if (data && typeof data === "object") {
    return Object.entries(data as Record<string, FieldDiff>).map(([field, diff]) => ({
      field,
      from: formatChangeValue(diff?.from),
      to: formatChangeValue(diff?.to),
    }));
  }
  return [];
}

export function parseChangesRowsFromJson(json: string): ChangeRow[] {
  try {
    return mapDiffToRows(JSON.parse(json));
  } catch {
    return [];
  }
}

export function getChangeRows(
  metadata: Record<string, unknown> | undefined
): ChangeRow[] {
  if (!metadata) return [];
  const raw = metadata.changes;
  if (raw !== undefined && raw !== null) {
    const rows = mapDiffToRows(raw);
    if (rows.length > 0) return rows;
  }
  const inline = getInlineChanges(metadata);
  if (!inline) return [];
  return Object.entries(inline).map(([field, diff]) => ({
    field,
    from: formatChangeValue(diff.from),
    to: formatChangeValue(diff.to),
  }));
}

const COMPANY_FIELD_ORDER = [
  "title",
  "email",
  "phone",
  "description",
  "is_active",
  "address_line_1",
  "city",
  "state",
  "country",
  "pin_code",
  "address",
  "created_at",
  "updated_at",
  "deleted",
];

function collectFields(
  previous: Record<string, unknown> | null | undefined,
  current: Record<string, unknown> | null | undefined
): string[] {
  const keys = new Set<string>();
  if (previous) Object.keys(previous).forEach((k) => keys.add(k));
  if (current) Object.keys(current).forEach((k) => keys.add(k));
  keys.delete("id");
  const ordered = COMPANY_FIELD_ORDER.filter((k) => keys.has(k));
  const rest = [...keys].filter((k) => !ordered.includes(k)).sort();
  return [...ordered, ...rest];
}

function getMetaBlock(document: Record<string, unknown>) {
  const metaData = document.meta_data as Record<string, unknown> | undefined;
  const metadata = document.metadata as Record<string, unknown> | undefined;
  return metaData || metadata;
}

function changesArrayToMap(
  changes: unknown
): Record<string, FieldDiff> | null {
  if (!Array.isArray(changes)) return null;
  const diff: Record<string, FieldDiff> = {};
  for (const item of changes) {
    if (item && typeof item === "object" && "field" in item) {
      const row = item as {
        field: string;
        from?: unknown;
        to?: unknown;
        previous?: unknown;
        current?: unknown;
      };
      diff[row.field] = { from: row.from ?? row.previous, to: row.to ?? row.current };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}

export function getChangesJson(metadata: Record<string, unknown> | undefined): string | null {
  if (!metadata) return null;
  const raw = metadata.changes;
  if (raw !== undefined && raw !== null) {
    if (Array.isArray(raw) && raw.length === 0) return null;
    if (
      typeof raw === "object" &&
      !Array.isArray(raw) &&
      Object.keys(raw as object).length === 0
    ) {
      return null;
    }
    return JSON.stringify(raw, null, 2);
  }
  const inline = getInlineChanges(metadata);
  if (!inline) return null;
  return JSON.stringify(inline, null, 2);
}

export function getInlineChanges(
  metadata: Record<string, unknown> | undefined
): Record<string, FieldDiff> | null {
  if (!metadata) return null;
  const fromArray = changesArrayToMap(metadata.changes);
  if (fromArray) return fromArray;
  const changes = metadata.changes as Record<string, FieldDiff> | undefined;
  if (changes && Object.keys(changes).length > 0) return changes;

  const previous = metadata.previous_info as Record<string, unknown> | undefined;
  const current = metadata.current_info as Record<string, unknown> | undefined;
  if (!previous && !current) return null;

  const diff: Record<string, FieldDiff> = {};
  for (const field of collectFields(previous, current)) {
    const from = previous?.[field];
    const to = current?.[field];
    if (from !== to) {
      diff[field] = { from, to };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}

export function extractChangeSummary(
  document: Record<string, unknown>
): ChangeSummary | null {
  const meta = getMetaBlock(document);
  if (!meta) return null;

  const action = String(document.action || "");
  const previousInfo = meta.previous_info as Record<string, unknown> | null | undefined;
  const currentInfo = meta.current_info as Record<string, unknown> | null | undefined;

  if (previousInfo || currentInfo) {
    const previous = previousInfo && typeof previousInfo === "object" ? previousInfo : {};
    const current = currentInfo && typeof currentInfo === "object" ? currentInfo : {};
    const fields = collectFields(previous, current);
    if (fields.length > 0 || Object.keys(previous).length || Object.keys(current).length) {
      return { previous, current, fields: fields.length ? fields : Object.keys({ ...previous, ...current }) };
    }
  }

  const fromArray = changesArrayToMap(meta.changes);
  if (fromArray) {
    const previous: Record<string, unknown> = {};
    const current: Record<string, unknown> = {};
    for (const [field, diff] of Object.entries(fromArray)) {
      previous[field] = diff.from;
      current[field] = diff.to;
    }
    return { previous, current, fields: Object.keys(fromArray) };
  }

  const changes = meta.changes as Record<string, FieldDiff> | undefined;
  const company = meta.company as Record<string, unknown> | undefined;

  if (changes && Object.keys(changes).length > 0) {
    const previous: Record<string, unknown> = {};
    const current: Record<string, unknown> = {};
    for (const [field, diff] of Object.entries(changes)) {
      previous[field] = diff.from;
      current[field] = diff.to;
    }
    return { previous, current, fields: Object.keys(changes) };
  }

  if (action === "company.created" && company) {
    return {
      previous: {},
      current: company,
      fields: Object.keys(company).filter((k) => k !== "id"),
    };
  }

  if (action === "company.deleted" && company) {
    return {
      previous: company,
      current: { status: "Deleted", deleted: true },
      fields: [...Object.keys(company).filter((k) => k !== "id"), "status"],
    };
  }

  if (company) {
    return {
      previous: {},
      current: company,
      fields: Object.keys(company).filter((k) => k !== "id"),
    };
  }

  return null;
}
