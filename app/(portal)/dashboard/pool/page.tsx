"use client";

import { type KeyboardEvent, Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCheck, CornerUpLeft, Download, MinusCircle, RefreshCw, SlidersHorizontal, X, XCircle } from "lucide-react";

import { DuplicateBadge, PoolStatusBadge, RiskBadge, ScoreMeter, WhitelistBadge } from "@/components/backoffice/status-badges";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { PayoutDialog, useServerNow } from "@/components/disbursements/payout-dialog";
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
import { Tabs, TabsContent, TabsCount, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { PoolEntry } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import type { BranchListItem, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useScoreMax } from "@/lib/backoffice/score-max";
import { ASNAF } from "@/lib/backoffice/options";
import { formatCount } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { useListState } from "@/lib/hooks/use-list-state";
import { cn } from "@/lib/utils";
import { bankChangedRecently } from "@/lib/zakat/disbursements";
import {
  hasBankAccount,
  notEligibleByHousehold,
  openPayoutState,
  POOL_FILTERS,
  POOL_LIST_DEFAULTS,
  POOL_SORTS,
  poolBlock,
  type PoolCounts,
  poolFilterParams,
  poolQuery,
  type PoolRow,
  poolStepBack,
} from "@/lib/zakat/pool-list";

const API = "/bff/backoffice/admin/pool";
const PAGE_SIZE = 25;

type View = "awaiting" | "pooled";
type RowAction = "decline" | "send-back" | "remove";

const VIEWS: { value: View; label: string }[] = [
  { value: "awaiting", label: "Awaiting pool" },
  { value: "pooled", label: "In the pool" },
];

/**
 * A text box's draft, written to the URL only when the admin presses Enter or
 * leaves the box, so typing "150" doesn't reload the list for "1" and "15"
 * (perf-11). Takes the URL's value when it changes from elsewhere (Clear, Back).
 */
function useDraft(value: string) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  return [draft, setDraft] as const;
}

function viewPath(view: View) {
  return view === "awaiting" ? `${API}/awaiting` : API;
}

type ActionCopy = { title: string; description: string; confirm: string; destructive?: boolean };

/** What happens after Decline or Remove differs for a fast-track entry, which has no assessment to fall back to. */
function actionCopy(kind: RowAction, source: PoolEntry["source"]): ActionCopy {
  const whitelist = source === "WHITELIST";
  const afterWhitelist =
    "Its fast-track entry stays on the whitelist but won't come back to this list. To queue it again, the entry has to be revoked and a new request approved.";
  const afterAssessment = "To be pooled again it needs a new assessment and branch approval.";
  switch (kind) {
    case "decline":
      return {
        title: "Decline from the pool",
        description: whitelist
          ? `The household is not pooled and goes back to Pending assessment. ${afterWhitelist}`
          : `The household is not pooled this time and goes back to Assessed. ${afterAssessment}`,
        confirm: "Decline",
        destructive: true,
      };
    case "send-back":
      return {
        title: "Send back to the branch",
        description: "The assessment becomes Returned so the officer can correct it; after the branch approves again it comes back here.",
        confirm: "Send back",
      };
    case "remove":
      return {
        title: "Remove from the pool",
        description: whitelist
          ? `The household leaves the disbursement pool and goes back to Pending assessment. ${afterWhitelist}`
          : `The household leaves the disbursement pool and goes back to Assessed. ${afterAssessment}`,
        confirm: "Remove",
        destructive: true,
      };
  }
}

function rowKey(entry: PoolEntry) {
  return entry.source === "WHITELIST" ? `w:${entry.whitelistEntryId}` : `a:${entry.assessmentId}`;
}

function actionPath(entry: PoolEntry, action: RowAction) {
  return entry.source === "WHITELIST"
    ? `${API}/whitelist/${encodeURIComponent(entry.whitelistEntryId ?? "")}/${action}`
    : `${API}/${encodeURIComponent(entry.assessmentId ?? "")}/${action}`;
}

/** The Remove answers that need words of their own (beneficiary-service checks payment-service first). */
function removeFailure(error: unknown): Error {
  if (error instanceof ApiError && error.code === "PAYOUT_OPEN") {
    return new Error("A payout for this household is prepared or being paid. Cancel or finish it on the Payouts page first.");
  }
  if (error instanceof ApiError && error.code === "SERVICE_UNAVAILABLE") {
    return new Error("We couldn't check for an open payout because the payment service didn't answer. Try again in a moment.");
  }
  return error instanceof Error ? error : new Error("Something went wrong");
}

/** The file name from a Content-Disposition header, or a fallback. */
function downloadName(header: string | null, fallback: string) {
  const match = header?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
}

export default function PoolPage() {
  return (
    <RequireRole audience={["admin"]}>
      {/* useSearchParams needs a Suspense boundary. */}
      <Suspense>
        <Pool />
      </Suspense>
    </RequireRole>
  );
}

function Pool() {
  // Tab, sort, filters and page live in the URL: reload, Back from a household and a shared link show the same list.
  const [list, setList] = useListState("", POOL_LIST_DEFAULTS, {
    allowed: { view: VIEWS.map((item) => item.value), sort: POOL_SORTS.map((item) => item.value), riskCategory: ["", "HIGH", "MEDIUM", "LOW"] },
  });
  const view = list.view as View;
  const page = list.page;
  const activeFilters = POOL_FILTERS.filter((key) => list[key]).length;
  const [showFilters, setShowFilters] = useState(activeFilters > 0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [poolOpen, setPoolOpen] = useState(false);
  // The rows the open "Pool" dialog is about, fixed when it opens so a reload can't empty it.
  const [poolTargets, setPoolTargets] = useState<PoolEntry[]>([]);
  const [action, setAction] = useState<{ entry: PoolEntry; kind: RowAction } | null>(null);
  const [paying, setPaying] = useState<PoolEntry | null>(null);
  const [reason, setReason] = useState("");

  // The active scoring config's maximum; 270 until it is known.
  const scoreMax = useScoreMax();
  const [scoreMinDraft, setScoreMinDraft] = useDraft(list.scoreMin);
  const [scoreMaxDraft, setScoreMaxDraft] = useDraft(list.scoreMax);
  // Both boxes go to the URL together. A range that can't match (min above max, outside
  // 0 to the maximum) is shown under the field and left out of the request (poolQuery).
  function commitScores() {
    setList({ scoreMin: scoreMinDraft.trim(), scoreMax: scoreMaxDraft.trim() });
  }
  function onScoreKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitScores();
    }
  }
  const query = poolQuery(list, scoreMax, PAGE_SIZE);
  // Errors follow what is typed, before it reaches the URL.
  const filterErrors = poolQuery({ ...list, scoreMin: scoreMinDraft, scoreMax: scoreMaxDraft }, scoreMax, PAGE_SIZE).errors;
  const scoresPending = scoreMinDraft.trim() !== list.scoreMin || scoreMaxDraft.trim() !== list.scoreMax;
  const listPath = `${viewPath(view)}?${query.params.toString()}`;
  const { data, error, isLoading, reload } = useResource<PaginatedItems<PoolRow>>(listPath);
  // Every tab's count under the same filters, in one call (UAT 78).
  const filterParams = poolFilterParams(query.params).toString();
  const poolCounts = useResource<PoolCounts>(`${API}/counts${filterParams ? `?${filterParams}` : ""}`);
  const counts: Record<View, number | undefined> = {
    awaiting: poolCounts.data?.AWAITING_POOL,
    pooled: poolCounts.data?.POOLED,
  };
  // Why POST /admin/pool refused households (409 NOT_ELIGIBLE), by beneficiary id, shown on their rows.
  const [notEligible, setNotEligible] = useState<Record<string, string[]>>({});
  const [exporting, setExporting] = useState(false);

  // A selection belongs to one page of one list: it is cleared when the list changes.
  const [selectionFor, setSelectionFor] = useState(listPath);
  if (selectionFor !== listPath) {
    setSelectionFor(listPath);
    setSelected(new Set());
  }

  // After a row action empties the last page, go back to the last page that has rows (logic-backoffice-23).
  const stepBackTo = poolStepBack(data, page);
  useEffect(() => {
    if (stepBackTo !== null) setList({ page: stepBackTo });
  }, [stepBackTo, setList]);
  const { data: branches } = useResource<PaginatedItems<BranchListItem>>(
    showFilters ? "/bff/admin/branches?page=1&limit=100" : null,
  );
  const now = useServerNow(60_000);

  const rows = useMemo(() => data?.items ?? [], [data]);
  const selectable = view === "awaiting" ? rows.filter((row) => !poolBlock(row)) : [];
  const selectedRows = selectable.filter((row) => selected.has(rowKey(row)));
  const allSelected = selectable.length > 0 && selectedRows.length === selectable.length;

  function reloadAll() {
    reload();
    poolCounts.reload();
  }

  /** The whole filtered tab as CSV (at most 10,000 rows), through the BFF. */
  async function exportCsv() {
    setExporting(true);
    setNotice(null);
    try {
      const params = new URLSearchParams(filterParams);
      params.set("status", view === "awaiting" ? "AWAITING_POOL" : "POOLED");
      const response = await fetch(`${API}/export?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Couldn't export the list. Try again.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = downloadName(response.headers.get("Content-Disposition"), `pool-${view}.csv`);
      link.click();
      URL.revokeObjectURL(url);
      if (response.headers.get("X-Export-Truncated") === "true") {
        const total = Number(response.headers.get("X-Total-Count"));
        setNotice({
          tone: "error",
          text: `The file has the first 10,000 households only${Number.isFinite(total) && total > 0 ? ` of ${formatCount(total)}` : ""}. Narrow the filters to export the rest.`,
        });
      }
    } catch (exportError) {
      setNotice({ tone: "error", text: errorMessage(exportError, "Couldn't export the list. Try again.") });
    } finally {
      setExporting(false);
    }
  }

  function update(key: (typeof POOL_FILTERS)[number], value: string) {
    setList({ [key]: value });
  }

  /** Each tab starts in its default order; the filters stay. */
  function switchView(next: string) {
    setNotice(null);
    setList({ view: next, sort: POOL_LIST_DEFAULTS.sort });
  }

  function clearFilters() {
    setList(Object.fromEntries(POOL_FILTERS.map((key) => [key, ""])));
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

  const actionText = action ? actionCopy(action.kind, action.entry.source) : null;

  return (
    <section className="space-y-6">
      <PageHeader
        title="Disbursement pool"
        description="Branch-approved households and fast-track whitelist entries wait here. Pool them to make them active for the next disbursement; fast track comes first, then priority, then the highest score."
        actions={
          <>
            <Button variant="outline" onClick={exportCsv} loading={exporting} loadingText="Exporting…" disabled={!data || data.pagination.totalItems === 0}>
              <Download />
              Export CSV
            </Button>
            <Button variant="outline" onClick={reloadAll} disabled={isLoading}>
              <RefreshCw />
              Refresh
            </Button>
          </>
        }
      />

      {notice ? <InlineAlert tone={notice.tone}>{notice.text}</InlineAlert> : null}

      <Panel flush>
        <Tabs value={view} onValueChange={switchView} activationMode="manual">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pr-3">
          <TabsList aria-label="Pool" className="shadow-none">
            {VIEWS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
                {counts[item.value] !== undefined ? <TabsCount>{formatCount(counts[item.value])}</TabsCount> : null}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-2 py-2">
            <div className="w-48">
              <NativeSelect aria-label="Sort" value={list.sort} onChange={(event) => setList({ sort: event.target.value })}>
                {POOL_SORTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button variant={showFilters ? "secondary" : "ghost"} size="sm" onClick={() => setShowFilters((value) => !value)}>
              <SlidersHorizontal />
              Filters
              {activeFilters ? (
                <span className="rounded-full bg-brand px-1.5 text-xs text-white tabular-nums">{activeFilters}</span>
              ) : null}
            </Button>
            {activeFilters ? (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X />
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        <TabsContent value={view}>

        {showFilters ? (
          <div className="grid gap-3 border-b border-black/[0.06] bg-black/[0.015] px-5 py-3 sm:grid-cols-2 lg:grid-cols-4">
            <FormField label="Branch" htmlFor="p-branch">
              <NativeSelect id="p-branch" value={list.branchId} onChange={(e) => update("branchId", e.target.value)}>
                <option value="">Any</option>
                {branches?.items.map((branch) => (
                  <option key={branch.id} value={branch.id}>{branch.name}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Region" htmlFor="p-region">
              <NativeSelect id="p-region" value={list.region} onChange={(e) => update("region", e.target.value)}>
                <option value="">Any</option>
                {ETHIOPIAN_REGIONS.map((region) => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Need" htmlFor="p-risk">
              <NativeSelect id="p-risk" value={list.riskCategory} onChange={(e) => update("riskCategory", e.target.value)}>
                <option value="">Any</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </NativeSelect>
            </FormField>
            <FormField label="Asnaf" htmlFor="p-asnaf">
              <NativeSelect id="p-asnaf" value={list.asnaf} onChange={(e) => update("asnaf", e.target.value)}>
                <option value="">Any</option>
                {ASNAF.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField
              label={`Score (0–${scoreMax})`}
              htmlFor="p-min"
              error={filterErrors.score}
              hint={scoresPending ? "Press Enter or leave the box to apply" : undefined}
            >
              <div className="flex items-center gap-2">
                <Input
                  id="p-min"
                  type="number"
                  min={0}
                  max={scoreMax}
                  placeholder="Min"
                  value={scoreMinDraft}
                  onChange={(e) => setScoreMinDraft(e.target.value)}
                  onKeyDown={onScoreKeyDown}
                  onBlur={commitScores}
                  className="bg-white"
                />
                <span className="text-black/60">–</span>
                <Input
                  type="number"
                  min={0}
                  max={scoreMax}
                  placeholder="Max"
                  aria-label="Maximum score"
                  value={scoreMaxDraft}
                  onChange={(e) => setScoreMaxDraft(e.target.value)}
                  onKeyDown={onScoreKeyDown}
                  onBlur={commitScores}
                  className="bg-white"
                />
              </div>
            </FormField>
            <FormField label="Approved between" htmlFor="p-from" className="lg:col-span-2" error={filterErrors.approved}>
              <div className="flex items-center gap-2">
                <Input id="p-from" type="date" value={list.approvedFrom} onChange={(e) => update("approvedFrom", e.target.value)} className="bg-white" />
                <span className="text-black/60">–</span>
                <Input type="date" aria-label="Approved to" value={list.approvedTo} onChange={(e) => update("approvedTo", e.target.value)} className="bg-white" />
              </div>
            </FormField>
          </div>
        ) : null}

        {view === "awaiting" && selectedRows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-brand/[0.05] px-5 py-2.5">
            <p className="text-sm text-navy">
              <span className="font-semibold tabular-nums">{selectedRows.length}</span> selected
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                Clear selection
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setPoolTargets(selectedRows);
                  setPoolOpen(true);
                }}
              >
                <CheckCheck />
                Pool selected
              </Button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="px-5 pt-4">
            <ErrorAlert error={error} onRetry={reloadAll} />
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              {view === "awaiting" ? (
                <TableHead className="w-10 pl-5">
                  <input
                    type="checkbox"
                    aria-label="Select all that can be pooled on this page"
                    checked={allSelected}
                    disabled={selectable.length === 0}
                    onChange={() => setSelected(allSelected ? new Set() : new Set(selectable.map(rowKey)))}
                    className="size-4 accent-brand disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </TableHead>
              ) : null}
              <TableHead className={view === "awaiting" ? undefined : "pl-5"}>Household</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>{view === "awaiting" ? "Approved" : "Pooled"}</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Bank account</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && rows.length === 0 ? (
              <TableSkeletonRows colSpan={8} />
            ) : rows.length === 0 ? (
              <TableMessageRow colSpan={8}>
                {activeFilters
                  ? "No households match these filters."
                  : view === "awaiting"
                    ? "Nothing is waiting to be pooled."
                    : "The pool is empty."}
              </TableMessageRow>
            ) : (
              rows.map((entry) => {
                const key = rowKey(entry);
                const name = entry.fullName ?? "household";
                const block = view === "awaiting" ? poolBlock(entry) : null;
                const isSelected = !block && selected.has(key);
                const refused = notEligible[entry.beneficiaryId];
                const pooled = view === "pooled" && entry.poolStatus !== "DISBURSED";
                const payoutState = pooled ? openPayoutState(entry) : null;
                const bankChange = Boolean(entry.pendingBankChange);
                const recentChange = now !== null && bankChangedRecently(entry.bankAccountChangedAt, now);
                const shared = (entry.sharedBankAccountCount ?? 0) > 0;
                const canPay = hasBankAccount(entry) && !bankChange;
                return (
                  <TableRow key={key} className={cn(isSelected && "bg-brand/[0.04]", refused && "bg-rose-50/60")}>
                    {view === "awaiting" ? (
                      <TableCell className="pl-5">
                        {block ? (
                          // Disabled inputs get no pointer events, so the wrapper carries the tooltip.
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex cursor-not-allowed">
                                <input
                                  type="checkbox"
                                  aria-label={`Can't select ${name}. ${block}`}
                                  checked={false}
                                  disabled
                                  readOnly
                                  className="size-4 accent-brand disabled:opacity-40"
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>{block}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <input
                            type="checkbox"
                            aria-label={`Select ${name}`}
                            checked={isSelected}
                            onChange={() => toggle(entry)}
                            className="size-4 accent-brand"
                          />
                        )}
                      </TableCell>
                    ) : null}
                    <TableCell className={view === "awaiting" ? undefined : "pl-5"}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link href={`/dashboard/beneficiary/${entry.beneficiaryId}`} className="font-medium text-navy hover:underline">
                          {entry.fullName ?? `Beneficiary #${entry.beneficiaryId}`}
                        </Link>
                        <WhitelistBadge effect={entry.whitelistEffect} />
                        <DuplicateBadge status={entry.duplicateStatus} />
                        {entry.source === "WHITELIST" ? <Badge tone="neutral">No assessment yet</Badge> : null}
                        {payoutState === "open" ? <Badge tone="info">Payout open</Badge> : null}
                        {payoutState === "unknown" ? (
                          <Badge tone="neutral" title="The payment service didn't answer in time, so we don't know whether a payout is open">
                            Payout: unknown
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-black/60">
                        {entry.assessmentId ? (
                          <Link href={`/dashboard/assessments/${entry.assessmentId}`} className="hover:underline">
                            {entry.assessmentNumber ?? `Assessment #${entry.assessmentId}`}
                          </Link>
                        ) : (
                          "Whitelist entry"
                        )}
                        {entry.phone ? ` · ${entry.phone}` : ""}
                      </p>
                      {refused ? (
                        <ul className="mt-1 space-y-0.5 text-xs text-rose-700">
                          {refused.map((reason) => (
                            <li key={reason}>Not pooled: {reason}</li>
                          ))}
                        </ul>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-navy">{entry.branchName ?? "—"}</p>
                      <p className="text-xs text-black/60">{[entry.woreda, entry.region].filter(Boolean).join(", ")}</p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <ScoreMeter score={entry.score} max={entry.maxScore ?? scoreMax} risk={entry.riskCategory} />
                        <div className="flex flex-wrap items-center gap-1">
                          {entry.riskCategory ? <RiskBadge risk={entry.riskCategory} /> : null}
                          {entry.scoringConfigVersion != null ? (
                            <span className="text-xs text-black/60" title="Scoring version used for this score">
                              v{entry.scoringConfigVersion}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-black/65">
                      {formatDateTime((view === "awaiting" ? entry.approvedAt : entry.poolStatusAt) ?? null)}
                      {view === "pooled" && entry.poolStatusByName ? <span className="block text-xs">by {entry.poolStatusByName}</span> : null}
                    </TableCell>
                    <TableCell>
                      {entry.verificationStatus ? (
                        <VerificationStatusBadge status={entry.verificationStatus} />
                      ) : (
                        <span className="text-sm text-black/60">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.bankAccount?.accountNumber ? (
                        <>
                          <p className="font-mono text-sm text-navy">{entry.bankAccount.accountNumber}</p>
                          <p className="text-xs text-black/60">
                            {[entry.bankAccount.bankName, entry.bankAccount.accountHolderName].filter(Boolean).join(" · ")}
                          </p>
                        </>
                      ) : hasBankAccount(entry) ? (
                        <span className="text-sm text-black/60">On file</span>
                      ) : (
                        <span className="text-sm text-amber-700">Missing</span>
                      )}
                      {bankChange ? <p className="text-xs text-amber-800">A bank change waits for another admin.</p> : null}
                      {recentChange ? (
                        <p className="text-xs text-amber-800">
                          Changed {formatDateTime(entry.bankAccountChangedAt ?? null)}
                          {entry.bankAccountChangedByName ? ` by ${entry.bankAccountChangedByName}` : ""}
                        </p>
                      ) : null}
                      {shared ? (
                        <p className="text-xs text-amber-800">
                          Also used by {formatCount(entry.sharedBankAccountCount ?? 0)} other household{entry.sharedBankAccountCount === 1 ? "" : "s"}
                        </p>
                      ) : null}
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
                            <Button variant="destructive-ghost" size="sm" onClick={() => setAction({ entry, kind: "decline" })}>
                              <XCircle />
                              Decline
                            </Button>
                          </>
                        ) : entry.poolStatus === "DISBURSED" ? (
                          // Paid and left the pool; it must be assessed and pooled again to be paid again.
                          <div className="text-right">
                            <PoolStatusBadge status="DISBURSED" />
                            {entry.poolStatusReason ? <p className="mt-1 text-xs text-black/60">{entry.poolStatusReason}</p> : null}
                          </div>
                        ) : payoutState === "open" ? (
                          // A payout is open: it is finished on the Payouts page, and the household can't leave the pool meanwhile.
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/disbursements?beneficiaryId=${encodeURIComponent(entry.beneficiaryId)}&range=1y`}>
                                <Banknote />
                                Open payout
                              </Link>
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex cursor-not-allowed">
                                  <Button variant="destructive-ghost" size="sm" disabled aria-label={`Remove ${name}: not while a payout is open`}>
                                    <MinusCircle />
                                    Remove
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>A payout is open for this household. Confirm, cancel or settle it first.</TooltipContent>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPaying(entry)}
                              disabled={!canPay}
                              title={bankChange ? "A bank change waits for another admin" : canPay ? undefined : "No bank account on file"}
                            >
                              <Banknote />
                              Pay
                            </Button>
                            <Button variant="destructive-ghost" size="sm" onClick={() => setAction({ entry, kind: "remove" })}>
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
          onPageChange={(next) => setList({ page: next })}
        />
        </TabsContent>
        </Tabs>
      </Panel>

      {paying ? (
        <PayoutDialog
          key={rowKey(paying)}
          entry={paying}
          onClose={() => {
            setPaying(null);
            reloadAll();
          }}
          onFinished={(payout) => {
            if (payout.status === "SUCCEEDED") {
              setNotice({ tone: "success", text: `Paid ${paying.fullName ?? "household"}. They have left the pool.` });
            }
            reloadAll();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={poolOpen}
        onOpenChange={setPoolOpen}
        title={`Pool ${poolTargets.length} household${poolTargets.length === 1 ? "" : "s"}?`}
        description="They become Active and are included in the next disbursement. It's all or nothing: if one of them was changed meanwhile, nothing is pooled and the list reloads."
        confirmLabel="Pool"
        confirmDisabled={poolTargets.length === 0}
        onConfirm={async () => {
          const assessmentIds = poolTargets.filter((row) => row.source === "ASSESSMENT").map((row) => row.assessmentId!);
          const whitelistEntryIds = poolTargets.filter((row) => row.source === "WHITELIST").map((row) => row.whitelistEntryId!);
          try {
            await apiClient(API, {
              method: "POST",
              body: JSON.stringify({
                ...(assessmentIds.length ? { assessmentIds } : {}),
                ...(whitelistEntryIds.length ? { whitelistEntryIds } : {}),
              }),
            });
          } catch (poolError) {
            // All or nothing: one household that isn't eligible stops the whole request. Show each
            // household's reasons on its row and keep the selection.
            if (poolError instanceof ApiError && poolError.code === "NOT_ELIGIBLE") {
              const reasons = notEligibleByHousehold(poolError.data, poolError.errors);
              setNotEligible(reasons);
              reloadAll();
              throw new Error(
                Object.keys(reasons).length
                  ? "Nothing was pooled: some households can't be pooled. The reason is shown on each of their rows."
                  : poolError.message,
              );
            }
            reloadAll();
            throw poolError;
          }
          setNotice({ tone: "success", text: `${poolTargets.length} household${poolTargets.length === 1 ? "" : "s"} pooled.` });
          setSelected(new Set());
          setNotEligible({});
          reloadAll();
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
        title={actionText?.title ?? ""}
        description={
          action && actionText ? (
            <>
              <strong>{action.entry.fullName ?? "This household"}</strong>. {actionText.description}
            </>
          ) : undefined
        }
        confirmLabel={actionText?.confirm ?? "Confirm"}
        destructive={actionText?.destructive ?? false}
        confirmDisabled={!reason.trim()}
        onConfirm={async () => {
          if (!action || !actionText) return;
          try {
            await apiClient(actionPath(action.entry, action.kind), {
              method: "POST",
              body: JSON.stringify({ reason: reason.trim() }),
            });
          } catch (actionError) {
            throw action.kind === "remove" ? removeFailure(actionError) : actionError;
          }
          setNotice({ tone: "success", text: `${actionText.confirm}: ${action.entry.fullName ?? "household"}.` });
          setReason("");
          reloadAll();
        }}
      >
        <FormField label="Reason" htmlFor="pool-reason" required hint="Recorded with the change">
          <Textarea id="pool-reason" maxLength={2000} value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
      </ConfirmDialog>
    </section>
  );
}
