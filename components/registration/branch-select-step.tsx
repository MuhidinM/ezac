"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { RegistrationShell } from "@/components/registration/registration-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ApiError } from "@/lib/api/errors";
import { apiClient } from "@/lib/api/client";
import type { BranchListItem, PaginatedItems } from "@/lib/api/types";
import { setSelectedBranch } from "@/lib/registration/session";
import { cn } from "@/lib/utils";

type StatusFilter = "active" | "inactive" | "all";
type SortOption = "name-asc" | "name-desc" | "region-asc" | "codes-desc";

const PAGE_SIZE = 100;

function formatCodes(item: BranchListItem): string {
  const available = item.codeStats?.available ?? 0;
  return `${available} available`;
}

export function BranchSelectStep() {
  const router = useRouter();
  const [branches, setBranches] = useState<BranchListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [regionFilter, setRegionFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("name-asc");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const all: BranchListItem[] = [];
      let page = 1;
      let totalPages = 1;

      do {
        try {
          const data = await apiClient<PaginatedItems<BranchListItem>>(
            `/api/admin/branches?page=${page}&limit=${PAGE_SIZE}`,
          );
          all.push(...(data.items ?? []));
          totalPages = Math.max(1, data.pagination?.totalPages ?? 1);
          page += 1;
        } catch (pageError) {
          // Keep any pages already loaded; surface the first failure.
          if (all.length === 0) throw pageError;
          setError(
            pageError instanceof ApiError
              ? pageError.message
              : "Some branches could not be loaded",
          );
          break;
        }
      } while (page <= totalPages);

      setBranches(all);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace("/login?redirect=/dashboard/register");
        return;
      }
      if (loadError instanceof ApiError && loadError.status === 403) {
        setError(
          "Insufficient permissions to list branches. An ADMIN account is required to register beneficiaries.",
        );
      } else {
        setError(
          loadError instanceof ApiError
            ? loadError.message
            : "Failed to load branches",
        );
      }
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const branch of branches) {
      const region = branch.region?.trim();
      if (region) set.add(region);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [branches]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    let rows = branches.filter((branch) => {
      if (statusFilter === "active" && !branch.active) return false;
      if (statusFilter === "inactive" && branch.active) return false;
      if (regionFilter && (branch.region ?? "") !== regionFilter) return false;

      if (!query) return true;
      const haystack = [
        branch.name,
        branch.branchPhone,
        branch.region,
        branch.zone,
        branch.woreda,
      ]
        .map((part) => (part ?? "").toString())
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });

    rows = [...rows].sort((a, b) => {
      const aName = a.name ?? "";
      const bName = b.name ?? "";
      const aRegion = a.region ?? "";
      const bRegion = b.region ?? "";

      switch (sort) {
        case "name-desc":
          return bName.localeCompare(aName);
        case "region-asc":
          return aRegion.localeCompare(bRegion) || aName.localeCompare(bName);
        case "codes-desc": {
          const aCodes = a.codeStats?.available ?? 0;
          const bCodes = b.codeStats?.available ?? 0;
          return bCodes - aCodes || aName.localeCompare(bName);
        }
        case "name-asc":
        default:
          return aName.localeCompare(bName);
      }
    });

    return rows;
  }, [branches, regionFilter, search, sort, statusFilter]);

  const selected = filtered.find((branch) => branch.id === selectedId) ?? null;

  function branchDisplayName(branch: BranchListItem): string {
    return (
      branch.name?.trim() ||
      branch.branchPhone?.trim() ||
      branch.id
    );
  }

  function onContinue() {
    if (!selected) return;
    setSelectedBranch({
      branchId: selected.id,
      branchName: branchDisplayName(selected),
    });
    router.push("/dashboard/register/type");
  }

  return (
    <RegistrationShell
      title="Select a branch"
      description="Choose the branch this beneficiary belongs to before continuing registration."
      error={error}
      wide
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label htmlFor="branch-search" className="sr-only">
              Search branches
            </label>
            <Input
              id="branch-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, region, zone, woreda"
            />
          </div>
          <label className="space-y-1 text-xs text-black/55">
            Status
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className="space-y-1 text-xs text-black/55">
            Region
            <select
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              value={regionFilter}
              onChange={(event) => setRegionFilter(event.target.value)}
            >
              <option value="">All regions</option>
              {regions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex max-w-xs flex-col gap-1 text-xs text-black/55">
          Sort by
          <select
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={sort}
            onChange={(event) => setSort(event.target.value as SortOption)}
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="region-asc">Region A–Z</option>
            <option value="codes-desc">Available codes (high → low)</option>
          </select>
        </label>

        <div className="overflow-hidden rounded-xl border border-black/8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Codes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-black/50"
                  >
                    Loading branches...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-sm text-black/50"
                  >
                    No branches match your search or filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((branch) => {
                  const isSelected = branch.id === selectedId;
                  return (
                    <TableRow
                      key={branch.id}
                      role="option"
                      aria-selected={isSelected}
                      tabIndex={0}
                      className={cn(
                        "cursor-pointer",
                        isSelected
                          ? "bg-[rgba(0,112,80,0.08)]"
                          : "hover:bg-black/[0.02]",
                      )}
                      onClick={() => setSelectedId(branch.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(branch.id);
                        }
                      }}
                    >
                      <TableCell className="font-medium text-[#001539]">
                        {branchDisplayName(branch)}
                      </TableCell>
                      <TableCell>{branch.region ?? "—"}</TableCell>
                      <TableCell>{branch.branchPhone ?? "—"}</TableCell>
                      <TableCell>
                        {branch.active ? (
                          <span className="text-emerald-700">Active</span>
                        ) : (
                          <span className="text-black/45">Inactive</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-black/65">
                        {formatCodes(branch)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {selected ? (
          <p className="text-sm text-black/60">
            Selected:{" "}
            <span className="font-medium text-[#001539]">
              {branchDisplayName(selected)}
            </span>
            {" · "}
            {formatCodes(selected)}
          </p>
        ) : (
          <p className="text-sm text-black/50">Select a branch to continue.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <a href="/dashboard/beneficiary">Cancel</a>
          </Button>
          <Button type="button" variant="outline" onClick={() => void loadBranches()}>
            Refresh
          </Button>
          <Button type="button" disabled={!selected} onClick={onContinue}>
            Continue
          </Button>
        </div>
      </div>
    </RegistrationShell>
  );
}
