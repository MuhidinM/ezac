"use client";

import { type FormEvent, useState } from "react";
import { Save } from "lucide-react";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { staffRef } from "@/components/zakat/staff-ref";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ANIMALS, type Animal, livestockUpdate } from "@/app/(portal)/dashboard/zakat/prices/price-update";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage, fieldErrorMap } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatEtb } from "@/lib/backoffice/format";
import { formatDateTime } from "@/lib/beneficiary/format";

/** One animal's price, as GET/PUT /admin/livestock-prices and its history return it. */
type LivestockPrice = {
  animal: Animal;
  unitPriceEtb: number;
  enteredBy: string | null;
  enteredByName: string | null;
  enteredAt: string;
};

const BASE = "/bff/zakat-admin/livestock-prices";
const HISTORY_LIMIT = 20;
const ANIMAL_LABEL = Object.fromEntries(ANIMALS.map(({ key, label }) => [key, label])) as Record<Animal, string>;

function byAnimal(prices: LivestockPrice[]): Partial<Record<Animal, LivestockPrice>> {
  return Object.fromEntries(prices.map((price) => [price.animal, price]));
}

/**
 * Average livestock prices. The calculator works out livestock zakat in
 * animals, not birr, so these prices change no one's amount: the public
 * "How it works" page lists them as a guide to each animal's value. They are
 * kept apart from the calculator rules, so activating a rules version never
 * changes them.
 */
export function LivestockPricesPanel() {
  const prices = useResource<LivestockPrice[]>(BASE);
  const [animal, setAnimal] = useState<Animal | "">("");
  const history = useResource<LivestockPrice[]>(
    `${BASE}/history?limit=${HISTORY_LIMIT}${animal ? `&animal=${animal}` : ""}`,
  );
  // Kept here: the form remounts after a save, so its own state is lost.
  const [notice, setNotice] = useState<string | null>(null);
  const rows = history.data ?? [];

  return (
    <Panel
      title="Livestock prices"
      description="Average price per animal. Livestock zakat is worked out in animals, so these prices don't change any amount; the public How it works page lists them as a guide to each animal's value. Calculator rules versions don't change them."
    >
      <div className="space-y-6">
        <ErrorAlert error={prices.error} onRetry={prices.reload} />
        {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
        {prices.data ? (
          <LivestockForm
            key={prices.data.map((price) => `${price.animal}:${price.unitPriceEtb}`).join(",")}
            current={byAnimal(prices.data)}
            onEdit={() => setNotice(null)}
            onSaved={(next, count) => {
              setNotice(`${count === 1 ? "Price" : "Prices"} saved. The public How it works page shows them now.`);
              prices.mutate(next);
              history.reload();
            }}
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
              aria-label="Animal"
              value={animal}
              onChange={(event) => setAnimal(event.target.value as Animal | "")}
              className="w-44"
            >
              <option value="">All animals</option>
              {ANIMALS.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <ErrorAlert error={history.error} onRetry={history.reload} />
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.015]">
                <TableHead>Set on</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.isLoading && rows.length === 0 ? (
                <TableSkeletonRows colSpan={4} />
              ) : rows.length === 0 ? (
                <TableMessageRow colSpan={4}>{history.error ? "Couldn't load the price history." : "No prices set yet."}</TableMessageRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={`${row.animal}-${row.enteredAt}`}>
                    <TableCell>{formatDateTime(row.enteredAt)}</TableCell>
                    <TableCell>{ANIMAL_LABEL[row.animal] ?? row.animal}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatEtb(row.unitPriceEtb)}</TableCell>
                    <TableCell className="text-sm text-black/60">{staffRef(row.enteredBy, row.enteredByName) ?? "—"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Panel>
  );
}

function LivestockForm({
  current,
  onEdit,
  onSaved,
}: {
  current: Partial<Record<Animal, LivestockPrice>>;
  onEdit: () => void;
  onSaved: (prices: LivestockPrice[], count: number) => void;
}) {
  const now = Object.fromEntries(ANIMALS.flatMap(({ key }) => (current[key] ? [[key, current[key].unitPriceEtb]] : []))) as Partial<
    Record<Animal, number>
  >;
  const [values, setValues] = useState<Record<Animal, string>>(
    () => Object.fromEntries(ANIMALS.map(({ key }) => [key, now[key] != null ? String(now[key]) : ""])) as Record<Animal, string>,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<Animal, string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const update = livestockUpdate(values, now);
  const changed = Object.keys(update.body).length;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    onEdit();
    setFieldErrors(update.errors);
    if (Object.keys(update.errors).length > 0 || changed === 0) return;
    setIsSaving(true);
    try {
      const saved = await apiClient<LivestockPrice[]>(BASE, { method: "PUT", body: JSON.stringify(update.body) });
      onSaved(saved, changed);
    } catch (saveError) {
      setMessage(errorMessage(saveError, "Couldn't save the prices"));
      if (saveError instanceof ApiError) {
        const map = fieldErrorMap(saveError.errors);
        setFieldErrors(Object.fromEntries(ANIMALS.flatMap(({ key }) => (map[key] ? [[key, map[key]]] : []))));
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {message ? <InlineAlert>{message}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ANIMALS.map(({ key, label }) => {
          const price = current[key];
          const by = price ? staffRef(price.enteredBy, price.enteredByName) : null;
          return (
            <FormField
              key={key}
              label={label}
              htmlFor={`livestock-${key}`}
              error={fieldErrors[key]}
              hint={
                price ? (
                  <>
                    Now {formatEtb(price.unitPriceEtb)}, set {formatDateTime(price.enteredAt)}
                    {by ? <> by {by}</> : null}
                  </>
                ) : (
                  "No price yet"
                )
              }
            >
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-xs text-black/60">ETB</span>
                <Input
                  id={`livestock-${key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  value={values[key]}
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
        })}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-black/60">Change only what you need; the other animals keep their price.</p>
        <Button type="submit" disabled={isSaving || (changed === 0 && Object.keys(update.errors).length === 0)}>
          <Save />
          {isSaving ? "Saving…" : "Save prices"}
        </Button>
      </div>
    </form>
  );
}
