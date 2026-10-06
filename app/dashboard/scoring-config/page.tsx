"use client";

import { useState } from "react";
import { CopyPlus, History } from "lucide-react";

import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { FormField } from "@/components/dashboard/form-field";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList, Panel } from "@/components/dashboard/panel";
import { RequireRole } from "@/components/dashboard/require-role";
import { ConfigEditor } from "@/components/scoring/config-editor";
import { ConfigViewer } from "@/components/scoring/config-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  getPath,
  type ScoringConfigVersion,
  type ScoringSchema,
} from "@/lib/backoffice/scoring-config";
import { cn } from "@/lib/utils";

const API = "/api/backoffice/admin/scoring-configs";

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
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [rollbackOpen, setRollbackOpen] = useState(false);
  const [reason, setReason] = useState("");

  const list = [...(versions.data ?? [])].sort((a, b) => b.version - a.version);
  const active = list.find((item) => item.active) ?? null;
  const current =
    list.find((item) => item.version === selected) ??
    list.find((item) => item.status === "DRAFT") ??
    active ??
    list[0] ??
    null;
  const base = current?.basedOnVersion != null ? list.find((item) => item.version === current.basedOnVersion) : null;

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
      setActionError(errorMessage(createError, "Couldn't create a draft"));
    } finally {
      setIsCreating(false);
    }
  }

  const thresholds = active?.config;
  const high = getPath(thresholds, "risk_thresholds.high_min");
  const medium = getPath(thresholds, "risk_thresholds.medium_min");
  const maxTotal = getPath(thresholds, "max_total");

  return (
    <section className="space-y-6">
      <PageHeader
        title="Scoring configuration"
        description="Weights and thresholds that turn an assessment into a score. Changes go through a draft, a preview and an activation; existing scores keep the version they were calculated with."
        actions={
          active ? (
            <Button onClick={() => void createDraft(active)} disabled={isCreating}>
              <CopyPlus />
              {isCreating ? "Creating…" : "New draft"}
            </Button>
          ) : null
        }
      />

      {notice ? <InlineAlert tone="success">{notice}</InlineAlert> : null}
      {actionError ? <InlineAlert>{actionError}</InlineAlert> : null}
      {versions.error ? <InlineAlert>{versions.error.message}</InlineAlert> : null}

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
            <p className="text-sm text-black/50">{versions.isLoading ? "Loading…" : "No active configuration."}</p>
          )}
        </Panel>
        <Panel title="Risk bands" description={`Out of ${typeof maxTotal === "number" ? maxTotal : 270} points.`}>
          <ul className="space-y-2.5 text-sm">
            <Band tone="bg-rose-500" label="High" range={`${typeof high === "number" ? high : 180} and above`} recommendation="Approve" />
            <Band
              tone="bg-amber-500"
              label="Medium"
              range={`${typeof medium === "number" ? medium : 110} – ${typeof high === "number" ? high - 1 : 179}`}
              recommendation="Conditional approval"
            />
            <Band tone="bg-emerald-500" label="Low" range={`Below ${typeof medium === "number" ? medium : 110}`} recommendation="Defer" />
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Panel title="Versions" flush className="lg:self-start">
          <ul className="divide-y divide-black/[0.05]">
            {list.map((item) => (
              <li key={item.version}>
                <button
                  type="button"
                  onClick={() => setSelected(item.version)}
                  className={cn(
                    "flex w-full items-start justify-between gap-2 px-4 py-3 text-left transition",
                    current?.version === item.version ? "bg-[#007050]/[0.06]" : "hover:bg-black/[0.02]",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#001539] tabular-nums">v{item.version}</span>
                    <span className="block truncate text-xs text-black/55">{item.name ?? "Untitled"}</span>
                    <span className="block text-[11px] text-black/40">
                      {item.createdByName ?? ""} {item.createdAt ? `· ${formatDateTime(item.createdAt)}` : ""}
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
              <li className="px-4 py-6 text-center text-sm text-black/45">No versions.</li>
            ) : null}
          </ul>
        </Panel>

        <div className="min-w-0">
          {!current ? null : current.status === "DRAFT" ? (
            schema.data ? (
              <ConfigEditor
                key={current.version}
                draft={current}
                baseConfig={base?.config ?? active?.config ?? null}
                schema={schema.data}
                apiBase={API}
                onSaved={(saved) => versions.mutate(list.map((item) => (item.version === saved.version ? saved : item)))}
                onDeleted={() => {
                  setSelected(null);
                  setNotice(`Draft v${current.version} deleted.`);
                  versions.reload();
                }}
                onActivated={() => {
                  setSelected(current.version);
                  setNotice(`v${current.version} is now active for new submissions.`);
                  versions.reload();
                }}
              />
            ) : schema.error ? (
              <InlineAlert>{schema.error.message}</InlineAlert>
            ) : (
              <div className="h-64 animate-pulse rounded-xl bg-black/[0.04]" />
            )
          ) : (
            <ConfigViewer
              config={current}
              actions={
                <>
                  <Button variant="outline" size="sm" onClick={() => void createDraft(current)} disabled={isCreating}>
                    <CopyPlus />
                    Draft from v{current.version}
                  </Button>
                  {!current.active ? (
                    <Button size="sm" onClick={() => setRollbackOpen(true)}>
                      <History />
                      Activate v{current.version}
                    </Button>
                  ) : null}
                </>
              }
            />
          )}
        </div>
      </div>

      {current && current.status === "PUBLISHED" && !current.active ? (
        <ConfirmDialog
          open={rollbackOpen}
          onOpenChange={setRollbackOpen}
          title={`Activate v${current.version} again?`}
          description="New submissions are scored with this older version. Existing scores don't change."
          confirmLabel="Activate"
          confirmDisabled={!reason.trim()}
          onConfirm={async () => {
            await apiClient(`${API}/${current.version}/activate`, {
              method: "POST",
              body: JSON.stringify({ reason: reason.trim() }),
            });
            setReason("");
            setNotice(`v${current.version} is active again.`);
            versions.reload();
          }}
        >
          <FormField label="Reason" htmlFor="rollback-reason" required>
            <Textarea id="rollback-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </FormField>
        </ConfirmDialog>
      ) : null}
    </section>
  );
}

function Band({ tone, label, range, recommendation }: { tone: string; label: string; range: string; recommendation: string }) {
  return (
    <li className="flex items-center gap-3">
      <span className={cn("h-8 w-1.5 rounded-full", tone)} />
      <span className="flex-1">
        <span className="block font-medium text-[#001539]">{label}</span>
        <span className="block text-xs text-black/50 tabular-nums">{range}</span>
      </span>
      <span className="text-xs text-black/60">{recommendation}</span>
    </li>
  );
}

