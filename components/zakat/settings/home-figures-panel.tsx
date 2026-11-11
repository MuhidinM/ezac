"use client";

import { type FormEvent, useState } from "react";
import { Check, RotateCw, Save, X } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { ListPagination } from "@/components/dashboard/list-pagination";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { useMyUserId } from "@/lib/auth/use-my-user-id";
import { addisToday, homeFiguresProblems } from "@/components/zakat/settings/logic";
import { staffRef } from "@/components/zakat/staff-ref";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap, isSameApprover, isVersionConflict, VERSION_CONFLICT_MESSAGE } from "@/lib/api/errors";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { formatCount, formatDate, formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";
import { SAME_APPROVER_TEXT } from "@/lib/zakat/payments";

const API = "/bff/zakat-admin/home/adjustment";
const HISTORY_SIZE = 10;

/** One requested change of the offline figures, as in GET …/history and `pending`. */
type HomeChange = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | string;
  offlineCollectedEtb: number;
  offlineBeneficiaries: number;
  previousOfflineCollectedEtb?: number | null;
  previousOfflineBeneficiaries?: number | null;
  note: string | null;
  asOfDate?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  decidedBy?: string | null;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
};

/** The approved figures the public home screen uses, and the change waiting for approval. */
type HomeAdjustment = {
  offlineCollectedEtb: number;
  offlineBeneficiaries: number;
  note: string | null;
  asOfDate?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  version?: number;
  pending?: HomeChange | null;
};

const STATUS_TONE: Record<string, BadgeTone> = { PENDING: "violet", APPROVED: "success", REJECTED: "neutral" };
const STATUS_LABEL: Record<string, string> = { PENDING: "Waiting for approval", APPROVED: "Approved", REJECTED: "Rejected" };

/**
 * The offline figures on the public home screen. A change waits for a second
 * admin: the public figures change only once another admin approves it.
 */
export function HomeFiguresPanel() {
  const { data, error, reload } = useResource<HomeAdjustment>(API);
  const [historyPage, setHistoryPage] = useState(1);
  const history = useResource<PaginatedItems<HomeChange>>(`${API}/history?page=${historyPage}&limit=${HISTORY_SIZE}`);
  const mySub = useMyUserId();
  // Kept here: the form remounts after a save, so its own state is lost.
  const [notice, setNotice] = useState<string | null>(null);
  const pending = data?.pending ?? null;

  function reloadAll(text: string | null = null) {
    setNotice(text);
    reload();
    history.reload();
  }

  return (
    <Panel
      title="Home figures (offline)"
      description="Collections and households from outside the app (cash, history before the app), added to the live totals on the public home screen. A change goes public only after another admin approves it."
    >
      <div className="space-y-6">
        <ErrorAlert error={error} onRetry={reload} />
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        {data && pending ? (
          <PendingChange
            change={pending}
            current={data}
            own={Boolean(mySub && pending.createdBy === mySub)}
            onDecided={(approved) =>
              reloadAll(
                approved
                  ? "Approved. The public home screen shows the new figures within about a minute."
                  : "Rejected. The public figures stay as they were.",
              )
            }
            onStale={() => reloadAll()}
          />
        ) : null}
        {data ? (
          <HomeFiguresForm
            key={`${data.version ?? ""}-${data.approvedAt ?? data.createdAt ?? "new"}-${pending?.id ?? ""}`}
            adjustment={data}
            blocked={pending !== null}
            onEdit={() => setNotice(null)}
            onReload={() => reloadAll()}
            onSaved={() => reloadAll("Change saved. It goes public once another admin approves it.")}
          />
        ) : null}
        <div className="space-y-3 border-t border-black/[0.06] pt-4">
          <p className="text-xs font-semibold tracking-wide text-black/60 uppercase">History</p>
          <ErrorAlert error={history.error} onRetry={history.reload} />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.015]">
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Collected</TableHead>
                  <TableHead className="text-right">Households</TableHead>
                  <TableHead>As of</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decided</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.isLoading && !history.data ? (
                  <TableSkeletonRows colSpan={6} />
                ) : !history.data?.items.length ? (
                  <TableMessageRow colSpan={6}>No changes yet.</TableMessageRow>
                ) : (
                  history.data.items.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell className="align-top text-sm">
                        {formatDateTime(change.createdAt ?? null)}
                        <span className="block text-xs text-black/60">{staffRef(change.createdBy, change.createdByName) ?? "—"}</span>
                        {change.note ? <span className="block max-w-64 text-xs whitespace-pre-line text-black/60">{change.note}</span> : null}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums">
                        {formatEtb(change.offlineCollectedEtb)}
                        {change.previousOfflineCollectedEtb != null ? (
                          <span className="block text-xs text-black/60">was {formatEtb(change.previousOfflineCollectedEtb)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right align-top tabular-nums">
                        {formatCount(change.offlineBeneficiaries)}
                        {change.previousOfflineBeneficiaries != null ? (
                          <span className="block text-xs text-black/60">was {formatCount(change.previousOfflineBeneficiaries)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="align-top text-sm">{formatDate(change.asOfDate)}</TableCell>
                      <TableCell className="align-top">
                        <Badge tone={STATUS_TONE[change.status] ?? "neutral"}>{STATUS_LABEL[change.status] ?? change.status}</Badge>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        {change.decidedAt ? formatDateTime(change.decidedAt) : "—"}
                        {change.decidedBy || change.decidedByName ? (
                          <span className="block text-xs text-black/60">{staffRef(change.decidedBy, change.decidedByName)}</span>
                        ) : null}
                        {change.decisionNote ? <span className="block max-w-64 text-xs whitespace-pre-line text-black/60">{change.decisionNote}</span> : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {history.data && history.data.pagination.totalPages > 1 ? (
            <ListPagination
              page={historyPage}
              pageSize={HISTORY_SIZE}
              totalItems={history.data.pagination.totalItems}
              totalPages={history.data.pagination.totalPages}
              disabled={history.isLoading}
              onPageChange={setHistoryPage}
            />
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

function PendingChange({
  change,
  current,
  own,
  onDecided,
  onStale,
}: {
  change: HomeChange;
  current: HomeAdjustment;
  /** The signed-in admin asked for this change. */
  own: boolean;
  onDecided: (approved: boolean) => void;
  onStale: () => void;
}) {
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [text, setText] = useState("");

  async function decide() {
    if (!decision) return;
    const note = text.trim();
    try {
      await apiClient(`${API}/${encodeURIComponent(change.id)}/${decision}`, {
        method: "POST",
        // The decision note is stored as decisionNote; reject also sends it as the reason.
        body: decision === "approve" ? (note ? JSON.stringify({ note }) : undefined) : JSON.stringify({ reason: note, note }),
      });
      onDecided(decision === "approve");
    } catch (decideError) {
      if (isSameApprover(decideError)) throw new Error(SAME_APPROVER_TEXT);
      if (decideError instanceof ApiError && decideError.status === 409) {
        onStale();
        throw new Error(`${decideError.message} The figures have been reloaded.`);
      }
      throw decideError;
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <div>
        <p className="text-sm font-semibold text-navy">A change is waiting for approval</p>
        <p className="mt-0.5 text-xs text-black/60">The public home screen keeps the current figures until another admin approves it.</p>
      </div>
      <DetailList
        columns={2}
        items={[
          {
            label: "Collected offline",
            value: (
              <span className="tabular-nums">
                {formatEtb(current.offlineCollectedEtb ?? 0)} → <strong>{formatEtb(change.offlineCollectedEtb)}</strong>
              </span>
            ),
          },
          {
            label: "Households",
            value: (
              <span className="tabular-nums">
                {formatCount(current.offlineBeneficiaries ?? 0)} → <strong>{formatCount(change.offlineBeneficiaries)}</strong>
              </span>
            ),
          },
          { label: "Counted to", value: formatDate(change.asOfDate) },
          {
            label: "Asked by",
            value: (
              <>
                {staffRef(change.createdBy, change.createdByName) ?? "—"}
                {change.createdAt ? <span className="block text-xs text-black/60">{formatDateTime(change.createdAt)}</span> : null}
              </>
            ),
          },
        ]}
      />
      {change.note ? <p className="rounded-lg bg-white/70 p-3 text-sm whitespace-pre-line text-black/70">Source: {change.note}</p> : null}
      {own ? (
        <InlineAlert tone="info" title="Waiting for another admin">
          You asked for this change, so another admin must approve or reject it.
        </InlineAlert>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setText("");
              setDecision("reject");
            }}
          >
            <X />
            Reject
          </Button>
          <Button
            onClick={() => {
              setText("");
              setDecision("approve");
            }}
          >
            <Check />
            Approve
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={decision !== null}
        onOpenChange={(value) => !value && setDecision(null)}
        title={decision === "approve" ? "Publish these figures?" : "Reject this change?"}
        description={
          decision === "approve"
            ? "The public home screen shows them within about a minute, added to the live totals. They replace the current offline figures."
            : "The public figures stay as they are."
        }
        confirmLabel={decision === "approve" ? "Approve and publish" : "Reject"}
        destructive={decision === "reject"}
        confirmDisabled={decision === "reject" && !text.trim()}
        onConfirm={decide}
      >
        <FormField
          label={decision === "approve" ? "Note" : "Reason"}
          htmlFor="home-decision"
          required={decision === "reject"}
          hint={decision === "approve" ? "Optional" : "Why the figures are wrong"}
        >
          <Textarea id="home-decision" rows={2} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} />
        </FormField>
      </ConfirmDialog>
    </div>
  );
}

function HomeFiguresForm({
  adjustment,
  blocked,
  onEdit,
  onReload,
  onSaved,
}: {
  adjustment: HomeAdjustment;
  /** A change already waits for approval; only one can wait at a time. */
  blocked: boolean;
  onEdit: () => void;
  onReload: () => void;
  onSaved: () => void;
}) {
  const [collected, setCollected] = useState(String(adjustment.offlineCollectedEtb ?? 0));
  const [households, setHouseholds] = useState(String(adjustment.offlineBeneficiaries ?? 0));
  // A fresh note and date for each change: where the new figures come from, and what day they count to.
  const [note, setNote] = useState("");
  const [asOfDate, setAsOfDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const today = addisToday();
  const nextCollected = Number(collected || 0);
  const nextHouseholds = Number(households || 0);
  const changed = nextCollected !== (adjustment.offlineCollectedEtb ?? 0) || nextHouseholds !== (adjustment.offlineBeneficiaries ?? 0);

  // These figures go public, so a save first shows the change and needs a source (gap-r1-3-2).
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onEdit();
    setError(null);
    setConflict(false);
    const problems = homeFiguresProblems({ households, note, asOfDate }, today);
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;
    setConfirming(true);
  }

  async function save() {
    try {
      await apiClient(API, {
        method: "PUT",
        body: JSON.stringify({
          offlineCollectedEtb: nextCollected,
          offlineBeneficiaries: nextHouseholds,
          note: note.trim(),
          asOfDate,
          ...(adjustment.version != null ? { version: adjustment.version } : {}),
        }),
      });
      onSaved();
    } catch (saveError) {
      // Shown on the form once the confirm step closes.
      if (isVersionConflict(saveError)) {
        setConflict(true);
      } else {
        setError(errorMessage(saveError, "Couldn't save the figures"));
        if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {conflict ? (
        <InlineAlert
          tone="error"
          action={
            <Button type="button" variant="outline" size="sm" onClick={onReload}>
              <RotateCw />
              Reload
            </Button>
          }
        >
          {VERSION_CONFLICT_MESSAGE}
        </InlineAlert>
      ) : null}
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <fieldset disabled={blocked} className="space-y-4 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField label="Collected offline (ETB)" htmlFor="hf-collected" required error={fieldErrors.offlineCollectedEtb}>
            <Input id="hf-collected" type="number" min={0} step="0.01" value={collected} onChange={(e) => setCollected(e.target.value)} required className="tabular-nums" />
          </FormField>
          <FormField label="Households supported offline" htmlFor="hf-households" error={fieldErrors.offlineBeneficiaries}>
            <Input id="hf-households" type="number" min={0} step={1} value={households} onChange={(e) => setHouseholds(e.target.value)} className="tabular-nums" />
          </FormField>
          <FormField label="Counted to" htmlFor="hf-asof" required hint="The date the figures are up to" error={fieldErrors.asOfDate}>
            <Input id="hf-asof" type="date" max={today} value={asOfDate} onChange={(e) => setAsOfDate(e.target.value)} required />
          </FormField>
        </div>
        <FormField
          label="Source of these figures"
          htmlFor="hf-note"
          required
          hint="Where the new figures come from, e.g. the report or ledger"
          error={fieldErrors.note}
        >
          <Textarea id="hf-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
        </FormField>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <div className="space-y-0.5 text-xs text-black/60">
          {adjustment.approvedAt || adjustment.createdAt ? (
            <>
              <p className="flex flex-wrap items-center gap-1">
                Public now: {formatEtb(adjustment.offlineCollectedEtb)} and {formatCount(adjustment.offlineBeneficiaries)} households
                {adjustment.asOfDate ? <>, counted to {formatDate(adjustment.asOfDate)}</> : null}
              </p>
              <p className="flex flex-wrap items-center gap-1">
                Asked by {staffRef(adjustment.createdBy, adjustment.createdByName) ?? "—"}
                {adjustment.approvedAt ? (
                  <>
                    , approved {formatDateTime(adjustment.approvedAt)} by {staffRef(adjustment.approvedBy, adjustment.approvedByName) ?? "—"}
                  </>
                ) : null}
              </p>
              {adjustment.note ? <p>Source given: {adjustment.note}</p> : null}
            </>
          ) : (
            <p>Not set yet</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={blocked || !changed}
          title={blocked ? "A change is already waiting for approval" : changed ? undefined : "Change a figure first"}
        >
          <Save />
          Review and send
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title="Send the new home figures for approval?"
        description="Another admin must approve them. Only then does the public home screen show them, added to the live totals."
        confirmLabel="Send for approval"
        onConfirm={save}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-navy">
          <dt className="text-black/60">Collected offline</dt>
          <dd className="tabular-nums">
            {formatEtb(adjustment.offlineCollectedEtb ?? 0)} → <strong>{formatEtb(nextCollected)}</strong>
          </dd>
          <dt className="text-black/60">Households</dt>
          <dd className="tabular-nums">
            {formatCount(adjustment.offlineBeneficiaries ?? 0)} → <strong>{formatCount(nextHouseholds)}</strong>
          </dd>
          <dt className="text-black/60">Counted to</dt>
          <dd>{formatDate(asOfDate)}</dd>
          <dt className="text-black/60">Source</dt>
          <dd className="break-words">{note.trim()}</dd>
        </dl>
      </ConfirmDialog>
    </form>
  );
}
