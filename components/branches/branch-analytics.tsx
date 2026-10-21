"use client";

import { useState } from "react";
import { ClipboardCheck, Timer } from "lucide-react";

import { LineChart } from "@/components/charts/line-chart";
import { StatTile, formatCompact } from "@/components/charts/stat-tile";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { TableMessageRow } from "@/components/dashboard/table-states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { BranchHome } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { rangeQuery, type RangeKey } from "@/lib/backoffice/date-range";

function weekLabel(week: string) {
  const date = new Date(`${week.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? week
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(date);
}

/** BRANCH home: review workload, weekly registrations and officer activity. */
export function BranchAnalytics() {
  const [range, setRange] = useState<RangeKey>("90d");
  const { data, error, isLoading } = useResource<BranchHome>(`/bff/backoffice/branch/analytics?${rangeQuery(range)}`);
  const loading = isLoading && !data;
  const reviewed = data?.reviewedInRange ?? {};
  const totalReviewed = Object.values(reviewed).reduce((sum, value) => sum + (value ?? 0), 0);

  // Align both weekly series on one set of week labels.
  const weeks = [
    ...new Set([...(data?.registrationsPerWeek ?? []).map((w) => w.week), ...(data?.codesUsedPerWeek ?? []).map((w) => w.week)]),
  ].sort();
  const registrations = new Map((data?.registrationsPerWeek ?? []).map((w) => [w.week, w.registrations]));
  const codes = new Map((data?.codesUsedPerWeek ?? []).map((w) => [w.week, w.codesUsed]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-[#001539]">Branch activity</h2>
        <RangeSelect value={range} onChange={setRange} />
      </div>
      {error ? <InlineAlert>{error.message}</InlineAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Waiting for you" value={formatCompact(data?.reviewQueue)} hint="Submitted assessments" icon={ClipboardCheck} loading={loading} />
        <StatTile label="Decided" value={formatCompact(totalReviewed)} hint="In this period" loading={loading} />
        <StatTile
          label="Approved / returned"
          value={`${(reviewed.APPROVED ?? 0).toLocaleString()} / ${(reviewed.RETURNED ?? 0).toLocaleString()}`}
          hint={`${(reviewed.DEFERRED ?? 0).toLocaleString()} deferred · ${(reviewed.REJECTED ?? 0).toLocaleString()} rejected`}
          loading={loading}
        />
        <StatTile
          label="Review time"
          value={data?.medianReviewDays != null ? `${data.medianReviewDays.toFixed(1)} d` : "—"}
          hint="Median, submission to decision"
          icon={Timer}
          loading={loading}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Weekly registrations" description="New beneficiaries and codes used per week">
          <LineChart
            labels={weeks}
            formatLabel={weekLabel}
            series={[
              { key: "registrations", label: "Registrations", values: weeks.map((w) => registrations.get(w) ?? 0) },
              { key: "codesUsed", label: "Codes used", values: weeks.map((w) => codes.get(w) ?? 0) },
            ]}
          />
        </Panel>
        <Panel title="Field officers" description="Assessments per officer in this branch" flush>
          <Table>
            <TableHeader>
              <TableRow className="bg-black/[0.015]">
                <TableHead className="pl-5">Officer</TableHead>
                <TableHead className="text-right">Open</TableHead>
                <TableHead className="text-right">Submitted</TableHead>
                <TableHead className="pr-5 text-right">Approved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.assessmentsPerOfficer ?? []).length === 0 ? (
                <TableMessageRow colSpan={4}>{loading ? "Loading…" : "No officer activity yet."}</TableMessageRow>
              ) : (
                data!.assessmentsPerOfficer.map((row) => (
                  <TableRow key={row.officerSub}>
                    <TableCell className="pl-5 font-medium text-[#001539]">{row.officerName ?? "Unnamed officer"}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.open}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.submittedInRange}</TableCell>
                    <TableCell className="pr-5 text-right tabular-nums">{row.approvedInRange}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </div>
  );
}
