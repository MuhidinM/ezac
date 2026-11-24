"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { Save } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { staffRef } from "@/components/zakat/staff-ref";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ageOrderWarnings, asksLargeChangeConfirm, unitPriceUpdate } from "@/app/(portal)/dashboard/zakat/prices/price-update";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";

/** One price as the list and history endpoints return it, under the panel's own field names. */
export type UnitPrice = {
  key: string;
  /** null on a history row that withdrew the price. */
  price: number | null;
  enteredBy: string | null;
  enteredByName: string | null;
  enteredAt: string;
};

export type UnitPriceGroup = {
  title: string;
  description?: string;
  items: readonly { key: string; label: string }[];
  /** Shown folded until opened (long lists such as crops). */
  collapsible?: boolean;
};

export type UnitPricesSpec = {
  title: string;
  description: string;
  /** BFF path of the list, e.g. /bff/zakat-admin/livestock-prices. */
  base: string;
  /** Query parameter that narrows the history to one key. */
  historyParam: string;
  /** Reads one row of the backend's list or history. */
  readRow: (row: Record<string, unknown>) => UnitPrice | null;
  groups: readonly UnitPriceGroup[];
  /** "per animal", "per kg". */
  unit: string;
  max?: number;
  /** DELETE {base}/{key} stops publishing one price (crops). */
  withdraw?: boolean;
  /** Keys from youngest to oldest: an older animal priced below a younger one gets a warning (saving still works). */
  ageOrder?: readonly (readonly string[])[];
  /** What "the other keys keep their price" says, and what the history filter calls "all". */
  keepHint: string;
  allLabel: string;
  filterLabel: string;
};

const HISTORY_LIMIT = 20;
const rate = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });

function readRows(data: unknown, readRow: UnitPricesSpec["readRow"]): UnitPrice[] {
  if (!Array.isArray(data)) return [];
  return data.flatMap((row) => {
    const read = row && typeof row === "object" ? readRow(row as Record<string, unknown>) : null;
    return read ? [read] : [];
  });
}

function percent(before: number, after: number) {
  const change = ((after - before) / before) * 100;
  return `${change > 0 ? "+" : ""}${Math.round(change)}%`;
}

/**
 * Prices an ADMIN sets per unit (an animal, a kilogram of a crop): a form
 * grouped by kind, a check before any move above 15%, and the history.
 * Saving sends only what changed; everything else keeps its price.
 */
export function UnitPricesPanel({ spec }: { spec: UnitPricesSpec }) {
  const prices = useResource<unknown>(spec.base);
  const [filter, setFilter] = useState("");
  const history = useResource<unknown>(
    `${spec.base}/history?limit=${HISTORY_LIMIT}${filter ? `&${spec.historyParam}=${encodeURIComponent(filter)}` : ""}`,
  );
  // Kept here: the form remounts after a save, so its own state is lost.
  const [notice, setNotice] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);
  const labelOf = Object.fromEntries(spec.groups.flatMap((group) => group.items.map((item) => [item.key, item.label])));
  const current = prices.data !== undefined && prices.data !== null ? readRows(prices.data, spec.readRow) : null;
  const rows = readRows(history.data, spec.readRow);

  function saved(message: string) {
    setNotice(message);
    prices.reload();
    history.reload();
  }

  return (
    <Panel title={spec.title} description={spec.description}>
      <div className="space-y-6">
        <ErrorAlert error={prices.error} onRetry={prices.reload} />
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        {current ? (
          <UnitPricesForm
            key={current.map((price) => `${price.key}:${price.price}`).join(",")}
            spec={spec}
            current={Object.fromEntries(current.map((price) => [price.key, price]))}
            onEdit={() => setNotice(null)}
            onSaved={(count) => saved(`${count === 1 ? "Price" : "Prices"} saved. The public calculator uses them now.`)}
            onWithdraw={spec.withdraw ? setWithdrawing : undefined}
          />
        ) : !prices.error ? (
          <p className="text-sm text-black/60">Loading…</p>
        ) : null}

        <div className="space-y-3 border-t border-black/[0.06] pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-medium text-navy">Price history</h3>
              <p className="text-xs text-black/60">Newest first, the latest {HISTORY_LIMIT}.</p>
            </div>
            <NativeSelect
              aria-label={spec.filterLabel}
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="w-56"
            >
              <option value="">{spec.allLabel}</option>
              {spec.groups.map((group) => (
                <optgroup key={group.title} label={group.title}>
                  {group.items.map(({ key, label }) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </NativeSelect>
          </div>
          <ErrorAlert error={history.error} onRetry={history.reload} />
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.015]">
                <TableHead>Set on</TableHead>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.isLoading && rows.length === 0 ? (
                <TableSkeletonRows colSpan={4} />
              ) : rows.length === 0 ? (
                <TableMessageRow colSpan={4}>
                  {history.error ? "Couldn't load the price history." : "No prices set yet."}
                </TableMessageRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.key}-${row.enteredAt}`}>
                    <TableCell>{formatDateTime(row.enteredAt)}</TableCell>
                    <TableCell>{labelOf[row.key] ?? row.key}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.price === null ? <span className="text-black/60">Withdrawn</span> : formatEtb(row.price)}
                    </TableCell>
                    <TableCell className="text-sm text-black/60">{staffRef(row.enteredBy, row.enteredByName) ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {spec.withdraw ? (
        <ConfirmDialog
          open={withdrawing !== null}
          onOpenChange={(open) => {
            if (!open) setWithdrawing(null);
          }}
          title={`Stop publishing the ${withdrawing ? (labelOf[withdrawing] ?? withdrawing) : ""} price?`}
          description="The public calculator will stop offering a price for it; visitors can still type their own. The history keeps the old price."
          confirmLabel="Stop publishing"
          destructive
          onConfirm={async () => {
            if (!withdrawing) return;
            await apiClient(`${spec.base}/${encodeURIComponent(withdrawing)}`, { method: "DELETE" });
            const label = labelOf[withdrawing] ?? withdrawing;
            setWithdrawing(null);
            saved(`The ${label} price is no longer published.`);
          }}
        />
      ) : null}
    </Panel>
  );
}

function UnitPricesForm({
  spec,
  current,
  onEdit,
  onSaved,
  onWithdraw,
}: {
  spec: UnitPricesSpec;
  current: Record<string, UnitPrice>;
  onEdit: () => void;
  onSaved: (count: number) => void;
  onWithdraw?: (key: string) => void;
}) {
  const keys = spec.groups.flatMap((group) => group.items.map((item) => item.key));
  const labelOf = Object.fromEntries(spec.groups.flatMap((group) => group.items.map((item) => [item.key, item.label])));
  const now = Object.fromEntries(
    Object.values(current).flatMap((price) => (price.price !== null ? [[price.key, price.price]] : [])),
  ) as Record<string, number>;
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(keys.map((key) => [key, now[key] != null ? String(now[key]) : ""])),
  );
  const [step, setStep] = useState<"edit" | "confirm">("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // zakat-engine asked for confirmLargeChange although the form saw no large move.
  const [serverAskedConfirm, setServerAskedConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const update = unitPriceUpdate(keys, values, now, spec.max);
  const changed = Object.keys(update.body).length;
  const errorCount = Object.keys(update.errors).length;
  const orderWarnings = ageOrderWarnings(spec.ageOrder ?? [], { ...now, ...update.body }, labelOf);

  async function save() {
    setMessage(null);
    setIsSaving(true);
    try {
      const confirm = update.large.length > 0 || serverAskedConfirm;
      await apiClient<unknown>(spec.base, {
        method: "PUT",
        body: JSON.stringify({ ...update.body, ...(confirm ? { confirmLargeChange: true } : {}) }),
      });
      onSaved(changed);
    } catch (saveError) {
      if (saveError instanceof ApiError && asksLargeChangeConfirm(saveError) && !serverAskedConfirm) {
        setServerAskedConfirm(true);
        setMessage(`${saveError.message} Check the prices, then choose Save anyway.`);
        setStep("confirm");
        return;
      }
      setMessage(errorMessage(saveError, "Couldn't save the prices"));
      setStep("edit");
      if (saveError instanceof ApiError) {
        const map = fieldErrorMap(saveError.errors);
        setFieldErrors(Object.fromEntries(keys.flatMap((key) => (map[key] ? [[key, map[key]]] : []))));
      }
    } finally {
      setIsSaving(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    onEdit();
    setFieldErrors(update.errors as Record<string, string>);
    if (errorCount > 0 || changed === 0) return;
    if (update.large.length > 0) {
      setStep("confirm");
      return;
    }
    void save();
  }

  const field = (key: string, label: string) => {
    const price = current[key];
    const by = price ? staffRef(price.enteredBy, price.enteredByName) : null;
    let hint: ReactNode = "No price yet";
    if (price && price.price !== null) {
      hint = (
        <>
          Now {formatEtb(price.price)}, set {formatDateTime(price.enteredAt)}
          {by ? <> by {by}</> : null}
          {onWithdraw ? (
            <>
              {" · "}
              <button
                type="button"
                className="underline underline-offset-2 hover:text-navy"
                onClick={() => onWithdraw(key)}
              >
                Stop publishing
              </button>
            </>
          ) : null}
        </>
      );
    }
    return (
      <FormField key={key} label={label} htmlFor={`price-${key}`} error={fieldErrors[key]} hint={hint}>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-xs text-black/60">ETB</span>
          <Input
            id={`price-${key}`}
            type="number"
            inputMode="decimal"
            min={0}
            max={spec.max}
            step="0.01"
            value={values[key] ?? ""}
            disabled={step === "confirm"}
            onChange={(event) => {
              onEdit();
              setValues((prev) => ({ ...prev, [key]: event.target.value }));
            }}
            aria-invalid={fieldErrors[key] ? true : undefined}
            className="ps-11 tabular-nums"
          />
        </div>
      </FormField>
    );
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {message ? <InlineAlert>{message}</InlineAlert> : null}
      {spec.groups.map((group) => {
        const grid = (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {group.items.map((item) => field(item.key, item.label))}
          </div>
        );
        const priced = group.items.filter((item) => now[item.key] != null).length;
        if (group.collapsible) {
          const hasError = group.items.some((item) => fieldErrors[item.key]);
          return (
            <details key={group.title} open={hasError || undefined} className="rounded-lg border border-black/[0.06] p-3">
              <summary className="cursor-pointer text-sm font-medium text-navy">
                {group.title}{" "}
                <span className="font-normal text-black/60">
                  ({priced} of {group.items.length} priced)
                </span>
              </summary>
              <div className="mt-3">{grid}</div>
            </details>
          );
        }
        return (
          <fieldset key={group.title} className="space-y-3">
            <legend className="text-sm font-medium text-navy">{group.title}</legend>
            {group.description ? <p className="text-xs text-black/60">{group.description}</p> : null}
            {grid}
          </fieldset>
        );
      })}

      {orderWarnings.length > 0 ? (
        <InlineAlert tone="warning" title="Check the ages">
          <ul className="list-disc space-y-1 pl-4">
            {orderWarnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}

      {step === "confirm" && update.large.length > 0 ? (
        <InlineAlert tone="warning" title="Large changes: check before saving">
          <ul className="list-disc space-y-1 pl-4">
            {update.large.map(({ key, before, after }) => (
              <li key={key}>
                {labelOf[key] ?? key} moves by {percent(before, after)} ({rate.format(before)} → {rate.format(after)}).
              </li>
            ))}
          </ul>
        </InlineAlert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/60">
          {spec.keepHint} Prices are ETB {spec.unit}.
        </p>
        {step === "confirm" ? (
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep("edit")} disabled={isSaving}>
              Go back
            </Button>
            <Button type="button" onClick={() => void save()} disabled={isSaving}>
              <Save />
              {isSaving ? "Saving…" : "Save anyway"}
            </Button>
          </div>
        ) : (
          <Button type="submit" disabled={isSaving || (changed === 0 && errorCount === 0)}>
            <Save />
            {isSaving ? "Saving…" : "Save prices"}
          </Button>
        )}
      </div>
    </form>
  );
}
