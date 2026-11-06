"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  CopyCheck,
  CornerUpLeft,
  Gauge,
  Inbox,
  Network,
  Ticket,
  Timer,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import { QueueCard } from "@/components/assessment/queue-card";
import { ASSESSMENT_STATUS, AssessmentStatusBadge } from "@/components/backoffice/status-badges";
import { BarList } from "@/components/charts/bar-list";
import { LineChart } from "@/components/charts/line-chart";
import { ScoreHistogram } from "@/components/charts/score-histogram";
import { StatTile, formatCompact } from "@/components/charts/stat-tile";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { Panel } from "@/components/dashboard/panel";
import { RangeSelect } from "@/components/dashboard/range-select";
import { TableMessageRow } from "@/components/dashboard/table-states";
import { Badge } from "@/components/ui/badge";
import { NativeSelect } from "@/components/ui/native-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AnalyticsAreaRow,
  AnalyticsBreakdown,
  AnalyticsOverview,
  AnalyticsTimeseries,
  AssessmentStatus,
  LifecycleStatus,
  OfficerHome,
  ScoreDistribution,
} from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { rangeQuery, type RangeKey } from "@/lib/backoffice/date-range";
import { formatCount, formatDays } from "@/lib/backoffice/format";
import {
  ASNAF,
  OFFICER_RECOMMENDATION,
  TENURE,
  VULNERABILITIES,
  labelFor,
  type Option,
} from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";
import { ETHIOPIAN_REGIONS } from "@/lib/constants/regions";
import { cn } from "@/lib/utils";

const API = "/bff/backoffice/analytics";

const LIFECYCLE_LABELS: Record<LifecycleStatus, string> = {
  PENDING_ASSESSMENT: "Pending assessment",
  UNDER_ASSESSMENT: "Under assessment",
  ASSESSED: "Assessed",
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  GRADUATED: "Graduated",
  EXITED: "Exited",
};

const RISK_ITEMS = [
  { key: "HIGH", label: "High", color: "#e11d48" },
  { key: "MEDIUM", label: "Medium", color: "#d97706" },
  { key: "LOW", label: "Low", color: "#059669" },
] as const;

const BREAKDOWN_LABELS: Record<string, Option[]> = {
  asnaf: ASNAF,
  vulnerability: VULNERABILITIES,
  tenure: TENURE,
  recommendation: OFFICER_RECOMMENDATION,
};

function intervalFor(range: RangeKey) {
  return range === "30d" ? "day" : range === "90d" ? "week" : "month";
}

function formatPeriod(period: string, interval: string) {
  const date = new Date(`${period.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return period;
  return new Intl.DateTimeFormat(
    "en",
    interval === "month" ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" },
  ).format(date);
}

const days = formatDays;

function percent(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${Math.round(value * 100)}%`;
}

export default function DashboardHomePage() {
  const { session } = useSession();
  const [range, setRange] = useState<RangeKey>("30d");
  const [region, setRegion] = useState("");
  const isAdmin = session?.isAdmin ?? false;
  const officer = isFieldOfficer(session) && !isAdmin;
  const name = session?.displayName?.trim() || session?.username;

  const scope = `${rangeQuery(range)}${region ? `&region=${encodeURIComponent(region)}` : ""}`;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy">
            {name ? `Welcome back, ${name}` : "Overview"}
          </h1>
          <p className="mt-1 text-sm text-black/60">
            {isAdmin
              ? "Registration, assessment and disbursement activity across EZAC."
              : "Activity in your assigned branches and regions."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin ? (
            <div className="w-44">
              <NativeSelect aria-label="Region" value={region} onChange={(event) => setRegion(event.target.value)}>
                <option value="">All regions</option>
                {ETHIOPIAN_REGIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </NativeSelect>
            </div>
          ) : null}
          <RangeSelect value={range} onChange={setRange} />
        </div>
      </div>

      {officer ? <OfficerSummary range={range} /> : null}

      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-2">
          <QueueCard
            countPath="/bff/backoffice/admin/pool/awaiting?page=1&limit=1"
            href="/dashboard/pool"
            title="Awaiting disbursement pool"
            description="Approved by branches, not yet pooled"
            icon={Inbox}
          />
          <QueueCard
            status="SUBMITTED"
            title="Waiting for branch decision"
            description="Submitted by field officers"
            icon={ClipboardCheck}
          />
        </div>
      ) : null}

      <Overview scope={scope} range={range} showAreas={isAdmin} />

      <QuickActions isAdmin={isAdmin} />
    </section>
  );
}

function OfficerSummary({ range }: { range: RangeKey }) {
  const { data, error, isLoading } = useResource<OfficerHome>(`${API}/me?${rangeQuery(range)}`);
  const loading = isLoading && !data;

  if (error) return <InlineAlert>{error.message}</InlineAlert>;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Drafts" value={formatCompact(data?.drafts)} hint="Started, not submitted" icon={ClipboardCheck} loading={loading} />
        <StatTile label="Returned to you" value={formatCompact(data?.returned)} hint="Needs corrections" icon={CornerUpLeft} loading={loading} />
        <StatTile
          label="Waiting for assessment"
          value={formatCompact(data?.beneficiariesPendingAssessment)}
          hint="Registered in your area"
          icon={Users}
          loading={loading}
        />
        <StatTile label="Submitted" value={formatCompact(data?.submittedInRange)} hint="In this period" loading={loading} />
        <StatTile label="Approved" value={formatCompact(data?.approvedInRange)} hint="By the branch, this period" loading={loading} />
        <StatTile
          label="Days to submit"
          value={days(data?.averageDaysToSubmit)}
          hint="Average, start to submission"
          icon={Timer}
          loading={loading}
        />
      </div>
      <Panel title="Recent assessments" flush>
        {(data?.recent ?? []).length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-black/60">{loading ? "Loading…" : "Nothing yet."}</p>
        ) : (
          <ul className="divide-y divide-black/[0.05]">
            {(data?.recent ?? []).map((item) => (
              <li key={item.assessmentId}>
                <Link
                  href={
                    item.status === "DRAFT" || item.status === "RETURNED"
                      ? `/dashboard/assessments/${item.assessmentId}/edit`
                      : `/dashboard/assessments/${item.assessmentId}`
                  }
                  className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-black/[0.02]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-navy">
                      {item.beneficiaryName ?? `#${item.assessmentId}`}
                    </span>
                    <span className="block text-xs text-black/60">{formatDateTime(item.updatedAt)}</span>
                  </span>
                  <AssessmentStatusBadge status={item.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

function Overview({ scope, range, showAreas }: { scope: string; range: RangeKey; showAreas: boolean }) {
  const interval = intervalFor(range);
  const overview = useResource<AnalyticsOverview>(`${API}/overview?${scope}`);
  const series = useResource<AnalyticsTimeseries>(
    `${API}/timeseries?metrics=registrations,assessmentsSubmitted,decisions,pooled&interval=${interval}&${scope}`,
  );
  const distribution = useResource<ScoreDistribution>(`${API}/score-distribution?bucket=10&${scope}`);
  const asnaf = useResource<AnalyticsBreakdown>(`${API}/breakdown?by=asnaf&${scope}`);
  const vulnerability = useResource<AnalyticsBreakdown>(`${API}/breakdown?by=vulnerability&${scope}`);

  const o = overview.data;
  const loading = overview.isLoading && !o;
  const points = series.data?.points ?? [];

  return (
    <div className="space-y-6">
      {overview.error ? <InlineAlert>{overview.error.message}</InlineAlert> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Beneficiaries"
          value={formatCompact(o?.beneficiaries.total)}
          hint={o ? `+${formatCount(o.beneficiaries.newInRange)} in this period` : undefined}
          icon={Users}
          loading={loading}
        />
        <StatTile
          label="Average score"
          value={o?.assessments.averageScore != null ? o.assessments.averageScore.toFixed(1) : "—"}
          hint={distribution.data?.max ? `Current scores, out of ${distribution.data.max}` : "Current scores"}
          icon={Gauge}
          loading={loading}
        />
        <StatTile
          label="Submitted / decided"
          value={o ? `${formatCount(o.assessments.submittedInRange)} / ${formatCount(o.assessments.decidedInRange)}` : "—"}
          hint="In this period"
          icon={ClipboardCheck}
          loading={loading}
        />
        <StatTile
          label="Decision time"
          value={days(o?.assessments.turnaroundDays.submitToDecisionMedian)}
          hint={`Median to branch decision · pooled after ${days(o?.assessments.turnaroundDays.approvalToPoolMedian)}`}
          icon={Timer}
          loading={loading}
        />
        <StatTile
          label="Officer–system agreement"
          value={percent(o?.assessments.officerVsSystemAgreementRate)}
          hint="Recommendation matches the score"
          loading={loading}
        />
        <StatTile
          label="Possible duplicates"
          value={formatCompact(o?.beneficiaries.duplicatesPending)}
          hint="Waiting for review"
          icon={CopyCheck}
          loading={loading}
        />
        <StatTile
          label="Codes available"
          value={formatCompact(o?.codes.available)}
          hint={o ? `${formatCount(o.codes.consumed)} used · ${formatCount(o.codes.revoked)} revoked` : undefined}
          icon={Ticket}
          loading={loading}
        />
        <StatTile
          label="Institutions"
          value={formatCompact(o?.beneficiaries.byType.institution)}
          hint={o ? `${formatCount(o.beneficiaries.byType.individual ?? 0)} individuals` : undefined}
          icon={Building2}
          loading={loading}
        />
      </div>

      <Panel title="Activity" description={`Per ${interval}. Hover for exact numbers.`}>
        {series.error ? (
          <InlineAlert>{series.error.message}</InlineAlert>
        ) : (
          <LineChart
            labels={points.map((point) => point.period)}
            formatLabel={(label) => formatPeriod(label, interval)}
            series={[
              { key: "registrations", label: "Registrations", values: points.map((p) => p.registrations ?? 0) },
              { key: "assessmentsSubmitted", label: "Assessments submitted", values: points.map((p) => p.assessmentsSubmitted ?? 0) },
              { key: "decisions", label: "Branch decisions", values: points.map((p) => p.decisions ?? 0) },
              { key: "pooled", label: "Pooled", values: points.map((p) => p.pooled ?? 0) },
            ]}
          />
        )}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Panel
          title="Score distribution"
          description={distribution.data ? `${formatCount(distribution.data.scored)} current scores, by need level` : undefined}
          actions={<AllTime />}
        >
          {distribution.error ? (
            <InlineAlert>{distribution.error.message}</InlineAlert>
          ) : distribution.data ? (
            <ScoreHistogram data={distribution.data} />
          ) : (
            <div className="h-[220px] animate-pulse rounded-lg bg-black/[0.03]" />
          )}
        </Panel>
        <Panel title="Need level" description="Beneficiaries by current need level" actions={<AllTime />}>
          <BarList
            items={RISK_ITEMS.map((item) => ({
              key: item.key,
              label: item.label,
              value: o?.assessments.byRisk[item.key] ?? 0,
              color: item.color,
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Lifecycle" description="Where beneficiaries are now" actions={<AllTime />}>
          <BarList
            items={Object.entries(o?.beneficiaries.byLifecycle ?? {})
              .map(([key, value]) => ({ key, label: LIFECYCLE_LABELS[key as LifecycleStatus] ?? key, value: value ?? 0 }))
              .sort((a, b) => b.value - a.value)}
          />
        </Panel>
        <Panel title="Assessments" description="By current status" actions={<AllTime />}>
          <BarList
            color="var(--color-navy)"
            items={Object.entries(o?.assessments.byStatus ?? {})
              .map(([key, value]) => ({
                key,
                label: ASSESSMENT_STATUS[key as AssessmentStatus]?.label ?? key,
                value: value ?? 0,
              }))
              .sort((a, b) => b.value - a.value)}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownPanel
          title="Asnaf"
          description="Each household's current category; an assessment can change the one given at registration"
          data={asnaf.data}
          error={asnaf.error?.message}
          allTime
        />
        <BreakdownPanel
          title="Vulnerabilities"
          description="From current assessments; a household can count more than once"
          data={vulnerability.data}
          error={vulnerability.error?.message}
          allTime
        />
      </div>

      {showAreas ? <AreaComparison scope={scope} /> : null}
    </div>
  );
}

/**
 * Marks a panel whose numbers don't follow the date range: the backend
 * computes them over all time, whatever range is picked.
 */
function AllTime() {
  return (
    <Badge tone="neutral" title="Not limited to the date range above">
      All time
    </Badge>
  );
}

function BreakdownPanel({
  title,
  description,
  data,
  error,
  allTime,
}: {
  title: string;
  description: string;
  data?: AnalyticsBreakdown;
  error?: string;
  /** The numbers ignore the date range. */
  allTime?: boolean;
}) {
  const labels = BREAKDOWN_LABELS[data?.by ?? ""] ?? [];
  return (
    <Panel title={title} description={description} actions={allTime ? <AllTime /> : undefined}>
      {error ? (
        <InlineAlert>{error}</InlineAlert>
      ) : (
        <BarList
          total={data?.total}
          items={(data?.items ?? []).slice(0, 8).map((item) => ({
            key: item.key,
            label: labelFor(labels, item.key),
            value: item.count,
          }))}
        />
      )}
    </Panel>
  );
}

function AreaComparison({ scope }: { scope: string }) {
  const [by, setBy] = useState<"branches" | "regions">("branches");
  const { data, error, isLoading } = useResource<AnalyticsAreaRow[]>(`${API}/${by}?${scope}`);
  const rows = [...(data ?? [])].sort((a, b) => b.beneficiaries - a.beneficiaries);

  return (
    <Panel
      title="By area"
      description="Workload and outcomes per branch or region"
      flush
      actions={
        <>
          <AllTime />
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
        </>
      }
    >
      {error ? (
        <div className="px-5 pt-4">
          <InlineAlert>{error.message}</InlineAlert>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="bg-black/[0.015]">
            <TableHead className="pl-5">{by === "branches" ? "Branch" : "Region"}</TableHead>
            <TableHead className="text-right">Beneficiaries</TableHead>
            <TableHead className="text-right">Pending</TableHead>
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
            <TableMessageRow colSpan={by === "branches" ? 9 : 8}>
              {isLoading ? "Loading…" : "No data yet."}
            </TableMessageRow>
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
                  <TableCell
                    className={cn("pr-5 text-right tabular-nums", (row.codesAvailable ?? 0) < 10 && "font-medium text-amber-700")}
                  >
                    {formatCount(row.codesAvailable)}
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Panel>
  );
}

const ACTIONS = [
  { title: "Register a beneficiary", description: "Walk-in registration at a branch.", href: "/dashboard/register", icon: UserPlus },
  { title: "Assessments", description: "Drafts, returns and decisions.", href: "/dashboard/assessments", icon: ClipboardCheck },
  { title: "Manage branches", description: "Branches, officers and registration codes.", href: "/dashboard/branches", icon: Network, adminOnly: true },
  {
    title: "Manage field officers",
    description: "Create officers and set their branch or region.",
    href: "/dashboard/field-officers",
    icon: UserCog,
    adminOnly: true,
  },
];

function QuickActions({ isAdmin }: { isAdmin: boolean }) {
  const actions = ACTIONS.filter((action) => !action.adminOnly || isAdmin);
  return (
    <div>
      <h2 className="text-sm font-semibold text-navy">Quick actions</h2>
      <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-start gap-4 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-brand/30 hover:shadow-sm"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-navy text-white">
              <action.icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-navy">{action.title}</span>
              <span className="mt-0.5 block text-sm text-black/60">{action.description}</span>
            </span>
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-black/30 transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
