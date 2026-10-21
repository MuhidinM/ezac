"use client";

import { FormField } from "@/components/dashboard/form-field";
import { NativeSelect } from "@/components/ui/native-select";
import { useResource } from "@/lib/api/use-resource";
import type { BranchListItem, PaginatedItems } from "@/lib/api/types";

/**
 * Picks the one branch a field officer works in. Officers cover a single
 * branch; region-wide or multi-branch assignments are no longer offered.
 */
export function BranchPicker({
  value,
  onChange,
  error,
  id = "officer-branch",
  exclude,
  label = "Branch",
  hint,
}: {
  value: string;
  onChange: (branchId: string) => void;
  error?: string;
  id?: string;
  /** A branch to leave out, e.g. the officer's current one when moving. */
  exclude?: string | null;
  label?: string;
  hint?: string;
}) {
  const { data: branches, isLoading } = useResource<PaginatedItems<BranchListItem>>(
    "/bff/admin/branches?page=1&limit=100",
  );
  // Grouped by region so a long branch list stays scannable.
  const byRegion = new Map<string, BranchListItem[]>();
  for (const branch of branches?.items ?? []) {
    if (!branch.active || branch.id === exclude) continue;
    const region = branch.region ?? "Other";
    byRegion.set(region, [...(byRegion.get(region) ?? []), branch]);
  }

  return (
    <FormField label={label} htmlFor={id} required hint={hint} error={error}>
      <NativeSelect id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={isLoading} required>
        <option value="">{isLoading ? "Loading branches…" : "Select a branch"}</option>
        {[...byRegion.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([region, items]) => (
            <optgroup key={region} label={region}>
              {items
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
            </optgroup>
          ))}
      </NativeSelect>
    </FormField>
  );
}
