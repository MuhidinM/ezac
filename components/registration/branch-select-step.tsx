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
import type { StaffBranchOption, StaffMe } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { FIRST_DETAILS_STEP, REGISTRATION_STEPS } from "@/lib/registration/constants";
import { beginRegistration, setSelectedBranch } from "@/lib/registration/session";
import { cn } from "@/lib/utils";

/** Free codes, or null when the branch didn't say. */
function codesLeft(branch: StaffBranchOption): number | null {
  return branch.codeStats ? branch.codeStats.available : null;
}

export function BranchSelectStep() {
  const router = useRouter();
  const { session } = useSession();
  // Branches the signed-in user may register into: all active ones for ADMIN,
  // their own for BRANCH, assigned branches and regions for field officers.
  const { data, error, isLoading, reload } = useResource<StaffMe>("/bff/backoffice/staff/me");
  const [search, setSearch] = useState("");
  const [region, setRegion] = useState("");
  const [pickedId, setSelectedId] = useState<string | null>(null);

  const branches = useMemo(() => (data?.branches ?? []).filter((branch) => branch.active), [data]);
  // Someone with a single branch doesn't have to pick it.
  const selectedId = pickedId ?? (branches.length === 1 ? branches[0].id : null);
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
        [branch.name, branch.region, branch.zone, branch.woreda]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const selected = branches.find((branch) => branch.id === selectedId) ?? null;
  const selectedHasNoCodes = !!selected && codesLeft(selected) === 0;

  function goOn(branch: StaffBranchOption) {
    setSelectedBranch({ branchId: branch.id, branchName: branch.name, codesAvailable: codesLeft(branch) });
    // Individuals are the only type today, so the type step is skipped.
    beginRegistration("manual");
    router.push(FIRST_DETAILS_STEP);
  }

  return (
    <RegistrationShell
      title="Register beneficiary"
      description="Pick the branch the beneficiary registers under. Their registration code comes from this branch."
      steps={REGISTRATION_STEPS}
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
            {error.message}
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
            {branches.length === 0
              ? "You aren't assigned to any active branch yet. Ask an administrator to add an assignment."
              : "No active branches match your search."}
          </p>
        ) : (
          <div role="radiogroup" aria-label="Branch" className="grid max-h-[28rem] gap-3 overflow-y-auto p-0.5 sm:grid-cols-2">
            {filtered.map((branch) => {
              const isSelected = branch.id === selectedId;
              const available = codesLeft(branch);
              return (
                <button
                  key={branch.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedId(branch.id)}
                  onDoubleClick={() => {
                    setSelectedId(branch.id);
                    // A branch without codes needs the notice first.
                    if (available !== 0) goOn(branch);
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
                    {available !== null ? (
                      <span
                        className={cn(
                          "mt-2 inline-block text-xs font-medium tabular-nums",
                          available > 0 ? "text-emerald-700" : "text-amber-700",
                        )}
                      >
                        {available > 0
                          ? `${available} code${available === 1 ? "" : "s"} available`
                          : "No registration codes left"}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selected && selectedHasNoCodes ? (
          <InlineAlert
            tone="warning"
            title={`${selected.name} has no registration codes left`}
            action={
              session?.isAdmin ? (
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/dashboard/branches/${encodeURIComponent(selected.id)}`}>Generate codes</Link>
                </Button>
              ) : null
            }
          >
            {session?.isAdmin
              ? "Generate more codes for this branch first. You can only continue if the household already has a printed code from this branch."
              : "Ask an administrator to generate more codes. You can only continue if the household already has a printed code from this branch."}
          </InlineAlert>
        ) : null}

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
            <Button disabled={!selected} onClick={() => selected && goOn(selected)}>
              {selectedHasNoCodes ? "Continue with a printed code" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </RegistrationShell>
  );
}
