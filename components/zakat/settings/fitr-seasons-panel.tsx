"use client";

import { type FormEvent, useState } from "react";
import { Pencil, Plus, RotateCw, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { SEASON_DELETE_REASON_MAX, type SeasonStatus, seasonDeletePath, seasonDeletion } from "@/components/zakat/settings/logic";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap, isVersionConflict, VERSION_CONFLICT_MESSAGE } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDate, formatEtb } from "@/lib/backoffice/format";

const API = "/bff/zakat-admin/zakat-al-fitr";

type FitrSeason = {
  hijriYear: number;
  status: SeasonStatus;
  startsOn: string;
  dueBy: string;
  perPersonAmountEtb: number;
  basis: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
  /** Sent back on edit; a stale one gives 409 VERSION_CONFLICT. */
  version?: number;
};

const SEASON_TONE: Record<SeasonStatus, BadgeTone> = { upcoming: "info", open: "success", closed: "neutral" };

export function FitrSeasonsPanel() {
  const { data, error, reload } = useResource<FitrSeason[]>(API);
  const [editing, setEditing] = useState<FitrSeason | "new" | null>(null);
  const [deleting, setDeleting] = useState<FitrSeason | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const seasons = data ?? [];

  return (
    <Panel
      title="Zakat al-Fitr seasons"
      description="One season per Hijri year. The app shows the open season or the next one; after Eid, this year's closed season. Seasons of earlier years are never shown."
      flush
      actions={
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          New season
        </Button>
      }
    >
      {error || notice ? (
        <div className="space-y-3 px-5 pt-4">
          <ErrorAlert error={error} onRetry={reload} />
          {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="bg-black/[0.015]">
            <TableHead className="pl-5">Hijri year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Window</TableHead>
            <TableHead className="text-right">Per person</TableHead>
            <TableHead>Basis</TableHead>
            <TableHead className="pr-5 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!data && !error ? (
            <TableSkeletonRows colSpan={6} />
          ) : seasons.length === 0 ? (
            <TableMessageRow colSpan={6}>No seasons yet.</TableMessageRow>
          ) : (
            seasons.map((season) => {
              const deletion = seasonDeletion(season.status);
              return (
                <TableRow key={season.hijriYear}>
                  <TableCell className="pl-5 font-semibold text-navy tabular-nums">{season.hijriYear} AH</TableCell>
                  <TableCell>
                    <Badge tone={SEASON_TONE[season.status] ?? "neutral"} className="capitalize">
                      {season.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(season.startsOn)} – {formatDate(season.dueBy)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatEtb(season.perPersonAmountEtb)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-black/60">{season.basis ?? "—"}</TableCell>
                  <TableCell className="pr-5 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setNotice(null);
                        setEditing(season);
                      }}
                    >
                      <Pencil />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-700"
                      disabled={!deletion.allowed}
                      title={deletion.allowed ? undefined : deletion.why}
                      onClick={() => {
                        setNotice(null);
                        setDeleting(season);
                      }}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {editing ? (
        <FitrSeasonDialog
          key={editing === "new" ? "new" : editing.hijriYear}
          season={editing === "new" ? null : editing}
          seasons={seasons}
          onEditExisting={setEditing}
          onClose={() => setEditing(null)}
          onReload={reload}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
      {deleting ? (
        <DeleteSeasonDialog
          key={deleting.hijriYear}
          season={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setNotice(`The ${deleting.hijriYear} AH season was deleted.`);
            reload();
          }}
        />
      ) : null}
    </Panel>
  );
}

function DeleteSeasonDialog({ season, onClose, onDeleted }: { season: FitrSeason; onClose: () => void; onDeleted: () => void }) {
  const deletion = seasonDeletion(season.status);
  const force = deletion.allowed && deletion.force;
  const [reason, setReason] = useState("");

  // A failure (e.g. 409 when the season opened meanwhile) stays in the dialog with the server's message.
  async function remove() {
    await apiClient(seasonDeletePath(season.hijriYear, force, reason), { method: "DELETE" });
    onDeleted();
  }

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={`Delete the ${season.hijriYear} AH season?`}
      description={
        force ? (
          <>
            This season has ended ({formatDate(season.startsOn)} – {formatDate(season.dueBy)}). Delete it only if it was entered by
            mistake. It can&apos;t be undone.
          </>
        ) : (
          <>It hasn&apos;t started yet, so the app hasn&apos;t shown it. It can&apos;t be undone.</>
        )
      }
      confirmLabel="Delete season"
      destructive
      confirmDisabled={force && !reason.trim()}
      onConfirm={remove}
    >
      {force ? (
        <FormField label="Reason" htmlFor="fs-delete-reason" required hint="Kept in the audit log">
          <Textarea
            id="fs-delete-reason"
            rows={2}
            maxLength={SEASON_DELETE_REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </FormField>
      ) : null}
    </ConfirmDialog>
  );
}

/** The Hijri (Umm al-Qura) year of a calendar day, or null when the browser can't tell. */
function hijriYearOf(day: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { year: "numeric", timeZone: "UTC" }).formatToParts(
      new Date(`${day}T00:00:00Z`),
    );
    const year = Number.parseInt(parts.find((part) => part.type === "year")?.value ?? "", 10);
    return Number.isFinite(year) ? year : null;
  } catch {
    return null;
  }
}

/** Things to double-check before saving a season; saving stays possible. */
function seasonWarnings(year: number, startsOn: string, dueBy: string, others: FitrSeason[]): string[] {
  const warnings: string[] = [];
  if (startsOn && dueBy) {
    for (const other of others) {
      if (other.startsOn <= dueBy && startsOn <= other.dueBy) {
        warnings.push(`The dates overlap the ${other.hijriYear} AH season (${formatDate(other.startsOn)} – ${formatDate(other.dueBy)}).`);
      }
    }
  }
  const startYear = startsOn ? hijriYearOf(startsOn) : null;
  const dueYear = dueBy ? hijriYearOf(dueBy) : null;
  if (Number.isInteger(year) && year > 0 && startYear !== null && startYear !== year && dueYear !== year) {
    warnings.push(`${formatDate(startsOn)} falls in ${startYear} AH, not ${year} AH. Check the year or the dates.`);
  }
  return warnings;
}

function FitrSeasonDialog({
  season,
  seasons,
  onEditExisting,
  onClose,
  onReload,
  onSaved,
}: {
  season: FitrSeason | null;
  seasons: FitrSeason[];
  onEditExisting: (season: FitrSeason) => void;
  onClose: () => void;
  onReload: () => void;
  onSaved: () => void;
}) {
  const [year, setYear] = useState(season ? String(season.hijriYear) : "");
  const [startsOn, setStartsOn] = useState(season?.startsOn ?? "");
  const [dueBy, setDueBy] = useState(season?.dueBy ?? "");
  const [amount, setAmount] = useState(season ? String(season.perPersonAmountEtb) : "");
  const [basis, setBasis] = useState(season?.basis ?? "");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const yearNumber = year.trim() ? Number(year.trim()) : Number.NaN;
  // A new season must not reuse a year (the server answers 409).
  const existing = season ? null : (seasons.find((item) => item.hijriYear === yearNumber) ?? null);
  const others = seasons.filter((item) => item.hijriYear !== (season?.hijriYear ?? yearNumber));
  const warnings = seasonWarnings(yearNumber, startsOn, dueBy, others);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConflict(false);
    const problems: Record<string, string> = {};
    if (!Number.isInteger(yearNumber) || yearNumber < 1400 || yearNumber > 1600) problems.hijriYear = "Enter a year from 1400 to 1600.";
    else if (existing) problems.hijriYear = `A season for ${existing.hijriYear} AH already exists. Edit it instead.`;
    if (startsOn && dueBy && dueBy < startsOn) problems.dueBy = "Must be on or after the start date.";
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;
    setIsSaving(true);
    const fields = { startsOn, dueBy, perPersonAmountEtb: Number(amount), basis: basis.trim() || undefined };
    try {
      // New seasons are created with POST; an edit sends the version it was loaded with.
      await (season
        ? apiClient(`${API}/${encodeURIComponent(String(season.hijriYear))}`, {
            method: "PUT",
            body: JSON.stringify({ ...fields, ...(season.version != null ? { version: season.version } : {}) }),
          })
        : apiClient(API, { method: "POST", body: JSON.stringify({ hijriYear: yearNumber, ...fields }) }));
      onSaved();
    } catch (saveError) {
      if (isVersionConflict(saveError)) {
        setConflict(true);
      } else {
        setError(errorMessage(saveError, "Couldn't save the season"));
        if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">{season ? `Zakat al-Fitr ${season.hijriYear} AH` : "New Zakat al-Fitr season"}</DialogTitle>
            <DialogDescription>
              The status (upcoming, open, closed) follows today&apos;s date. Dates must fall from 40 days before to 5 days after
              that year&apos;s Eid al-Fitr.
            </DialogDescription>
          </DialogHeader>
          {conflict ? (
            <InlineAlert
              tone="error"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onReload();
                    onClose();
                  }}
                >
                  <RotateCw />
                  Reload
                </Button>
              }
            >
              {VERSION_CONFLICT_MESSAGE}
            </InlineAlert>
          ) : null}
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          {existing ? (
            <InlineAlert
              tone="warning"
              title={`${existing.hijriYear} AH already has a season`}
              action={
                <Button type="button" size="sm" variant="outline" onClick={() => onEditExisting(existing)}>
                  Edit {existing.hijriYear} AH
                </Button>
              }
            >
              {formatEtb(existing.perPersonAmountEtb)} per person, {formatDate(existing.startsOn)} – {formatDate(existing.dueBy)}.
            </InlineAlert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Hijri year" htmlFor="fs-year" required hint="1400–1600" error={fieldErrors.hijriYear}>
              <Input id="fs-year" type="number" min={1400} max={1600} value={year} onChange={(e) => setYear(e.target.value)} disabled={!!season} required />
            </FormField>
            <FormField label="Per person (ETB)" htmlFor="fs-amount" required error={fieldErrors.perPersonAmountEtb}>
              <Input id="fs-amount" type="number" min={0.01} max={100000} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </FormField>
            <FormField label="Starts on" htmlFor="fs-start" required error={fieldErrors.startsOn}>
              <Input id="fs-start" type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} required />
            </FormField>
            <FormField label="Due by" htmlFor="fs-due" required hint="On or after the start" error={fieldErrors.dueBy}>
              <Input id="fs-due" type="date" value={dueBy} onChange={(e) => setDueBy(e.target.value)} required />
            </FormField>
          </div>
          <FormField label="Basis" htmlFor="fs-basis" hint="How the amount was set" error={fieldErrors.basis}>
            <Textarea id="fs-basis" rows={2} maxLength={500} value={basis} onChange={(e) => setBasis(e.target.value)} />
          </FormField>
          {warnings.length > 0 ? (
            <InlineAlert tone="warning" title="Check before saving">
              <ul className="list-disc space-y-0.5 pl-4">
                {warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </InlineAlert>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={existing !== null} loading={isSaving} loadingText="Saving…">
              {warnings.length > 0 ? "Save anyway" : "Save season"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
