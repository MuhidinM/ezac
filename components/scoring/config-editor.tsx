"use client";

import { useEffect, useRef, useState } from "react";
import { Check, FlaskConical, Rocket, Save, Trash2 } from "lucide-react";

import { BEFORE_SIGN_OUT_EVENT } from "@/components/auth/idle-sign-out";
import { RiskBadge } from "@/components/backoffice/status-badges";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { ScoringDesigner } from "@/components/scoring/scoring-designer";
import { describeScoringPaths, fieldName, validateScoring } from "@/components/scoring/scoring-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { RiskCategory } from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { ApiError, errorMessage } from "@/lib/api/errors";
import {
  changedPaths,
  ruleText,
  setPath,
  type DraftBaseline,
  type ScoringConfigVersion,
  type ScoringPreview,
  type ScoringSchema,
} from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

/** How many changed settings the activate dialog names before "and N more". */
const LISTED_CHANGES = 8;

/** Edit a DRAFT in three steps: change the points, check the impact, activate. */
export function ConfigEditor({
  draft,
  baseline,
  schema,
  apiBase,
  onSaved,
  onDeleted,
  onActivated,
  onDirtyChange,
}: {
  draft: ScoringConfigVersion;
  /** The live version (which activation replaces) and the one the draft was copied from. */
  baseline: DraftBaseline;
  schema: ScoringSchema;
  apiBase: string;
  onSaved: (version: ScoringConfigVersion) => void;
  onDeleted: () => void;
  onActivated: () => void;
  /** Told whether there are unsaved edits, so the page can ask before leaving the draft. */
  onDirtyChange?: (dirty: boolean) => void;
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
  const [acknowledged, setAcknowledged] = useState(false);
  const signingOut = useRef(false);

  const versionPath = `${apiBase}/${draft.version}`;
  const isDirty = name !== (draft.name ?? "") || JSON.stringify(config) !== JSON.stringify(draft.config);
  const { live, stale, compareWith } = baseline;
  // Counted against the live version: that is what activating this draft changes.
  const changes = compareWith ? changedPaths(schema.fields, compareWith.config, config) : [];
  const fieldsByPath = new Map(schema.fields.map((field) => [field.path, field]));
  const changeNames = changes.map((path) => {
    const field = fieldsByPath.get(path);
    return field ? fieldName(field) : path;
  });
  const problems = validateScoring(schema, config);
  const step = isDirty || changes.length === 0 ? 1 : preview ? 3 : 2;

  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  // Closing or reloading the tab would lose the edits; signing out may go ahead.
  useEffect(() => {
    if (!isDirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (!signingOut.current) event.preventDefault();
    };
    const onSignOut = () => {
      signingOut.current = true;
    };
    window.addEventListener("beforeunload", warn);
    window.addEventListener(BEFORE_SIGN_OUT_EVENT, onSignOut);
    return () => {
      window.removeEventListener("beforeunload", warn);
      window.removeEventListener(BEFORE_SIGN_OUT_EVENT, onSignOut);
    };
  }, [isDirty]);

  /** The server's message, with field paths and per-field errors in plain words. */
  function scoringError(error: unknown, fallback: string) {
    const fields = error instanceof ApiError ? error.errors : [];
    const text =
      fields.length > 0
        ? fields.map((item) => `${item.field}: ${item.message}`).join(" ")
        : errorMessage(error, fallback);
    return describeScoringPaths(schema, text);
  }

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
      setMessage({ tone: "error", text: scoringError(saveError, "Couldn't save the draft") });
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
      setMessage({ tone: "error", text: scoringError(previewError, "Preview failed") });
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
            {changes.length > 0 && compareWith ? (
              <Badge tone="info">
                {changes.length} change{changes.length === 1 ? "" : "s"} from {live ? "live " : ""}v{compareWith.version}
              </Badge>
            ) : null}
          </span>
        }
        description={`A copy of v${draft.basedOnVersion ?? "—"} you can change.${
          compareWith ? ` Values marked “was” show ${live ? `the live version, v${live.version}` : `v${compareWith.version}`}.` : ""
        } Nothing affects households until you activate it, and even then only new assessments are scored with it.`}
        actions={
          <>
            <Button variant="destructive-ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 />
              Delete
            </Button>
            <Button variant="outline" size="sm" onClick={() => void save()} disabled={!isDirty} loading={isSaving} loadingText="Saving…">
              <Save />
              {isDirty ? "Save" : "Saved"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void runPreview()} loading={isPreviewing} loadingText="Running…">
              <FlaskConical />
              Preview impact
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
          {stale && live ? (
            <InlineAlert tone="warning" title={`This draft isn't a copy of the live version (v${live.version})`}>
              {draft.basedOnVersion != null ? `It was copied from v${draft.basedOnVersion}. ` : null}
              Activating it replaces all of v{live.version}&apos;s settings, so every value marked “was” changes back, including ones
              you didn&apos;t edit. To keep v{live.version}&apos;s settings, delete this draft and make a new one from v{live.version}.
            </InlineAlert>
          ) : null}
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

      <ScoringDesigner schema={schema} config={config} baseConfig={compareWith?.config ?? null} onChange={update} />

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
        onOpenChange={(open) => {
          setActivateOpen(open);
          if (!open) setAcknowledged(false);
        }}
        title={`Activate v${draft.version}?`}
        description={
          live
            ? `It replaces v${live.version}, the live version, for every new submission. Existing scores keep the version they were calculated with. To go back, activate v${live.version} again.`
            : "It becomes the active configuration for every new submission. Existing scores keep the version they were calculated with. To go back, activate an older version."
        }
        confirmLabel="Activate"
        confirmDisabled={!reason.trim() || (stale && !acknowledged)}
        onConfirm={async () => {
          await apiClient(`${versionPath}/activate`, { method: "POST", body: JSON.stringify({ reason: reason.trim() }) });
          setReason("");
          onActivated();
        }}
      >
        {compareWith ? (
          <div className="text-sm text-black/65">
            {changes.length === 0 ? (
              <p>It has the same settings as v{compareWith.version}, so scores don&apos;t change.</p>
            ) : (
              <>
                <p className="font-medium text-[#001539]">
                  {changes.length} setting{changes.length === 1 ? "" : "s"} differ{changes.length === 1 ? "s" : ""} from{" "}
                  {live ? "live " : ""}v{compareWith.version}:
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {changeNames.slice(0, LISTED_CHANGES).map((changeName) => (
                    <li key={changeName}>{changeName}</li>
                  ))}
                </ul>
                {changes.length > LISTED_CHANGES ? <p className="mt-1">and {changes.length - LISTED_CHANGES} more.</p> : null}
              </>
            )}
          </div>
        ) : null}
        {stale && live ? (
          <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <input
              type="checkbox"
              className="mt-0.5 accent-brand"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>
              {draft.basedOnVersion != null
                ? `This draft was copied from v${draft.basedOnVersion}, not from the live v${live.version}.`
                : `This draft wasn't copied from the live v${live.version}.`}{" "}
              I&apos;ve checked every setting that differs from v{live.version}, including ones I didn&apos;t edit.
            </span>
          </label>
        ) : null}
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
                <th className="px-3 py-2 font-medium">Need</th>
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
