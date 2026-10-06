import { CopyCheck } from "lucide-react";

import { Badge, type BadgeTone } from "@/components/ui/badge";
import type {
  AssessmentStatus,
  DuplicateStatus,
  LifecycleStatus,
  RiskCategory,
} from "@/lib/api/backoffice-types";
import { cn } from "@/lib/utils";

const LIFECYCLE: Record<LifecycleStatus, { label: string; tone: BadgeTone }> = {
  PENDING_ASSESSMENT: { label: "Pending assessment", tone: "neutral" },
  UNDER_ASSESSMENT: { label: "Under assessment", tone: "info" },
  ASSESSED: { label: "Assessed", tone: "navy" },
  ACTIVE: { label: "Active", tone: "success" },
  INACTIVE: { label: "Inactive", tone: "neutral" },
  GRADUATED: { label: "Graduated", tone: "violet" },
  EXITED: { label: "Exited", tone: "neutral" },
};

export const ASSESSMENT_STATUS: Record<AssessmentStatus, { label: string; tone: BadgeTone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  SUBMITTED: { label: "Submitted", tone: "info" },
  RETURNED: { label: "Returned", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  DEFERRED: { label: "Deferred", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "danger" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

const RISK: Record<RiskCategory, { label: string; tone: BadgeTone; bar: string }> = {
  HIGH: { label: "High", tone: "danger", bar: "bg-rose-500" },
  MEDIUM: { label: "Medium", tone: "warning", bar: "bg-amber-500" },
  LOW: { label: "Low", tone: "success", bar: "bg-emerald-500" },
};

export function LifecycleBadge({ status }: { status?: LifecycleStatus | null }) {
  if (!status) return <span className="text-black/40">—</span>;
  const meta = LIFECYCLE[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function AssessmentStatusBadge({ status }: { status?: AssessmentStatus | null }) {
  if (!status) return <span className="text-black/40">—</span>;
  const meta = ASSESSMENT_STATUS[status] ?? { label: status, tone: "neutral" as const };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** HIGH red, MEDIUM amber, LOW green; grey "Not assessed" when missing. */
export function RiskBadge({ risk }: { risk?: RiskCategory | null }) {
  if (!risk) return <Badge tone="neutral">Not assessed</Badge>;
  const meta = RISK[risk];
  return (
    <Badge tone={meta.tone}>
      <span className={cn("size-1.5 rounded-full", meta.bar)} />
      {meta.label} risk
    </Badge>
  );
}

export function DuplicateBadge({ status }: { status?: DuplicateStatus | null }) {
  if (status === "POTENTIAL") {
    return (
      <Badge tone="warning">
        <CopyCheck />
        Possible duplicate
      </Badge>
    );
  }
  if (status === "CONFIRMED_DUPLICATE") {
    return <Badge tone="danger">Confirmed duplicate</Badge>;
  }
  return null;
}

/** "196 / 270" with a thin bar tinted by risk. */
export function ScoreMeter({
  score,
  max,
  risk,
  size = "sm",
}: {
  score?: number | null;
  max?: number | null;
  risk?: RiskCategory | null;
  size?: "sm" | "lg";
}) {
  if (score === null || score === undefined) {
    return <span className="text-sm text-black/40">—</span>;
  }
  const total = max || 270;
  const percent = Math.max(0, Math.min(100, (score / total) * 100));
  const bar = risk ? RISK[risk].bar : "bg-[#001539]";

  return (
    <div className={size === "lg" ? "w-full" : "w-28"}>
      <p
        className={cn(
          "font-semibold text-[#001539] tabular-nums",
          size === "lg" ? "text-4xl tracking-tight" : "text-sm",
        )}
      >
        {score}
        <span className={cn("font-normal text-black/40", size === "lg" ? "text-xl" : "text-xs")}>
          {" "}
          / {total}
        </span>
      </p>
      <div
        className={cn(
          "mt-1.5 overflow-hidden rounded-full bg-black/[0.07]",
          size === "lg" ? "h-2" : "h-1",
        )}
      >
        <div className={cn("h-full rounded-full", bar)} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
