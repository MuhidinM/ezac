"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardPlus, Pencil } from "lucide-react";

import { AssessmentStatusBadge, RiskBadge, ScoreMeter } from "@/components/backoffice/status-badges";
import { InlineAlert } from "@/components/dashboard/inline-alert";
import { isFieldOfficer } from "@/components/dashboard/nav-config";
import { Panel } from "@/components/dashboard/panel";
import { TableMessageRow, TableSkeletonRows } from "@/components/dashboard/table-states";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Assessment,
  AssessmentListItem,
  AssessmentStatus,
} from "@/lib/api/backoffice-types";
import { apiClient } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { BeneficiaryDetail, PaginatedItems } from "@/lib/api/types";
import { useResource } from "@/lib/api/use-resource";
import { useSession } from "@/lib/auth/use-session";
import { assessmentBlockedReason, isEditable } from "@/lib/backoffice/assessment-steps";
import { formatDate, todayIso } from "@/lib/backoffice/format";

const CLOSED: AssessmentStatus[] = ["APPROVED", "DEFERRED", "REJECTED", "CANCELLED"];

/** Assessment history on the beneficiary profile, with start / continue. */
export function BeneficiaryAssessments({ beneficiary }: { beneficiary: BeneficiaryDetail }) {
  const router = useRouter();
  const { session } = useSession();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const { data, error, isLoading } = useResource<AssessmentListItem[] | PaginatedItems<AssessmentListItem>>(
    `/bff/backoffice/beneficiaries/${encodeURIComponent(beneficiary.id)}/assessments`,
  );
  const history = Array.isArray(data) ? data : (data?.items ?? []);

  const officer = isFieldOfficer(session);
  const open = history.find((item) => !CLOSED.includes(item.status));
  const blockedReason = assessmentBlockedReason(beneficiary);

  async function start() {
    setIsStarting(true);
    setStartError(null);
    try {
      const created = await apiClient<Assessment>("/bff/backoffice/assessments", {
        method: "POST",
        body: JSON.stringify({ beneficiaryId: beneficiary.id, assessmentDate: todayIso() }),
      });
      router.push(`/dashboard/assessments/${created.id}/edit`);
    } catch (createError) {
      setStartError(errorMessage(createError, "Couldn't start the assessment"));
      setIsStarting(false);
    }
  }

  let action = null;
  if (officer && open && isEditable(open.status)) {
    action = (
      <Button size="sm" asChild>
        <Link href={`/dashboard/assessments/${open.id}/edit`}>
          <Pencil />
          {open.status === "RETURNED" ? "Make corrections" : "Continue assessment"}
        </Link>
      </Button>
    );
  } else if (officer && !open && !blockedReason) {
    // A blocked household gets no Start button; the panel says why instead.
    action = (
      <Button size="sm" onClick={() => void start()} disabled={isStarting || isLoading}>
        <ClipboardPlus />
        {isStarting ? "Starting…" : history.length > 0 ? "Start reassessment" : "Start assessment"}
      </Button>
    );
  }

  return (
    <Panel
      title="Assessments"
      description={
        officer && !open && blockedReason
          ? blockedReason
          : "Means-test history. A beneficiary has at most one open assessment."
      }
      actions={action}
      flush
    >
      {startError || error ? (
        <div className="px-5 pt-4">
          <InlineAlert>{startError ?? error?.message}</InlineAlert>
        </div>
      ) : null}
      <Table>
        <TableHeader>
          <TableRow className="bg-black/[0.015]">
            <TableHead className="pl-5">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="pr-5">Risk</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading && history.length === 0 ? (
            <TableSkeletonRows colSpan={4} rows={2} />
          ) : history.length === 0 ? (
            <TableMessageRow colSpan={4}>Not assessed yet.</TableMessageRow>
          ) : (
            history.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/assessments/${item.id}`)}
              >
                <TableCell className="pl-5 font-medium text-[#001539]">
                  {/* The link makes the row reachable by keyboard; the row click is a mouse shortcut. */}
                  <Link
                    href={`/dashboard/assessments/${item.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="hover:underline"
                  >
                    {formatDate(item.assessmentDate ?? item.createdAt)}
                  </Link>
                </TableCell>
                <TableCell>
                  <AssessmentStatusBadge status={item.status} />
                </TableCell>
                <TableCell>
                  <ScoreMeter score={item.totalScore} max={item.maxScore} risk={item.riskCategory} />
                </TableCell>
                <TableCell className="pr-5">
                  {item.totalScore != null ? <RiskBadge risk={item.riskCategory} /> : <span className="text-black/40">—</span>}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Panel>
  );
}
