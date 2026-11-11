"use client";

import { type FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, X } from "lucide-react";

import { CodeStatsInline, CodeStatsLegend } from "@/components/branches/code-stats";
import { CreateBranchDialog } from "@/components/branches/create-branch-form";
import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
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
import { oneTimeCredentials } from "@/lib/branches/credentials";
import { useListState } from "@/lib/hooks/use-list-state";

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

function Branches() {
  const router = useRouter();
  // Filters live in the address so Back, reload and shared links keep them.
  const [filters, setFilters, { reset, isDefault }] = useListState(
    "",
    { search: "", region: "", active: "", page: 1 },
    { allowed: { active: ["", "true", "false"] } },
  );
  const { search, region, active, page } = filters;
  const [draftSearch, setDraftSearch] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  if (seenSearch !== search) {
    setSeenSearch(search);
    setDraftSearch(search);
  }
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
  const query = !isDefault;

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ search: draftSearch.trim() });
  }

  function clearFilters() {
    setDraftSearch("");
    reset();
  }

  return (
    <section className="space-y-6">
      {credentials ? (
        <CredentialsOnceDialog
          {...oneTimeCredentials(credentials, branchContact(credentials).phone)}
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
        <form role="search" onSubmit={onSearch} className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-3">
          <SearchInput
            label="Search branches"
            wrapperClassName="min-w-60 flex-[2]"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search name, place or officer"
          />
          <div className="min-w-44 flex-1">
            <NativeSelect
              aria-label="Region"
              value={region}
              onChange={(event) => setFilters({ region: event.target.value })}
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
              onChange={(event) => setFilters({ active: event.target.value })}
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
            <ErrorAlert error={error} onRetry={reload} />
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
                  className="cursor-pointer"
                  // A mouse shortcut; the name link is the keyboard and screen-reader way in.
                  onClick={() => router.push(`/dashboard/branches/${item.id}`)}
                >
                  <TableCell className="pl-5">
                    <Link
                      href={`/dashboard/branches/${item.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-navy hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-black/65">
                    {[item.woreda, item.zone, item.region].filter(Boolean).join(", ") || "—"}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-navy">{branchContact(item).fullName ?? "—"}</p>
                    <p className="text-xs text-black/60 tabular-nums">{branchContact(item).phone ?? ""}</p>
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
