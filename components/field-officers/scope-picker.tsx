"use client";

import { FormField } from "@/components/dashboard/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { useResource } from "@/lib/api/use-resource";
import type { BranchListItem, PaginatedItems } from "@/lib/api/types";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { cn } from "@/lib/utils";

export type ScopeKind = "branch" | "region" | "none";

export type ScopeValue = {
  kind: ScopeKind;
  branchId: string;
  region: string;
};

export const EMPTY_SCOPE: ScopeValue = { kind: "branch", branchId: "", region: "" };

/** Branch-or-region picker. An officer sees only beneficiaries in scope. */
export function ScopePicker({
  value,
  onChange,
  allowNone,
  errors,
}: {
  value: ScopeValue;
  onChange: (value: ScopeValue) => void;
  allowNone?: boolean;
  errors?: Record<string, string>;
}) {
  const { data: branches, isLoading } = useResource<PaginatedItems<BranchListItem>>(
    "/api/admin/branches?page=1&limit=100",
  );

  const kinds: { key: ScopeKind; label: string; hint: string }[] = [
    { key: "branch", label: "Branch", hint: "One branch" },
    { key: "region", label: "Region", hint: "Every branch in a region" },
    ...(allowNone
      ? [{ key: "none" as const, label: "Later", hint: "Assign after creating" }]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-label="Assignment scope"
        className={cn("grid gap-2", kinds.length === 3 ? "grid-cols-3" : "grid-cols-2")}
      >
        {kinds.map((kind) => {
          const selected = value.kind === kind.key;
          return (
            <button
              key={kind.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange({ ...value, kind: kind.key })}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition",
                selected
                  ? "border-[#007050] bg-[#007050]/[0.06] ring-1 ring-[#007050]"
                  : "border-black/10 hover:border-black/20",
              )}
            >
              <span className="block text-sm font-medium text-[#001539]">{kind.label}</span>
              <span className="block text-xs text-black/50">{kind.hint}</span>
            </button>
          );
        })}
      </div>

      {value.kind === "branch" ? (
        <FormField label="Branch" htmlFor="scope-branch" required error={errors?.branchId}>
          <NativeSelect
            id="scope-branch"
            value={value.branchId}
            onChange={(event) => onChange({ ...value, branchId: event.target.value })}
            disabled={isLoading}
            required
          >
            <option value="">{isLoading ? "Loading branches…" : "Select a branch"}</option>
            {branches?.items
              .filter((branch) => branch.active)
              .map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                  {branch.region ? ` — ${branch.region}` : ""}
                </option>
              ))}
          </NativeSelect>
        </FormField>
      ) : null}

      {value.kind === "region" ? (
        <FormField label="Region" htmlFor="scope-region" required error={errors?.region}>
          <NativeSelect
            id="scope-region"
            value={value.region}
            onChange={(event) => onChange({ ...value, region: event.target.value })}
            required
          >
            <option value="">Select a region</option>
            {ETHIOPIAN_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </NativeSelect>
        </FormField>
      ) : null}
    </div>
  );
}

/** Request body fragment for the chosen scope. */
export function scopeBody(value: ScopeValue): { branchId?: string; region?: string } {
  if (value.kind === "branch" && value.branchId) return { branchId: value.branchId };
  if (value.kind === "region" && value.region) return { region: value.region };
  return {};
}
