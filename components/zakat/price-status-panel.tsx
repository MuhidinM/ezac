"use client";

import { type FormEvent, useState } from "react";
import { PenLine, RefreshCw, TriangleAlert } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { DetailList, Panel } from "@/components/dashboard/panel";
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
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";

type PriceSnapshot = {
  id: string;
  pricesAsOf: string;
  source: string | null;
  usdEtbRate: number | null;
  goldPricePerGramEtb: Record<string, number>;
  silverPricePerGramEtb: number;
  manual: boolean;
  enteredBy?: string | null;
  note?: string | null;
  createdAt: string;
};

type PriceStatus = {
  latest: PriceSnapshot | null;
  apiKeyConfigured: boolean;
  budget: {
    month: string;
    used: number;
    limit: number;
    lastAttemptAt?: string | null;
    lastSuccessAt?: string | null;
    lastError?: string | null;
  };
};

const STALE_HOURS = 48;
const KARATS = ["24k", "22k", "21k", "18k", "14k"] as const;
const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });

/** ADMIN: price health, refresh now and manual entry (WEB-ADMIN-ZAKAT-GUIDE §2). */
export function PriceStatusPanel({ onChanged }: { onChanged: () => void }) {
  const { data, error, reload } = useResource<PriceStatus>("/bff/zakat-admin/prices/status");
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Captured once per mount; age only needs to be roughly right.
  const [now] = useState(() => Date.now());

  const latest = data?.latest ?? null;
  const ageHours = latest ? (now - new Date(latest.pricesAsOf).getTime()) / 3_600_000 : null;
  const stale = ageHours !== null && ageHours > STALE_HOURS;

  function refreshed(message: string) {
    setNotice(message);
    reload();
    onChanged();
  }

  return (
    <Panel
      title="Price feed"
      description="Fetched automatically every day at 06:00 Addis Ababa time. Manual prices are used until the next automatic fetch."
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setManualOpen(true)}>
            <PenLine />
            Enter prices
          </Button>
          <Button size="sm" onClick={() => setRefreshOpen(true)} disabled={data ? !data.apiKeyConfigured : false}>
            <RefreshCw />
            Refresh now
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InlineAlert>{error.message}</InlineAlert> : null}
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        {data && !data.apiKeyConfigured ? (
          <InlineAlert tone="warning" title="Automatic prices are off">
            No price API key is configured. Enter prices manually.
          </InlineAlert>
        ) : null}
        {data?.budget.lastError ? (
          <InlineAlert title="Last automatic fetch failed">{data.budget.lastError}</InlineAlert>
        ) : null}
        {data && !latest ? (
          <InlineAlert tone="warning">No prices stored yet, so the public calculator is unavailable. Refresh or enter prices.</InlineAlert>
        ) : null}

        {latest ? (
          <DetailList
            columns={4}
            items={[
              {
                label: "Prices as of",
                value: (
                  <span className="flex flex-wrap items-center gap-1.5">
                    {formatDateTime(latest.pricesAsOf)}
                    {stale ? (
                      <Badge tone="warning">
                        <TriangleAlert />
                        {Math.round(ageHours!)} h old
                      </Badge>
                    ) : null}
                  </span>
                ),
              },
              {
                label: "Source",
                value: latest.manual ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="warning">Entered by an admin</Badge>
                    {latest.note ? <span className="text-black/60">{latest.note}</span> : null}
                  </span>
                ) : (
                  latest.source
                ),
              },
              { label: "Gold 24k / g", value: `ETB ${etb.format(latest.goldPricePerGramEtb["24k"] ?? 0)}` },
              { label: "Silver / g", value: `ETB ${etb.format(latest.silverPricePerGramEtb)}` },
              { label: "USD/ETB", value: latest.usdEtbRate != null ? latest.usdEtbRate.toFixed(4) : null },
              {
                label: "API budget",
                value: data ? `${data.budget.used} of ${data.budget.limit} used (${data.budget.month})` : null,
              },
              { label: "Last success", value: formatDateTime(data?.budget.lastSuccessAt ?? null) },
              { label: "Last attempt", value: formatDateTime(data?.budget.lastAttemptAt ?? null) },
            ]}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={refreshOpen}
        onOpenChange={setRefreshOpen}
        title="Fetch prices now?"
        description={`This uses 2 of the monthly API requests${data ? ` (${data.budget.used} of ${data.budget.limit} used)` : ""}. If the provider fails, the current prices stay in use.`}
        confirmLabel="Refresh now"
        onConfirm={async () => {
          const snapshot = await apiClient<PriceSnapshot>("/bff/zakat-admin/prices/refresh", { method: "POST" });
          refreshed(`Prices refreshed as of ${formatDateTime(snapshot.pricesAsOf)}.`);
        }}
      />

      <ManualPricesDialog
        open={manualOpen}
        onOpenChange={setManualOpen}
        latest={latest}
        onSaved={() => refreshed("Manual prices saved. They're used until the next automatic fetch.")}
      />
    </Panel>
  );
}

function ManualPricesDialog({
  open,
  onOpenChange,
  latest,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latest: PriceSnapshot | null;
  onSaved: () => void;
}) {
  const [gold, setGold] = useState<Record<string, string>>({});
  const [silver, setSilver] = useState("");
  const [usd, setUsd] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    const goldBody = Object.fromEntries(
      KARATS.filter((karat) => gold[karat]?.trim()).map((karat) => [karat, Number(gold[karat])]),
    );
    setIsSaving(true);
    try {
      await apiClient("/bff/zakat-admin/prices", {
        method: "POST",
        body: JSON.stringify({
          goldPricePerGramEtb: goldBody,
          silverPricePerGramEtb: Number(silver),
          ...(usd.trim() ? { usdEtbRate: Number(usd) } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      setGold({});
      setSilver("");
      setUsd("");
      setNote("");
      onOpenChange(false);
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the prices"));
      if (saveError instanceof ApiError) setFieldErrors(fieldErrorMap(saveError.errors));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="text-[#001539]">Enter prices manually</DialogTitle>
            <DialogDescription>
              Used until the next automatic fetch (next morning at 06:00). Leave other karats empty to work them out from 24k by purity.
            </DialogDescription>
          </DialogHeader>
          {error ? <InlineAlert>{error}</InlineAlert> : null}
          <div className="grid gap-3 sm:grid-cols-3">
            {KARATS.map((karat) => (
              <FormField
                key={karat}
                label={`Gold ${karat} / g`}
                htmlFor={`gold-${karat}`}
                required={karat === "24k"}
                error={fieldErrors[`goldPricePerGramEtb.${karat}`] ?? (karat === "24k" ? fieldErrors.goldPricePerGramEtb : undefined)}
              >
                <Input
                  id={`gold-${karat}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={gold[karat] ?? ""}
                  placeholder={latest?.goldPricePerGramEtb[karat] ? String(latest.goldPricePerGramEtb[karat]) : undefined}
                  onChange={(event) => setGold((prev) => ({ ...prev, [karat]: event.target.value }))}
                  required={karat === "24k"}
                  className="tabular-nums"
                />
              </FormField>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Silver / g" htmlFor="silver" required error={fieldErrors.silverPricePerGramEtb}>
              <Input
                id="silver"
                type="number"
                min={0}
                step="0.01"
                value={silver}
                placeholder={latest ? String(latest.silverPricePerGramEtb) : undefined}
                onChange={(event) => setSilver(event.target.value)}
                required
                className="tabular-nums"
              />
            </FormField>
            <FormField label="USD/ETB" htmlFor="usd" hint="Optional; keeps the last rate" error={fieldErrors.usdEtbRate}>
              <Input
                id="usd"
                type="number"
                min={0}
                step="0.0001"
                value={usd}
                placeholder={latest?.usdEtbRate ? String(latest.usdEtbRate) : undefined}
                onChange={(event) => setUsd(event.target.value)}
                className="tabular-nums"
              />
            </FormField>
          </div>
          <FormField label="Note" htmlFor="price-note" hint="Why prices were entered by hand" error={fieldErrors.note}>
            <Textarea id="price-note" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
          </FormField>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save prices"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
