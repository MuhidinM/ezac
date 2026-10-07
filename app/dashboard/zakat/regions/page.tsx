"use client";

import { type FormEvent, useState } from "react";
import { Pencil } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
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
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";

const API = "/api/zakat-admin/impact/regions";

type ImpactRegion = {
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  distributedFundsEtb: number | null;
  livesTouched: number | null;
  sortOrder: number | null;
  active: boolean;
  updatedBy: string | null;
  updatedAt: string | null;
};

export default function ImpactRegionsPage() {
  return (
    <RequireRole audience={["admin"]}>
      <ImpactRegions />
    </RequireRole>
  );
}

function ImpactRegions() {
  const { data, error, isLoading, reload } = useResource<ImpactRegion[]>(API);
  const [editing, setEditing] = useState<ImpactRegion | null>(null);
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
            <InlineAlert>{error.message}</InlineAlert>
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">Region</TableHead>
              <TableHead className="text-right">Funds distributed</TableHead>
              <TableHead className="text-right">Lives touched</TableHead>
              <TableHead>Visibility</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="pr-5 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && regions.length === 0 ? (
              <TableSkeletonRows colSpan={6} />
            ) : regions.length === 0 ? (
              <TableMessageRow colSpan={6}>No regions.</TableMessageRow>
            ) : (
              regions.map((region) => (
                <TableRow key={region.code}>
                  <TableCell className="pl-5">
                    <span className="font-medium text-[#001539]">{region.name}</span>
                    <span className="block font-mono text-xs text-black/45">{region.code}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatEtb(region.distributedFundsEtb)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {region.livesTouched != null ? region.livesTouched.toLocaleString("en") : <span className="text-xs text-black/45">Live count</span>}
                  </TableCell>
                  <TableCell>{region.active ? <Badge tone="success">Shown</Badge> : <Badge tone="neutral">Hidden</Badge>}</TableCell>
                  <TableCell className="text-sm text-black/60">{formatDateTime(region.updatedAt)}</TableCell>
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

function RegionDialog({
  region,
  onClose,
  onSaved,
}: {
  region: ImpactRegion;
  onClose: () => void;
  onSaved: (region: ImpactRegion) => void;
}) {
  const [form, setForm] = useState({
    name: region.name,
    latitude: String(region.latitude),
    longitude: String(region.longitude),
    distributedFundsEtb: region.distributedFundsEtb != null ? String(region.distributedFundsEtb) : "",
    livesTouched: region.livesTouched != null ? String(region.livesTouched) : "",
    sortOrder: region.sortOrder != null ? String(region.sortOrder) : "",
    active: region.active,
  });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const set = (key: keyof typeof form, value: string | boolean) => setForm((prev) => ({ ...prev, [key]: value }));

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setIsSaving(true);
    try {
      // PUT replaces the region, so every field is sent.
      const saved = await apiClient<ImpactRegion>(`${API}/${encodeURIComponent(region.code)}`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          latitude: Number(form.latitude),
          longitude: Number(form.longitude),
          distributedFundsEtb: form.distributedFundsEtb.trim() ? Number(form.distributedFundsEtb) : 0,
          livesTouched: form.livesTouched.trim() ? Number(form.livesTouched) : null,
          ...(form.sortOrder.trim() ? { sortOrder: Number(form.sortOrder) } : {}),
          active: form.active,
        }),
      });
      onSaved(saved);
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the region"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">{region.name}</DialogTitle>
            <DialogDescription>Usually only the two figures change. The public map updates straight away.</DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Funds distributed (ETB)" htmlFor="rg-funds" error={fieldErrors.distributedFundsEtb}>
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
            <FormField label="Lives touched" htmlFor="rg-lives" hint="Empty = live beneficiary count" error={fieldErrors.livesTouched}>
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
            <FormField label="Latitude" htmlFor="rg-lat" required error={fieldErrors.latitude}>
              <Input id="rg-lat" type="number" step="any" min={-90} max={90} value={form.latitude} onChange={(e) => set("latitude", e.target.value)} required />
            </FormField>
            <FormField label="Longitude" htmlFor="rg-lng" required error={fieldErrors.longitude}>
              <Input id="rg-lng" type="number" step="any" min={-180} max={180} value={form.longitude} onChange={(e) => set("longitude", e.target.value)} required />
            </FormField>
            <FormField label="Sort order" htmlFor="rg-sort" error={fieldErrors.sortOrder}>
              <Input id="rg-sort" type="number" step={1} value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </FormField>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-[#001539]">
              <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-[#007050]" />
              Show on the public site
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save region"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
