"use client";

import { Plus, Trash2 } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { getPath, setPath } from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

/** One input described by a backend form schema (calculator rules). */
export type SchemaField = {
  path: string;
  type: "enum" | "number" | "integer" | "text" | "table";
  label: string;
  section?: string;
  help?: string | null;
  required?: boolean;
  nullable?: boolean;
  min?: number | null;
  minExclusive?: boolean;
  max?: number | null;
  maxExclusive?: boolean;
  options?: string[];
  /** For tables: the row fields, with paths relative to the row. */
  columns?: SchemaField[];
};

type Row = Record<string, unknown>;

function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

function boundsHint(field: SchemaField) {
  const parts: string[] = [];
  if (field.min != null) parts.push(`${field.minExclusive ? ">" : "≥"} ${field.min}`);
  if (field.max != null) parts.push(`${field.maxExclusive ? "<" : "≤"} ${field.max}`);
  return parts.join(", ");
}

function emptyRow(columns: SchemaField[]): Row {
  return Object.fromEntries(columns.map((column) => [column.path, column.type === "table" ? [] : null]));
}

/** A scalar input (enum, number, integer, text). Empty number inputs become null. */
function ScalarInput({
  field,
  value,
  onChange,
  disabled,
  id,
  compact,
}: {
  field: SchemaField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  id: string;
  compact?: boolean;
}) {
  if (field.type === "enum") {
    return (
      <NativeSelect id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || null)} disabled={disabled}>
        {!field.required || field.nullable ? <option value="">—</option> : null}
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {humanize(option)}
          </option>
        ))}
      </NativeSelect>
    );
  }
  if (field.type === "text") {
    return (
      <Input id={id} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={cn(compact && "h-8")} />
    );
  }
  return (
    <Input
      id={id}
      type="number"
      step={field.type === "integer" ? 1 : "any"}
      min={field.min ?? undefined}
      max={field.max ?? undefined}
      value={typeof value === "number" ? value : ""}
      placeholder={field.nullable ? "—" : undefined}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
      disabled={disabled}
      className={cn("tabular-nums", compact && "h-8")}
    />
  );
}

/** Editable rows; a column of type table renders as a nested mini-editor. */
function TableInput({
  field,
  rows,
  onChange,
  disabled,
  idPrefix,
  nested,
}: {
  field: SchemaField;
  rows: Row[];
  onChange: (rows: Row[]) => void;
  disabled?: boolean;
  idPrefix: string;
  nested?: boolean;
}) {
  const columns = field.columns ?? [];

  function setCell(index: number, column: SchemaField, value: unknown) {
    onChange(rows.map((row, i) => (i === index ? { ...row, [column.path]: value } : row)));
  }

  return (
    <div className={cn(!nested && "overflow-x-auto rounded-lg border border-black/[0.08]")}>
      <table className={cn("w-full text-sm", !nested && "min-w-[720px]")}>
        <thead>
          <tr className={cn("text-left text-xs text-black/50", !nested && "bg-black/[0.015]")}>
            {columns.map((column) => (
              <th key={column.path} className={cn("px-2 py-2 font-medium", !nested && "first:pl-3")} title={column.help ?? undefined}>
                {column.label}
                {column.required ? <span className="text-rose-600">*</span> : null}
              </th>
            ))}
            {!disabled ? <th className="w-8" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-black/[0.05] align-top">
              {columns.map((column) => {
                const cellId = `${idPrefix}-${index}-${column.path}`;
                return (
                  <td key={column.path} className={cn("px-2 py-1.5", !nested && "first:pl-3")}>
                    {column.type === "table" ? (
                      <TableInput
                        field={column}
                        rows={Array.isArray(row[column.path]) ? (row[column.path] as Row[]) : []}
                        onChange={(value) => setCell(index, column, value)}
                        disabled={disabled}
                        idPrefix={cellId}
                        nested
                      />
                    ) : (
                      <ScalarInput
                        field={column}
                        value={row[column.path]}
                        onChange={(value) => setCell(index, column, value)}
                        disabled={disabled}
                        id={cellId}
                        compact
                      />
                    )}
                  </td>
                );
              })}
              {!disabled ? (
                <td className="py-1.5 pr-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove row ${index + 1}`}
                    onClick={() => onChange(rows.filter((_, i) => i !== index))}
                  >
                    <Trash2 className="text-black/40" />
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {!disabled ? (
        <div className={cn(nested ? "pt-1" : "border-t border-black/[0.05] px-3 py-2")}>
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange([...rows, emptyRow(columns)])}>
            <Plus />
            {nested ? "Add" : "Add row"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Renders schema fields grouped by section and edits `value` by dot path. */
export function SchemaForm({
  fields,
  value,
  onChange,
  disabled,
}: {
  fields: SchemaField[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  disabled?: boolean;
}) {
  const sections = new Map<string, SchemaField[]>();
  for (const field of fields.filter((item) => typeof item.path === "string")) {
    const key = field.section ?? "General";
    sections.set(key, [...(sections.get(key) ?? []), field]);
  }

  return (
    <div className="space-y-6">
      {[...sections.entries()].map(([section, sectionFields]) => (
        <fieldset key={section} className="space-y-4">
          <legend className="mb-2 text-sm font-semibold text-[#001539]">{section}</legend>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectionFields.map((field) => {
              const id = `schema-${field.path}`;
              const current = getPath(value, field.path);
              const hint = [field.help, boundsHint(field)].filter(Boolean).join(" · ") || undefined;
              if (field.type === "table") {
                return (
                  <div key={field.path} className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                    <p className="text-[13px] font-medium text-[#001539]">{field.label}</p>
                    {hint ? <p className="text-xs text-black/50">{hint}</p> : null}
                    <TableInput
                      field={field}
                      rows={Array.isArray(current) ? (current as Row[]) : []}
                      onChange={(rows) => onChange(setPath(value, field.path, rows))}
                      disabled={disabled}
                      idPrefix={id}
                    />
                  </div>
                );
              }
              return (
                <FormField key={field.path} label={field.label} htmlFor={id} required={field.required && !disabled} hint={hint}>
                  <ScalarInput
                    field={field}
                    value={current}
                    onChange={(next) => onChange(setPath(value, field.path, next))}
                    disabled={disabled}
                    id={id}
                  />
                </FormField>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
