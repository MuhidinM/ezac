"use client";

import { useState } from "react";

import { ASSESSMENT_STATUS } from "@/components/backoffice/status-badges";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { TableMessageRow } from "@/components/dashboard/table-states";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssessmentStatus, OfficerStats } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { rangeQuery, type RangeKey } from "@/lib/backoffice/date-range";

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-black/[0.06] p-4">
      <p className="text-xs font-medium text-black/50">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-[#001539] tabular-nums">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-black/45">{hint}</p> : null}
    </div>
  );
}

/** ADMIN: an officer's throughput, quality and coverage. */
export function OfficerStatsPanel({ officerId }: { officerId: string }) {
  const [range, setRange] = useState<RangeKey>("90d");
  const { data, error, isLoading } = useResource<OfficerStats>(
    `/bff/backoffice/admin/field-officers/${encodeURIComponent(officerId)}/stats?${rangeQuery(range)}`,
  );

  const statuses = Object.entries(data?.byStatus ?? {}).filter(([, count]) => (count ?? 0) > 0) as [
    AssessmentStatus,
    number,
  ][];

  return (
    <Panel title="Performance" description="Assessments in this officer's name." actions={<RangeSelect value={range} onChange={setRange} />}>
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}
      {isLoading && !data ? <div className="h-28 animate-pulse rounded-lg bg-black/[0.04]" /> : null}
      {data ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Submitted" value={data.submittedInRange.toLocaleString()} hint="In this period" />
            <Metric
              label="Average days to submit"
              value={data.averageDaysToSubmit != null ? data.averageDaysToSubmit.toFixed(1) : "—"}
              hint="From start to submission"
            />
            <Metric
              label="Return rate"
              value={data.returnRate != null ? `${Math.round(data.returnRate * 100)}%` : "—"}
              hint="Returned by the branch at least once"
            />
          </div>

          {statuses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {statuses.map(([status, count]) => (
                <Badge key={status} tone={ASSESSMENT_STATUS[status]?.tone ?? "neutral"}>
                  {ASSESSMENT_STATUS[status]?.label ?? status}
                  <span className="tabular-nums">{count}</span>
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-lg border border-black/[0.06]">
            <Table>
              <TableHeader>
                <TableRow className="bg-black/[0.015]">
                  <TableHead className="pl-4">Coverage</TableHead>
                  <TableHead className="text-right">Beneficiaries</TableHead>
                  <TableHead className="text-right">Pending assessment</TableHead>
                  <TableHead className="pr-4 text-right">Assessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.coverage.length === 0 ? (
                  <TableMessageRow colSpan={4}>No active assignments.</TableMessageRow>
                ) : (
                  data.coverage.map((row) => (
                    <TableRow key={row.assignmentId}>
                      <TableCell className="pl-4 font-medium text-[#001539]">
                        {row.branchName ?? (row.region ? `${row.region} region` : "—")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{row.beneficiaries}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.pendingAssessment}</TableCell>
                      <TableCell className="pr-4 text-right tabular-nums">{row.assessed}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
