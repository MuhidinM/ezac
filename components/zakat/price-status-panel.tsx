"use client";

import { type FormEvent, useEffect, useState } from "react";
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
import {
  addDays,
  asksLargeChangeConfirm,
  changedPriceFields,
  currentPrice,
  karatOrderProblems,
  KARATS,
  largeChanges,
  MANUAL_UNTIL_MAX_DAYS,
  manualUntilProblem,
  parsePrice,
  PRICE_FIELDS,
  priceErrorField,
  type PriceField,
  type PriceInputs,
  priceUpdateBody,
  snapshotVersion,
  tooManyDecimals,
} from "@/app/(portal)/dashboard/zakat/prices/price-update";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, isVersionConflict, VERSION_CONFLICT_MESSAGE } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDate, formatEtb, todayIso } from "@/lib/backoffice/format";
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
  /** Also the `version` a price edit sends (409 when a newer snapshot exists). */
  id: string;
  silverPricePerGramEtb: number;
  enteredBy?: string | null;
  enteredByName?: string | null;
  /** Prices entered by hand stay until this date ("YYYY-MM-DD"); the daily fetch is skipped until then. */
  manualUntil?: string | null;
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
const NEXT_FETCH = "until the next automatic fetch at 06:00 Addis Ababa time";

/** A bare rate for cells whose header already names the unit ("ETB per gram"). Fixed "en" locale, like lib/backoffice/format. */
const rate = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A person's name for "entered by"; a bare account id means nothing to an admin, so it's left out. */
export function enteredByLabel(entry: { enteredBy?: string | null; enteredByName?: string | null }) {
  if (entry.enteredByName) return entry.enteredByName;
  return entry.enteredBy && !UUID.test(entry.enteredBy) ? entry.enteredBy : null;
}

/** How long prices entered by hand stay in use. */
function untilText(automatic: boolean, manualUntil: string | null | undefined) {
  if (!automatic) return "until new prices are entered";
  return manualUntil ? `until the end of ${formatDate(manualUntil)}` : NEXT_FETCH;
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
  const { data, error, reload, mutate } = useResource<PriceStatus>("/bff/zakat-admin/prices/status");
  const [refreshOpen, setRefreshOpen] = useState(false);
  const [automaticOpen, setAutomaticOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Captured once per mount; age only needs to be roughly right.
  const [now] = useState(() => Date.now());

  const latest = data?.latest ?? null;
  const ageHours = latest ? (now - new Date(latest.pricesAsOf).getTime()) / 3_600_000 : null;
  const stale = ageHours !== null && ageHours > STALE_HOURS;
  const manualInUse = latest?.manual === true;
  const automatic = data?.apiKeyConfigured ?? true;
  const budgetText = data ? ` (${data.budget.used} of ${data.budget.limit} used this month)` : "";

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
      description="Gold and silver follow the market: fetched automatically every day at 06:00 Addis Ababa time. Prices entered by hand replace them until the next automatic fetch, or until a date you choose."
      actions={
        <>
          <Button size="sm" variant="outline" onClick={() => setManualOpen(true)} disabled={!data}>
            <PenLine />
            Change prices
          </Button>
          {manualInUse ? (
            <Button size="sm" onClick={() => setAutomaticOpen(true)}>
              <RotateCcw />
              Return to automatic prices
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRefreshOpen(true)}
              disabled={!data?.apiKeyConfigured}
              title={data && !data.apiKeyConfigured ? "Automatic prices are off: no price API key is configured." : undefined}
            >
              <RefreshCw />
              Refresh now
            </Button>
          )}
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
            They stay {untilText(automatic, latest?.manualUntil)}. To use the last automatic prices again now, choose Return
            to automatic prices.
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
              { label: "Gold 24k, per gram", value: formatEtb(latest.goldPricePerGramEtb["24k"] ?? null) },
              { label: "Silver, per gram", value: formatEtb(latest.silverPricePerGramEtb) },
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
        title="Fetch prices now?"
        description={`This uses 2 of the monthly price API requests${budgetText}. If the provider fails, the current prices stay in use.`}
        confirmLabel="Refresh now"
        onConfirm={async () => {
          const snapshot = await apiClient<PriceSnapshot>("/bff/zakat-admin/prices/refresh", { method: "POST" });
          changed(`Prices refreshed as of ${formatDateTime(snapshot.pricesAsOf)}.`);
        }}
      />

      <ConfirmDialog
        open={automaticOpen}
        onOpenChange={setAutomaticOpen}
        title="Return to automatic prices?"
        description={
          automatic
            ? "The last prices fetched automatically replace the prices entered by hand straight away, and the daily fetch at 06:00 Addis Ababa time runs again. No price API request is used."
            : "The last prices fetched automatically replace the prices entered by hand straight away. No price API key is configured, so no new prices are fetched after that."
        }
        confirmLabel="Return to automatic prices"
        onConfirm={async () => {
          const snapshot = await apiClient<PriceSnapshot | null>("/bff/zakat-admin/prices/automatic", { method: "POST" });
          changed(
            snapshot?.pricesAsOf
              ? `Automatic prices are back in use: the prices fetched ${formatDateTime(snapshot.pricesAsOf)}.`
              : "Automatic prices are back in use.",
          );
        }}
      />

      {reuse || manualOpen ? (
        <ManualPricesDialog
          key={reuse ? `reuse-${reuse.pricesAsOf}` : "latest"}
          reuse={reuse}
          nisab={nisab}
          onLoaded={mutate}
          onClose={closeDialog}
          onSaved={(manualUntil) => {
            closeDialog();
            changed(`New prices saved and in use. They stay ${untilText(automatic, manualUntil)}.`);
          }}
        />
      ) : null}
    </Panel>
  );
}

const FIELD_LABEL: Record<PriceField, string> = {
  "24k": "Gold 24k",
  "22k": "Gold 22k",
  "21k": "Gold 21k",
  "18k": "Gold 18k",
  "14k": "Gold 14k",
  silver: "Silver",
  usd: "USD to ETB",
};

function toValues(from: PriceValues | null): PriceInputs {
  const text = (value: number | null | undefined) => (value != null && value > 0 ? String(value) : "");
  return {
    ...(Object.fromEntries(KARATS.map((karat) => [karat, text(from?.goldPricePerGramEtb[karat])])) as Record<(typeof KARATS)[number], string>),
    silver: text(from?.silverPricePerGramEtb),
    usd: text(from?.usdEtbRate),
  };
}

function percent(from: number, to: number) {
  const change = ((to - from) / from) * 100;
  return `${change > 0 ? "+" : ""}${change.toFixed(1)}%`;
}

/**
 * Reads the prices in use again before showing the form. The page's copy can be
 * hours old (the 06:00 fetch, another admin): the save sends that snapshot's id
 * as `version`, and the form compares against it.
 */
function ManualPricesDialog({
  reuse,
  nisab,
  onLoaded,
  onClose,
  onSaved,
}: {
  reuse: PriceValues | null;
  nisab: NisabRules | null;
  /** Updates the panel with the fresh read. */
  onLoaded: (status: PriceStatus) => void;
  onClose: () => void;
  onSaved: (manualUntil: string | null) => void;
}) {
  const fresh = useResource<PriceStatus>("/bff/zakat-admin/prices/status");
  const ready = fresh.data && !fresh.error && !fresh.isLoading ? fresh.data : null;

  useEffect(() => {
    if (ready) onLoaded(ready);
  }, [ready, onLoaded]);

  return (
    <Dialog open onOpenChange={(open) => (open ? null : onClose())}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {ready ? (
          <ManualPricesForm
            current={ready.latest}
            from={reuse ?? ready.latest}
            reusing={reuse !== null}
            automatic={ready.apiKeyConfigured}
            nisab={nisab}
            onReload={fresh.reload}
            onClose={onClose}
            onSaved={onSaved}
          />
        ) : (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-navy">Change prices</DialogTitle>
              <DialogDescription>
                {fresh.error
                  ? "The form opens only with the prices in use read just now, so no old prices are saved by mistake."
                  : "Loading the prices in use…"}
              </DialogDescription>
            </DialogHeader>
            {fresh.error ? <InlineAlert title="Couldn't load the prices in use">{fresh.error.message}</InlineAlert> : null}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {fresh.error ? (
                <Button type="button" onClick={fresh.reload}>
                  Try again
                </Button>
              ) : null}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ManualPricesForm({
  current,
  from,
  reusing,
  automatic,
  nisab,
  onReload,
  onClose,
  onSaved,
}: {
  current: PriceSnapshot | null;
  from: PriceValues | null;
  reusing: boolean;
  /** The daily fetch runs (a price API key is configured). */
  automatic: boolean;
  nisab: NisabRules | null;
  /** Reads the prices in use again; the form opens afresh with them. */
  onReload: () => void;
  onClose: () => void;
  onSaved: (manualUntil: string | null) => void;
}) {
  // Every field starts with the prices in use (read just now) or the history
  // row chosen. Only the prices that differ from the ones in use are sent.
  const [values, setValues] = useState<PriceInputs>(() => toValues(from));
  const [note, setNote] = useState(() =>
    reusing && from ? `Same prices as ${formatDateTime(from.pricesAsOf)}${from.manual ? "" : " (automatic)"}` : "",
  );
  const [manualUntil, setManualUntil] = useState("");
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  // zakat-engine asked for confirmLargeChange although the form saw no large move.
  const [serverAskedConfirm, setServerAskedConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [today] = useState(todayIso);

  const set = (field: PriceField, value: string) => setValues((prev) => ({ ...prev, [field]: value }));
  const gold24 = parsePrice(values["24k"]);
  const large = largeChanges(values, current);
  const warnings = large.map(
    ({ field, before, after }) =>
      `${FIELD_LABEL[field]} moves by ${percent(before, after)} (${rate.format(before)} → ${rate.format(after)}). Check it before saving.`,
  );
  const changedFields = changedPriceFields(values, current);
  const until = untilText(automatic, manualUntil || null);

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
    for (const field of PRICE_FIELDS) {
      const value = parsePrice(values[field]);
      // With no prices stored yet, 24k and silver are needed; otherwise an empty field keeps its price.
      if (value === null && !current && (field === "24k" || field === "silver")) problems[field] = "Enter a price.";
      else if (Number.isNaN(value)) problems[field] = "Enter a number above 0.";
      else if (field !== "usd" && tooManyDecimals(values[field])) problems[field] = "Use at most 2 decimals.";
    }
    for (const [karat, problem] of Object.entries(karatOrderProblems(values, current))) {
      problems[karat] ??= problem;
    }
    const untilProblem = manualUntilProblem(manualUntil, today);
    if (untilProblem) problems.manualUntil = untilProblem;
    // Prices typed by hand go live for every calculator user, so the reason is required (gap-r1-4-1).
    if (note.trim().length < 10) problems.note = "Say why the prices are set by hand and where they come from (at least 10 characters).";
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
    setConflict(false);
    setIsSaving(true);
    try {
      await apiClient("/bff/zakat-admin/prices", {
        method: "POST",
        body: JSON.stringify(
          priceUpdateBody(values, current, {
            note,
            version: snapshotVersion(current?.id),
            manualUntil: manualUntil || undefined,
            confirmLargeChange: large.length > 0 || serverAskedConfirm,
          }),
        ),
      });
      onSaved(manualUntil || null);
    } catch (saveError) {
      if (!(saveError instanceof ApiError)) {
        setError(errorMessage(saveError, "Couldn't save the prices"));
        return;
      }
      if (asksLargeChangeConfirm(saveError) && !serverAskedConfirm) {
        setServerAskedConfirm(true);
        setError(`${saveError.message} Check the prices, then choose Save anyway.`);
        setStep("confirm");
        return;
      }
      // A newer snapshot was stored after the form opened (the 06:00 fetch, another admin).
      if (isVersionConflict(saveError) || saveError.status === 409) {
        setConflict(true);
        setError(VERSION_CONFLICT_MESSAGE);
        return;
      }
      setError(saveError.message);
      const next: Record<string, string> = {};
      const items = saveError.errors.length > 0 ? saveError.errors : [{ field: saveError.message, message: saveError.message }];
      for (const item of items) {
        const field = priceErrorField(item.field);
        if (field && !next[field]) next[field] = item.message;
      }
      setFieldErrors(next);
      if (Object.keys(next).length > 0) setStep("edit");
    } finally {
      setIsSaving(false);
    }
  }

  const alert = error ? (
    <InlineAlert>
      {error}
      {conflict ? (
        <Button type="button" size="sm" variant="outline" className="mt-2 flex" onClick={onReload}>
          Reload prices
        </Button>
      ) : null}
    </InlineAlert>
  ) : null;

  return step === "edit" ? (
    <form onSubmit={review} className="space-y-4" noValidate>
      <DialogHeader>
        <DialogTitle className="text-navy">Change prices</DialogTitle>
        <DialogDescription>
          {reusing && from
            ? `Filled in with the prices of ${formatDateTime(from.pricesAsOf)}. `
            : current
              ? "Filled in with the prices in use. Change only what you need; the rest keeps its price. "
              : "No prices are stored yet. Enter 24k gold and silver; an empty karat is worked out from 24k. "}
          You check the result before it goes live.
        </DialogDescription>
      </DialogHeader>
      {alert}
      <fieldset className="space-y-2">
        <legend className="text-[13px] font-medium text-navy">Gold, ETB per gram</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {KARATS.map((karat) => (
            <PriceInput
              key={karat}
              id={`gold-${karat}`}
              label={karat}
              required={!current && karat === "24k"}
              emptyHint={current ? "Keeps its price" : karat === "24k" ? undefined : "Worked out from 24k"}
              value={values[karat]}
              before={currentPrice(current, karat)}
              error={fieldErrors[karat]}
              onChange={(value) => set(karat, value)}
            />
          ))}
        </div>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-black/60">
          A new 24k price doesn&apos;t change the other karats. Each karat must cost less than the one above it.
          <button
            type="button"
            onClick={workOutKarats}
            disabled={gold24 === null || Number.isNaN(gold24)}
            className="font-medium text-brand underline underline-offset-2 disabled:text-black/30 disabled:no-underline"
          >
            Work out 22k to 14k from 24k now
          </button>
        </p>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <PriceInput
          id="silver"
          label="Silver, ETB per gram"
          required={!current}
          emptyHint={current ? "Keeps its price" : undefined}
          value={values.silver}
          before={currentPrice(current, "silver")}
          error={fieldErrors.silver}
          onChange={(value) => set("silver", value)}
        />
        <PriceInput
          id="usd"
          label="USD to ETB"
          step="0.0001"
          emptyHint="Keeps the last rate"
          value={values.usd}
          before={currentPrice(current, "usd")}
          error={fieldErrors.usd}
          onChange={(value) => set("usd", value)}
        />
      </div>
      {automatic ? (
        <FormField
          label="Keep these prices until"
          htmlFor="price-manual-until"
          hint={`Optional. Empty: ${NEXT_FETCH}. A date skips the daily fetch until the end of that day, at most ${MANUAL_UNTIL_MAX_DAYS} days ahead.`}
          error={fieldErrors.manualUntil}
        >
          <Input
            id="price-manual-until"
            type="date"
            min={today}
            max={addDays(today, MANUAL_UNTIL_MAX_DAYS)}
            value={manualUntil}
            onChange={(event) => setManualUntil(event.target.value)}
            className="w-44"
          />
        </FormField>
      ) : null}
      <FormField
        label="Reason and source"
        htmlFor="price-note"
        required
        hint="Why the prices are set by hand, and where they come from"
        error={fieldErrors.note}
      >
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
        <DialogTitle className="text-navy">Check the new prices</DialogTitle>
        <DialogDescription>
          They go live in the public calculator as soon as you save, and stay {until}.
        </DialogDescription>
      </DialogHeader>
      {alert}
      <ChangeTable values={values} current={current} changed={changedFields} />
      <NisabChange values={values} current={current} nisab={nisab} />
      <p className="text-sm text-navy">
        <span className="text-black/60">Reason and source:</span> {note.trim()}
      </p>
      {warnings.length > 0 ? <WarningList warnings={warnings} /> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setStep("edit")} disabled={isSaving}>
          Back
        </Button>
        <Button type="button" onClick={() => void save()} loading={isSaving} loadingText="Saving…" disabled={conflict}>
          {warnings.length > 0 || serverAskedConfirm ? "Save anyway" : "Save prices"}
        </Button>
      </DialogFooter>
    </div>
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
  const next = parsePrice(value);
  const edited = next !== null && !Number.isNaN(next) && before != null && next !== before;
  return (
    <FormField
      label={label}
      htmlFor={id}
      required={required}
      error={error}
      hint={edited ? `Was ${rate.format(before)}` : value.trim() ? undefined : emptyHint}
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
        className={cn("tabular-nums", edited && "border-brand")}
      />
    </FormField>
  );
}

function WarningList({ warnings }: { warnings: string[] }) {
  return (
    <InlineAlert tone="warning" title="Large changes: check before saving">
      <ul className="list-disc space-y-1 pl-4">
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </InlineAlert>
  );
}

function ChangeTable({ values, current, changed }: { values: PriceInputs; current: PriceSnapshot | null; changed: PriceField[] }) {
  const gold24 = parsePrice(values["24k"]);
  const rows = PRICE_FIELDS.filter((field) => values[field].trim() || currentPrice(current, field) != null);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-black/[0.08] text-left text-xs text-black/60">
          <th className="py-1.5 font-medium">ETB per gram</th>
          <th className="py-1.5 text-right font-medium">Now</th>
          <th className="py-1.5 text-right font-medium">New</th>
          <th className="py-1.5 text-right font-medium">Change</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((field) => {
          const before = currentPrice(current, field);
          const typed = parsePrice(values[field]);
          const next = typed !== null && !Number.isNaN(typed) ? typed : null;
          // With no prices stored yet, an empty karat is worked out from 24k.
          const derived = !current && next === null && gold24 !== null && field.endsWith("k") ? (gold24 * parseInt(field, 10)) / 24 : null;
          const isChanged = changed.includes(field);
          return (
            <tr key={field} className={cn("border-b border-black/[0.04]", isChanged ? "text-navy" : "text-black/60")}>
              <td className={cn("py-1.5", isChanged && "font-medium")}>{field === "usd" ? "USD to ETB rate" : FIELD_LABEL[field]}</td>
              <td className="py-1.5 text-right tabular-nums">{before != null ? rate.format(before) : "—"}</td>
              <td className={cn("py-1.5 text-right tabular-nums", isChanged && "font-semibold")}>
                {isChanged && next !== null
                  ? rate.format(next)
                  : derived !== null
                    ? `≈ ${rate.format(derived)} (from 24k)`
                    : before != null
                      ? "Kept"
                      : "—"}
              </td>
              <td className="py-1.5 text-right tabular-nums">
                {!isChanged ? "No change" : before && next ? percent(before, next) : "New"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function NisabChange({ values, current, nisab }: { values: PriceInputs; current: PriceSnapshot | null; nisab: NisabRules | null }) {
  if (!nisab) return null;
  const gold = nisab.basis === "gold";
  const grams = gold ? nisab.goldGrams : nisab.silverGrams;
  const field: PriceField = gold ? "24k" : "silver";
  const typed = parsePrice(values[field]);
  const beforePrice = currentPrice(current, field);
  // An empty field keeps its price.
  const next = typed !== null && !Number.isNaN(typed) ? typed : beforePrice;
  if (next === null) return null;
  const after = grams * next;
  const before = beforePrice ? grams * beforePrice : null;
  return (
    <div className="rounded-lg border border-black/[0.08] bg-black/[0.015] px-4 py-3 text-sm">
      <p className="text-xs text-black/60">
        Nisab ({gold ? "gold" : "silver"} basis: {grams} g × {gold ? "gold 24k" : "silver"} price)
      </p>
      <p className="mt-0.5 font-semibold text-navy tabular-nums">
        {before !== null && Math.round(before) !== Math.round(after)
          ? `${formatEtb(Math.round(before))} → ${formatEtb(Math.round(after))} (${percent(before, after)})`
          : `${formatEtb(Math.round(after))} (no change)`}
      </p>
    </div>
  );
}
