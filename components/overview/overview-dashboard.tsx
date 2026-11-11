"use client";

import Link from "next/link";
import { ArrowRight, ClipboardCheck, CopyCheck, HandCoins, Inbox, Scale, UserPlus, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Funnel } from "@/components/charts/funnel";
import { LineChart } from "@/components/charts/line-chart";
import { Lollipop } from "@/components/charts/lollipop";
import { CATEGORICAL, NEED, STATUS } from "@/components/charts/palette";
import { RadialMeter } from "@/components/charts/radial-meter";
import { ScoreHistogram } from "@/components/charts/score-histogram";
import { SplitBar } from "@/components/charts/split-bar";
import { StatTile, formatCompact } from "@/components/charts/stat-tile";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { Panel } from "@/components/dashboard/panel";
import { AreaComparison } from "@/components/overview/area-comparison";
import { MoneySection } from "@/components/overview/money-section";
import { Badge } from "@/components/ui/badge";
import type {
  AnalyticsBreakdown,
  AnalyticsOverview,
  AnalyticsTimeseries,
  LifecycleStatus,
  PoolStatus,
  ScoreDistribution,
  TimeseriesMetric,
} from "@/lib/api/backoffice-types";
import type { PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { PREVIOUS_LABEL, type RangeKey, previousRangeDates, rangeDates } from "@/lib/backoffice/date-range";
import { formatCount, formatDays, formatEtb } from "@/lib/backoffice/format";
import { ASNAF, OFFICER_RECOMMENDATION, TENURE, VULNERABILITIES, labelFor, type Option } from "@/lib/backoffice/options";
import type { DisbursementSummary } from "@/lib/zakat/disbursements";
import { type PaymentSummary, paymentDatesQuery } from "@/lib/zakat/payments";

const API = "/bff/backoffice/analytics";

/** GET /admin/pool/counts: rows per pool status. */
type PoolCounts = Partial<Record<PoolStatus, number>>;
const METRICS: TimeseriesMetric[] = ["registrations", "assessmentsSubmitted", "decisions", "pooled"];

const LIFECYCLE: { key: LifecycleStatus; label: string }[] = [
  { key: "PENDING_ASSESSMENT", label: "Waiting for assessment" },
  { key: "UNDER_ASSESSMENT", label: "Under assessment" },
  { key: "ASSESSED", label: "Assessed" },
  { key: "ACTIVE", label: "Receiving support" },
  { key: "INACTIVE", label: "Inactive" },
  { key: "GRADUATED", label: "Graduated" },
  { key: "EXITED", label: "Exited" },
];

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

/** Totals of one metric over the points on or after / before `from`. */
function splitTotals(points: AnalyticsTimeseries["points"], metric: TimeseriesMetric, from: string) {
  let current = 0;
  let previous = 0;
  for (const point of points) {
    const value = point[metric] ?? 0;
    if (point.period.slice(0, 10) >= from) current += value;
    else previous += value;
  }
  return { current, previous };
}

function breakdownParts(data: AnalyticsBreakdown | undefined, labels: Option[], max = 6) {
  const items = [...(data?.items ?? [])].sort((a, b) => b.count - a.count);
  const head = items.slice(0, max - 1);
  const tail = items.slice(max - 1);
  const parts = head.map((item) => ({ key: item.key, label: labelFor(labels, item.key), value: item.count }));
  // Six parts at most: a long tail folds into "Other" (the table keeps every value).
  if (tail.length === 1) parts.push({ key: tail[0].key, label: labelFor(labels, tail[0].key), value: tail[0].count });
  else if (tail.length > 1) parts.push({ key: "other", label: "Other", value: tail.reduce((sum, item) => sum + item.count, 0) });
  return parts;
}

/** Marks a panel whose numbers are today's state, not limited to the date range (the overview's household and code counts). */
function AllTime() {
  return (
    <Badge tone="neutral" title="Not limited to the date range above">
      All time
    </Badge>
  );
}

/** A count that needs someone, linking to the list where it gets done. Pass a count, or a list path to count. */
function AttentionTile({
  title,
  description,
  count: given,
  countPath,
  href,
  icon: Icon,
}: {
  title: string;
  description: string;
  count?: number;
  countPath?: string;
  href: string;
  icon: LucideIcon;
}) {
  const counted = useResource<PaginatedItems<unknown>>(countPath ?? null);
  const count = countPath ? counted.data?.pagination.totalItems : given;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-black/[0.06] bg-white p-5 shadow-xs transition hover:border-brand/30 hover:shadow-sm"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-black/70">{title}</span>
        <span className="block text-xs text-black/60">{description}</span>
      </span>
      <span className="text-2xl font-semibold text-navy">{count === undefined ? "—" : formatCount(count)}</span>
      <ArrowRight className="size-4 shrink-0 text-black/40 transition group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden="true" />
    </Link>
  );
}

/**
 * The staff Overview: headline figures with their trend and change, what
 * needs attention, the household pipeline, scores and need, who the
 * households are, money in and out (admins), and the picture per area.
 */
export function OverviewDashboard({ range, region, isAdmin }: { range: RangeKey; region: string; isAdmin: boolean }) {
  const interval = intervalFor(range);
  const current = rangeDates(range);
  const previous = previousRangeDates(range);
  const regionQuery = region ? `&region=${encodeURIComponent(region)}` : "";
  const scope = `from=${current.from}&to=${current.to}${regionQuery}`;

  const overview = useResource<AnalyticsOverview>(`${API}/overview?${scope}`);
  const series = useResource<AnalyticsTimeseries>(`${API}/timeseries?metrics=${METRICS.join(",")}&interval=${interval}&${scope}`);
  // The window before this one too, for "change vs previous period".
  const compare = useResource<AnalyticsTimeseries>(
    `${API}/timeseries?metrics=${METRICS.join(",")}&interval=${interval}&from=${previous.from}&to=${current.to}${regionQuery}`,
  );
  // Scores and breakdowns count the assessments in the chosen period.
  const distribution = useResource<ScoreDistribution>(`${API}/score-distribution?bucket=10&${scope}`);
  const asnaf = useResource<AnalyticsBreakdown>(`${API}/breakdown?by=asnaf&${scope}`);
  const vulnerability = useResource<AnalyticsBreakdown>(`${API}/breakdown?by=vulnerability&${scope}`);
  const tenure = useResource<AnalyticsBreakdown>(`${API}/breakdown?by=tenure&${scope}`);
  const recommendation = useResource<AnalyticsBreakdown>(`${API}/breakdown?by=recommendation&${scope}`);
  // Today's counts, whatever the dates.
  const pool = useResource<PoolCounts>(isAdmin ? "/bff/backoffice/admin/pool/counts" : null);
  const paymentsToCheck = useResource<{ count: number }>(isAdmin ? "/bff/payments-admin/zakat-payments/needs-action/count" : null);
  const payments = useResource<PaymentSummary>(isAdmin ? `/bff/payments-admin/zakat-payments/summary?${paymentDatesQuery(current)}` : null);
  const paymentsBefore = useResource<PaymentSummary>(isAdmin ? `/bff/payments-admin/zakat-payments/summary?${paymentDatesQuery(previous)}` : null);
  const payouts = useResource<DisbursementSummary>(isAdmin ? `/bff/payments-admin/disbursements/summary?${paymentDatesQuery(current)}` : null);

  const o = overview.data;
  const loading = overview.isLoading && !o;
  const points = series.data?.points ?? [];
  const trend = (metric: TimeseriesMetric) => points.map((point) => point[metric] ?? 0);
  const delta = (metric: TimeseriesMetric) => {
    if (!compare.data) return undefined;
    const totals = splitTotals(compare.data.points, metric, current.from);
    return { ...totals, label: PREVIOUS_LABEL[range] };
  };

  const lifecycle = o?.beneficiaries.byLifecycle ?? {};
  const count = (keys: LifecycleStatus[]) => keys.reduce((sum, key) => sum + (lifecycle[key] ?? 0), 0);
  const total = o?.beneficiaries.total ?? 0;
  const stages = [
    { key: "registered", label: "Registered", value: total },
    { key: "started", label: "Assessment started", value: total - count(["PENDING_ASSESSMENT"]) },
    { key: "decided", label: "Assessed", value: count(["ASSESSED", "ACTIVE", "INACTIVE", "GRADUATED", "EXITED"]) },
    { key: "support", label: "Receiving support", value: count(["ACTIVE", "GRADUATED"]) },
  ];
  const verification = o?.beneficiaries.byVerification ?? {};
  const codes = o?.codes;

  return (
    <div className="space-y-6">
      {overview.error ? <InlineAlert>{overview.error.message}</InlineAlert> : null}

      {/* Headline figures for the chosen period, each with its trend and change. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="New households"
          value={formatCompact(o?.beneficiaries.newInRange)}
          hint={o ? `${formatCount(total)} registered in all` : undefined}
          icon={UserPlus}
          loading={loading}
          trend={trend("registrations")}
          delta={delta("registrations")}
        />
        <StatTile
          label="Assessments submitted"
          value={formatCompact(o?.assessments.submittedInRange)}
          hint={o?.assessments.averageScore != null ? `Average score ${o.assessments.averageScore.toFixed(0)} of ${distribution.data?.max ?? "—"}` : undefined}
          icon={ClipboardCheck}
          loading={loading}
          trend={trend("assessmentsSubmitted")}
          trendColor={CATEGORICAL[2]}
          delta={delta("assessmentsSubmitted")}
        />
        <StatTile
          label="Branch decisions"
          value={formatCompact(o?.assessments.decidedInRange)}
          hint={o ? `Median time to decide: ${formatDays(o.assessments.turnaroundDays.submitToDecisionMedian).toLowerCase()}` : undefined}
          icon={Scale}
          loading={loading}
          trend={trend("decisions")}
          trendColor={CATEGORICAL[1]}
          delta={delta("decisions")}
        />
        {isAdmin ? (
          <StatTile
            label="Zakat collected"
            value={formatEtb(payments.data?.succeededAmountEtb, { compact: true })}
            hint={payments.data ? `${formatCount(payments.data.succeededCount)} paid donations` : undefined}
            icon={HandCoins}
            loading={payments.isLoading && !payments.data}
            delta={
              payments.data && paymentsBefore.data
                ? { current: payments.data.succeededAmountEtb, previous: paymentsBefore.data.succeededAmountEtb, label: PREVIOUS_LABEL[range] }
                : undefined
            }
          />
        ) : (
          <StatTile
            label="Moved to the pool"
            value={formatCompact(trend("pooled").reduce((sum, value) => sum + value, 0))}
            hint={o ? `Median time from approval: ${formatDays(o.assessments.turnaroundDays.approvalToPoolMedian).toLowerCase()}` : undefined}
            icon={Wallet}
            loading={loading}
            trend={trend("pooled")}
            delta={delta("pooled")}
          />
        )}
      </div>

      {/* What needs someone now. */}
      {isAdmin ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AttentionTile
            title="Awaiting the pool"
            description="Approved, not yet pooled"
            count={pool.data?.AWAITING_POOL}
            href="/dashboard/pool"
            icon={Inbox}
          />
          <AttentionTile
            title="Waiting for a branch"
            description="Submitted by field officers"
            countPath="/bff/backoffice/assessments?status=SUBMITTED&page=1&limit=1"
            href="/dashboard/assessments?status=SUBMITTED"
            icon={ClipboardCheck}
          />
          <AttentionTile
            title="Possible duplicates"
            description="Waiting for review"
            count={o?.beneficiaries.duplicatesPending}
            href="/dashboard/beneficiary"
            icon={CopyCheck}
          />
          <AttentionTile
            title="Payments to check"
            description="Waiting for an admin to check or approve"
            count={paymentsToCheck.data ? paymentsToCheck.data.count + (payouts.data?.needsChecking ?? 0) : undefined}
            href="/dashboard/zakat/payments"
            icon={HandCoins}
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-12">
        <Panel className="lg:col-span-8" title="Activity" description={`Per ${interval} in the chosen period`}>
          {series.error ? (
            <InlineAlert>{series.error.message}</InlineAlert>
          ) : (
            <LineChart
              label={`Registrations, submissions, decisions and pooling per ${interval}`}
              labels={points.map((point) => point.period)}
              formatLabel={(label) => formatPeriod(label, interval)}
              series={[
                { key: "registrations", label: "Registrations", values: trend("registrations") },
                { key: "assessmentsSubmitted", label: "Assessments submitted", values: trend("assessmentsSubmitted"), color: CATEGORICAL[2] },
                { key: "decisions", label: "Branch decisions", values: trend("decisions"), color: CATEGORICAL[1] },
                { key: "pooled", label: "Moved to the pool", values: trend("pooled"), color: CATEGORICAL[3] },
              ]}
            />
          )}
        </Panel>
        <Panel className="lg:col-span-4" title="Household pipeline" description="How far registered households have got" actions={<AllTime />}>
          {loading ? <div className="h-64 animate-pulse rounded-lg bg-black/[0.03]" /> : <Funnel label="Household pipeline" stages={stages} />}
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <Panel
          className="lg:col-span-8"
          title="Score distribution"
          description={
            distribution.data ? `${formatCount(distribution.data.scored)} current scores in the chosen period, out of ${distribution.data.max}` : undefined
          }
        >
          {distribution.error ? (
            <InlineAlert>{distribution.error.message}</InlineAlert>
          ) : distribution.data ? (
            <ScoreHistogram data={distribution.data} />
          ) : (
            <div className="h-[240px] animate-pulse rounded-lg bg-black/[0.03]" />
          )}
        </Panel>
        <Panel className="lg:col-span-4" title="Need level" description="Households by current need" actions={<AllTime />}>
          <SplitBar
            size="tall"
            label="Households by need level"
            parts={[
              { key: "HIGH", label: "High need", value: o?.assessments.byRisk.HIGH ?? 0, color: NEED.HIGH },
              { key: "MEDIUM", label: "Medium need", value: o?.assessments.byRisk.MEDIUM ?? 0, color: NEED.MEDIUM },
              { key: "LOW", label: "Low need", value: o?.assessments.byRisk.LOW ?? 0, color: NEED.LOW },
            ]}
          />
          <p className="mt-5 border-t border-black/[0.06] pt-4 text-xs text-black/60">
            Need comes from the household&apos;s current score: high from {distribution.data?.thresholds.high ?? "—"}, medium from{" "}
            {distribution.data?.thresholds.medium ?? "—"}.
          </p>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Where households are" description="Current stage" actions={<AllTime />}>
          <SplitBar
            label="Households by stage"
            parts={LIFECYCLE.map((item, index) => ({ key: item.key, label: item.label, value: lifecycle[item.key] ?? 0, color: CATEGORICAL[index % CATEGORICAL.length] })).filter((part) => part.value > 0)}
            emptyText="No households yet."
          />
        </Panel>
        <Panel title="Identity checks" description="Verification of registered households" actions={<AllTime />}>
          <SplitBar
            label="Households by identity check"
            parts={[
              { key: "verified", label: "Verified", value: verification.verified ?? 0, color: STATUS.good },
              { key: "pending", label: "Not checked yet", value: verification.pending ?? 0, color: STATUS.waiting },
              { key: "rejected", label: "Rejected", value: verification.rejected ?? 0, color: STATUS.bad },
            ]}
          />
        </Panel>
        <Panel title="Registration codes" description="Codes handed to branches" actions={<AllTime />}>
          <SplitBar
            label="Registration codes by state"
            parts={[
              { key: "consumed", label: "Used", value: codes?.consumed ?? 0, color: CATEGORICAL[0] },
              { key: "available", label: "Available", value: codes?.available ?? 0, color: CATEGORICAL[2] },
              { key: "reserved", label: "Reserved", value: codes?.reserved ?? 0, color: CATEGORICAL[3] },
              { key: "revoked", label: "Revoked", value: codes?.revoked ?? 0, color: STATUS.neutral },
            ]}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Vulnerabilities" description="From current assessments in the chosen period; a household can count more than once">
          {vulnerability.error ? (
            <InlineAlert>{vulnerability.error.message}</InlineAlert>
          ) : (
            <Lollipop
              label="Households by vulnerability"
              items={(vulnerability.data?.items ?? []).map((item) => ({ key: item.key, label: labelFor(VULNERABILITIES, item.key), value: item.count }))}
              color={CATEGORICAL[4]}
            />
          )}
        </Panel>
        <Panel title="Officers and the score" description="Officer recommendations, and how often they match the system's">
          <div className="space-y-5">
            <RadialMeter value={o?.assessments.officerVsSystemAgreementRate} label="agree with the score" size={150} />
            <SplitBar label="Assessments by officer recommendation" parts={breakdownParts(recommendation.data, OFFICER_RECOMMENDATION)} />
          </div>
        </Panel>
        <div className="grid gap-6">
          <Panel title="Asnaf" description="Each household's current category, assessed in the chosen period">
            {asnaf.error ? <InlineAlert>{asnaf.error.message}</InlineAlert> : <SplitBar label="Households by Asnaf" parts={breakdownParts(asnaf.data, ASNAF)} />}
          </Panel>
          <Panel title="Housing" description="From current assessments in the chosen period">
            {tenure.error ? <InlineAlert>{tenure.error.message}</InlineAlert> : <SplitBar label="Households by housing" parts={breakdownParts(tenure.data, TENURE)} />}
          </Panel>
        </div>
      </div>

      {isAdmin ? <MoneySection payments={payments.data} payouts={payouts.data} /> : null}

      {isAdmin ? <AreaComparison scope={scope} /> : null}
    </div>
  );
}
