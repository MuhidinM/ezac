"use client";

import { type FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, X } from "lucide-react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { AssignmentBadges } from "@/components/field-officers/assignment-badges";
import { CreateOfficerDialog } from "@/components/field-officers/create-officer-dialog";
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
import type {
  CreateFieldOfficerResponse,
  FieldOfficer,
} from "@/lib/api/backoffice-types";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useListState } from "@/lib/hooks/use-list-state";

const PAGE_SIZE = 20;

export default function FieldOfficersPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <FieldOfficers />
      </Suspense>
    </RequireRole>
  );
}

function FieldOfficers() {
  const router = useRouter();
  // Filters live in the address so Back, reload and shared links keep them.
  const [filters, setFilters, { reset, isDefault }] = useListState(
    "",
    { search: "", active: "", page: 1 },
    { allowed: { active: ["", "true", "false"] } },
  );
  const { search, active, page } = filters;
  const [draftSearch, setDraftSearch] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  if (seenSearch !== search) {
    setSeenSearch(search);
    setDraftSearch(search);
  }
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<CreateFieldOfficerResponse | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  if (active) params.set("active", active);

  const { data, error, isLoading, reload } = useResource<PaginatedItems<FieldOfficer>>(
    `/bff/backoffice/admin/field-officers?${params.toString()}`,
  );

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ search: draftSearch.trim() });
  }

  function clearFilters() {
    setDraftSearch("");
    reset();
  }

  const rows = data?.items ?? [];

  return (
    <section className="space-y-6">
      {created ? (
        <CredentialsOnceDialog
          title="Field officer credentials"
          recipient="field officer"
          login={created.username}
          initialPassword={created.initialPassword}
          passwordChangeRequired={created.passwordChangeRequired}
          onClose={() => {
            const id = created.officer.id;
            setCreated(null);
            router.push(`/dashboard/field-officers/${id}`);
          }}
        />
      ) : null}

      <CreateOfficerDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(result) => {
          setCreateOpen(false);
          setCreated(result);
          reload();
        }}
      />

      <PageHeader
        title="Field officers"
        description="Assessment officers and the branch each one works in. Officers only see beneficiaries registered in their branch."
        actions={
          <>
            <Button variant="outline" onClick={reload} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              New field officer
            </Button>
          </>
        }
      />

      <Panel flush>
        <form
          role="search"
          onSubmit={onSearch}
          className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-3"
        >
          <SearchInput
            label="Search field officers"
            wrapperClassName="min-w-60 flex-1"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search name, phone or email"
          />
          <div className="w-40">
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
          {!isDefault || draftSearch ? (
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
              <TableHead className="pl-5">Officer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Open</TableHead>
              <TableHead className="text-right">This month</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={6} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={6}>
                {!isDefault
                  ? "No field officers match your filters."
                  : "No field officers yet. Create one to start assigning assessments."}
              </TableMessageRow>
            ) : (
              rows.map((officer) => (
                <TableRow
                  key={officer.id}
                  className="cursor-pointer"
                  // A mouse shortcut; the name link is the keyboard and screen-reader way in.
                  onClick={() => router.push(`/dashboard/field-officers/${officer.id}`)}
                >
                  <TableCell className="pl-5">
                    <Link
                      href={`/dashboard/field-officers/${officer.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-navy hover:underline"
                    >
                      {officer.fullName}
                    </Link>
                    <p className="text-xs text-black/50">{officer.email ?? "—"}</p>
                  </TableCell>
                  <TableCell className="tabular-nums">{officer.phone ?? "—"}</TableCell>
                  <TableCell>
                    <AssignmentBadges assignments={officer.assignments ?? []} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{officer.openAssessments ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{officer.submittedThisMonth ?? "—"}</TableCell>
                  <TableCell>
                    <Badge tone={officer.active ? "success" : "neutral"}>
                      {officer.active ? "Active" : "Inactive"}
                    </Badge>
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
          onPageChange={(next) => setFilters({ page: next })}
        />
      </Panel>
    </section>
  );
}
