"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, MapPin, Search, Store } from "lucide-react";

import { InlineAlert } from "@/components/dashboard/inline-alert";
import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { BranchListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { setSelectedBranch } from "@/lib/registration/session";
import { cn } from "@/lib/utils";

export function BranchSelectStep() {
  const router = useRouter();
  const { data, error, isLoading, reload } = useResource<PaginatedItems<BranchListItem>>(
    "/api/admin/branches?page=1&limit=100",
  );
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const branches = useMemo(() => (data?.items ?? []).filter((branch) => branch.active), [data]);
  const regions = useMemo(
    () => [...new Set(branches.map((branch) => branch.region?.trim()).filter(Boolean) as string[])].sort(),
    [branches],
  );

  const query = search.trim().toLowerCase();
  const filtered = branches
    .filter((branch) => !region || branch.region === region)
    .filter(
      (branch) =>
        !query ||
        [branch.name, branch.region, branch.zone, branch.woreda, branch.branchPhone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const selected = branches.find((branch) => branch.id === selectedId) ?? null;

  function onContinue() {
    if (!selected) return;
    setSelectedBranch({ branchId: selected.id, branchName: selected.name });
    router.push("/dashboard/register/type");
  }

  return (
    <RegistrationShell
      title="Register beneficiary"
      description="Pick the branch the beneficiary registers under. Their registration code comes from this branch."
      steps={["Branch", "Type", "Details"]}
      currentStep={0}
      wide
    >
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-60 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search branch, zone or woreda"
              className="bg-white pl-9"
              aria-label="Search branches"
            />
          </div>
          <div className="w-48">
            <NativeSelect aria-label="Region" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">All regions</option>
              {regions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
          </div>
        </div>

        {error ? (
          <InlineAlert action={<Button variant="outline" size="sm" onClick={reload}>Retry</Button>}>
            {error.status === 403
              ? "Your account can't list branches. Ask an administrator to register this beneficiary."
              : error.message}
          </InlineAlert>
        ) : null}

        {isLoading && !data ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-black/[0.04]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="rounded-lg border border-dashed border-black/15 py-10 text-center text-sm text-black/50">
            No active branches match your search.
          </p>
        ) : (
          <div role="radiogroup" aria-label="Branch" className="grid max-h-[28rem] gap-3 overflow-y-auto p-0.5 sm:grid-cols-2">
            {filtered.map((branch) => {
              const isSelected = branch.id === selectedId;
              const available = branch.codeStats?.available ?? 0;
              return (
                <button
                  key={branch.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedId(branch.id)}
                  onDoubleClick={() => {
                    setSelectedId(branch.id);
                    setSelectedBranch({ branchId: branch.id, branchName: branch.name });
                    router.push("/dashboard/register/type");
                  }}
                  className={cn(
                    "relative flex items-start gap-3 rounded-lg border p-4 text-left transition",
                    isSelected
                      ? "border-[#007050] bg-[#007050]/[0.05] ring-1 ring-[#007050]"
                      : "border-black/[0.08] bg-white hover:border-black/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md",
                      isSelected ? "bg-[#007050] text-white" : "bg-black/[0.04] text-black/50",
                    )}
                  >
                    {isSelected ? <Check className="size-4" /> : <Store className="size-4" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-[#001539]">{branch.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-black/50">
                      <MapPin className="size-3" />
                      {[branch.woreda, branch.zone, branch.region].filter(Boolean).join(", ") || "—"}
                    </span>
                    <span
                      className={cn(
                        "mt-2 inline-block text-xs font-medium tabular-nums",
                        available > 0 ? "text-emerald-700" : "text-amber-700",
                      )}
                    >
                      {available} code{available === 1 ? "" : "s"} available
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-5">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/beneficiary">Cancel</Link>
          </Button>
          <div className="flex items-center gap-3">
            {selected ? (
              <span className="text-sm text-black/55">
                <span className="font-medium text-[#001539]">{selected.name}</span> selected
              </span>
            ) : null}
            <Button disabled={!selected} onClick={onContinue}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </RegistrationShell>
  );
}
