"use client";

import { Check, Circle, MessageSquareWarning } from "lucide-react";

import { ScoreBreakdown, ScoreHeadline, flagText } from "@/components/assessment/score-breakdown";
import { ASSESSMENT_STATUS, POOL_STATUS, RiskBadge } from "@/components/backoffice/status-badges";
import { DetailList, Panel } from "@/components/dashboard/panel";
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
import type { Assessment, AssessmentScore } from "@/lib/api/backoffice-types";
import { useResource } from "@/lib/api/use-resource";
import { OFFICER_RECOMMENDATION, labelFor } from "@/lib/backoffice/options";
import { formatDateTime } from "@/lib/beneficiary/format";
import { cn } from "@/lib/utils";

const WARNING_LABELS: Record<string, string> = {
  MEMBER_INCOME_MISMATCH: "Members' incomes differ from the household total by more than 20%",
  ZERO_INCOME_ZERO_EXPENDITURE: "Zero income and zero expenditure",
  EXPENDITURE_OVER_3X_INCOME: "Expenditure is more than 3 times income",
  ZERO_ASSETS_WITH_HOUSE_OR_VEHICLE: "Zero asset value with a house or vehicle",
};

/** "Assessment & Score" tab: score, breakdown, flags and sign-offs. */
export function ScorePanel({ assessment }: { assessment: Assessment }) {
  const score = assessment.score;
  const flags = score?.dataQualityFlags ?? [];
  const acknowledgements = Object.entries(assessment.warningAcknowledgements ?? {});

  if (!score) {
    return (
      <div className="p-5 text-sm text-black/50">
        This assessment hasn&apos;t been scored yet. It&apos;s scored when the officer submits it.
      </div>
    );
  }

  return (
    <div className="divide-y divide-black/[0.06]">
      <div className="space-y-4 p-5">
        <ScoreHeadline score={score} />
        <DetailList
          columns={3}
          items={[
            { label: "Scoring config", value: score.scoringConfigVersion != null ? `Version ${score.scoringConfigVersion}` : null },
            { label: "Calculated", value: score.calculatedAt ? formatDateTime(score.calculatedAt) : null },
            { label: "Calculated by", value: score.calculatedByName ?? assessment.signOffs?.submittedByName },
          ]}
        />
      </div>

      <div className="p-5">
        <h3 className="mb-3 text-sm font-semibold text-[#001539]">Section breakdown</h3>
        <ScoreBreakdown score={score} />
      </div>

      {flags.length > 0 || acknowledgements.length > 0 ? (
        <div className="grid gap-6 p-5 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#001539]">Data-quality flags</h3>
            {flags.length === 0 ? (
              <p className="text-sm text-black/45">None</p>
            ) : (
              <ul className="space-y-1.5">
                {flags.map((flag, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-amber-900">
                    <MessageSquareWarning className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <span className="capitalize">{flagText(flag)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold text-[#001539]">Officer&apos;s warning comments</h3>
            {acknowledgements.length === 0 ? (
              <p className="text-sm text-black/45">None</p>
            ) : (
              <dl className="space-y-3">
                {acknowledgements.map(([code, comment]) => (
                  <div key={code}>
                    <dt className="text-xs font-medium text-black/50">{WARNING_LABELS[code] ?? code}</dt>
                    <dd className="text-sm text-[#001539]">{comment || "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Submitted → reviewed → decided, with comments. */
export function SignOffTimeline({ assessment }: { assessment: Assessment }) {
  const s = assessment.signOffs ?? {};
  const recommendation = assessment.recommendation;

  const events = [
    {
      done: !!s.submittedAt,
      title: "Submitted by field officer",
      who: s.submittedByName ?? assessment.assessmentInfo?.officerName,
      when: s.submittedAt,
      body: recommendation?.officerRecommendation ? (
        <>
          Recommended <strong>{labelFor(OFFICER_RECOMMENDATION, recommendation.officerRecommendation)}</strong>
          {recommendation.recommendationReason ? ` — ${recommendation.recommendationReason}` : ""}
        </>
      ) : null,
    },
    {
      done: !!s.reviewedAt,
      title:
        assessment.status === "RETURNED"
          ? "Returned by branch"
          : assessment.status === "APPROVED" || assessment.status === "REJECTED" || assessment.status === "DEFERRED"
            ? `Branch decision: ${ASSESSMENT_STATUS[assessment.status].label.toLowerCase()}`
            : "Branch decision",
      who: s.reviewedByName ?? assessment.assessmentInfo?.supervisorName,
      when: s.reviewedAt,
      body: s.reviewComment,
    },
    ...(assessment.status === "APPROVED"
      ? [
          {
            done: !!assessment.pool && assessment.pool.status !== "AWAITING_POOL",
            title:
              assessment.pool && assessment.pool.status !== "AWAITING_POOL"
                ? POOL_STATUS[assessment.pool.status].label
                : "Disbursement pool",
            who: assessment.pool?.changedByName,
            when: assessment.pool?.status !== "AWAITING_POOL" ? assessment.pool?.changedAt : null,
            body: assessment.pool?.reason,
          },
        ]
      : []),
    ...(s.cancelledAt
      ? [
          {
            done: true,
            title: "Cancelled",
            who: s.cancelledByName,
            when: s.cancelledAt,
            body: s.cancelReason,
          },
        ]
      : []),
  ];

  return (
    <Panel title="Sign-off">
      <ol className="space-y-5">
        {events.map((event, index) => (
          <li key={event.title} className="relative flex gap-3">
            {index < events.length - 1 ? (
              <span className="absolute top-6 bottom-[-1.25rem] left-[11px] w-px bg-black/10" aria-hidden />
            ) : null}
            <span
              className={cn(
                "relative flex size-6 shrink-0 items-center justify-center rounded-full",
                event.done ? "bg-[#007050] text-white" : "bg-black/[0.05] text-black/30",
              )}
            >
              {event.done ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
            </span>
            <div className="min-w-0">
              <p className={cn("text-sm font-medium", event.done ? "text-[#001539]" : "text-black/40")}>
                {event.title}
              </p>
              {event.done ? (
                <p className="text-xs text-black/50">
                  {[event.who, event.when ? formatDateTime(event.when) : null].filter(Boolean).join(" · ")}
                </p>
              ) : (
                <p className="text-xs text-black/40">Pending</p>
              )}
              {event.done && event.body ? <p className="mt-1 text-sm text-black/70">{event.body}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

/** Current and superseded scores, newest first; superseded ones greyed. */
export function ScoreHistory({ assessmentId }: { assessmentId: string }) {
  const { data, error, isLoading } = useResource<AssessmentScore[]>(
    `/bff/backoffice/assessments/${encodeURIComponent(assessmentId)}/scores`,
  );
  const scores = data ?? [];

  return (
    <div>
      {error ? <p className="px-5 pt-4 text-sm text-rose-700">{error.message}</p> : null}
      <Table>
        <TableHeader>
          <TableRow className="bg-black/[0.015]">
            <TableHead className="pl-5">Calculated</TableHead>
            <TableHead>Score</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Recommendation</TableHead>
            <TableHead>Config</TableHead>
            <TableHead className="pr-5">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && scores.length === 0 ? (
            <TableSkeletonRows colSpan={6} rows={2} />
          ) : scores.length === 0 ? (
            <TableMessageRow colSpan={6}>No scores yet.</TableMessageRow>
          ) : (
            scores.map((item, index) => {
              const superseded = item.status === "SUPERSEDED";
              return (
                <TableRow key={item.id ?? index} className={superseded ? "text-black/40" : undefined}>
                  <TableCell className="pl-5">{formatDateTime(item.calculatedAt ?? null)}</TableCell>
                  <TableCell className={cn("font-semibold tabular-nums", superseded ? "line-through" : "text-[#001539]")}>
                    {item.totalScore} / {item.maxScore}
                  </TableCell>
                  <TableCell className={superseded ? "opacity-50" : undefined}>
                    <RiskBadge risk={item.riskCategory} />
                  </TableCell>
                  <TableCell>{labelFor(OFFICER_RECOMMENDATION, item.preliminaryRecommendation)}</TableCell>
                  <TableCell className="tabular-nums">v{item.scoringConfigVersion ?? "—"}</TableCell>
                  <TableCell className="pr-5">
                    <Badge tone={superseded ? "neutral" : "success"}>{superseded ? "Superseded" : "Current"}</Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
