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
 * Average livestock prices. The calculator works out livestock zakat in
 * animals, not birr, so these prices change no one's amount: the public
 * "How it works" page lists them as a guide to each animal's value. They live
 * in the versioned calculator rules, so saving creates a new version from the
 * active one with only these prices changed, and activates it.
 */
export function LivestockPricesPanel({ onChanged }: { onChanged?: () => void }) {
  const { data, error, mutate } = useResource<RulesVersion>("/bff/zakat-admin/calculator-configs/active");
  // Kept here: the form remounts on the new version, so its own state is lost.
  const [notice, setNotice] = useState<{ tone: "success" | "warning"; text: string } | null>(null);
  return (
    <Panel
      title="Livestock prices"
      description="Average price per animal. Livestock zakat is worked out in animals, so these prices don't change any amount; the public How it works page lists them as a guide to each animal's value. Saving publishes a new calculator rules version."
    >
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}
      {notice ? (
        <InlineAlert tone={notice.tone} className="mb-4">
          {notice.text}
        </InlineAlert>
      ) : null}
      {data ? (
        <LivestockForm
          key={data.version}
          active={data}
          onEdit={() => setNotice(null)}
          onSaved={(next) => {
            setNotice({ tone: "success", text: `Saved as calculator rules v${next.version}. The public How it works page shows the new prices now.` });
            mutate(next);
            onChanged?.();
          }}
          onOutdated={(latest) => {
            setNotice({
              tone: "warning",
              text: `Nothing was saved: calculator rules v${latest.version} (${latest.name}) was applied after this page loaded, and saving would have undone it. The form now shows v${latest.version}; enter the livestock prices again and save.`,
            });
            mutate(latest);
            onChanged?.();
          }}
        />
      ) : !error ? (
        <p className="text-sm text-black/45">Loading…</p>
      ) : null}
    </Panel>
  );
}

function LivestockForm({
  active,
  onEdit,
  onSaved,
  onOutdated,
}: {
  active: RulesVersion;
  onEdit: () => void;
  onSaved: (version: RulesVersion) => void;
  /** Another version became active after this form loaded; nothing was saved. */
  onOutdated: (latest: RulesVersion) => void;
}) {
  const current = active.rules.livestockAverageUnitPriceEtb;
  const [prices, setPrices] = useState<Record<Animal, string>>(() =>
    Object.fromEntries(ANIMALS.map(({ key }) => [key, current?.[key] != null ? String(current[key]) : ""])) as Record<Animal, string>,
  );
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const changed = ANIMALS.filter(({ key }) => prices[key].trim() !== "" && Number(prices[key]) !== current?.[key]);
  const valid = ANIMALS.every(({ key }) => Number(prices[key]) > 0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    onEdit();
    setIsSaving(true);
    const livestockAverageUnitPriceEtb = Object.fromEntries(ANIMALS.map(({ key }) => [key, Number(prices[key])]));
    const today = new Date().toLocaleDateString("en", { dateStyle: "medium" });
    try {
      // The new version copies every other rule from the active one. Read it again
      // now: a version applied since this page loaded (another tab or admin) would
      // otherwise be undone by a copy of the older rules.
      const latest = await apiClient<RulesVersion>("/bff/zakat-admin/calculator-configs/active");
      if (latest.version !== active.version) {
        onOutdated(latest);
        return;
      }
      const created = await apiClient<RulesVersion>("/bff/zakat-admin/calculator-configs", {
        method: "POST",
        body: JSON.stringify({
          name: (note.trim() || `Livestock prices ${today}`).slice(0, 160),
          rules: { ...latest.rules, livestockAverageUnitPriceEtb },
          activate: true,
        }),
      });
      onSaved(created);
    } catch (saveError) {
      const details = saveError instanceof ApiError ? saveError.errors.map((item) => item.message).join(" ") : "";
      setMessage([errorMessage(saveError, "Couldn't save the prices"), details].filter(Boolean).join(" "));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {message ? <InlineAlert>{message}</InlineAlert> : null}
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
              <span className="pointer-events-none absolute top-1/2 start-3 -translate-y-1/2 text-xs text-black/45">ETB</span>
              <Input
                id={`livestock-${key}`}
                type="number"
                min={1}
                step="1"
                value={prices[key]}
                onChange={(event) => {
                  onEdit();
                  setPrices((prev) => ({ ...prev, [key]: event.target.value }));
                }}
                required
                className="ps-11 tabular-nums"
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
