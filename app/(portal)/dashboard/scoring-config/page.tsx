"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, History, PencilLine } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { ErrorAlert } from "@/components/dashboard/error-alert";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { PanelSkeleton } from "@/components/dashboard/skeletons";
import { useMyUserId } from "@/lib/auth/use-my-user-id";
import { ANOTHER_ADMIN_MESSAGE, ConfigEditor } from "@/components/scoring/config-editor";
import { ConfigViewer } from "@/components/scoring/config-viewer";
import { ActivationHistory, VersionHistory } from "@/components/scoring/version-history";
import { needLevels, recommendationLabel, type NeedLevels } from "@/components/scoring/scoring-schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { ApiError, isSameApprover } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { useLeaveGuard } from "@/lib/hooks/use-leave-guard";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  activationNeedsAnotherAdmin,
  draftBaseline,
  draftToContinue,
  type ScoringConfigVersion,
  type ScoringSchema,
} from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

const API = "/bff/backoffice/admin/scoring-configs";

export default function ScoringConfigPage() {
  return (
    <RequireRole audience={["admin"]}>
      <ScoringConfigView />
    </RequireRole>
  );
}

function ScoringConfigView() {
  const versions = useResource<ScoringConfigVersion[]>(API);
  const schema = useResource<ScoringSchema>(`${API}/schema`);
  const [selected, setSelected] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  // Bumped after an activation, so the history panels load again.
  const [historyKey, setHistoryKey] = useState(0);
  const router = useRouter();
  const myUserId = useMyUserId();
  // Whether the open draft has unsaved edits. State, so the link guard below
  // switches on and off with it. setState is stable, so the editor's effect
  // that reports it doesn't re-run on every render.
  const [draftDirty, setDraftDirty] = useState(false);
  // What to do once the user agrees to drop those edits.
  const [leaving, setLeaving] = useState<{ run: () => void | Promise<void> } | null>(null);
  // Sidebar, header, breadcrumb and in-page links ask first, like the assessment wizard.
  useLeaveGuard(draftDirty, (href) => setLeaving({ run: () => router.push(href) }));

  const list = [...(versions.data ?? [])].sort((a, b) => b.version - a.version);
  const active = list.find((item) => item.active) ?? null;
  // Open on the live version; a draft shows once someone picks or creates it.
  const current = list.find((item) => item.version === selected) ?? active ?? list[0] ?? null;
  const openDraft = draftToContinue(list);

  /** Runs `next` now, or after confirming when the open draft has unsaved edits. */
  function leaveDraft(next: () => void | Promise<void>) {
    if (draftDirty) setLeaving({ run: next });
    else void next();
  }

  async function createDraft(from: ScoringConfigVersion) {
    setIsCreating(true);
    setActionError(null);
    try {
      const draft = await apiClient<ScoringConfigVersion>(API, {
        method: "POST",
        body: JSON.stringify({ basedOnVersion: from.version, name: `Draft from v${from.version}` }),
      });
      versions.mutate([draft, ...list]);
      setSelected(draft.version);
      setNotice(null);
    } catch (createError) {
      setActionError(createError);
    } finally {
      setIsCreating(false);
    }
  }

  const levels = active && schema.data ? needLevels(schema.data, active.config) : null;
  const levelsNote =
    versions.error || schema.error
      ? "Couldn't load the need levels."
      : versions.isLoading || schema.isLoading
        ? "Loading…"
        : "No active version.";

  return (
    <section className="space-y-6">
      <PageHeader
        title="Scoring"
        description="How a household's answers turn into a need score. To change it, make a draft, adjust the points, check the impact, then activate. Scores already given never change."
        actions={
          // An open draft is continued rather than starting another next to it.
          openDraft ? (
            openDraft.version !== current?.version ? (
              <Button onClick={() => leaveDraft(() => setSelected(openDraft.version))}>
                <PencilLine />
                Open draft v{openDraft.version}
              </Button>
            ) : null
          ) : active ? (
            <Button onClick={() => void createDraft(active)} loading={isCreating} loadingText="Creating…">
              <CopyPlus />
              Change scoring
            </Button>
          ) : null
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
      <ErrorAlert error={actionError} title="Couldn't create a draft" />
      <ErrorAlert error={versions.error} title="Couldn't load the scoring versions" onRetry={versions.reload} />
      <ErrorAlert error={schema.error} title="Couldn't load the scoring form" onRetry={schema.reload} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Active version" className="lg:col-span-2">
          {active ? (
            <DetailList
              columns={4}
              items={[
                { label: "Version", value: `v${active.version}` },
                { label: "Name", value: active.name },
                { label: "Activated", value: formatDateTime(active.activatedAt) },
                { label: "Activated by", value: active.activatedByName },
                { label: "Reason", value: active.activationReason },
              ]}
            />
          ) : (
            <p className="text-sm text-black/60">{versions.isLoading ? "Loading…" : "No active configuration."}</p>
          )}
        </Panel>
        <Panel title="Need levels" description={levels?.maxTotal != null ? `Out of ${levels.maxTotal} points.` : undefined}>
          {levels ? <NeedLevelList levels={levels} /> : <p className="text-sm text-black/60">{levelsNote}</p>}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Panel title="Versions" flush className="lg:self-start">
          <ul className="divide-y divide-black/[0.05]">
            {list.map((item) => (
              <li key={item.version}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.version !== current?.version) leaveDraft(() => setSelected(item.version));
                  }}
                  aria-current={current?.version === item.version ? "true" : undefined}
                  className={cn(
                    "flex w-full items-start justify-between gap-2 px-4 py-3 text-left transition",
                    current?.version === item.version ? "bg-brand/[0.06]" : "hover:bg-black/[0.02]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy tabular-nums">v{item.version}</span>
                    <span className="block truncate text-xs text-black/60">{item.name ?? "Untitled"}</span>
                    <span className="block text-xs text-black/60">
                      {[item.createdByName, item.createdAt ? formatDateTime(item.createdAt) : null].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  {item.active ? (
                    <Badge tone="success">Active</Badge>
                  ) : item.status === "DRAFT" ? (
                    <Badge tone="warning">Draft</Badge>
                  ) : null}
                </button>
              </li>
            ))}
            {list.length === 0 && !versions.isLoading ? (
              <li className="px-4 py-6 text-center text-sm text-black/60">No versions.</li>
            ) : null}
          </ul>
        </Panel>

        <div className="min-w-0">
          {!current ? null : current.status === "DRAFT" ? (
            schema.data ? (
              <ConfigEditor
                key={current.version}
                draft={current}
                baseline={draftBaseline(current, list)}
                schema={schema.data}
                apiBase={API}
                myUserId={myUserId}
                onDirtyChange={setDraftDirty}
                onSaved={(saved) => versions.mutate(list.map((item) => (item.version === saved.version ? saved : item)))}
                onDeleted={() => {
                  setSelected(null);
                  setNotice(`Draft v${current.version} deleted.`);
                  versions.reload();
                }}
                onActivated={() => {
                  setSelected(current.version);
                  setNotice(`v${current.version} is now active for new submissions.`);
                  setHistoryKey((value) => value + 1);
                  versions.reload();
                }}
                onGone={() => {
                  setSelected(null);
                  setNotice(`Draft v${current.version} was deleted or activated by another admin.`);
                  versions.reload();
                }}
              />
            ) : schema.error ? (
              <p className="text-sm text-black/60">The draft opens once the scoring form loads.</p>
            ) : (
              <PanelSkeleton rows={4} />
            )
          ) : (
            <ConfigViewer
              config={current}
              schema={schema.data}
              baseConfig={current.active ? null : (active?.config ?? null)}
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={() => void createDraft(current)} loading={isCreating}>
                    <CopyPlus />
                    Make a draft from this
                  </Button>
                  {!current.active && !activationNeedsAnotherAdmin(current, myUserId) ? (
                    <Button size="sm" onClick={() => setRollbackOpen(true)}>
                      <History />
                      Activate v{current.version}
                    </Button>
                  ) : null}
                </>
              }
            />
          )}
          {current && !current.active && current.status === "PUBLISHED" && activationNeedsAnotherAdmin(current, myUserId) ? (
            <InlineAlert tone="info" title="Waiting for another admin" className="mt-4">
              You made or last changed v{current.version}, so another admin must activate it.
            </InlineAlert>
          ) : null}
          {current ? (
            <div className="mt-6">
              <VersionHistory
                key={`${current.version}-${current.updatedAt ?? ""}-${historyKey}`}
                apiBase={API}
                version={current.version}
              />
            </div>
          ) : null}
        </div>
      </div>

      <ActivationHistory key={historyKey} apiBase={API} />

      {current && current.status === "PUBLISHED" && !current.active ? (
        // Keyed by version: a reason typed for one version never carries over to another.
        <ReactivateDialog
          key={current.version}
          version={current}
          live={active}
          open={rollbackOpen}
          onOpenChange={setRollbackOpen}
          onActivated={() => {
            setNotice(`v${current.version} is active again.`);
            setHistoryKey((value) => value + 1);
            versions.reload();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={leaving != null}
        onOpenChange={(open) => {
          if (!open) setLeaving(null);
        }}
        title="Discard unsaved changes?"
        description="The open draft has changes you haven't saved. If you leave it now, they are lost."
        confirmLabel="Discard changes"
        destructive
        onConfirm={async () => {
          setDraftDirty(false);
          await leaving?.run();
        }}
      />
    </section>
  );
}

function ReactivateDialog({
  version,
  live,
  open,
  onOpenChange,
  onActivated,
}: {
  version: ScoringConfigVersion;
  live: ScoringConfigVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onActivated: () => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Activate v${version.version} again?`}
      description={`New submissions are scored with v${version.version}${live ? ` instead of v${live.version}` : ""}. Existing scores don't change.`}
      confirmLabel="Activate"
      confirmDisabled={!reason.trim()}
      onConfirm={async () => {
        try {
          await apiClient(`${API}/${version.version}/activate`, {
            method: "POST",
            body: JSON.stringify({ reason: reason.trim() }),
          });
        } catch (activateError) {
          if (isSameApprover(activateError) || (activateError instanceof ApiError && activateError.status === 403)) {
            throw new Error(ANOTHER_ADMIN_MESSAGE);
          }
          throw activateError;
        }
        onActivated();
      }}
    >
      <FormField label="Reason" htmlFor="rollback-reason" required hint="Recorded with the version, e.g. the committee decision number">
        <Textarea id="rollback-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
      </FormField>
    </ConfirmDialog>
  );
}

/** The active version's need levels, read at the schema's paths; "—" where the config has no value. */
function NeedLevelList({ levels }: { levels: NeedLevels }) {
  const { medium, high, recommendations } = levels;
  return (
    <ul className="space-y-2.5 text-sm">
      <Band
        tone="bg-rose-500"
        label="High"
        range={high != null ? `${high} and above` : "—"}
        recommendation={recommendationLabel(recommendations.HIGH)}
      />
      <Band
        tone="bg-amber-500"
        label="Medium"
        range={medium != null && high != null ? `From ${medium}, below ${high}` : "—"}
        recommendation={recommendationLabel(recommendations.MEDIUM)}
      />
      <Band
        tone="bg-emerald-500"
        label="Low"
        range={medium != null ? `Below ${medium}` : "—"}
        recommendation={recommendationLabel(recommendations.LOW)}
      />
    </ul>
  );
}

function Band({ tone, label, range, recommendation }: { tone: string; label: string; range: string; recommendation: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={cn("h-8 w-1.5 rounded-full", tone)} />
      <span className="flex-1">
        <span className="block font-medium text-navy">{label}</span>
        <span className="block text-xs text-black/60 tabular-nums">{range}</span>
      </span>
      <span className="text-xs text-black/60">{recommendation}</span>
    </li>
  );
}
