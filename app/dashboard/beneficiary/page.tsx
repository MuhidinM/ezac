"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
import type {
  BeneficiaryListItem,
  BeneficiaryType,
  PaginatedItems,
  VerificationStatus,
} from "@/lib/api/types";
import {
  formatBeneficiaryCategory,
  formatDateTime,
} from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Filters = {
  search: string;
  verificationStatus: VerificationStatus | "";
  beneficiaryType: BeneficiaryType | "";
};

export default function BeneficiaryPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BeneficiaryListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    verificationStatus: "",
    beneficiaryType: "",
  });
  const [draftSearch, setDraftSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBeneficiaries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });

    if (filters.search) params.set("search", filters.search);
    if (filters.verificationStatus) {
      params.set("verificationStatus", filters.verificationStatus);
    }
    if (filters.beneficiaryType) {
      params.set("beneficiaryType", filters.beneficiaryType);
    }

    try {
      const data = await apiClient<PaginatedItems<BeneficiaryListItem>>(
        `/api/beneficiaries?${params.toString()}`,
      );

      setRows(data.items);
      setTotalPages(Math.max(1, data.pagination.totalPages));
      setTotalItems(data.pagination.totalItems);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace("/login?redirect=/dashboard/beneficiary");
        return;
      }

      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load beneficiaries",
      );
      setRows([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, router]);

  useEffect(() => {
    void loadBeneficiaries();
  }, [loadBeneficiaries]);

  function onSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters((prev) => ({ ...prev, search: draftSearch.trim() }));
  }

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-4xl tracking-tight text-black">
            Beneficiary
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Review and manage registered individuals and institutions.
          </p>
        </div>

        <Button variant="outline" onClick={() => void loadBeneficiaries()} disabled={isLoading}>
          Refresh
        </Button>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5">
        <form
          onSubmit={onSearchSubmit}
          className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-black/35" />
            <Input
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Search name, phone, or national ID"
              className="pl-9"
            />
          </div>

          <select
            value={filters.verificationStatus}
            onChange={(event) => {
              setPage(1);
              setFilters((prev) => ({
                ...prev,
                verificationStatus: event.target.value as Filters["verificationStatus"],
              }));
            }}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              !filters.verificationStatus ? "text-muted-foreground/70" : "text-foreground",
            )}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending review</option>
            <option value="pending_third_party">Fayda in progress</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.beneficiaryType}
            onChange={(event) => {
              setPage(1);
              setFilters((prev) => ({
                ...prev,
                beneficiaryType: event.target.value as Filters["beneficiaryType"],
              }));
            }}
            className={cn(
              "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              !filters.beneficiaryType ? "text-muted-foreground/70" : "text-foreground",
            )}
          >
            <option value="">All types</option>
            <option value="individual">Individual</option>
            <option value="institution">Institution</option>
          </select>

          <Button type="submit">Search</Button>
        </form>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm shadow-black/5">
        {error ? (
          <p
            role="alert"
            className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-black/50">
                  Loading beneficiaries...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-black/50">
                  No beneficiaries match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id} className="cursor-pointer hover:bg-black/[0.02]">
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/beneficiary/${item.id}`}
                      className="hover:underline"
                    >
                      {item.fullName ?? "Unnamed beneficiary"}
                    </Link>
                  </TableCell>
                  <TableCell>{item.phone ?? "—"}</TableCell>
                  <TableCell className="capitalize">{item.beneficiaryType}</TableCell>
                  <TableCell>{formatBeneficiaryCategory(item.beneficiaryCategory)}</TableCell>
                  <TableCell>
                    <VerificationStatusBadge status={item.verificationStatus} />
                  </TableCell>
                  <TableCell>{formatDateTime(item.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-black/60">
            Showing {rangeStart}-{rangeEnd} of {totalItems}
          </p>

          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1 || isLoading}
                >
                  Previous
                </PaginationPrevious>
              </PaginationItem>
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === page}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages || isLoading}
                >
                  Next
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </section>
  );
}
