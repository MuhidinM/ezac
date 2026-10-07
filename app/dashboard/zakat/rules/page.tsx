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

const BASE = "/api/zakat-admin/calculator-configs";

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
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activateTarget, setActivateTarget] = useState<RulesVersion | null>(null);

  const list = versions.data ?? [];
  const active = list.find((item) => item.active) ?? null;
  const current = list.find((item) => item.version === selected) ?? active ?? list[0] ?? null;
  const editing = draft !== null;

  function startDraft(from: RulesVersion) {
    setDraft(structuredClone(from.rules));
    setName("");
    setActivate(false);
    setSaveError(null);
    setSaveErrors([]);
    setNotice(null);
  }

  function cancelDraft() {
    setDraft(null);
    setSaveError(null);
    setSaveErrors([]);
  }

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    setSaveError(null);
    setSaveErrors([]);
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
      setSaveError(errorMessage(error, "Couldn't save the rules"));
      if (error instanceof ApiError) setSaveErrors((error.errors ?? []).map((item) => item.message).filter(Boolean));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <PageHeader
        title="Calculator rules"
        description="Nisab basis, zakat rates and livestock tables behind the public calculator. A version is never edited: save a new one, then activate it."
      />

      {versions.error ? <InlineAlert>{versions.error.message}</InlineAlert> : null}
      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <Panel title="Versions" description="Newest first" flush>
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
                      {item.active ? <Badge tone="success">Active</Badge> : null}
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
                  <SchemaForm fields={schema.data?.fields ?? []} value={draft} onChange={setDraft} />
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
              description={`Created ${formatDateTime(current.createdAt)}${current.active ? " · used by the public calculator" : ""}`}
              actions={
                <>
                  {!current.active ? (
                    <Button size="sm" variant="outline" onClick={() => setActivateTarget(current)}>
                      <CheckCircle2 />
                      Activate
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

          {schema.data?.rules.length ? (
            <Panel title="Checks applied on save">
              <ul className="list-disc space-y-1 pl-5 text-sm text-black/65">
                {schema.data.rules.map((rule) => (
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
          setNotice(`v${activateTarget.version} is now active.`);
          versions.reload();
        }}
      />
    </section>
  );
}
