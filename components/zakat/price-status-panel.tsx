"use client";

import { type FormEvent, useState } from "react";
import { PenLine, RefreshCw, RotateCcw, TriangleAlert } from "lucide-react";

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
import { cn } from "@/lib/utils";

/** The prices of one snapshot: the latest one, or a row of the price history. */
export type PriceValues = {
  pricesAsOf: string;
  source?: string | null;
  manual: boolean;
  usdEtbRate: number | null;
  /** Keys like "24k", "22k". */
  goldPricePerGramEtb: Record<string, number>;
  silverPricePerGramEtb: number | null;
  note?: string | null;
};

type PriceSnapshot = PriceValues & {
  id: string;
  silverPricePerGramEtb: number;
  enteredBy?: string | null;
  /** Not sent yet (go-live requests §20); shown once it is. */
  enteredByName?: string | null;
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

/** What the nisab is worked out from (the active calculator rules). */
export type NisabRules = { basis: "gold" | "silver"; goldGrams: number; silverGrams: number };

const STALE_HOURS = 48;
const KARATS = ["24k", "22k", "21k", "18k", "14k"] as const;
type Karat = (typeof KARATS)[number];
type PriceField = Karat | "silver" | "usd";
/** A change this large is flagged before saving (go-live requests §16). */
const LARGE_CHANGE = 0.15;

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 2 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A person's name for "entered by"; a bare account id means nothing to an admin, so it's left out. */
export function enteredByLabel(entry: { enteredBy?: string | null; enteredByName?: string | null }) {
  if (entry.enteredByName) return entry.enteredByName;
  return entry.enteredBy && !UUID.test(entry.enteredBy) ? entry.enteredBy : null;
}

/** ADMIN: price health, return to automatic prices, and manual entry (WEB-ADMIN-ZAKAT-GUIDE §2). */
export function PriceStatusPanel({
  onChanged,
  nisab,
  reuse,
  onReuseClose,
}: {
  onChanged: () => void;
  /** Lets the confirmation show the new nisab; null while the rules load. */
  nisab: NisabRules | null;
  /** A history row the admin chose to use again: opens the price form with its values. */
  reuse: PriceValues | null;
  onReuseClose: () => void;
}) {
  const { data, error, reload } = useResource<PriceStatus>("/bff/zakat-admin/prices/status");
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Captured once per mount; age only needs to be roughly right.
  const [now] = useState(() => Date.now());

  const latest = data?.latest ?? null;
  const ageHours = latest ? (now - new Date(latest.pricesAsOf).getTime()) / 3_600_000 : null;
  const stale = ageHours !== null && ageHours > STALE_HOURS;
  const manualInUse = latest?.manual === true;
  const automatic = data?.apiKeyConfigured ?? true;
  const until = automatic ? "until the next automatic fetch at 06:00 Addis Ababa time" : "until new prices are entered";
  const budgetText = data ? ` (${data.budget.used} of ${data.budget.limit} used this month)` : "";
  const dialogFrom = reuse ?? (manualOpen ? latest : null);

  function changed(message: string) {
    setNotice(message);
    reload();
    onChanged();
  }

  function closeDialog() {
    setManualOpen(false);
    onReuseClose();
  }

  return (
    <Panel
      title="Price feed"
      description="Gold and silver follow the market: fetched automatically every day at 06:00 Addis Ababa time. Prices entered by hand replace them until the next automatic fetch."
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setManualOpen(true)} disabled={!data}>
            <PenLine />
            Change prices
          </Button>
          <Button
            size="sm"
            variant={manualInUse ? "default" : "outline"}
            onClick={() => setRefreshOpen(true)}
            disabled={!data?.apiKeyConfigured}
            title={data && !data.apiKeyConfigured ? "Automatic prices are off: no price API key is configured." : undefined}
          >
            {manualInUse ? <RotateCcw /> : <RefreshCw />}
            {manualInUse ? "Return to automatic prices" : "Refresh now"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error ? <InlineAlert>{error.message}</InlineAlert> : null}
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        {data && !data.apiKeyConfigured ? (
          <InlineAlert tone="warning" title="Automatic prices are off">
            No price API key is configured, so prices can only be entered by hand. They stay in use until changed.
          </InlineAlert>
        ) : null}
        {data?.budget.lastError ? (
          <InlineAlert title="Last automatic fetch failed">{data.budget.lastError}</InlineAlert>
        ) : null}
        {data && !latest ? (
          <InlineAlert tone="warning">No prices stored yet, so the public calculator is unavailable. Refresh or enter prices.</InlineAlert>
        ) : null}
        {manualInUse ? (
          <InlineAlert tone="info" title="Prices entered by hand are in use">
            They stay {until}.
            {automatic ? " To use market prices again now, choose Return to automatic prices." : null}
          </InlineAlert>
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
                  <span className="space-y-0.5">
                    <Badge tone="warning">Entered by hand</Badge>
                    {enteredByLabel(latest) ? <span className="block text-black/60">by {enteredByLabel(latest)}</span> : null}
                    {latest.note ? <span className="block text-black/60">{latest.note}</span> : null}
                  </span>
                ) : (
                  <span className="space-y-0.5">
                    <Badge tone="success">Automatic</Badge>
                    {latest.source ? <span className="block text-black/60">{latest.source}</span> : null}
                  </span>
                ),
              },
              { label: "Gold 24k, ETB per gram", value: etb.format(latest.goldPricePerGramEtb["24k"] ?? 0) },
              { label: "Silver, ETB per gram", value: etb.format(latest.silverPricePerGramEtb) },
              { label: "USD to ETB", value: latest.usdEtbRate != null ? latest.usdEtbRate.toFixed(4) : null },
              {
                label: "Price API requests",
                value: data ? `${data.budget.used} of ${data.budget.limit} used (${data.budget.month})` : null,
              },
              { label: "Last automatic fetch", value: formatDateTime(data?.budget.lastSuccessAt ?? null) },
              { label: "Last attempt", value: formatDateTime(data?.budget.lastAttemptAt ?? null) },
            ]}
          />
        ) : null}
      </div>

      <ConfirmDialog
        open={refreshOpen}
        onOpenChange={setRefreshOpen}
        title={manualInUse ? "Return to automatic prices?" : "Fetch prices now?"}
        description={
          manualInUse
            ? `Fetches today's market prices now and replaces the prices entered by hand. This uses 2 of the monthly price API requests${budgetText}. If the provider fails, the prices entered by hand stay in use.`
            : `This uses 2 of the monthly price API requests${budgetText}. If the provider fails, the current prices stay in use.`
        }
        confirmLabel={manualInUse ? "Return to automatic prices" : "Refresh now"}
        onConfirm={async () => {
          const snapshot = await apiClient<PriceSnapshot>("/bff/zakat-admin/prices/refresh", { method: "POST" });
          changed(
            manualInUse
              ? `Automatic prices are back in use, as of ${formatDateTime(snapshot.pricesAsOf)}.`
              : `Prices refreshed as of ${formatDateTime(snapshot.pricesAsOf)}.`,
          );
        }}
      />

      {dialogFrom || manualOpen ? (
        <ManualPricesDialog
          key={reuse ? `reuse-${reuse.pricesAsOf}` : "latest"}
          current={latest}
          from={dialogFrom}
          reusing={reuse !== null}
          nisab={nisab}
          until={until}
          onClose={closeDialog}
          onSaved={() => {
            closeDialog();
            changed(`New prices saved and in use. They stay ${until}.`);
          }}
        />
      ) : null}
    </Panel>
  );
}

type Values = Record<PriceField, string>;

const FIELD_LABEL: Record<PriceField, string> = {
  "24k": "Gold 24k",
  "22k": "Gold 22k",
  "21k": "Gold 21k",
  "18k": "Gold 18k",
  "14k": "Gold 14k",
  silver: "Silver",
  usd: "USD to ETB",
};

function toValues(from: PriceValues | null): Values {
  const text = (value: number | null | undefined) => (value != null && value > 0 ? String(value) : "");
  return {
    ...(Object.fromEntries(KARATS.map((karat) => [karat, text(from?.goldPricePerGramEtb[karat])])) as Record<Karat, string>),
    silver: text(from?.silverPricePerGramEtb),
    usd: text(from?.usdEtbRate),
  };
}

function currentValue(current: PriceValues | null, field: PriceField): number | null {
  if (!current) return null;
  if (field === "silver") return current.silverPricePerGramEtb;
  if (field === "usd") return current.usdEtbRate;
  return current.goldPricePerGramEtb[field] ?? null;
}

/** A positive number, null when empty, NaN when not a valid price. */
function parse(value: string): number | null {
  if (!value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : Number.NaN;
}

function percent(from: number, to: number) {
  const change = ((to - from) / from) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

/** An empty USD rate keeps the last one; an empty karat is worked out again from 24k. */
function isChanged(field: PriceField, values: Values, current: PriceValues | null) {
  const next = parse(values[field]);
  if (field === "usd" && next === null) return false;
  return next !== currentValue(current, field);
}

/** Problems worth a second look before prices reach every calculator user. */
function priceWarnings(values: Values, current: PriceValues | null): string[] {
  const warnings: string[] = [];
  // Purer gold costs more: 24k ≥ 22k ≥ 21k ≥ 18k ≥ 14k.
  let purer: { karat: Karat; price: number } | null = null;
  for (const karat of KARATS) {
    const price = parse(values[karat]);
    if (price === null || Number.isNaN(price)) continue;
    if (purer && price > purer.price) {
      warnings.push(
        `Gold ${karat} (ETB ${etb.format(price)}) costs more than gold ${purer.karat} (ETB ${etb.format(purer.price)}). Purer gold should cost more, so check for a typing mistake.`,
      );
    }
    purer = { karat, price };
  }
  for (const field of [...KARATS, "silver", "usd"] as const) {
    const next = parse(values[field]);
    const before = currentValue(current, field);
    if (next === null || Number.isNaN(next) || !before) continue;
    if (Math.abs(next - before) / before > LARGE_CHANGE) {
      warnings.push(
        `${FIELD_LABEL[field]} moves by ${percent(before, next)} (${etb.format(before)} → ${etb.format(next)}). Check it before saving.`,
      );
    }
  }
  return warnings;
}

function ManualPricesDialog({
  current,
  from,
  reusing,
  nisab,
  until,
  onClose,
  onSaved,
}: {
  current: PriceSnapshot | null;
  from: PriceValues | null;
  reusing: boolean;
  nisab: NisabRules | null;
  until: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  // Every field starts with the prices in use (or the history row chosen), so
  // changing one price leaves the others as they are.
  const [values, setValues] = useState<Values>(() => toValues(from));
  const [note, setNote] = useState(() =>
    reusing && from ? `Same prices as ${formatDateTime(from.pricesAsOf)}${from.manual ? "" : " (automatic)"}` : "",
  );
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: PriceField, value: string) => setValues((prev) => ({ ...prev, [field]: value }));
  const gold24 = parse(values["24k"]);
  const warnings = priceWarnings(values, current);
  const changedFields = ([...KARATS, "silver", "usd"] as const).filter((field) => isChanged(field, values, current));

  function workOutKarats() {
    if (gold24 === null || Number.isNaN(gold24)) return;
    setValues((prev) => ({
      ...prev,
      ...Object.fromEntries(
        KARATS.filter((karat) => karat !== "24k").map((karat) => [karat, String(Math.round(((gold24 * parseInt(karat, 10)) / 24) * 100) / 100)]),
      ),
    }));
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const problems: Record<string, string> = {};
    for (const field of [...KARATS, "silver", "usd"] as const) {
      const value = parse(values[field]);
      const required = field === "24k" || field === "silver";
      if (value === null && required) problems[field] = "Enter a price.";
      else if (Number.isNaN(value)) problems[field] = "Enter a number above 0.";
    }
    setFieldErrors(problems);
    if (Object.keys(problems).length > 0) return;
    if (current && changedFields.length === 0) {
      setError("Nothing has changed. Change at least one price, or cancel.");
      return;
    }
    setStep("confirm");
  }

  async function save() {
    setError(null);
    setIsSaving(true);
    const goldBody = Object.fromEntries(
      KARATS.flatMap((karat) => {
        const price = parse(values[karat]);
        return price !== null ? [[karat, price]] : [];
      }),
    );
    const usd = parse(values.usd);
    try {
      await apiClient("/bff/zakat-admin/prices", {
        method: "POST",
        body: JSON.stringify({
          goldPricePerGramEtb: goldBody,
          silverPricePerGramEtb: parse(values.silver),
          ...(usd !== null ? { usdEtbRate: usd } : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });
      onSaved();
    } catch (saveError) {
      setError(errorMessage(saveError, "Couldn't save the prices"));
      if (saveError instanceof ApiError) {
        const map = fieldErrorMap(saveError.errors);
        setFieldErrors({
          ...Object.fromEntries(KARATS.flatMap((karat) => (map[`goldPricePerGramEtb.${karat}`] ? [[karat, map[`goldPricePerGramEtb.${karat}`]]] : []))),
          ...(map.goldPricePerGramEtb && !map["goldPricePerGramEtb.24k"] ? { "24k": map.goldPricePerGramEtb } : {}),
          ...(map.silverPricePerGramEtb ? { silver: map.silverPricePerGramEtb } : {}),
          ...(map.usdEtbRate ? { usd: map.usdEtbRate } : {}),
          ...(map.note ? { note: map.note } : {}),
        });
        if (saveError.errors.length > 0) setStep("edit");
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {step === "edit" ? (
          <form onSubmit={review} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle className="text-[#001539]">Change prices</DialogTitle>
              <DialogDescription>
                {reusing && from
                  ? `Filled in with the prices of ${formatDateTime(from.pricesAsOf)}. `
                  : "Filled in with the prices in use. Change only what you need; the rest stays as it is. "}
                You check the result before it goes live.
              </DialogDescription>
            </DialogHeader>
            {error ? <InlineAlert>{error}</InlineAlert> : null}
            <fieldset className="space-y-2">
              <legend className="text-[13px] font-medium text-[#001539]">Gold, ETB per gram</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {KARATS.map((karat) => (
                  <PriceInput
                    key={karat}
                    id={`gold-${karat}`}
                    label={karat}
                    required={karat === "24k"}
                    emptyHint={karat === "24k" ? undefined : "Worked out from 24k"}
                    value={values[karat]}
                    before={currentValue(current, karat)}
                    error={fieldErrors[karat]}
                    onChange={(value) => set(karat, value)}
                  />
                ))}
              </div>
              <p className="flex flex-wrap items-center gap-x-2 text-xs text-black/50">
                Clear a karat to have it worked out from 24k by purity.
                <button
                  type="button"
                  onClick={workOutKarats}
                  disabled={gold24 === null || Number.isNaN(gold24)}
                  className="font-medium text-[#007050] underline underline-offset-2 disabled:text-black/30 disabled:no-underline"
                >
                  Work out 22k to 14k from 24k now
                </button>
              </p>
            </fieldset>
            <div className="grid grid-cols-2 gap-3">
              <PriceInput
                id="silver"
                label="Silver, ETB per gram"
                required
                value={values.silver}
                before={currentValue(current, "silver")}
                error={fieldErrors.silver}
                onChange={(value) => set("silver", value)}
              />
              <PriceInput
                id="usd"
                label="USD to ETB"
                step="0.0001"
                emptyHint="Keeps the last rate"
                value={values.usd}
                before={currentValue(current, "usd")}
                error={fieldErrors.usd}
                onChange={(value) => set("usd", value)}
              />
            </div>
            <FormField label="Note" htmlFor="price-note" hint="Why the prices were changed by hand" error={fieldErrors.note}>
              <Textarea id="price-note" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
            </FormField>
            {warnings.length > 0 ? <WarningList warnings={warnings} /> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Review</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-[#001539]">Check the new prices</DialogTitle>
              <DialogDescription>
                They go live in the public calculator as soon as you save, and stay {until}.
              </DialogDescription>
            </DialogHeader>
            {error ? <InlineAlert>{error}</InlineAlert> : null}
            <ChangeTable values={values} current={current} changed={changedFields} />
            <NisabChange values={values} current={current} nisab={nisab} />
            {warnings.length > 0 ? <WarningList warnings={warnings} /> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep("edit")} disabled={isSaving}>
                Back
              </Button>
              <Button type="button" onClick={() => void save()} disabled={isSaving}>
                {isSaving ? "Saving…" : warnings.length > 0 ? "Save anyway" : "Save prices"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PriceInput({
  id,
  label,
  required,
  value,
  before,
  error,
  step = "0.01",
  emptyHint,
  onChange,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  before: number | null;
  error?: string;
  step?: string;
  /** Shown while the field is empty. */
  emptyHint?: string;
  onChange: (value: string) => void;
}) {
  const next = parse(value);
  const edited = next !== null && !Number.isNaN(next) && before != null && next !== before;
  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      error={error}
      hint={edited ? `Was ${etb.format(before)}` : value.trim() ? undefined : emptyHint}
    >
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        className={cn("tabular-nums", edited && "border-[#007050]")}
      />
    </FormField>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  return (
    <InlineAlert tone="warning" title="Check before saving">
      <ul className="list-disc space-y-1 pl-4">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </InlineAlert>
  );
}

function ChangeTable({ values, current, changed }: { values: Values; current: PriceValues | null; changed: PriceField[] }) {
  const gold24 = parse(values["24k"]);
  const rows = ([...KARATS, "silver", "usd"] as const).filter((field) => values[field].trim() || currentValue(current, field) != null);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-black/[0.08] text-left text-xs text-black/50">
          <th className="py-1.5 font-medium">ETB per gram</th>
          <th className="py-1.5 text-right font-medium">Now</th>
          <th className="py-1.5 text-right font-medium">New</th>
          <th className="py-1.5 text-right font-medium">Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((field) => {
          const before = currentValue(current, field);
          const next = parse(values[field]);
          const derived = next === null && gold24 !== null && field.endsWith("k") ? (gold24 * parseInt(field, 10)) / 24 : null;
          const shown = next ?? derived;
          const isChanged = changed.includes(field);
          return (
            <tr key={field} className={cn("border-b border-black/[0.04]", isChanged ? "text-[#001539]" : "text-black/45")}>
              <td className={cn("py-1.5", isChanged && "font-medium")}>{field === "usd" ? "USD to ETB rate" : FIELD_LABEL[field]}</td>
              <td className="py-1.5 text-right tabular-nums">{before != null ? etb.format(before) : "—"}</td>
              <td className={cn("py-1.5 text-right tabular-nums", isChanged && "font-semibold")}>
                {next !== null ? etb.format(next) : derived !== null ? `≈ ${etb.format(derived)} (from 24k)` : "—"}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {!isChanged ? "No change" : before && shown ? percent(before, shown) : "New"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NisabChange({ values, current, nisab }: { values: Values; current: PriceValues | null; nisab: NisabRules | null }) {
  if (!nisab) return null;
  const gold = nisab.basis === "gold";
  const grams = gold ? nisab.goldGrams : nisab.silverGrams;
  const next = parse(gold ? values["24k"] : values.silver);
  const beforePrice = currentValue(current, gold ? "24k" : "silver");
  if (next === null || Number.isNaN(next)) return null;
  const after = grams * next;
  const before = beforePrice ? grams * beforePrice : null;
  return (
    <div className="rounded-lg border border-black/[0.08] bg-black/[0.015] px-4 py-3 text-sm">
      <p className="text-xs text-black/50">
        Nisab ({gold ? "gold" : "silver"} basis: {grams} g × {gold ? "gold 24k" : "silver"} price)
      </p>
      <p className="mt-0.5 font-semibold text-[#001539] tabular-nums">
        {before !== null && Math.round(before) !== Math.round(after)
          ? `ETB ${etb.format(Math.round(before))} → ETB ${etb.format(Math.round(after))} (${percent(before, after)})`
          : `ETB ${etb.format(Math.round(after))} (no change)`}
      </p>
    </div>
  );
}
