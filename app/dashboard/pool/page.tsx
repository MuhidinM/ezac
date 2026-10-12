"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCheck, CornerUpLeft, MinusCircle, RefreshCw, SlidersHorizontal, X, XCircle } from "lucide-react";

import { RiskBadge, ScoreMeter, WhitelistBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { PayoutDialog } from "@/components/disbursements/payout-dialog";
import { FormField } from "@/components/dashboard/form-field";
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
import { Textarea } from "@/components/ui/textarea";
import type { PoolEntry } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import type { BranchListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { ASNAF } from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { cn } from "@/lib/utils";

const API = "/api/backoffice/admin/pool";
const PAGE_SIZE = 25;

type View = "awaiting" | "pooled";
type RowAction = "decline" | "send-back" | "remove";

type Filters = {
  branchId: string;
  region: string;
  riskCategory: string;
  scoreMin: string;
  scoreMax: string;
  asnaf: string;
  approvedFrom: string;
  approvedTo: string;
  sort: "priority" | "score" | "approvedAt" | "poolStatusAt";
  order: "desc" | "asc";
};

const EMPTY: Filters = {
  branchId: "",
  region: "",
  riskCategory: "",
  scoreMin: "",
  scoreMax: "",
  asnaf: "",
  approvedFrom: "",
  approvedTo: "",
  sort: "priority",
  order: "desc",
};

const ACTION_COPY: Record<RowAction, { title: string; description: string; confirm: string; destructive?: boolean }> = {
  decline: {
    title: "Decline from the pool",
    description: "The household is not pooled this time and goes back to Assessed. A new assessment can start later.",
    confirm: "Decline",
    destructive: true,
  },
  "send-back": {
    title: "Send back to the branch",
    description: "The assessment becomes Returned so the officer can correct it; after the branch approves again it comes back here.",
    confirm: "Send back",
  },
  remove: {
    title: "Remove from the pool",
    description: "The household leaves the disbursement pool and goes back to Assessed.",
    confirm: "Remove",
    destructive: true,
  },
};

function rowKey(entry: PoolEntry) {
  return entry.source === "WHITELIST" ? `w:${entry.whitelistEntryId}` : `a:${entry.assessmentId}`;
}

function actionPath(entry: PoolEntry, action: RowAction) {
  return entry.source === "WHITELIST"
    ? `${API}/whitelist/${encodeURIComponent(entry.whitelistEntryId ?? "")}/${action}`
    : `${API}/${encodeURIComponent(entry.assessmentId ?? "")}/${action}`;
}

export default function PoolPage() {
  return (
    <RequireRole audience={["admin"]}>
      <Pool />
    </RequireRole>
  );
}

function Pool() {
  const [view, setView] = useState<View>("awaiting");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [showFilters, setShowFilters] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [poolOpen, setPoolOpen] = useState(false);
  const [action, setAction] = useState<{ entry: PoolEntry; kind: RowAction } | null>(null);
  const [paying, setPaying] = useState<PoolEntry | null>(null);
  const [reason, setReason] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    if ((key === "sort" && value === "priority") || (key === "order" && value === "desc")) continue;
    params.set(key, value);
  }
  const path = view === "awaiting" ? `${API}/awaiting` : API;
  const { data, error, isLoading, reload } = useResource<PaginatedItems<PoolEntry>>(`${path}?${params.toString()}`);
  const { data: branches } = useResource<PaginatedItems<BranchListItem>>(
    showFilters ? "/api/admin/branches?page=1&limit=100" : null,
  );

  const rows = useMemo(() => data?.items ?? [], [data]);
  const selectedRows = rows.filter((row) => selected.has(rowKey(row)));
  const allSelected = rows.length > 0 && selectedRows.length === rows.length;
  const activeFilters = (["branchId", "region", "riskCategory", "scoreMin", "scoreMax", "asnaf", "approvedFrom", "approvedTo"] as const).filter(
    (key) => filters[key],
  ).length;

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setPage(1);
    setSelected(new Set());
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function switchView(next: View) {
    setView(next);
    setPage(1);
    setSelected(new Set());
    setNotice(null);
    setFilters((prev) => ({ ...prev, sort: "priority" }));
  }

  function toggle(entry: PoolEntry) {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = rowKey(entry);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Disbursement pool"
        description="Branch-approved households and fast-track whitelist entries wait here. Pool them to make them active for the next disbursement; fast track comes first, then priority, then the highest score."
        actions={
          <Button variant="outline" onClick={reload} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
        }
      />

      {notice ? <InlineAlert tone={notice.tone}>{notice.text}</InlineAlert> : null}

      <Panel flush>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] px-3 pt-2">
          <div className="flex gap-1" role="tablist">
            {(
              [
                ["awaiting", "Awaiting pool"],
                ["pooled", "In the pool"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={view === key}
                onClick={() => switchView(key)}
                className={cn(
                  "-mb-px border-b-2 px-3 py-2.5 text-sm transition",
                  view === key ? "border-[#007050] font-medium text-[#001539]" : "border-transparent text-black/55 hover:text-[#001539]",
                )}
              >
                {label}
                {view === key && data ? (
                  <span className="ml-1.5 text-xs text-black/45 tabular-nums">{data.pagination.totalItems}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 pb-2">
            <div className="w-48">
              <NativeSelect
                aria-label="Sort"
                value={`${filters.sort}:${filters.order}`}
                onChange={(event) => {
                  const [sort, order] = event.target.value.split(":") as [Filters["sort"], Filters["order"]];
                  setPage(1);
                  setFilters((prev) => ({ ...prev, sort, order }));
                }}
              >
                <option value="priority:desc">Priority (default)</option>
                <option value="score:desc">Highest score</option>
                <option value="approvedAt:asc">Approved longest ago</option>
                <option value="approvedAt:desc">Approved most recently</option>
                <option value="poolStatusAt:desc">Last pool change</option>
              </NativeSelect>
            </div>
            <Button variant={showFilters ? "secondary" : "ghost"} size="sm" onClick={() => setShowFilters((value) => !value)}>
              <SlidersHorizontal />
              Filters
              {activeFilters ? (
                <span className="rounded-full bg-[#007050] px-1.5 text-[11px] text-white tabular-nums">{activeFilters}</span>
              ) : null}
            </Button>
            {activeFilters ? (
              <Button variant="ghost" size="sm" onClick={() => { setPage(1); setFilters({ ...EMPTY, sort: filters.sort, order: filters.order }); }}>
                <X />
                Clear
              </Button>
            ) : null}
          </div>
        </div>

        {showFilters ? (
          <div className="grid gap-3 border-b border-black/[0.06] bg-black/[0.015] px-5 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Branch" htmlFor="p-branch">
              <NativeSelect id="p-branch" value={filters.branchId} onChange={(e) => update("branchId", e.target.value)}>
                <option value="">Any</option>
                {branches?.items.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Region" htmlFor="p-region">
              <NativeSelect id="p-region" value={filters.region} onChange={(e) => update("region", e.target.value)}>
                <option value="">Any</option>
                {ETHIOPIAN_REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Risk" htmlFor="p-risk">
              <NativeSelect id="p-risk" value={filters.riskCategory} onChange={(e) => update("riskCategory", e.target.value)}>
                <option value="">Any</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </NativeSelect>
            </FormField>
            <FormField label="Asnaf" htmlFor="p-asnaf">
              <NativeSelect id="p-asnaf" value={filters.asnaf} onChange={(e) => update("asnaf", e.target.value)}>
                <option value="">Any</option>
                {ASNAF.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Score (0–270)" htmlFor="p-min">
              <div className="flex items-center gap-2">
                <Input id="p-min" type="number" min={0} max={270} placeholder="Min" value={filters.scoreMin} onChange={(e) => update("scoreMin", e.target.value)} className="bg-white" />
                <span className="text-black/40">–</span>
                <Input type="number" min={0} max={270} placeholder="Max" aria-label="Maximum score" value={filters.scoreMax} onChange={(e) => update("scoreMax", e.target.value)} className="bg-white" />
              </div>
            </FormField>
            <FormField label="Approved between" htmlFor="p-from" className="lg:col-span-2">
              <div className="flex items-center gap-2">
                <Input id="p-from" type="date" value={filters.approvedFrom} onChange={(e) => update("approvedFrom", e.target.value)} className="bg-white" />
                <span className="text-black/40">–</span>
                <Input type="date" aria-label="Approved to" value={filters.approvedTo} onChange={(e) => update("approvedTo", e.target.value)} className="bg-white" />
              </div>
            </FormField>
          </div>
        ) : null}

        {view === "awaiting" && selectedRows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-[#007050]/[0.05] px-5 py-2.5">
            <p className="text-sm text-[#001539]">
              <span className="font-semibold tabular-nums">{selectedRows.length}</span> selected
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear selection
              </Button>
              <Button size="sm" onClick={() => setPoolOpen(true)}>
                <CheckCheck />
                Pool selected
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="px-5 pt-4">
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              {view === "awaiting" ? (
                <TableHead className="w-10 pl-5">
                  <input
                    type="checkbox"
                    aria-label="Select all on this page"
                    checked={allSelected}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(rows.map(rowKey)))}
                    className="size-4 accent-[#007050]"
                  />
                </TableHead>
              ) : null}
              <TableHead className={view === "awaiting" ? undefined : "pl-5"}>Household</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>{view === "awaiting" ? "Approved" : "Pooled"}</TableHead>
              <TableHead>Bank account</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={7} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={7}>
                {view === "awaiting" ? "Nothing is waiting to be pooled." : "The pool is empty."}
              </TableMessageRow>
            ) : (
              rows.map((entry) => {
                const key = rowKey(entry);
                const isSelected = selected.has(key);
                return (
                  <TableRow key={key} className={cn(isSelected && "bg-[#007050]/[0.04]")}>
                    {view === "awaiting" ? (
                      <TableCell className="pl-5">
                        <input
                          type="checkbox"
                          aria-label={`Select ${entry.fullName ?? "household"}`}
                          checked={isSelected}
                          onChange={() => toggle(entry)}
                          className="size-4 accent-[#007050]"
                        />
                      </TableCell>
                    ) : null}
                    <TableCell className={view === "awaiting" ? undefined : "pl-5"}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/dashboard/beneficiary/${entry.beneficiaryId}`} className="font-medium text-[#001539] hover:underline">
                          {entry.fullName ?? `Beneficiary #${entry.beneficiaryId}`}
                        </Link>
                        <WhitelistBadge effect={entry.whitelistEffect} />
                        {entry.source === "WHITELIST" ? <Badge tone="neutral">No assessment yet</Badge> : null}
                      </div>
                      <p className="text-xs text-black/50">
                        {entry.assessmentId ? (
                          <Link href={`/dashboard/assessments/${entry.assessmentId}`} className="hover:underline">
                            {entry.assessmentNumber ?? `Assessment #${entry.assessmentId}`}
                          </Link>
                        ) : (
                          "Whitelist entry"
                        )}
                        {entry.phone ? ` · ${entry.phone}` : ""}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-[#001539]">{entry.branchName ?? "—"}</p>
                      <p className="text-xs text-black/45">{[entry.woreda, entry.region].filter(Boolean).join(", ")}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <ScoreMeter score={entry.score} max={entry.maxScore} risk={entry.riskCategory} />
                        {entry.riskCategory ? <RiskBadge risk={entry.riskCategory} /> : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-black/65">
                      {formatDateTime((view === "awaiting" ? entry.approvedAt : entry.poolStatusAt) ?? null)}
                    </TableCell>
                    <TableCell>
                      {entry.bankAccount?.accountNumber ? (
                        <>
                          <p className="font-mono text-sm text-[#001539]">{entry.bankAccount.accountNumber}</p>
                          <p className="text-xs text-black/45">
                            {[entry.bankAccount.bankName, entry.bankAccount.accountHolderName].filter(Boolean).join(" · ")}
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-amber-700">Missing</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex justify-end gap-1">
                        {view === "awaiting" ? (
                          <>
                            {entry.source === "ASSESSMENT" ? (
                              <Button variant="ghost" size="sm" onClick={() => setAction({ entry, kind: "send-back" })}>
                                <CornerUpLeft />
                                Send back
                              </Button>
                            ) : null}
                            <Button variant="ghost" size="sm" className="text-rose-700 hover:text-rose-800" onClick={() => setAction({ entry, kind: "decline" })}>
                              <XCircle />
                              Decline
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaying(entry)}
                              disabled={!entry.bankAccount?.accountNumber}
                              title={entry.bankAccount?.accountNumber ? undefined : "No bank account on file"}
                            >
                              <Banknote />
                              Pay
                            </Button>
                            <Button variant="ghost" size="sm" className="text-rose-700 hover:text-rose-800" onClick={() => setAction({ entry, kind: "remove" })}>
                              <MinusCircle />
                              Remove
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <ListPagination
          page={page}
          pageSize={PAGE_SIZE}
          totalItems={data?.pagination.totalItems ?? 0}
          totalPages={data?.pagination.totalPages ?? 1}
          disabled={isLoading}
          onPageChange={(next) => {
            setPage(next);
            setSelected(new Set());
          }}
        />
      </Panel>

      {paying ? (
        <PayoutDialog
          key={rowKey(paying)}
          entry={paying}
          onClose={() => setPaying(null)}
          onFinished={(payout) => {
            if (payout.status === "SUCCEEDED") {
              setNotice({ tone: "success", text: `Paid ${paying.fullName ?? "household"}. They have left the pool.` });
            }
            reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={poolOpen}
        onOpenChange={setPoolOpen}
        title={`Pool ${selectedRows.length} household${selectedRows.length === 1 ? "" : "s"}?`}
        description="They become Active and are included in the next disbursement. It's all or nothing: if one of them was changed meanwhile, nothing is pooled and the list reloads."
        confirmLabel="Pool"
        onConfirm={async () => {
          const assessmentIds = selectedRows.filter((row) => row.source === "ASSESSMENT").map((row) => row.assessmentId!);
          const whitelistEntryIds = selectedRows.filter((row) => row.source === "WHITELIST").map((row) => row.whitelistEntryId!);
          try {
            await apiClient(API, {
              method: "POST",
              body: JSON.stringify({
                ...(assessmentIds.length ? { assessmentIds } : {}),
                ...(whitelistEntryIds.length ? { whitelistEntryIds } : {}),
              }),
            });
            setNotice({ tone: "success", text: `${selectedRows.length} household${selectedRows.length === 1 ? "" : "s"} pooled.` });
          } finally {
            setSelected(new Set());
            reload();
          }
        }}
      />

      <ConfirmDialog
        open={action !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAction(null);
            setReason("");
          }
        }}
        title={action ? ACTION_COPY[action.kind].title : ""}
        description={
          action ? (
            <>
              <strong>{action.entry.fullName ?? "This household"}</strong>. {ACTION_COPY[action.kind].description}
            </>
          ) : undefined
        }
        confirmLabel={action ? ACTION_COPY[action.kind].confirm : "Confirm"}
        destructive={action ? ACTION_COPY[action.kind].destructive : false}
        confirmDisabled={!reason.trim()}
        onConfirm={async () => {
          if (!action) return;
          await apiClient(actionPath(action.entry, action.kind), {
            method: "POST",
            body: JSON.stringify({ reason: reason.trim() }),
          });
          setNotice({ tone: "success", text: `${ACTION_COPY[action.kind].confirm}: ${action.entry.fullName ?? "household"}.` });
          setReason("");
          reload();
        }}
      >
        <FormField label="Reason" htmlFor="pool-reason" required hint="Recorded with the change">
          <Textarea id="pool-reason" maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
      </ConfirmDialog>
    </section>
  );
}
