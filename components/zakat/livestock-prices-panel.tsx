"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { Save } from "lucide-react";

import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";

type RulesVersion = {
  version: number;
  name: string;
  active: boolean;
  createdAt: string;
  rules: Record<string, unknown> & { livestockAverageUnitPriceEtb?: Record<Animal, number> };
};

const ANIMALS = [
  { key: "sheep", label: "Sheep" },
  { key: "goat", label: "Goat" },
  { key: "cattle", label: "Cattle (one head)" },
  { key: "camel", label: "Camel" },
] as const;

type Animal = (typeof ANIMALS)[number]["key"];

const etb = new Intl.NumberFormat("en-ET", { maximumFractionDigits: 0 });

/**
 * Average livestock prices the calculator uses to value animals due as zakat.
 * They live in the versioned calculator rules, so saving creates a new version
 * from the active one with only these prices changed, and activates it.
 */
export function LivestockPricesPanel({ onChanged }: { onChanged?: () => void }) {
  const { data, error, mutate } = useResource<RulesVersion>("/api/zakat-admin/calculator-configs/active");
  return (
    <Panel
      title="Livestock prices"
      description="Average price per animal, used by the calculator to show the value of livestock zakat. Saving publishes a new calculator rules version."
    >
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}
      {data ? (
        <LivestockForm
          key={data.version}
          active={data}
          onSaved={(next) => {
            mutate(next);
            onChanged?.();
          }}
        />
      ) : !error ? (
        <p className="text-sm text-black/45">Loading…</p>
      ) : null}
    </Panel>
  );
}

function LivestockForm({ active, onSaved }: { active: RulesVersion; onSaved: (version: RulesVersion) => void }) {
  const current = active.rules.livestockAverageUnitPriceEtb;
  const [prices, setPrices] = useState<Record<Animal, string>>(() =>
    Object.fromEntries(ANIMALS.map(({ key }) => [key, current?.[key] != null ? String(current[key]) : ""])) as Record<Animal, string>,
  );
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const changed = ANIMALS.filter(({ key }) => prices[key].trim() !== "" && Number(prices[key]) !== current?.[key]);
  const valid = ANIMALS.every(({ key }) => Number(prices[key]) > 0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSaving(true);
    const livestockAverageUnitPriceEtb = Object.fromEntries(ANIMALS.map(({ key }) => [key, Number(prices[key])]));
    const today = new Date().toLocaleDateString("en", { dateStyle: "medium" });
    try {
      const created = await apiClient<RulesVersion>("/api/zakat-admin/calculator-configs", {
        method: "POST",
        body: JSON.stringify({
          name: (note.trim() || `Livestock prices ${today}`).slice(0, 160),
          rules: { ...active.rules, livestockAverageUnitPriceEtb },
          activate: true,
        }),
      });
      setMessage({ tone: "success", text: `Saved as calculator rules v${created.version}; the public calculator uses it now.` });
      setNote("");
      onSaved(created);
    } catch (saveError) {
      const details = saveError instanceof ApiError ? saveError.errors.map((item) => item.message).join(" ") : "";
      setMessage({ tone: "error", text: [errorMessage(saveError, "Couldn't save the prices"), details].filter(Boolean).join(" ") });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message ? <InlineAlert tone={message.tone}>{message.text}</InlineAlert> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ANIMALS.map(({ key, label }) => (
          <FormField
            key={key}
            label={label}
            htmlFor={`livestock-${key}`}
            required
            hint={current?.[key] != null ? `Now ETB ${etb.format(current[key])}` : undefined}
          >
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs text-black/45">ETB</span>
              <Input
                id={`livestock-${key}`}
                type="number"
                min={1}
                step="1"
                value={prices[key]}
                onChange={(event) => setPrices((prev) => ({ ...prev, [key]: event.target.value }))}
                required
                className="pl-11 tabular-nums"
              />
            </div>
          </FormField>
        ))}
      </div>
      <FormField label="Note" htmlFor="livestock-note" hint="Optional; becomes the rules version name">
        <Input id="livestock-note" maxLength={160} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Market survey, Meskerem 2019" />
      </FormField>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/[0.06] pt-4">
        <p className="text-xs text-black/45">
          From rules v{active.version} ({active.name}), {formatDateTime(active.createdAt)}.{" "}
          <Link href="/dashboard/zakat/rules" className="underline underline-offset-2">
            All calculator rules
          </Link>
        </p>
        <Button type="submit" disabled={isSaving || !valid || changed.length === 0}>
          <Save />
          {isSaving ? "Saving…" : "Save and apply"}
        </Button>
      </div>
    </form>
  );
}
