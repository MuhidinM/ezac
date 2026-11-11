"use client";

import { type FormEvent, Suspense, useState } from "react";
import { MonitorSmartphone, RefreshCw, X } from "lucide-react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { StaffSessionsDialog } from "@/components/staff/staff-sessions-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { SearchInput } from "@/components/ui/search-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  STAFF_ROLE_LABELS,
  type StaffAccount,
  isOwnAccount,
  staffName,
  staffRoleLabels,
} from "@/lib/branches/staff-accounts";
import { useListState } from "@/lib/hooks/use-list-state";

const PAGE_SIZE = 20;

export default function StaffPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <StaffAccounts />
      </Suspense>
    </RequireRole>
  );
}

function StaffAccounts() {
  const { session } = useSession();
  // Filters live in the address so Back, reload and shared links keep them.
  const [filters, setFilters, { reset, isDefault }] = useListState(
    "",
    { search: "", role: "", active: "", page: 1 },
    { allowed: { role: ["", "ADMIN", "BRANCH", "FIELD_OFFICER"], active: ["", "true", "false"] } },
  );
  const { search, role, active, page } = filters;
  const [draftSearch, setDraftSearch] = useState(search);
  const [seenSearch, setSeenSearch] = useState(search);
  if (seenSearch !== search) {
    setSeenSearch(search);
    setDraftSearch(search);
  }
  const [selected, setSelected] = useState<StaffAccount | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (search) params.set("search", search);
  if (role) params.set("role", role);
  if (active) params.set("active", active);
  const { data, error, isLoading, reload } = useResource<PaginatedItems<StaffAccount>>(
    `/bff/admin/staff?${params.toString()}`,
  );
  const rows = data?.items ?? [];

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
      {selected ? (
        <StaffSessionsDialog
          account={selected}
          own={isOwnAccount(selected, session?.username)}
          onClose={() => setSelected(null)}
        />
      ) : null}

      <PageHeader
        title="Staff accounts"
        description="Every administrator, branch officer and field officer login. Open an account's sessions to sign it out."
        actions={
          <Button variant="outline" onClick={reload} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      <Panel flush>
        <form
          role="search"
          onSubmit={onSearch}
          className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-3"
        >
          <SearchInput
            label="Search staff accounts"
            wrapperClassName="min-w-60 flex-[2]"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search name, login or email"
          />
          <div className="min-w-44 flex-1">
            <NativeSelect aria-label="Role" value={role} onChange={(event) => setFilters({ role: event.target.value })}>
              <option value="">All roles</option>
              {Object.entries(STAFF_ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
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
              <TableHead className="pl-5">Account</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last sign-in</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={6} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={6}>
                {!isDefault ? "No staff accounts match your filters." : "No staff accounts yet."}
              </TableMessageRow>
            ) : (
              rows.map((account) => (
                <TableRow key={account.sub}>
                  <TableCell className="pl-5">
                    <p className="font-medium text-navy">
                      {staffName(account)}
                      {isOwnAccount(account, session?.username) ? (
                        <span className="ml-1.5 text-xs font-normal text-black/60">(you)</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-black/60 tabular-nums">{account.username}</p>
                    {account.email ? <p className="text-xs text-black/60">{account.email}</p> : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {staffRoleLabels(account.roles).map((label) => (
                        <Badge key={label} tone="navy">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge tone={account.active ? "success" : "neutral"}>
                        {account.active ? "Active" : "Inactive"}
                      </Badge>
                      {account.passwordChangeRequired ? <Badge tone="warning">Temporary password</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell>{account.lastSignInAt ? formatDateTime(account.lastSignInAt) : "Never"}</TableCell>
                  <TableCell>{formatDateTime(account.createdAt)}</TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(account)}>
                      <MonitorSmartphone />
                      Sessions<span className="sr-only"> of {staffName(account)}</span>
                    </Button>
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
