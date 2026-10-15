"use client";

import { useState } from "react";
import { Check, FlaskConical, Rocket, Save, Trash2 } from "lucide-react";

import { RiskBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { ScoringDesigner, validateScoring } from "@/components/scoring/scoring-designer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RiskCategory } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import {
  changedPaths,
  ruleText,
  setPath,
  type ScoringConfigVersion,
  type ScoringPreview,
  type ScoringSchema,
} from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

/** Edit a DRAFT in three steps: change the points, check the impact, activate. */
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
  const problems = validateScoring(schema, config);
  const step = isDirty || changes.length === 0 ? 1 : preview ? 3 : 2;

  function update(path: string, value: unknown) {
    setConfig((prev) => setPath(prev, path, value));
    setPreview(null);
  }

  async function save(): Promise<boolean> {
    if (problems.length > 0) {
      setMessage({ tone: "error", text: "Fix the problems listed below before saving." });
      return false;
    }
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
        description={`A copy of v${draft.basedOnVersion ?? "—"} you can change. Nothing affects households until you activate it, and even then only new assessments are scored with it.`}
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
            <Button size="sm" onClick={() => setActivateOpen(true)} disabled={isDirty || problems.length > 0}>
              <Rocket />
              Activate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Steps current={step} />
          {message ? <InlineAlert tone={message.tone}>{message.text}</InlineAlert> : null}
          {problems.length > 0 ? (
            <InlineAlert tone="warning" title="To fix before saving">
              <ul className="list-disc space-y-0.5 pl-4">
                {problems.map((problem) => (
                  <li key={problem}>{problem}</li>
                ))}
              </ul>
            </InlineAlert>
          ) : null}
          {isDirty ? (
            <p className="text-xs text-black/50">You have unsaved changes. Save the draft before checking the impact or activating it.</p>
          ) : null}
          <div className="max-w-md">
            <FormField label="Version name" htmlFor="config-name">
              <Input id="config-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Stricter high band" />
            </FormField>
          </div>
        </div>
      </Panel>

      {preview ? <PreviewResults preview={preview} /> : null}

      <ScoringDesigner schema={schema} config={config} baseConfig={baseConfig} onChange={update} />

      {schema.rules.length > 0 ? (
        <details className="rounded-xl border border-black/[0.08] bg-white p-4">
          <summary className="cursor-pointer text-sm font-medium text-[#001539]">Rules the system checks when you save</summary>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/65">
            {schema.rules.map((rule, index) => (
              <li key={index}>{ruleText(rule)}</li>
            ))}
          </ul>
        </details>
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

const STEPS = ["Change the points", "Check the impact", "Activate"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {STEPS.map((label, index) => {
        const number = index + 1;
        const done = number < current;
        const active = number === current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                done ? "bg-[#007050] text-white" : active ? "bg-[#001539] text-white" : "bg-black/[0.06] text-black/45",
              )}
            >
              {done ? <Check className="size-3.5" /> : number}
            </span>
            <span className={cn(active ? "font-medium text-[#001539]" : "text-black/50")}>{label}</span>
            {number < STEPS.length ? <span className="mx-1 h-px w-6 bg-black/15" /> : null}
          </li>
        );
      })}
    </ol>
  );
}

function PreviewResults({ preview }: { preview: ScoringPreview }) {
  const transitions = Object.entries(preview.transitions ?? {});
  return (
    <Panel
      title="What would change"
      description={`We re-scored the ${preview.sampled} most recent assessments with this draft to show the effect. Nothing was changed for real.`}
    >
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Stat label="Households changing need level" value={`${preview.riskChanged} of ${preview.sampled}`} />
          <Stat label="Average score today" value={preview.averageOldScore?.toFixed(1) ?? "—"} />
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
