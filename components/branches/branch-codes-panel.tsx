"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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
  PaginatedItems,
  RegistrationCodeItem,
  RegistrationCodeStatus,
} from "@/lib/api/types";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

type Props = {
  /** API path that returns PaginatedItems<RegistrationCodeItem> */
  listPath: string;
  /** When set, shows generate-codes controls that POST to this path */
  generatePath?: string;
  onUnauthorized?: () => void;
};

export function BranchCodesPanel({
  listPath,
  generatePath,
  onUnauthorized,
}: Props) {
  const [rows, setRows] = useState<RegistrationCodeItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [status, setStatus] = useState<RegistrationCodeStatus | "">("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState("50");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[] | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (status) params.set("status", status);

    const separator = listPath.includes("?") ? "&" : "?";

    try {
      const data = await apiClient<PaginatedItems<RegistrationCodeItem>>(
        `${listPath}${separator}${params.toString()}`,
      );
      setRows(data.items);
      setTotalPages(Math.max(1, data.pagination.totalPages));
      setTotalItems(data.pagination.totalItems);
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 401) {
        onUnauthorized?.();
        return;
      }
      setError(
        loadError instanceof ApiError
          ? loadError.message
          : "Failed to load registration codes",
      );
      setRows([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [listPath, onUnauthorized, page, status]);

  useEffect(() => {
    void loadCodes();
  }, [loadCodes]);

  async function onGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!generatePath) return;

    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
      setGenerateError("Enter a quantity between 1 and 500.");
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setGeneratedCodes(null);
    setCopied(false);

    try {
      const codes = await apiClient<string[]>(generatePath, {
        method: "POST",
        body: JSON.stringify({ quantity: qty }),
      });
      setGeneratedCodes(codes);
      setPage(1);
      await loadCodes();
    } catch (genError) {
      setGenerateError(
        genError instanceof ApiError
          ? genError.message
          : "Failed to generate codes",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyGenerated() {
    if (!generatedCodes?.length) return;
    try {
      await navigator.clipboard.writeText(generatedCodes.join("\n"));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalItems);

  return (
    <div className="space-y-4">
      {generatePath ? (
        <form
          onSubmit={onGenerate}
          className="flex flex-wrap items-end gap-3 rounded-2xl border border-black/5 bg-white p-4 shadow-sm shadow-black/5"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="quantity"
              className="text-xs uppercase tracking-[0.12em] text-black/50"
            >
              Generate codes (1–500)
            </label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-32"
            />
          </div>
          <Button type="submit" disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
          {generateError ? (
            <p className="w-full text-sm text-red-700">{generateError}</p>
          ) : null}
        </form>
      ) : null}

      {generatedCodes ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-emerald-900">
              Generated {generatedCodes.length} code
              {generatedCodes.length === 1 ? "" : "s"}. Copy or export now.
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => void copyGenerated()}>
                {copied ? "Copied" : "Copy all"}
              </Button>
              <Button type="button" variant="outline" size="sm" asChild>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(generatedCodes.join("\n"))}`}
                  download="registration-codes.txt"
                >
                  Download .txt
                </a>
              </Button>
            </div>
          </div>
          <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-white/80 p-3 text-xs text-[#001539]">
            {generatedCodes.join("\n")}
          </pre>
        </div>
      ) : null}

      <div className="rounded-2xl border border-black/5 bg-white p-3 shadow-sm shadow-black/5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
          <select
            value={status}
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value as RegistrationCodeStatus | "");
            }}
            className={cn(
              "flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
              !status ? "text-muted-foreground/70" : "text-foreground",
            )}
          >
            <option value="">All statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="RESERVED">Reserved</option>
            <option value="CONSUMED">Consumed</option>
            <option value="REVOKED">Revoked</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadCodes()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>

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
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Consumed</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-black/50"
                >
                  Loading codes...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-10 text-center text-sm text-black/50"
                >
                  No registration codes match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.code}</TableCell>
                  <TableCell className="capitalize">
                    {item.status.toLowerCase()}
                  </TableCell>
                  <TableCell>{item.beneficiaryId ?? "—"}</TableCell>
                  <TableCell>{formatDateTime(item.consumedAt)}</TableCell>
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
    </div>
  );
}
