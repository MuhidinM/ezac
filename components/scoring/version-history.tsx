"use client";

import { ErrorAlert } from "@/components/dashboard/error-alert";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResource } from "@/lib/api/use-resource";
import { formatDateTime } from "@/lib/beneficiary/format";
import {
  scoringHistorySteps,
  type ScoringActivation,
  type ScoringVersionHistory,
} from "@/lib/backoffice/scoring-config";

/** Who drafted, edited and activated one version, oldest first. */
export function VersionHistory({ apiBase, version }: { apiBase: string; version: number }) {
  const { data, error, isLoading, reload } = useResource<ScoringVersionHistory>(`${apiBase}/${version}/history`);
  const steps = data ? scoringHistorySteps(data) : [];

  return (
    <Panel title={`History of v${version}`}>
      {error ? (
        <ErrorAlert error={error} onRetry={reload} fallback="The history couldn't be loaded." />
      ) : isLoading && !data ? (
        <p className="text-sm text-black/60">Loading…</p>
      ) : steps.length === 0 ? (
        <p className="text-sm text-black/60">Nothing recorded yet.</p>
      ) : (
        <ol className="space-y-3">
          {steps.map((step, index) => (
            <li key={`${step.title}-${step.at ?? ""}-${index}`} className="text-sm">
              <p className="font-medium text-navy">{step.title}</p>
              <p className="text-xs text-black/60">
                {[step.byName, step.at ? formatDateTime(step.at) : null].filter(Boolean).join(" · ")}
              </p>
              {step.note ? <p className="mt-0.5 text-black/70">{step.note}</p> : null}
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

/** Every period a version was live, newest first. */
export function ActivationHistory({ apiBase }: { apiBase: string }) {
  const { data, error, isLoading, reload } = useResource<ScoringActivation[]>(`${apiBase}/activations`);
  const rows = data ?? [];

  return (
    <Panel title="Activation history" description="Which version scored new submissions, and when." flush>
      {error ? (
        <div className="px-5 pt-4">
          <ErrorAlert error={error} onRetry={reload} fallback="The activation history couldn't be loaded." />
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="bg-black/[0.015]">
            <TableHead className="pl-5">Version</TableHead>
            <TableHead>Live from</TableHead>
            <TableHead>Live until</TableHead>
            <TableHead>Activated by</TableHead>
            <TableHead className="pr-5">Reason</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && rows.length === 0 ? (
            <TableSkeletonRows colSpan={5} rows={3} />
          ) : rows.length === 0 ? (
            <TableMessageRow colSpan={5}>{error ? "—" : "No activations yet."}</TableMessageRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={`${row.version}-${row.activatedAt ?? index}`}>
                <TableCell className="pl-5 font-semibold text-navy tabular-nums">
                  <span className="flex items-center gap-2">
                    v{row.version}
                    {row.retiredAt ? null : <Badge tone="success">Live</Badge>}
                  </span>
                </TableCell>
                <TableCell>{formatDateTime(row.activatedAt)}</TableCell>
                <TableCell>
                  {row.retiredAt ? (
                    <>
                      {formatDateTime(row.retiredAt)}
                      {row.retiredByName ? <span className="block text-xs text-black/60">by {row.retiredByName}</span> : null}
                    </>
                  ) : (
                    <span className="text-black/60">Live now</span>
                  )}
                </TableCell>
                <TableCell>{row.activatedByName ?? "—"}</TableCell>
                <TableCell className="pr-5 text-sm text-black/70">
                  {row.reason ?? "—"}
                  {row.staleConfirmed ? (
                    <span className="mt-0.5 block text-xs text-amber-800">
                      Activated although it was copied from an older version.
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Panel>
  );
}
