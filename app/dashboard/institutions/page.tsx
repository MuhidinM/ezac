"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Search } from "lucide-react";

import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
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
import type { InstitutionListItem, PaginatedItems, VerificationStatus } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";

const PAGE_SIZE = 20;

type Filters = {
  search: string;
  verificationStatus: VerificationStatus | "";
  kycComplete: "" | "true" | "false";
};

export default function InstitutionsPage() {
  return (
    <RequireRole audience={["hq"]}>
      <Institutions />
    </RequireRole>
  );
}

function Institutions() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ search: "", verificationStatus: "", kycComplete: "" });
  const [draftSearch, setDraftSearch] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);

  const { data, error, isLoading, reload } = useResource<PaginatedItems<InstitutionListItem>>(
    `/bff/beneficiaries/institutions?${params.toString()}`,
  );
  const rows = data?.items ?? [];

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function onSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    update("search", draftSearch.trim());
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Institution review"
        description="Registered organisations and their KYC documents. Open one to check documents and verify it."
        actions={
          <Button variant="outline" onClick={reload} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      <Panel flush>
        <form onSubmit={onSearch} className="flex flex-wrap items-center gap-3 border-b border-black/[0.06] px-5 py-3">
          <div className="relative min-w-60 flex-[2]">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-black/35" />
            <Input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search name, trading name or phone"
              className="bg-white pl-9"
            />
          </div>
          <div className="min-w-40 flex-1">
            <NativeSelect
              aria-label="Verification status"
              value={filters.verificationStatus}
              onChange={(event) => update("verificationStatus", event.target.value as Filters["verificationStatus"])}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending review</option>
              <option value="pending_third_party">Fayda in progress</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
            </NativeSelect>
          </div>
          <div className="min-w-36 flex-1">
            <NativeSelect
              aria-label="KYC"
              value={filters.kycComplete}
              onChange={(event) => update("kycComplete", event.target.value as Filters["kycComplete"])}
            >
              <option value="">Any KYC</option>
              <option value="true">KYC complete</option>
              <option value="false">KYC incomplete</option>
            </NativeSelect>
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
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
              <TableMessageRow colSpan={5}>No institutions match your filters.</TableMessageRow>
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
                      className="font-medium text-[#001539] hover:underline"
                    >
                      {item.fullName ?? "Unnamed institution"}
                    </Link>
                    <p className="text-xs text-black/50">
                      {[item.tradingName, item.phone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="capitalize">{item.institutionSubtype?.replaceAll("_", " ") ?? "—"}</TableCell>
                  <TableCell>
                    {item.institutionRequiredKycComplete == null ? (
                      <span className="text-black/40">—</span>
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
