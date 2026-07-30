"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CreateBranchForm } from "@/components/branches/create-branch-form";
import { CredentialsOnceDialog } from "@/components/branches/credentials-once-dialog";
import { Button } from "@/components/ui/button";
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
  BranchCreateResponse,
  BranchListItem,
  CodeStats,
  PaginatedItems,
} from "@/lib/api/types";
import { fetchSession } from "@/lib/auth/use-session";

const PAGE_SIZE = 20;

function formatCodeStats(stats: CodeStats | null): string {
  if (!stats) return "—";
  return `${stats.available} avail · ${stats.reserved} res · ${stats.consumed} used · ${stats.revoked} rev`;
}

export default function BranchesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<BranchListItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [credentials, setCredentials] = useState<BranchCreateResponse | null>(
    null,
  );

  const loadBranches = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const session = await fetchSession();
      if (session && !session.isAdmin) {
        router.replace("/dashboard/beneficiary");
        return;
      }

      const data = await apiClient<PaginatedItems<BranchListItem>>(
        `/api/admin/branches?page=${page}&limit=${PAGE_SIZE}`,
      );
      setRows(data.items);
      setTotalPages(Math.max(1, data.pagination.totalPages));
      setTotalItems(data.pagination.totalItems);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        router.replace("/login?redirect=/dashboard/branches");
        return;
      }
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load branches",
      );
      setRows([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, router]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  if (isCreating) {
    return (
      <section className="space-y-5">
        <CreateBranchForm
          onCancel={() => setIsCreating(false)}
          onCreated={(created) => {
            setIsCreating(false);
            setCredentials(created);
            setPage(1);
            void loadBranches();
          }}
        />
      </section>
    );
  }

  return (
    <section className="space-y-5">
      {credentials ? (
        <CredentialsOnceDialog
          branchPhone={credentials.branchPhone ?? ""}
          initialPassword={credentials.initialPassword}
          passwordChangeRequired={credentials.passwordChangeRequired}
          onClose={() => {
            setCredentials(null);
            if (credentials.id) {
              router.push(`/dashboard/branches/${credentials.id}`);
            }
          }}
        />
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif-display text-4xl tracking-tight text-[#001539]">
            Branches
          </h1>
          <p className="mt-1 text-sm text-black/60">
            Manage branch offices and registration codes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadBranches()} disabled={isLoading}>
            Refresh
          </Button>
          <Button onClick={() => setIsCreating(true)}>Create branch</Button>
        </div>
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
              <TableHead>Region</TableHead>
              <TableHead>Zone</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Codes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-black/50"
                >
                  Loading branches...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-sm text-black/50"
                >
                  No branches yet. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id} className="hover:bg-black/[0.02]">
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/branches/${item.id}`}
                      className="hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>{item.region ?? "—"}</TableCell>
                  <TableCell>{item.zone ?? "—"}</TableCell>
                  <TableCell>{item.branchPhone ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        item.active
                          ? "text-emerald-700"
                          : "text-black/50"
                      }
                    >
                      {item.active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-black/65">
                    {formatCodeStats(item.codeStats)}
                  </TableCell>
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
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
