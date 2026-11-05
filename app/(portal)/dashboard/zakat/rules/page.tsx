"use client";

import { type FormEvent, useState } from "react";
import { CheckCircle2, CopyPlus, X } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { SchemaForm, type SchemaField } from "@/components/zakat/schema-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { getPath } from "@/lib/backoffice/scoring-config";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

type RulesVersion = {
  version: number;
  name: string;
  active: boolean;
  createdBy: string | null;
  createdAt: string;
  rules: Record<string, unknown>;
};

type RulesSchema = { fields: SchemaField[]; rules: string[] };

const BASE = "/bff/zakat-admin/calculator-configs";
const LIVESTOCK_PRICES = "livestockAverageUnitPriceEtb";

/** Versions zakat-engine created itself; the newest of them is the default. */
const isBuiltIn = (version: RulesVersion) => version.createdBy === "system";

/**
 * Plain wording for the checks zakat-engine lists with its schema. Unknown
 * checks are shown as sent; the "never edited" one repeats the page header.
 */
const CHECK_WORDING: [RegExp, string | null][] = [
  [/^Grams, kilograms and the hawl/i, "Grams, kilograms and the hawl must be above 0. Average animal prices can be 0 or more."],
  [/^Livestock tables: each row/i, "Livestock tables: each row's maximum is at least its minimum, and each row starts above the previous row's maximum."],
  [/^Only the last row of a table/i, "Only the last row of a table may leave the maximum empty (“and above”). Every other row needs what is due."],
  [/^livestockAverageUnitPriceEtb/i, "Average prices are needed for sheep, goats, cattle and camels."],
  [/^Versions are never edited/i, null],
];

function checkText(rule: string) {
  const match = CHECK_WORDING.find(([pattern]) => pattern.test(rule));
  return match ? match[1] : rule;
}

/** "must not be null" from the server reads as "required". */
function plainMessage(message: string) {
  return /^must not be (null|empty|blank)$/i.test(message.trim()) ? "required" : message;
}

/**
 * Where a server error points, in the form's own words. Paths look like
 * "rules.wealth.rate" or "rules.livestock.sheepGoats[2].max".
 */
function describePath(path: string, fields: SchemaField[]): { key: string | null; label: string | null } {
  const clean = path.replace(/^rules\./, "");
  const exact = fields.find((field) => field.path === clean);
  if (exact) return { key: exact.path, label: exact.label };
  for (const field of fields) {
    if (field.type !== "table" || !clean.startsWith(field.path)) continue;
    const rest = clean.slice(field.path.length);
    if (rest === "") return { key: field.path, label: field.label };
    const row = /^(?:\[(\d+)\]|\.(\d+))\.?(.*)$/.exec(rest);
    if (!row) continue;
    const column = row[3] ? describePath(row[3], field.columns ?? []).label : null;
    return {
      key: field.path,
      label: [field.label, `row ${Number(row[1] ?? row[2]) + 1}`, column].filter(Boolean).join(", "),
    };
  }
  const parent = fields
    .filter((field) => clean.startsWith(`${field.path}.`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  if (parent) return { key: parent.path, label: parent.label };
  return { key: null, label: null };
}

function showValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "empty";
  if (typeof value === "number") return value.toLocaleString("en");
  if (typeof value === "string") return value.replace(/_/g, " ");
  return JSON.stringify(value);
}

/** What `to` changes compared with `from`, one line per changed field. */
function ruleChanges(from: Record<string, unknown>, to: Record<string, unknown>, fields: SchemaField[]) {
  return fields.flatMap((field) => {
    const before = getPath(from, field.path);
    const after = getPath(to, field.path);
    if (JSON.stringify(before ?? null) === JSON.stringify(after ?? null)) return [];
    return [
      {
        path: field.path,
        text: field.type === "table" ? `${field.label}: rows changed` : `${field.label}: ${showValue(before)} → ${showValue(after)}`,
      },
    ];
  });
}

function ChangeSummary({ changes, livestockNote }: { changes: { path: string; text: string }[]; livestockNote: string }) {
  if (changes.length === 0) return <p className="text-sm text-black/55">Same rules as the active version.</p>;
  const livestock = changes.some((change) => change.path.startsWith(`${LIVESTOCK_PRICES}.`));
  return (
    <div className="space-y-3">
      {livestock ? <InlineAlert tone="warning">{livestockNote}</InlineAlert> : null}
      <div>
        <p className="mb-1 text-xs font-medium text-black/55">Compared with the active version</p>
        <ul className="max-h-56 list-disc space-y-0.5 overflow-y-auto pl-5 text-sm text-[#001539]">
          {changes.map((change) => (
            <li key={change.path}>{change.text}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function CalculatorRulesPage() {
  return (
    <RequireRole audience={["admin"]}>
      <CalculatorRules />
    </RequireRole>
  );
}

function CalculatorRules() {
  const versions = useResource<RulesVersion[]>(BASE);
  const schema = useResource<RulesSchema>(`${BASE}/schema`);
  const [selected, setSelected] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [name, setName] = useState("");
  const [activate, setActivate] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<RulesVersion | null>(null);

  const list = versions.data ?? [];
  const fields = schema.data?.fields ?? [];
  const active = list.find((item) => item.active) ?? null;
  const current = list.find((item) => item.version === selected) ?? active ?? list[0] ?? null;
  const editing = draft !== null;
  const defaultVersion = list.filter(isBuiltIn).sort((a, b) => b.version - a.version)[0] ?? null;
  const checks = (schema.data?.rules ?? []).map(checkText).filter((rule): rule is string => Boolean(rule));

  function clearErrors() {
    setSaveError(null);
    setSaveErrors([]);
    setFieldErrors({});
  }

  function startDraft(from: RulesVersion) {
    setDraft(structuredClone(from.rules));
    setName("");
    setActivate(false);
    clearErrors();
    setNotice(null);
  }

  function cancelDraft() {
    setDraft(null);
    clearErrors();
  }

  function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    // Going live straight away gets the same check as the Activate button.
    if (activate) {
      setConfirmSave(true);
      return;
    }
    void save();
  }

  async function save() {
    if (!draft) return;
    clearErrors();
    setIsSaving(true);
    try {
      const created = await apiClient<RulesVersion>(BASE, {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), rules: draft, activate }),
      });
      setDraft(null);
      setSelected(created.version);
      setNotice(
        created.active
          ? `Version ${created.version} saved and active. The public calculator uses it now.`
          : `Version ${created.version} saved. Activate it when it's ready.`,
      );
      versions.reload();
    } catch (error) {
      setSaveError(
        error instanceof ApiError && error.errors.length > 0
          ? "Some values need fixing. Correct them, then save again."
          : errorMessage(error, "Couldn't save the rules"),
      );
      if (error instanceof ApiError) {
        const lines: string[] = [];
        const byField: Record<string, string> = {};
        for (const item of error.errors ?? []) {
          const message = plainMessage(item.message);
          const { key, label } = describePath(item.field, fields);
          lines.push(label ? `${label}: ${message}` : message);
          // A table shows its row and column with the message.
          const own = fields.find((field) => field.path === key)?.label;
          if (key && !byField[key]) byField[key] = label && label !== own ? `${label}: ${message}` : message;
        }
        setSaveErrors([...new Set(lines.filter(Boolean))]);
        setFieldErrors(byField);
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Calculator rules"
        description="Nisab basis, zakat rates, livestock tables and average livestock prices behind the public calculator. A version is never edited: save a new one, then activate it."
      />

      {versions.error ? <InlineAlert>{versions.error.message}</InlineAlert> : null}
      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel
          title="Versions"
          description={defaultVersion ? "Newest first. To undo changes, activate the default version or an earlier one." : "Newest first"}
          flush
        >
          {versions.isLoading && list.length === 0 ? (
            <p className="px-5 py-4 text-sm text-black/45">Loading…</p>
          ) : list.length === 0 ? (
            <p className="px-5 py-4 text-sm text-black/45">No versions yet.</p>
          ) : (
            <ul className="divide-y divide-black/[0.05]">
              {list.map((item) => {
                const isCurrent = !editing && current?.version === item.version;
                return (
                  <li key={item.version}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(item.version);
                        cancelDraft();
                      }}
                      aria-current={isCurrent ? "true" : undefined}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 px-5 py-3 text-left transition hover:bg-black/[0.02]",
                        isCurrent && "bg-[#007050]/[0.05] shadow-[inset_2px_0_0_#007050]",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-[#001539]">
                          v{item.version} · {item.name}
                        </span>
                        <span className="block text-xs text-black/50">{formatDateTime(item.createdAt)}</span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        {item.active ? <Badge tone="success">Active</Badge> : null}
                        {item.version === defaultVersion?.version ? (
                          <Badge tone="info">Default</Badge>
                        ) : isBuiltIn(item) ? (
                          <Badge tone="neutral">Built-in</Badge>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          {schema.error ? <InlineAlert>{schema.error.message}</InlineAlert> : null}

          {editing ? (
            <form onSubmit={onSave}>
              <Panel
                title="New version"
                description={`Starting from v${current?.version ?? "—"}. Saving creates a new version; existing ones stay unchanged.`}
                actions={
                  <Button type="button" size="sm" variant="ghost" onClick={cancelDraft}>
                    <X />
                    Cancel
                  </Button>
                }
              >
                <div className="space-y-6">
                  {saveError ? (
                    <InlineAlert title={saveError}>
                      {saveErrors.length > 0 ? (
                        <ul className="list-disc space-y-0.5 pl-4">
                          {saveErrors.map((message) => (
                            <li key={message}>{message}</li>
                          ))}
                        </ul>
                      ) : null}
                    </InlineAlert>
                  ) : null}
                  <SchemaForm fields={fields} value={draft} onChange={setDraft} errors={fieldErrors} />
                  <div className="grid gap-4 border-t border-black/[0.06] pt-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <FormField label="Version name" htmlFor="rules-name" required hint="What changed, e.g. “Silver basis”">
                      <Input id="rules-name" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} required />
                    </FormField>
                    <label className="flex h-9 items-center gap-2 text-sm text-[#001539]">
                      <input
                        type="checkbox"
                        checked={activate}
                        onChange={(e) => setActivate(e.target.checked)}
                        className="size-4 accent-[#007050]"
                      />
                      Activate now
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={cancelDraft}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving || !name.trim()}>
                      {isSaving ? "Saving…" : activate ? "Save and activate" : "Save version"}
                    </Button>
                  </div>
                </div>
              </Panel>
            </form>
          ) : current ? (
            <Panel
              title={`v${current.version} · ${current.name}`}
              description={[
                `Created ${formatDateTime(current.createdAt)}`,
                current.version === defaultVersion?.version ? "the default rules, set up with the system" : null,
                current.active ? "used by the public calculator" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              actions={
                <>
                  {!current.active ? (
                    <Button size="sm" variant="outline" onClick={() => setActivateTarget(current)}>
                      <CheckCircle2 />
                      {current.version === defaultVersion?.version ? "Activate default rules" : "Activate"}
                    </Button>
                  ) : null}
                  <Button size="sm" onClick={() => startDraft(current)} disabled={!schema.data}>
                    <CopyPlus />
                    Edit as new version
                  </Button>
                </>
              }
            >
              {schema.data ? (
                <SchemaForm fields={schema.data.fields} value={current.rules} onChange={() => undefined} disabled />
              ) : schema.isLoading ? (
                <p className="text-sm text-black/45">Loading form…</p>
              ) : null}
            </Panel>
          ) : null}

          {checks.length ? (
            <Panel title="Checks applied on save">
              <ul className="list-disc space-y-1 pl-5 text-sm text-black/65">
                {checks.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={activateTarget !== null}
        onOpenChange={(open) => !open && setActivateTarget(null)}
        title={`Activate v${activateTarget?.version ?? ""}?`}
        description={`The public calculator switches to “${activateTarget?.name ?? ""}” straight away${active ? `, replacing v${active.version}` : ""}.`}
        confirmLabel="Activate"
        onConfirm={async () => {
          if (!activateTarget) return;
          await apiClient(`${BASE}/${activateTarget.version}/activate`, { method: "POST" });
          setNotice(`v${activateTarget.version} is now active. The public calculator uses it now.`);
          versions.reload();
        }}
      >
        {activateTarget && active && fields.length ? (
          <ChangeSummary
            changes={ruleChanges(active.rules, activateTarget.rules, fields)}
            livestockNote="This version has other average livestock prices. Activating it replaces the prices set on Prices & nisab."
          />
        ) : null}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Save and activate?"
        description="The public calculator switches to this new version straight away."
        confirmLabel="Save and activate"
        onConfirm={save}
      >
        {draft && active && fields.length ? (
          <ChangeSummary
            changes={ruleChanges(active.rules, draft, fields)}
            livestockNote="The average livestock prices change too. They replace the prices set on Prices & nisab."
          />
        ) : null}
      </ConfirmDialog>
    </section>
  );
}
