"use client";

import { useMemo, useState } from "react";
import { FlaskConical, Rocket, Save, Trash2 } from "lucide-react";

import { RiskBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RiskCategory } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import {
  changedPaths,
  getPath,
  ruleText,
  setPath,
  type Band,
  type SchemaField,
  type ScoringConfigVersion,
  type ScoringPreview,
  type ScoringSchema,
} from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

function humanize(key: string) {
  return key.replace(/[_-]+/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

function toNumber(raw: string) {
  if (raw.trim() === "") return 0;
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

/** Edit a DRAFT: one input per schema field, then save, preview, activate. */
export function ConfigEditor({
  draft,
  baseConfig,
  schema,
  apiBase,
  onSaved,
  onDeleted,
  onActivated,
}: {
  draft: ScoringConfigVersion;
  /** Config of the version the draft was based on, to count changes. */
  baseConfig: Record<string, unknown> | null;
  schema: ScoringSchema;
  apiBase: string;
  onSaved: (version: ScoringConfigVersion) => void;
  onDeleted: () => void;
  onActivated: () => void;
}) {
  const [name, setName] = useState(draft.name ?? "");
  const [config, setConfig] = useState<Record<string, unknown>>(draft.config);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [preview, setPreview] = useState<ScoringPreview | null>(null);
  const [activateOpen, setActivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

  const versionPath = `${apiBase}/${draft.version}`;
  const isDirty = name !== (draft.name ?? "") || JSON.stringify(config) !== JSON.stringify(draft.config);
  const changes = baseConfig ? changedPaths(schema.fields, baseConfig, config) : [];

  const sections = useMemo(() => {
    const groups = new Map<string, SchemaField[]>();
    for (const field of schema.fields) {
      groups.set(field.section, [...(groups.get(field.section) ?? []), field]);
    }
    return [...groups.entries()];
  }, [schema.fields]);

  function update(path: string, value: unknown) {
    setConfig((prev) => setPath(prev, path, value));
    setPreview(null);
  }

  async function save(): Promise<boolean> {
    setIsSaving(true);
    setMessage(null);
    try {
      const saved = await apiClient<ScoringConfigVersion>(versionPath, {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() || undefined, config }),
      });
      onSaved(saved);
      setMessage({ tone: "success", text: "Draft saved." });
      return true;
    } catch (saveError) {
      setMessage({ tone: "error", text: errorMessage(saveError, "Couldn't save the draft") });
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function runPreview() {
    if (isDirty && !(await save())) return;
    setIsPreviewing(true);
    setMessage(null);
    try {
      setPreview(
        await apiClient<ScoringPreview>(`${versionPath}/preview`, {
          method: "POST",
          body: JSON.stringify({ sample: 50 }),
        }),
      );
    } catch (previewError) {
      setMessage({ tone: "error", text: errorMessage(previewError, "Preview failed") });
    } finally {
      setIsPreviewing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Panel
        title={
          <span className="flex items-center gap-2">
            Draft v{draft.version}
            <Badge tone="warning">Draft</Badge>
            {changes.length > 0 ? (
              <Badge tone="info">
                {changes.length} change{changes.length === 1 ? "" : "s"} from v{draft.basedOnVersion}
              </Badge>
            ) : null}
          </span>
        }
        description={`Based on v${draft.basedOnVersion ?? "—"}. Only numbers can change; activation applies to new submissions only.`}
        actions={
          <>
            <Button variant="ghost" size="sm" className="text-rose-700 hover:text-rose-800" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => void save()} disabled={!isDirty || isSaving}>
              <Save />
              {isSaving ? "Saving…" : isDirty ? "Save" : "Saved"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void runPreview()} disabled={isPreviewing}>
              <FlaskConical />
              {isPreviewing ? "Running…" : "Preview impact"}
            </Button>
            <Button size="sm" onClick={() => setActivateOpen(true)} disabled={isDirty}>
              <Rocket />
              Activate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {message ? <InlineAlert tone={message.tone}>{message.text}</InlineAlert> : null}
          {isDirty ? (
            <p className="text-xs text-black/50">Save the draft before activating it.</p>
          ) : null}
          <div className="max-w-md">
            <FormField label="Version name" htmlFor="config-name">
              <Input id="config-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Stricter high band" />
            </FormField>
          </div>
        </div>
      </Panel>

      {preview ? <PreviewResults preview={preview} /> : null}

      {sections.map(([section, fields]) => (
        <Panel key={section} title={humanize(section)}>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map((field) => {
              const value = getPath(config, field.path);
              const changed = baseConfig
                ? JSON.stringify(getPath(baseConfig, field.path)) !== JSON.stringify(value)
                : false;
              if (field.type === "bands") {
                return (
                  <BandsInput
                    key={field.path}
                    field={field}
                    value={Array.isArray(value) ? (value as Band[]) : []}
                    changed={changed}
                    onChange={(next) => update(field.path, next)}
                  />
                );
              }
              return (
                <FormField
                  key={field.path}
                  label={
                    <span className="flex items-center gap-1.5">
                      {field.label}
                      {changed ? <span className="size-1.5 rounded-full bg-sky-500" title="Changed" /> : null}
                    </span>
                  }
                  htmlFor={field.path}
                  hint={<code className="text-[11px]">{field.path}</code>}
                >
                  <Input
                    id={field.path}
                    type="number"
                    min={field.min ?? 0}
                    step={field.type === "integer" ? 1 : "any"}
                    value={typeof value === "number" ? value : ""}
                    onChange={(event) => update(field.path, toNumber(event.target.value))}
                    className={cn("bg-white tabular-nums", changed && "border-sky-300")}
                  />
                </FormField>
              );
            })}
          </div>
        </Panel>
      ))}

      {schema.rules.length > 0 ? (
        <Panel title="Validation rules" description="Checked by the server when you save.">
          <ul className="list-disc space-y-1 pl-5 text-sm text-black/65">
            {schema.rules.map((rule, index) => (
              <li key={index}>{ruleText(rule)}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title={`Activate v${draft.version}?`}
        description="It becomes the active configuration for every new submission. Existing scores keep the version they were calculated with. To go back, activate an older version."
        confirmLabel="Activate"
        confirmDisabled={!reason.trim()}
        onConfirm={async () => {
          await apiClient(`${versionPath}/activate`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) });
          setReason("");
          onActivated();
        }}
      >
        <FormField label="Reason" htmlFor="activate-reason" required hint="Recorded with the version, e.g. the committee decision number">
          <Textarea id="activate-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
        </FormField>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete draft v${draft.version}?`}
        description="The draft and its changes are removed. Published versions are not affected."
        confirmLabel="Delete draft"
        destructive
        onConfirm={async () => {
          await apiClient(versionPath, { method: "DELETE" });
          onDeleted();
        }}
      />
    </div>
  );
}

function BandsInput({
  field,
  value,
  changed,
  onChange,
}: {
  field: SchemaField;
  value: Band[];
  changed: boolean;
  onChange: (value: Band[]) => void;
}) {
  function set(index: number, position: 0 | 1, raw: string) {
    onChange(value.map((band, i) => (i === index ? (position === 0 ? [toNumber(raw), band[1]] : [band[0], toNumber(raw)]) : band)));
  }

  return (
    <div className={cn("rounded-lg border p-3 sm:col-span-2 lg:col-span-3", changed ? "border-sky-300" : "border-black/[0.08]")}>
      <p className="text-[13px] font-medium text-[#001539]">{field.label}</p>
      <p className="text-[11px] text-black/45">
        <code>{field.path}</code> · bound → points
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {value.map((band, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <Input
              type="number"
              step="any"
              min={0}
              aria-label={`${field.label} band ${index + 1} bound`}
              value={band[0]}
              onChange={(event) => set(index, 0, event.target.value)}
              className="bg-white tabular-nums"
            />
            <span className="text-black/35">→</span>
            <Input
              type="number"
              step={1}
              min={0}
              aria-label={`${field.label} band ${index + 1} points`}
              value={band[1]}
              onChange={(event) => set(index, 1, event.target.value)}
              className="w-20 bg-white tabular-nums"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewResults({ preview }: { preview: ScoringPreview }) {
  const transitions = Object.entries(preview.transitions ?? {});
  return (
    <Panel
      title="Impact preview"
      description={`Re-scored the ${preview.sampled} most recently scored assessments with this draft. Nothing was saved.`}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Risk band changes" value={`${preview.riskChanged} of ${preview.sampled}`} />
          <Stat label="Average score now" value={preview.averageOldScore?.toFixed(1) ?? "—"} />
          <Stat label="Average with this draft" value={preview.averageNewScore?.toFixed(1) ?? "—"} />
        </div>
        {transitions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {transitions.map(([key, count]) => (
              <Badge key={key} tone="info">
                {key.replace("->", " → ")}
                <span className="tabular-nums">{count}</span>
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="max-h-80 overflow-auto rounded-lg border border-black/[0.06]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#fafafa] text-left text-xs text-black/50">
              <tr>
                <th className="px-3 py-2 font-medium">Assessment</th>
                <th className="px-3 py-2 text-right font-medium">Now</th>
                <th className="px-3 py-2 text-right font-medium">Draft</th>
                <th className="px-3 py-2 font-medium">Risk</th>
              </tr>
            </thead>
            <tbody>
              {[...preview.items]
                .sort((a, b) => Number(b.riskChanged) - Number(a.riskChanged))
                .map((item) => (
                  <tr key={item.assessmentId} className={cn("border-t border-black/[0.04]", item.riskChanged && "bg-sky-50/60")}>
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#001539]">{item.beneficiaryName ?? `#${item.assessmentId}`}</p>
                      <p className="text-xs text-black/45">{item.assessmentNumber ?? ""}</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{item.oldScore}</td>
                    <td className="px-3 py-2 text-right font-medium text-[#001539] tabular-nums">{item.newScore}</td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-1.5">
                        <RiskBadge risk={item.oldRisk as RiskCategory} />
                        {item.riskChanged ? (
                          <>
                            <span className="text-black/35">→</span>
                            <RiskBadge risk={item.newRisk as RiskCategory} />
                          </>
                        ) : null}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/[0.06] p-4">
      <p className="text-xs font-medium text-black/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#001539] tabular-nums">{value}</p>
    </div>
  );
}
