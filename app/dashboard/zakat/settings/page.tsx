"use client";

import { type FormEvent, useState } from "react";
import { Pencil, Plus, Save } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { TableMessageRow } from "@/components/dashboard/table-states";
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
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDate } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";

type HomeAdjustment = {
  offlineCollectedEtb: number;
  offlineBeneficiaries: number;
  note: string | null;
  createdBy?: string | null;
  createdAt?: string | null;
};

type PaymentSettings = {
  creditAccountNumber: string | null;
  creditAccountName: string | null;
  coopEnabled: boolean;
  minAmountEtb: number | null;
  maxAmountEtb: number | null;
  ready: boolean;
  bankMode: "live" | "sandbox";
  defaultOtpEnabled: boolean;
  updatedBy?: string | null;
  updatedAt?: string | null;
};

type FitrSeason = {
  hijriYear: number;
  status: "upcoming" | "open" | "closed";
  startsOn: string;
  dueBy: string;
  perPersonAmountEtb: number;
  basis: string | null;
  updatedBy?: string | null;
  updatedAt?: string | null;
};

const SEASON_TONE: Record<FitrSeason["status"], BadgeTone> = { upcoming: "info", open: "success", closed: "neutral" };
const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });

export default function ZakatSettingsPage() {
  return (
    <RequireRole audience={["admin"]}>
      <section className="space-y-6">
        <PageHeader
          title="Zakat settings"
          description="Payment receiving account, the offline figures on the public home screen, and Zakat al-Fitr seasons."
        />
        <PaymentSettingsPanel />
        <HomeFiguresPanel />
        <FitrSeasonsPanel />
      </section>
    </RequireRole>
  );
}

function PaymentSettingsPanel() {
  const { data, error, mutate } = useResource<PaymentSettings>("/api/payments-admin/payment-settings");
  // Keyed on updatedAt so the form re-initialises after a save.
  return (
    <Panel
      title="Payment settings"
      description="Donors pay from their Coop Bank account into this commission account. Changes apply to new payments only."
      actions={
        data ? (
          <Badge tone={data.ready ? "success" : "warning"}>{data.ready ? "Payments ready" : "Payments unavailable"}</Badge>
        ) : null
      }
    >
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}
      {data ? <PaymentSettingsForm key={data.updatedAt ?? "new"} settings={data} onSaved={mutate} /> : null}
    </Panel>
  );
}

function PaymentSettingsForm({ settings, onSaved }: { settings: PaymentSettings; onSaved: (settings: PaymentSettings) => void }) {
  const [account, setAccount] = useState(settings.creditAccountNumber ?? "");
  const [name, setName] = useState(settings.creditAccountName ?? "");
  const [enabled, setEnabled] = useState(settings.coopEnabled);
  const [min, setMin] = useState(settings.minAmountEtb != null ? String(settings.minAmountEtb) : "");
  const [max, setMax] = useState(settings.maxAmountEtb != null ? String(settings.maxAmountEtb) : "");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setFieldErrors({});
    try {
      const saved = await apiClient<PaymentSettings>("/api/payments-admin/payment-settings", {
        method: "PUT",
        body: JSON.stringify({
          creditAccountNumber: account.trim() || null,
          creditAccountName: name.trim() || null,
          coopEnabled: enabled,
          minAmountEtb: min.trim() ? Number(min) : null,
          maxAmountEtb: max.trim() ? Number(max) : null,
        }),
      });
      onSaved(saved);
    } catch (saveError) {
      setMessage({ tone: "error", text: errorMessage(saveError, "Couldn't save payment settings") });
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {settings.bankMode === "sandbox" ? (
        <InlineAlert tone="warning" title="TEST MODE">
          The bank connection is a sandbox: payments are simulated and no money moves.
        </InlineAlert>
      ) : null}
      {settings.defaultOtpEnabled ? (
        <InlineAlert tone="info" title="Test confirmation code in use">
          SMS isn&apos;t connected yet; the server accepts one fixed confirmation code. Don&apos;t treat payments as production.
        </InlineAlert>
      ) : null}
      {message ? <InlineAlert tone={message.tone}>{message.text}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Receiving account number" htmlFor="ps-account" hint="6–20 digits; required to switch payments on" error={fieldErrors.creditAccountNumber}>
          <Input id="ps-account" inputMode="numeric" value={account} onChange={(e) => setAccount(e.target.value)} className="font-mono" />
        </FormField>
        <FormField label="Account name" htmlFor="ps-name" error={fieldErrors.creditAccountName}>
          <Input id="ps-name" value={name} onChange={(e) => setName(e.target.value)} />
        </FormField>
        <FormField label="Minimum payment (ETB)" htmlFor="ps-min" error={fieldErrors.minAmountEtb}>
          <Input id="ps-min" type="number" min={0} value={min} onChange={(e) => setMin(e.target.value)} />
        </FormField>
        <FormField label="Maximum payment (ETB)" htmlFor="ps-max" error={fieldErrors.maxAmountEtb}>
          <Input id="ps-max" type="number" min={0} value={max} onChange={(e) => setMax(e.target.value)} />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-[#001539]">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="size-4 accent-[#007050]" />
        Accept Coop Bank payments in the app
      </label>
      <div className="flex items-center justify-between border-t border-black/[0.06] pt-4">
        <p className="text-xs text-black/45">
          {settings.updatedAt ? `Last changed ${formatDateTime(settings.updatedAt)}` : "Not configured yet"} · bank mode {settings.bankMode}
        </p>
        <Button type="submit" disabled={isSaving}>
          <Save />
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function HomeFiguresPanel() {
  const { data, error, mutate } = useResource<HomeAdjustment>("/api/zakat-admin/home/adjustment");
  return (
    <Panel
      title="Home figures (offline)"
      description="Collections and households from outside the app (cash, history before the app). Added to the live totals on the public home screen within about a minute. Saving replaces the previous values."
    >
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}
      {data ? <HomeFiguresForm key={data.createdAt ?? "new"} adjustment={data} onSaved={mutate} /> : null}
    </Panel>
  );
}

function HomeFiguresForm({ adjustment, onSaved }: { adjustment: HomeAdjustment; onSaved: (value: HomeAdjustment) => void }) {
  const [collected, setCollected] = useState(String(adjustment.offlineCollectedEtb ?? 0));
  const [households, setHouseholds] = useState(String(adjustment.offlineBeneficiaries ?? 0));
  const [note, setNote] = useState(adjustment.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      onSaved(
        await apiClient<HomeAdjustment>("/api/zakat-admin/home/adjustment", {
          method: "PUT",
          body: JSON.stringify({
            offlineCollectedEtb: Number(collected || 0),
            offlineBeneficiaries: Number(households || 0),
            note: note.trim() || undefined,
          }),
        }),
      );
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the figures"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? <InlineAlert>{error}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Collected offline (ETB)" htmlFor="hf-collected" required>
          <Input id="hf-collected" type="number" min={0} step="0.01" value={collected} onChange={(e) => setCollected(e.target.value)} required className="tabular-nums" />
        </FormField>
        <FormField label="Households supported offline" htmlFor="hf-households">
          <Input id="hf-households" type="number" min={0} step={1} value={households} onChange={(e) => setHouseholds(e.target.value)} className="tabular-nums" />
        </FormField>
      </div>
      <FormField label="Note" htmlFor="hf-note" hint="Where these figures come from">
        <Textarea id="hf-note" rows={2} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </FormField>
      <div className="flex items-center justify-between border-t border-black/[0.06] pt-4">
        <p className="text-xs text-black/45">
          {adjustment.createdAt
            ? `Currently ETB ${etb.format(adjustment.offlineCollectedEtb)} and ${adjustment.offlineBeneficiaries.toLocaleString()} households, set ${formatDateTime(adjustment.createdAt)}`
            : "Not set yet"}
        </p>
        <Button type="submit" disabled={isSaving}>
          <Save />
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}

function FitrSeasonsPanel() {
  const { data, error, reload } = useResource<FitrSeason[]>("/api/zakat-admin/zakat-al-fitr");
  const [editing, setEditing] = useState<FitrSeason | "new" | null>(null);
  const seasons = data ?? [];

  return (
    <Panel
      title="Zakat al-Fitr seasons"
      description="One season per Hijri year. The app shows the open season, or the next upcoming one."
      flush
      actions={
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          New season
        </Button>
      }
    >
      {error ? (
        <div className="px-5 pt-4">
          <InlineAlert>{error.message}</InlineAlert>
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
              <span className="sr-only">Edit</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {seasons.length === 0 ? (
            <TableMessageRow colSpan={6}>No seasons yet.</TableMessageRow>
          ) : (
            seasons.map((season) => (
              <TableRow key={season.hijriYear}>
                <TableCell className="pl-5 font-semibold text-[#001539] tabular-nums">{season.hijriYear} AH</TableCell>
                <TableCell>
                  <Badge tone={SEASON_TONE[season.status] ?? "neutral"} className="capitalize">
                    {season.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {formatDate(season.startsOn)} – {formatDate(season.dueBy)}
                </TableCell>
                <TableCell className="text-right tabular-nums">ETB {etb.format(season.perPersonAmountEtb)}</TableCell>
                <TableCell className="max-w-xs truncate text-sm text-black/60">{season.basis ?? "—"}</TableCell>
                <TableCell className="pr-5 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(season)}>
                    <Pencil />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {editing ? (
        <FitrSeasonDialog
          season={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      ) : null}
    </Panel>
  );
}

function FitrSeasonDialog({ season, onClose, onSaved }: { season: FitrSeason | null; onClose: () => void; onSaved: () => void }) {
  const [year, setYear] = useState(season ? String(season.hijriYear) : "");
  const [startsOn, setStartsOn] = useState(season?.startsOn ?? "");
  const [dueBy, setDueBy] = useState(season?.dueBy ?? "");
  const [amount, setAmount] = useState(season ? String(season.perPersonAmountEtb) : "");
  const [basis, setBasis] = useState(season?.basis ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      await apiClient(`/api/zakat-admin/zakat-al-fitr/${encodeURIComponent(year.trim())}`, {
        method: "PUT",
        body: JSON.stringify({ startsOn, dueBy, perPersonAmountEtb: Number(amount), basis: basis.trim() || undefined }),
      });
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the season"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">{season ? `Zakat al-Fitr ${season.hijriYear} AH` : "New Zakat al-Fitr season"}</DialogTitle>
            <DialogDescription>The status (upcoming, open, closed) follows today&apos;s date.</DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Hijri year" htmlFor="fs-year" required hint="1400–1600" error={fieldErrors.hijriYear}>
              <Input id="fs-year" type="number" min={1400} max={1600} value={year} onChange={(e) => setYear(e.target.value)} disabled={!!season} required />
            </FormField>
            <FormField label="Per person (ETB)" htmlFor="fs-amount" required error={fieldErrors.perPersonAmountEtb}>
              <Input id="fs-amount" type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save season"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
