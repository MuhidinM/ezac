"use client";

import { type FormEvent, useState } from "react";
import { Pencil } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { AMHARIC_HINT, AMHARIC_INPUT, AMHARIC_TITLE } from "@/components/zakat/content/amharic";
import type { RegionAdmin } from "@/components/zakat/content/types";
import { VersionConflictAlert } from "@/components/zakat/content/version-conflict-alert";
import { staffRef } from "@/components/zakat/staff-ref";
import { Badge } from "@/components/ui/badge";
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
import { ApiError, errorMessage, fieldErrorMap, isVersionConflict } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatCount, formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";

const API = "/bff/zakat-admin/impact/regions";

export default function ImpactRegionsPage() {
  return (
    <RequireRole audience={["admin"]}>
      <ImpactRegions />
    </RequireRole>
  );
}

function ImpactRegions() {
  const { data, error, isLoading, reload } = useResource<RegionAdmin[]>(API);
  const [editing, setEditing] = useState<RegionAdmin | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const regions = [...(data ?? [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <section className="space-y-6">
      <PageHeader
        title="Impact regions"
        description="Funds distributed and lives touched per region, shown on the public impact map. Use these region names when registering beneficiaries and creating causes so live counts match."
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <Panel flush>
        {error ? (
          <div className="px-5 pt-4">
            <ErrorAlert error={error} onRetry={reload} />
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Region</TableHead>
              <TableHead className="text-right">Funds distributed</TableHead>
              <TableHead className="text-right">Lives touched (public)</TableHead>
              <TableHead className="text-right">Households now</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && regions.length === 0 ? (
              <TableSkeletonRows colSpan={7} />
            ) : regions.length === 0 ? (
              <TableMessageRow colSpan={7}>No regions.</TableMessageRow>
            ) : (
              regions.map((region) => (
                <TableRow key={region.code}>
                  <TableCell className="pl-5">
                    <span className="block font-medium text-navy">{region.name}</span>
                    {region.nameAm ? (
                      <span {...AMHARIC_INPUT} className="block text-xs text-black/60">
                        {region.nameAm}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {region.distributedFundsEtb != null ? (
                      formatEtb(region.distributedFundsEtb)
                    ) : (
                      <span className="text-xs text-black/60">Not specified</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {region.livesTouchedEffective != null ? formatCount(region.livesTouchedEffective) : "—"}
                    <span className="block text-xs text-black/60">
                      {region.livesTouchedSource === "ENTERED" ? "Entered by admin" : "Live count"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{region.beneficiaries != null ? formatCount(region.beneficiaries) : "—"}</TableCell>
                  <TableCell>{region.active ? <Badge tone="success">Shown</Badge> : <Badge tone="neutral">Hidden</Badge>}</TableCell>
                  <TableCell className="text-sm text-black/60">
                    {formatDateTime(region.updatedAt)}
                    {region.updatedBy || region.updatedByName ? (
                      <span className="block text-xs text-black/60">by {staffRef(region.updatedBy, region.updatedByName)}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(region)}>
                      <Pencil />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Panel>

      {editing ? (
        <RegionDialog
          key={editing.code}
          region={editing}
          onClose={() => setEditing(null)}
          onReload={() => {
            setEditing(null);
            reload();
          }}
          onSaved={(saved) => {
            setEditing(null);
            setNotice(`${saved.name} updated.`);
            reload();
          }}
        />
      ) : null}
    </section>
  );
}

/** A figure for the before/after list: an amount, or what an empty one means. */
function livesText(value: number | null, liveCount: number | null) {
  return value != null ? formatCount(value) : `Live count (${formatCount(liveCount ?? 0)})`;
}

function RegionDialog({
  region,
  onClose,
  onReload,
  onSaved,
}: {
  region: RegionAdmin;
  onClose: () => void;
  /** Close and load the list again (after someone else changed the region). */
  onReload: () => void;
  onSaved: (region: RegionAdmin) => void;
}) {
  const [form, setForm] = useState({
    name: region.name,
    nameAm: region.nameAm ?? "",
    latitude: String(region.latitude),
    longitude: String(region.longitude),
    distributedFundsEtb: region.distributedFundsEtb != null ? String(region.distributedFundsEtb) : "",
    livesTouched: region.livesTouched != null ? String(region.livesTouched) : "",
    sortOrder: region.sortOrder != null ? String(region.sortOrder) : "",
    active: region.active,
  });
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const set = (key: keyof typeof form, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  // The two public figures, before and after. A blank funds figure is "not entered"; blank lives is the live count.
  const nextFunds = form.distributedFundsEtb.trim() ? Number(form.distributedFundsEtb) : null;
  const nextLives = form.livesTouched.trim() ? Number(form.livesTouched) : null;
  const fundsText = (value: number | null) => (value != null ? formatEtb(value) : "Not specified");
  const figureChanges = [
    ...(nextFunds !== region.distributedFundsEtb
      ? [{ label: "Funds distributed", from: fundsText(region.distributedFundsEtb), to: fundsText(nextFunds) }]
      : []),
    ...(nextLives !== region.livesTouched
      ? [
          {
            label: "Lives touched",
            from: livesText(region.livesTouched, region.beneficiaries),
            to: livesText(nextLives, region.beneficiaries),
          },
        ]
      : []),
  ];

  // The public map shows these figures straight away, so a change is shown before and after first (gap-r1-3-2).
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setConflict(false);
    setFieldErrors({});
    if (figureChanges.length > 0) {
      setConfirming(true);
      return;
    }
    void save();
  }

  async function save() {
    setIsSaving(true);
    try {
      // PUT replaces the region, so every field is sent, with the loaded version.
      const saved = await apiClient<RegionAdmin>(`${API}/${encodeURIComponent(region.code)}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          nameAm: form.nameAm.trim() || null,
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          distributedFundsEtb: nextFunds,
          livesTouched: nextLives,
          ...(form.sortOrder.trim() ? { sortOrder: Number(form.sortOrder) } : {}),
          active: form.active,
          version: region.version,
        }),
      });
      onSaved(saved);
    } catch (saveError) {
      if (isVersionConflict(saveError)) {
        setConflict(true);
        return;
      }
      setError(errorMessage(saveError, "Couldn't save the region"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !confirming && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-navy">{region.name}</DialogTitle>
            <DialogDescription>Usually only the two figures change. The public map updates straight away when you save.</DialogDescription>
          </DialogHeader>
          {conflict ? <VersionConflictAlert onReload={onReload} /> : null}
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Funds distributed (ETB)" htmlFor="rg-funds" hint="Empty: not specified" error={fieldErrors.distributedFundsEtb}>
              <Input
                id="rg-funds"
                type="number"
                min={0}
                step="0.01"
                value={form.distributedFundsEtb}
                onChange={(e) => set("distributedFundsEtb", e.target.value)}
                className="tabular-nums"
              />
            </FormField>
            <FormField
              label="Lives touched"
              htmlFor="rg-lives"
              hint={`Empty shows the live count (${formatCount(region.beneficiaries ?? 0)} households now)`}
              error={fieldErrors.livesTouched}
            >
              <Input
                id="rg-lives"
                type="number"
                min={0}
                step={1}
                value={form.livesTouched}
                onChange={(e) => set("livesTouched", e.target.value)}
                className="tabular-nums"
              />
            </FormField>
            <FormField label="Name" htmlFor="rg-name" required error={fieldErrors.name} className="sm:col-span-2">
              <Input id="rg-name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </FormField>
            <fieldset className="space-y-2 sm:col-span-2">
              <legend className="text-sm font-medium text-navy">{AMHARIC_TITLE}</legend>
              <FormField label="Name in Amharic" htmlFor="rg-name-am" hint={AMHARIC_HINT} error={fieldErrors.nameAm}>
                <Input id="rg-name-am" {...AMHARIC_INPUT} maxLength={100} value={form.nameAm} onChange={(e) => set("nameAm", e.target.value)} />
              </FormField>
            </fieldset>
            <FormField label="Latitude" htmlFor="rg-lat" required error={fieldErrors.latitude}>
              <Input id="rg-lat" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} required />
            </FormField>
            <FormField label="Longitude" htmlFor="rg-lng" required error={fieldErrors.longitude}>
              <Input id="rg-lng" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} required />
            </FormField>
            <FormField label="Sort order" htmlFor="rg-sort" error={fieldErrors.sortOrder}>
              <Input id="rg-sort" type="number" step={1} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </FormField>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-navy">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-brand" />
              Show on the public site
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSaving} loadingText="Saving…">
              Save region
            </Button>
          </DialogFooter>
        </form>
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Publish new figures for ${region.name}?`}
          description="The public impact map shows them straight away."
          confirmLabel="Save region"
          onConfirm={save}
        >
          <ul className="list-disc space-y-1 pl-5 text-sm text-navy">
            {figureChanges.map((change) => (
              <li key={change.label}>
                {change.label}: {change.from} → <strong>{change.to}</strong>
              </li>
            ))}
          </ul>
        </ConfirmDialog>
      </DialogContent>
    </Dialog>
  );
}
