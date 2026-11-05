"use client";

import { type FormEvent, Suspense, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, RefreshCw, Search, X } from "lucide-react";

import { CodeStatsInline, CodeStatsLegend } from "@/components/branches/code-stats";
import { CreateBranchDialog } from "@/components/branches/create-branch-form";
import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BranchCreateResponse, BranchListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { branchContact } from "@/lib/branches/contact";

const PAGE_SIZE = 20;

export default function BranchesPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <Branches />
      </Suspense>
    </RequireRole>
  );
}

type Filters = { page: number; search: string; region: string; active: "" | "true" | "false" };

function Branches() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Filters live in the address so Back, reload and shared links keep them.
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const search = searchParams.get("search") ?? "";
  const region = searchParams.get("region") ?? "";
  const activeParam = searchParams.get("active");
  const active: Filters["active"] = activeParam === "true" || activeParam === "false" ? activeParam : "";
  const [draftSearch, setDraftSearch] = useState(search);
  const [createOpen, setCreateOpen] = useState(false);
  const [credentials, setCredentials] = useState<BranchCreateResponse | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  if (region) params.set("region", region);
  if (active) params.set("active", active);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<BranchListItem>>(
    `/bff/backoffice/admin/branches?${params.toString()}`,
  );
  const rows = data?.items ?? [];
  const query = search || region || active;

  function setFilters(next: Partial<Filters>) {
    const merged: Filters = { page, search, region, active, ...next };
    const address = new URLSearchParams();
    if (merged.search) address.set("search", merged.search);
    if (merged.region) address.set("region", merged.region);
    if (merged.active) address.set("active", merged.active);
    if (merged.page > 1) address.set("page", String(merged.page));
    const qs = address.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ page: 1, search: draftSearch.trim() });
  }

  function clearFilters() {
    setDraftSearch("");
    setFilters({ page: 1, search: "", region: "", active: "" });
  }

  return (
    <section className="space-y-6">
      {credentials ? (
        <CredentialsOnceDialog
          login={branchContact(credentials).phone ?? ""}
          initialPassword={credentials.initialPassword}
          passwordChangeRequired={credentials.passwordChangeRequired}
          onClose={() => {
            const id = credentials.id;
            setCredentials(null);
            if (id) router.push(`/dashboard/branches/${id}`);
          }}
        />
      ) : null}

      <CreateBranchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(created) => {
          setCreateOpen(false);
          setCredentials(created);
          reload();
        }}
      />

      <PageHeader
        title="Branches"
        description="Branches hand out registration codes; beneficiaries belong to the branch whose code they used."
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              New branch
            </Button>
          </>
        }
      />

      <Panel flush>
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-3">
          <div className="relative min-w-60 flex-[2]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
            <Input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search name or location"
              className="bg-white pl-9"
            />
          </div>
          <div className="min-w-44 flex-1">
            <NativeSelect
              aria-label="Region"
              value={region}
              onChange={(event) => setFilters({ page: 1, region: event.target.value })}
            >
              <option value="">All regions</option>
              {ETHIOPIAN_REGIONS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="min-w-36 flex-1">
            <NativeSelect
              aria-label="Status"
              value={active}
              onChange={(event) => setFilters({ page: 1, active: event.target.value as Filters["active"] })}
            >
              <option value="">All statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </NativeSelect>
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {query || draftSearch ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <X />
              Clear
            </Button>
          ) : null}
        </form>

        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Branch</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Officer</TableHead>
              <TableHead>Codes</TableHead>
              <TableHead className="pr-5">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>
                {query ? "No branches match your filters." : "No branches yet. Create one to get started."}
              </TableMessageRow>
            ) : (
              rows.map((item) => (
                <TableRow
                  key={item.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/branches/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") router.push(`/dashboard/branches/${item.id}`);
                  }}
                >
                  <TableCell className="pl-5 font-medium text-[#001539]">{item.name}</TableCell>
                  <TableCell className="text-sm text-black/65">
                    {[item.woreda, item.zone, item.region].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-[#001539]">{branchContact(item).fullName ?? "—"}</p>
                    <p className="text-xs text-black/50 tabular-nums">{branchContact(item).phone ?? ""}</p>
                  </TableCell>
                  <TableCell>
                    <CodeStatsInline stats={item.codeStats} />
                  </TableCell>
                  <TableCell className="pr-5">
                    <Badge tone={item.active ? "success" : "neutral"}>{item.active ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {rows.length > 0 ? <CodeStatsLegend className="border-t border-black/[0.06] px-5 py-3" /> : null}

        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={data?.pagination.totalItems ?? 0}
          totalPages={data?.pagination.totalPages ?? 1}
          disabled={isLoading}
          onPageChange={(next) => setFilters({ page: next })}
        />
      </Panel>
    </section>
  );
}
