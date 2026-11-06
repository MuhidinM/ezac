"use client";

import { useState } from "react";
import Link from "next/link";

import { StackedBars } from "@/components/charts/stacked-bars";
import { ORDINAL_GREEN } from "@/components/charts/palette";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow } from "@/components/dashboard/table-states";
import { Badge } from "@/components/ui/badge";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsAreaRow } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { formatCount } from "@/lib/backoffice/format";
import { cn } from "@/lib/utils";

const API = "/bff/backoffice/analytics";

/** Pipeline stages per area, in order, light to dark green (later = darker). */
const STAGES = [
  { key: "pendingAssessment", label: "Waiting for assessment", color: ORDINAL_GREEN[0] },
  { key: "underAssessment", label: "Under assessment", color: ORDINAL_GREEN[1] },
  { key: "submitted", label: "Submitted", color: ORDINAL_GREEN[3] },
  { key: "approved", label: "Approved", color: ORDINAL_GREEN[4] },
] as const;

/**
 * Workload per branch or region: stacked pipeline bars (top 10 by
 * households) or the full table with scores and codes left.
 */
export function AreaComparison({ scope }: { scope: string }) {
  const [by, setBy] = useState<"branches" | "regions">("branches");
  const [view, setView] = useState<"chart" | "table">("chart");
  const { data, error, isLoading } = useResource<AnalyticsAreaRow[]>(`${API}/${by}?${scope}`);
  const rows = [...(data ?? [])].sort((a, b) => b.beneficiaries - a.beneficiaries);

  return (
    <Panel
      title="By area"
      description="Where households are in the pipeline, per branch or region"
      flush
      actions={
        <>
          <Badge tone="neutral" title="Not limited to the date range above">
            All time
          </Badge>
          <SegmentedControl
            size="sm"
            aria-label="Compare by"
            value={by}
            onValueChange={setBy}
            options={[
              { value: "branches", label: "Branches" },
              { value: "regions", label: "Regions" },
            ]}
          />
          <SegmentedControl
            size="sm"
            aria-label="Show as"
            value={view}
            onValueChange={setView}
            options={[
              { value: "chart", label: "Chart" },
              { value: "table", label: "Table" },
            ]}
          />
        </>
      }
    >
      {error ? (
        <div className="px-5 pt-4">
          <InlineAlert>{error.message}</InlineAlert>
        </div>
      ) : null}
      {view === "chart" ? (
        <div className="p-5">
          {isLoading && !data ? (
            <div className="h-64 animate-pulse rounded-lg bg-black/[0.03]" />
          ) : (
            <StackedBars
              label={`Households by pipeline stage, per ${by === "branches" ? "branch" : "region"}`}
              series={STAGES.map((stage) => ({ key: stage.key, label: stage.label, color: stage.color }))}
              rows={rows.slice(0, 10).map((row) => ({
                id: row.id,
                label: row.name,
                pendingAssessment: row.pendingAssessment,
                underAssessment: row.underAssessment,
                submitted: row.submitted,
                approved: row.approved,
              }))}
              emptyText="No households in any area yet."
            />
          )}
          {rows.length > 10 ? (
            <p className="mt-2 text-xs text-black/60">Showing the 10 busiest of {rows.length}. The table lists them all.</p>
          ) : null}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-black/[0.015]">
              <TableHead className="pl-5">{by === "branches" ? "Branch" : "Region"}</TableHead>
              <TableHead className="text-right">Households</TableHead>
              <TableHead className="text-right">Waiting</TableHead>
              <TableHead className="text-right">Under assessment</TableHead>
              <TableHead className="text-right">Submitted</TableHead>
              <TableHead className="text-right">Approved</TableHead>
              <TableHead className="text-right">High need</TableHead>
              <TableHead className={cn("text-right", by === "regions" && "pr-5")}>Avg score</TableHead>
              {by === "branches" ? <TableHead className="pr-5 text-right">Codes left</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableMessageRow colSpan={by === "branches" ? 9 : 8}>{isLoading ? "Loading…" : "No data yet."}</TableMessageRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-5">
                    {by === "branches" ? (
                      <Link href={`/dashboard/branches/${row.id}`} className="font-medium text-navy hover:underline">
                        {row.name}
                      </Link>
                    ) : (
                      <span className="font-medium text-navy">{row.name}</span>
                    )}
                    {by === "branches" && row.region ? <p className="text-xs text-black/60">{row.region}</p> : null}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.beneficiaries)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.pendingAssessment)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.underAssessment)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.submitted)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.approved)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatCount(row.highRisk)}</TableCell>
                  <TableCell className={cn("text-right tabular-nums", by === "regions" && "pr-5")}>
                    {row.averageScore != null ? row.averageScore.toFixed(1) : "—"}
                  </TableCell>
                  {by === "branches" ? (
                    <TableCell className={cn("pr-5 text-right tabular-nums", (row.codesAvailable ?? 0) < 10 && "font-medium text-amber-700")}>
                      {formatCount(row.codesAvailable)}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </Panel>
  );
}
