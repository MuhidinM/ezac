"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Banknote, CheckCheck, CornerUpLeft, MinusCircle, RefreshCw, SlidersHorizontal, X, XCircle } from "lucide-react";

import { PoolStatusBadge, RiskBadge, ScoreMeter, WhitelistBadge } from "@/components/backoffice/status-badges";
import { VerificationStatusBadge } from "@/components/beneficiary/verification-status-badge";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { PayoutDialog, isExpired, useServerNow } from "@/components/disbursements/payout-dialog";
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
import type { BranchListItem, PaginatedItems, VerificationStatus } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useScoreMax } from "@/lib/backoffice/score-max";
import { ASNAF } from "@/lib/backoffice/options";
import { formatCount } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { useListState } from "@/lib/hooks/use-list-state";
import { cn } from "@/lib/utils";
import type { Disbursement } from "@/lib/zakat/disbursements";
import { POOL_FILTERS, POOL_LIST_DEFAULTS, POOL_SORTS, poolQuery, poolStepBack } from "@/lib/zakat/pool-list";

const API = "/bff/backoffice/admin/pool";
const PAYOUTS_API = "/bff/payments-admin/disbursements";
const PAGE_SIZE = 25;

type View = "awaiting" | "pooled";
type RowAction = "decline" | "send-back" | "remove";

const VIEWS: { value: View; label: string }[] = [
  { value: "awaiting", label: "Awaiting pool" },
  { value: "pooled", label: "In the pool" },
];

/** How long the score boxes wait after the last keystroke before the list reloads (perf-11). */
const SCORE_DEBOUNCE_MS = 400;

/**
 * A text box whose value is written to the URL a moment after typing stops,
 * so each keystroke doesn't reload the list. Takes the URL's value when it
 * changes from elsewhere (Clear, Back).
 */
function useDebouncedDraft(value: string, commit: (value: string) => void, delay = SCORE_DEBOUNCE_MS) {
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => commit(draft), delay);
    return () => clearTimeout(timer);
  }, [draft, value, commit, delay]);
  return [draft, setDraft] as const;
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

/** undefined: still checking; null: the check failed. */
type Verification = VerificationStatus | null | undefined;

/**
 * The verification state of each household on the page. Pool rows don't carry it yet,
 * so each household is read once per page load. Earlier results stay while a reload runs.
 */
function useVerification(page: PaginatedItems<PoolEntry> | undefined) {
  const [statuses, setStatuses] = useState<Record<string, VerificationStatus | null>>({});
  useEffect(() => {
    if (!page?.items.length) return;
    let cancelled = false;
    const ids = [...new Set(page.items.map((row) => row.beneficiaryId))];
    void Promise.all(
      ids.map((id) =>
        apiClient<{ verificationStatus?: VerificationStatus | null }>(`/bff/beneficiaries/${encodeURIComponent(id)}`).then(
          (detail) => [id, detail.verificationStatus ?? null] as const,
          () => [id, null] as const,
        ),
      ),
    ).then((entries) => {
      if (!cancelled) setStatuses((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
  }, [page]);
  return (beneficiaryId: string): Verification => statuses[beneficiaryId];
}

/** Why a row can't be pooled, or null when it can. */
function poolBlock(entry: PoolEntry, verification: Verification) {
  if (verification === undefined) return "Checking whether the household is verified…";
  const reasons: string[] = [];
  if (verification === null) reasons.push("Couldn't check whether the household is verified. Refresh to try again.");
  else if (verification !== "verified") reasons.push("Not verified yet. Verify the household before pooling it.");
  if (!entry.bankAccount?.accountNumber) reasons.push("No bank account on file. Add one before pooling.");
  return reasons.length ? reasons.join(" ") : null;
}

/** The prepared or needs-checking payout of a pooled row, if any. */
function openPayoutOf(entry: PoolEntry, payouts: Disbursement[]) {
  return (
    payouts.find((payout) =>
      entry.source === "WHITELIST"
        ? payout.whitelistEntryId != null && String(payout.whitelistEntryId) === String(entry.whitelistEntryId)
        : payout.assessmentId != null && String(payout.assessmentId) === String(entry.assessmentId),
    ) ?? null
  );
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
  const commitScoreMin = useCallback((value: string) => setList({ scoreMin: value }), [setList]);
  const commitScoreMax = useCallback((value: string) => setList({ scoreMax: value }), [setList]);
  const [scoreMinDraft, setScoreMinDraft] = useDebouncedDraft(list.scoreMin, commitScoreMin);
  const [scoreMaxDraft, setScoreMaxDraft] = useDebouncedDraft(list.scoreMax, commitScoreMax);
  const query = poolQuery(list, scoreMax, PAGE_SIZE);
  // Errors follow what is typed, before it reaches the URL.
  const filterErrors = poolQuery({ ...list, scoreMin: scoreMinDraft, scoreMax: scoreMaxDraft }, scoreMax, PAGE_SIZE).errors;
  const path = view === "awaiting" ? `${API}/awaiting` : API;
  const listPath = `${path}?${query.params.toString()}`;
  const { data, error, isLoading, reload } = useResource<PaginatedItems<PoolEntry>>(listPath);

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
  const verificationOf = useVerification(data);

  // Open payouts, so a pooled row can point to its payout instead of offering Pay again. The pool
  // rows don't say this yet. `from` is set wide so an old payout that needs checking still shows.
  const openPayoutsQuery = `from=${encodeURIComponent("2020-01-01T00:00:00+03:00")}&page=1&limit=100`;
  const preparedPayouts = useResource<PaginatedItems<Disbursement>>(
    view === "pooled" ? `${PAYOUTS_API}?status=AWAITING_CONFIRMATION&${openPayoutsQuery}` : null,
  );
  const checkingPayouts = useResource<PaginatedItems<Disbursement>>(
    view === "pooled" ? `${PAYOUTS_API}?status=PROCESSING&${openPayoutsQuery}` : null,
  );
  const now = useServerNow(30_000);
  const openPayouts = [
    ...(preparedPayouts.data?.items ?? []).filter((payout) => !isExpired(payout, now)),
    ...(checkingPayouts.data?.items ?? []),
  ];

  const rows = useMemo(() => data?.items ?? [], [data]);
  const selectable = view === "awaiting" ? rows.filter((row) => !poolBlock(row, verificationOf(row.beneficiaryId))) : [];
  const selectedRows = selectable.filter((row) => selected.has(rowKey(row)));
  const allSelected = selectable.length > 0 && selectedRows.length === selectable.length;

  function reloadAll() {
    reload();
    preparedPayouts.reload();
    checkingPayouts.reload();
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
          <Button variant="outline" onClick={reloadAll} disabled={isLoading}>
            <RefreshCw />
            Refresh
          </Button>
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
                {view === item.value && data ? <TabsCount>{formatCount(data.pagination.totalItems)}</TabsCount> : null}
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
                <span className="rounded-full bg-[#007050] px-1.5 text-[11px] text-white tabular-nums">{activeFilters}</span>
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
            <FormField label={`Score (0–${scoreMax})`} htmlFor="p-min" error={filterErrors.score}>
              <div className="flex items-center gap-2">
                <Input id="p-min" type="number" min={0} max={scoreMax} placeholder="Min" value={scoreMinDraft} onChange={(e) => setScoreMinDraft(e.target.value)} className="bg-white" />
                <span className="text-black/40">–</span>
                <Input type="number" min={0} max={scoreMax} placeholder="Max" aria-label="Maximum score" value={scoreMaxDraft} onChange={(e) => setScoreMaxDraft(e.target.value)} className="bg-white" />
              </div>
            </FormField>
            <FormField label="Approved between" htmlFor="p-from" className="lg:col-span-2" error={filterErrors.approved}>
              <div className="flex items-center gap-2">
                <Input id="p-from" type="date" value={list.approvedFrom} onChange={(e) => update("approvedFrom", e.target.value)} className="bg-white" />
                <span className="text-black/40">–</span>
                <Input type="date" aria-label="Approved to" value={list.approvedTo} onChange={(e) => update("approvedTo", e.target.value)} className="bg-white" />
              </div>
            </FormField>
          </div>
        ) : null}

        {view === "awaiting" && selectedRows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] bg-[#007050]/[0.05] px-5 py-2.5">
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
                    className="size-4 accent-[#007050] disabled:cursor-not-allowed disabled:opacity-40"
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
                const verification = verificationOf(entry.beneficiaryId);
                const block = view === "awaiting" ? poolBlock(entry, verification) : null;
                const isSelected = !block && selected.has(key);
                const payout = view === "pooled" && entry.poolStatus !== "DISBURSED" ? openPayoutOf(entry, openPayouts) : null;
                return (
                  <TableRow key={key} className={cn(isSelected && "bg-[#007050]/[0.04]")}>
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
                                  className="size-4 accent-[#007050] disabled:opacity-40"
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
                            className="size-4 accent-[#007050]"
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
                        {entry.source === "WHITELIST" ? <Badge tone="neutral">No assessment yet</Badge> : null}
                        {payout ? (
                          <Badge tone={payout.status === "PROCESSING" ? "warning" : "info"}>
                            {payout.status === "PROCESSING" ? "Payout needs checking" : "Payout prepared"}
                          </Badge>
                        ) : null}
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
                      <p className="text-sm text-navy">{entry.branchName ?? "—"}</p>
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
                      {verification === undefined ? (
                        <span className="text-sm text-black/40">Checking…</span>
                      ) : verification === null ? (
                        <span className="text-sm text-amber-700">Couldn&apos;t check</span>
                      ) : (
                        <VerificationStatusBadge status={verification} />
                      )}
                    </TableCell>
                    <TableCell>
                      {entry.bankAccount?.accountNumber ? (
                        <>
                          <p className="font-mono text-sm text-navy">{entry.bankAccount.accountNumber}</p>
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
                            <Button variant="destructive-ghost" size="sm" onClick={() => setAction({ entry, kind: "decline" })}>
                              <XCircle />
                              Decline
                            </Button>
                          </>
                        ) : entry.poolStatus === "DISBURSED" ? (
                          // Paid and left the pool; it must be assessed and pooled again to be paid again.
                          <div className="text-right">
                            <PoolStatusBadge status="DISBURSED" />
                            {entry.poolStatusReason ? <p className="mt-1 text-xs text-black/50">{entry.poolStatusReason}</p> : null}
                          </div>
                        ) : payout ? (
                          // A payout is open: it is finished on the Payouts page, and the household can't leave the pool meanwhile.
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/dashboard/disbursements?open=${encodeURIComponent(payout.disbursementId)}`}>
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
                              <TooltipContent>A payout is open for this household. Pay, cancel or settle it first.</TooltipContent>
                            </Tooltip>
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
            // Keep the selection so the admin can see what failed; the dialog shows the error.
            reloadAll();
            throw poolError;
          }
          setNotice({ tone: "success", text: `${poolTargets.length} household${poolTargets.length === 1 ? "" : "s"} pooled.` });
          setSelected(new Set());
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
          await apiClient(actionPath(action.entry, action.kind), {
            method: "POST",
            body: JSON.stringify({ reason: reason.trim() }),
          });
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
