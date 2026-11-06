"use client";

import { type FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, X } from "lucide-react";

import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
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
import type { InstitutionListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { formatDateTime } from "@/lib/beneficiary/format";
import { useListState } from "@/lib/hooks/use-list-state";

const PAGE_SIZE = 20;

export default function InstitutionsPage() {
  return (
    <RequireRole audience={["hq"]}>
      {/* useListState reads the address through useSearchParams. */}
      <Suspense>
        <Institutions />
      </Suspense>
    </RequireRole>
  );
}

function Institutions() {
  const router = useRouter();
  const { session } = useSession();
  // Filters live in the address so Back, reload and shared links keep them.
  const [filters, setFilters, { reset, isDefault }] = useListState(
    "",
    { search: "", verificationStatus: "", kycComplete: "", page: 1 },
    { allowed: { verificationStatus: ["", "pending", "verified", "rejected"], kycComplete: ["", "true", "false"] } },
  );
  const [draftSearch, setDraftSearch] = useState(filters.search);
  const [seenSearch, setSeenSearch] = useState(filters.search);
  if (seenSearch !== filters.search) {
    setSeenSearch(filters.search);
    setDraftSearch(filters.search);
  }

  const params = new URLSearchParams({ page: String(filters.page), limit: String(PAGE_SIZE) });
  if (filters.search) params.set("search", filters.search);
  if (filters.verificationStatus) params.set("verificationStatus", filters.verificationStatus);
  if (filters.kycComplete) params.set("kycComplete", filters.kycComplete);

  const { data, error, isLoading, reload } = useResource<PaginatedItems<InstitutionListItem>>(
    `/bff/beneficiaries/institutions?${params.toString()}`,
  );
  const rows = data?.items ?? [];
  const hasFilters = !isDefault;

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters({ search: draftSearch.trim() });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Institution review"
        description={
          session?.isAdmin
            ? "Registered organisations and their KYC documents. Open one to check its documents and verify it."
            : "Registered organisations and their KYC documents. Open one to check its documents."
        }
        actions={
          <Button variant="outline" onClick={reload} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      <Panel flush>
        <form role="search" onSubmit={onSearch} className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-3">
          <SearchInput
            label="Search institutions"
            wrapperClassName="min-w-60 flex-[2]"
            value={draftSearch}
            onChange={(event) => setDraftSearch(event.target.value)}
            placeholder="Search name, trading name or phone"
          />
          <div className="min-w-40 flex-1">
            <NativeSelect
              aria-label="Verification status"
              value={filters.verificationStatus}
              onChange={(event) => setFilters({ verificationStatus: event.target.value })}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending review</option>
              {/* Institutions don't go through Fayda; the backend refuses that filter. */}
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </NativeSelect>
          </div>
          <div className="min-w-36 flex-1">
            <NativeSelect
              aria-label="KYC"
              value={filters.kycComplete}
              onChange={(event) => setFilters({ kycComplete: event.target.value })}
            >
              <option value="">Any KYC</option>
              <option value="true">KYC complete</option>
              <option value="false">KYC incomplete</option>
            </NativeSelect>
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
          {hasFilters || draftSearch ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setDraftSearch("");
                reset();
              }}
            >
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
              <TableHead className="pl-5">Institution</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>KYC</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead className="pr-5">Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={5}>
                {hasFilters
                  ? "No institutions match your filters."
                  : "No institutions registered yet. Institutions can't be registered in the portal yet."}
              </TableMessageRow>
            ) : (
              rows.map((item) => (
                <TableRow
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/beneficiary/${item.id}`)}
                >
                  <TableCell className="pl-5">
                    <Link
                      href={`/dashboard/beneficiary/${item.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="font-medium text-navy hover:underline"
                    >
                      {item.fullName ?? "Unnamed institution"}
                    </Link>
                    <p className="text-xs text-black/60">
                      {[item.tradingName, item.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="capitalize">{item.institutionSubtype?.replaceAll("_", " ") ?? "—"}</TableCell>
                  <TableCell>
                    {item.institutionRequiredKycComplete == null ? (
                      <span className="text-black/60">—</span>
                    ) : (
                      <Badge tone={item.institutionRequiredKycComplete ? "success" : "warning"}>
                        {item.institutionRequiredKycComplete ? "Complete" : "Incomplete"}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <VerificationStatusBadge status={item.verificationStatus} />
                  </TableCell>
                  <TableCell className="pr-5">{formatDateTime(item.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <ListPagination
          page={filters.page}
          pageSize={PAGE_SIZE}
          totalItems={data?.pagination.totalItems ?? 0}
          totalPages={data?.pagination.totalPages ?? 1}
          disabled={isLoading}
          onPageChange={(page) => setFilters({ page })}
        />
      </Panel>
    </section>
  );
}
