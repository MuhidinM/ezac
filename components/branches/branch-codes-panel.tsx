"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { Ban, Check, Copy, Download, Plus, RefreshCw } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type {
  PaginatedItems,
  RegistrationCodeItem,
  RegistrationCodeStatus,
} from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS: Record<RegistrationCodeStatus, { label: string; tone: BadgeTone }> = {
  AVAILABLE: { label: "Available", tone: "success" },
  RESERVED: { label: "Reserved", tone: "info" },
  CONSUMED: { label: "Used", tone: "navy" },
  REVOKED: { label: "Revoked", tone: "neutral" },
};

const TABS: { status: RegistrationCodeStatus | ""; label: string }[] = [
  { status: "", label: "All" },
  { status: "AVAILABLE", label: "Available" },
  { status: "RESERVED", label: "Reserved" },
  { status: "CONSUMED", label: "Used" },
  { status: "REVOKED", label: "Revoked" },
];

type Props = {
  /** API path that returns PaginatedItems<RegistrationCodeItem> */
  listPath: string;
  /** When set, shows the generate-codes action that POSTs here */
  generatePath?: string;
  /** Link consumed codes to beneficiary profiles (HQ staff only). */
  linkBeneficiaries?: boolean;
  /** Admin codes path; enables single and bulk revoke. */
  revokeBasePath?: string;
  /** Called after codes are generated successfully */
  onGenerated?: (codes: string[]) => void;
};

export function BranchCodesPanel({ listPath, generatePath, linkBeneficiaries, revokeBasePath, onGenerated }: Props) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<RegistrationCodeStatus | "">("");
  const [generateOpen, setGenerateOpen] = useState(false);
  const [generated, setGenerated] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  // null = closed, "all" = every available code, otherwise one code.
  const [revokeTarget, setRevokeTarget] = useState<RegistrationCodeItem | "all" | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) params.set("status", status);
  const separator = listPath.includes("?") ? "&" : "?";
  const { data, error, isLoading, reload } = useResource<PaginatedItems<RegistrationCodeItem>>(
    `${listPath}${separator}${params.toString()}`,
  );
  const rows = data?.items ?? [];

  return (
    <div className="space-y-4">
      {generated ? (
        <InlineAlert
          tone="success"
          title={`${generated.length} new code${generated.length === 1 ? "" : "s"} generated`}
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => setCopied(await copyToClipboard(generated.join("\n")))}
              >
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy all"}
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`data:text/plain;charset=utf-8,${encodeURIComponent(generated.join("\n"))}`}
                  download="registration-codes.txt"
                >
                  <Download />
                  .txt
                </a>
              </Button>
            </div>
          }
        >
          <pre className="mt-2 max-h-32 overflow-auto font-mono text-xs">{generated.join("\n")}</pre>
        </InlineAlert>
      ) : null}

      <Panel
        title="Registration codes"
        description="Single-use codes beneficiaries register with. The code they use becomes their BIN."
        flush
        actions={
          <>
            <Button variant="ghost" size="sm" onClick={reload} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
            {revokeBasePath ? (
              <Button variant="ghost" size="sm" className="text-rose-700 hover:text-rose-800" onClick={() => setRevokeTarget("all")}>
                <Ban />
                Revoke available
              </Button>
            ) : null}
            {generatePath ? (
              <Button size="sm" onClick={() => setGenerateOpen(true)}>
                <Plus />
                Generate codes
              </Button>
            ) : null}
          </>
        }
      >
        <div className="flex gap-1 overflow-x-auto border-b border-black/[0.06] px-3" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              role="tab"
              aria-selected={status === tab.status}
              onClick={() => {
                setPage(1);
                setStatus(tab.status);
              }}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm transition",
                status === tab.status
                  ? "border-[#007050] font-medium text-[#001539]"
                  : "border-transparent text-black/55 hover:text-[#001539]",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error || notice ? (
          <div className="space-y-2 px-5 pt-4">
            {error ? <InlineAlert>{error.message}</InlineAlert> : null}
            {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Beneficiary</TableHead>
              <TableHead>Used</TableHead>
              <TableHead className={revokeBasePath ? undefined : "pr-5"}>Created</TableHead>
              {revokeBasePath ? (
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={revokeBasePath ? 6 : 5} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={revokeBasePath ? 6 : 5}>
                {status ? "No codes with this status." : "No registration codes yet."}
              </TableMessageRow>
            ) : (
              rows.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-5 font-mono text-sm text-[#001539]">{item.code}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS[item.status]?.tone ?? "neutral"}>
                      {STATUS[item.status]?.label ?? item.status}
                    </Badge>
                    {item.status === "REVOKED" && item.revokeReason ? (
                      <p className="mt-1 max-w-48 truncate text-xs text-black/45" title={item.revokeReason}>
                        {item.revokeReason}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {item.beneficiaryId ? (
                      linkBeneficiaries ? (
                        <Link href={`/dashboard/beneficiary/${item.beneficiaryId}`} className="text-[#007050] hover:underline">
                          #{item.beneficiaryId}
                        </Link>
                      ) : (
                        <span className="tabular-nums">#{item.beneficiaryId}</span>
                      )
                    ) : (
                      <span className="text-black/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(item.consumedAt)}</TableCell>
                  <TableCell className={revokeBasePath ? undefined : "pr-5"}>{formatDateTime(item.createdAt)}</TableCell>
                  {revokeBasePath ? (
                    <TableCell className="pr-5 text-right">
                      {item.status === "AVAILABLE" || item.status === "RESERVED" ? (
                        <Button variant="ghost" size="sm" onClick={() => setRevokeTarget(item)}>
                          Revoke
                        </Button>
                      ) : null}
                    </TableCell>
                  ) : null}
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

      {revokeBasePath ? (
        <ConfirmDialog
          open={revokeTarget !== null}
          onOpenChange={(open) => (open ? null : setRevokeTarget(null))}
          title={revokeTarget === "all" ? "Revoke every available code?" : `Revoke ${revokeTarget ? revokeTarget.code : "code"}?`}
          description={
            revokeTarget === "all"
              ? "All unused codes of this branch stop working immediately. Used codes are not affected."
              : "This code stops working immediately and can't be restored."
          }
          confirmLabel="Revoke"
          destructive
          confirmDisabled={!revokeReason.trim()}
          onConfirm={async () => {
            if (!revokeTarget) return;
            if (revokeTarget === "all") {
              const result = await apiClient<{ revoked: number }>(`${revokeBasePath}/revoke`, {
                method: "POST",
                body: JSON.stringify({ allAvailable: true, reason: revokeReason.trim() }),
              });
              setNotice(`${result.revoked} code${result.revoked === 1 ? "" : "s"} revoked.`);
            } else {
              await apiClient(`${revokeBasePath}/${encodeURIComponent(revokeTarget.id)}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "REVOKED", reason: revokeReason.trim() }),
              });
              setNotice(`${revokeTarget.code} revoked.`);
            }
            setRevokeReason("");
            reload();
            onGenerated?.([]);
          }}
        >
          <FormField label="Reason" htmlFor="revoke-reason" required>
            <Textarea
              id="revoke-reason"
              value={revokeReason}
              onChange={(event) => setRevokeReason(event.target.value)}
              placeholder="e.g. Printed batch lost"
            />
          </FormField>
        </ConfirmDialog>
      ) : null}

      {generatePath ? (
        <GenerateCodesDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          path={generatePath}
          onGenerated={(codes) => {
            setGenerated(codes);
            setCopied(false);
            setPage(1);
            reload();
            onGenerated?.(codes);
          }}
        />
      ) : null}
    </div>
  );
}

function GenerateCodesDialog({
  open,
  onOpenChange,
  path,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: string;
  onGenerated: (codes: string[]) => void;
}) {
  const [quantity, setQuantity] = useState("50");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1 || qty > 500) {
      setError("Enter a whole number between 1 and 500.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const codes = await apiClient<string[]>(path, {
        method: "POST",
        body: JSON.stringify({ quantity: qty }),
      });
      onGenerated(codes);
      onOpenChange(false);
    } catch (generateError) {
      setError(errorMessage(generateError, "Failed to generate codes"));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Generate registration codes</DialogTitle>
            <DialogDescription>
              New codes are available immediately. You can copy or download them after generating.
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <FormField label="How many?" htmlFor="code-quantity" hint="Between 1 and 500" required>
            <Input
              id="code-quantity"
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-40"
            />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? "Generating…" : "Generate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
