"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, Search } from "lucide-react";

import { CodeStatsInline } from "@/components/branches/code-stats";
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

const PAGE_SIZE = 20;

export default function BranchesPage() {
  return (
    <RequireRole audience={["admin"]}>
      <Branches />
    </RequireRole>
  );
}

function Branches() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [credentials, setCredentials] = useState<BranchCreateResponse | null>(null);

  const { data, error, isLoading, reload } = useResource<PaginatedItems<BranchListItem>>(
    `/api/admin/branches?page=${page}&limit=${PAGE_SIZE}`,
  );

  // The branches endpoint has no search; filter the current page locally.
  const query = filter.trim().toLowerCase();
  const rows = (data?.items ?? []).filter(
    (item) =>
      !query ||
      [item.name, item.region, item.zone, item.woreda, item.branchPhone]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
  );

  return (
    <section className="space-y-6">
      {credentials ? (
        <CredentialsOnceDialog
          login={credentials.branchPhone ?? ""}
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
        <div className="border-b border-black/[0.06] px-5 py-3">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
            <Input
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder="Filter by name, location or phone"
              className="bg-white pl-9"
            />
          </div>
        </div>

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
                {query ? "No branches on this page match your filter." : "No branches yet. Create one to get started."}
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
                    <p className="text-sm text-[#001539]">{item.branchFullName ?? "—"}</p>
                    <p className="text-xs text-black/50 tabular-nums">{item.branchPhone ?? ""}</p>
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

        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={data?.pagination.totalItems ?? 0}
          totalPages={data?.pagination.totalPages ?? 1}
          disabled={isLoading}
          onPageChange={setPage}
        />
      </Panel>
    </section>
  );
}
